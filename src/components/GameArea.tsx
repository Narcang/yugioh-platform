"use client";
import React, { useRef, useEffect } from 'react';
import { useMedia } from '@/context/MediaContext';
import { useLayout } from '@/context/LayoutContext';
import PlayerOverlay from './PlayerOverlay';
import { DigitalField, type FieldPlayOpts } from './DigitalBoard';
import type { RemotePeer } from '@/hooks/useWebRTC';
import type { TeamId } from '@/lib/gameConfig';
import type { BoardCard } from '@/lib/digitalBoard';
import type { TableToken, TokenDrop } from '@/lib/tokens';
import { TokenOverlay } from './Tokens';

interface GameAreaProps {
    peers: RemotePeer[];
    selfName?: string;
    sendLP?: (lp: number) => void;
    myId: string;
    myTeam: TeamId;
    onTeamChange: (team: TeamId) => void;
    activePlayerId: string | null;
    myPlayMode?: 'physical' | 'digital';
    myField?: BoardCard[];
    gameType?: string;
    onMoveFieldCard?: (instanceId: string, x: number, y: number) => void;
    onReturnToHand?: (instanceId: string) => void;
    onToGraveyard?: (instanceId: string) => void;
    onToExile?: (instanceId: string) => void;
    onToExtra?: (instanceId: string) => void;
    onUpdateFieldCard?: (instanceId: string, patch: FieldPlayOpts) => void;
    tokens?: TableToken[];
    onMoveToken?: (id: string, drop: NonNullable<TokenDrop>) => void;
    onChangeToken?: (id: string, patch: { count?: number } | 'remove') => void;
}

/** Renders one remote peer's video feed */
const RemoteSlot: React.FC<{
    peer: RemotePeer;
    baseLifePoints: number;
    fitMode: 'cover' | 'contain';
    teamLabel?: string;
    gameType?: string;
}> = ({ peer, baseLifePoints, fitMode, teamLabel, gameType = '' }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const el = videoRef.current;
        if (!el) return;
        if (peer.stream) {
            if (el.srcObject !== peer.stream) {
                el.srcObject = peer.stream;
            }
            el.play().catch(e => console.warn('remoteVideo.play() failed:', e));
        } else {
            el.srcObject = null;
        }
    }, [peer.stream]);

    return (
        <>
            <div className="video-frame">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className={`rot-${peer.rotation}`}
                    style={{
                        objectFit: fitMode,
                        display: peer.stream ? 'block' : 'none',
                    }}
                />
            </div>
            {!peer.stream && peer.playMode !== 'digital' && (
                <div className="video-placeholder">
                    <p style={{ color: 'var(--text-muted)' }}>In attesa di {peer.username}...</p>
                    <div style={{ width: '30px', height: '30px', border: '2px solid var(--text-muted)', borderTopColor: 'transparent', borderRadius: '50%', margin: '10px auto', animation: 'spin 1s linear infinite' }}></div>
                </div>
            )}

            {peer.playMode === 'digital' && (
                <DigitalField
                    field={peer.field}
                    graveyard={peer.graveyard}
                    exile={peer.exile}
                    dropId={peer.id}
                    readOnly
                    gameType={gameType}
                    tokens={peer.tokens}
                />
            )}

            <TokenOverlay tokens={peer.tokens ?? []} gameType={gameType} readOnly />

            <PlayerOverlay
                name={peer.username}
                initialLP={baseLifePoints}
                currentLP={peer.lifePoints ?? baseLifePoints}
                teamLabel={teamLabel}
            />
        </>
    );
};

const GameArea: React.FC<GameAreaProps> = ({
    peers,
    selfName = 'Duelist',
    sendLP,
    myId,
    myTeam,
    onTeamChange,
    activePlayerId,
    myPlayMode = 'physical',
    myField = [],
    gameType = '',
    onMoveFieldCard,
    onReturnToHand,
    onToGraveyard,
    onToExile,
    onToExtra,
    onUpdateFieldCard,
    tokens = [],
    onMoveToken,
    onChangeToken,
}) => {
    const {
        localStream,
        isVideoEnabled,
        error,
        videoRotation,
        rotateVideo,
        zoom,
        zoomCapabilities,
        setZoomLevel,
    } = useMedia();
    const {
        layoutMode,
        spotlightTarget,
        setLayoutMode,
        setSpotlightTarget,
        videoFitMode,
        baseLifePoints,
        currentRoomId,
        maxPlayers,
        matchMode,
        setIsCardPanelOpen,
    } = useLayout();
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && localStream) {
            videoRef.current.srcObject = localStream;
        }
    }, [localStream, isVideoEnabled]);

    // Reserve slots for the expected player count so the grid is stable while
    // people are still joining.
    const expectedRemotes = Math.max(maxPlayers - 1, peers.length);
    const slots: (RemotePeer | null)[] = Array.from({ length: expectedRemotes }, (_, i) => peers[i] ?? null);
    const totalSlots = slots.length + 1;

    const handlePlayerClick = (target: string) => {
        // On mobile the card sheet covers the fields, so tapping one dismisses it
        setIsCardPanelOpen(false);
        setSpotlightTarget(target);
        if (layoutMode === 'grid') setLayoutMode('fullscreen');
    };

    // The stored target may be a peer that already left, or the legacy
    // 'opponent' sentinel — fall back to the first connected peer.
    const connectedIds = slots.filter((p): p is RemotePeer => p !== null).map(p => p.id);
    const resolvedSpotlight =
        spotlightTarget === 'self' || connectedIds.includes(spotlightTarget)
            ? spotlightTarget
            : connectedIds[0] ?? 'self';

    const getSlotClass = (target: string) => {
        if (layoutMode === 'grid') return '';

        const isTarget = resolvedSpotlight === target;

        if (layoutMode === 'fullscreen') {
            return isTarget ? 'maximized' : 'hidden';
        }
        if (layoutMode === 'boxed') {
            return isTarget ? 'maximized' : 'minimized';
        }
        return '';
    };

    const showTeams = matchMode === 'teams' && maxPlayers === 4;

    // Pinch on your own feed drives the camera's optical/digital zoom. The page
    // itself cannot be pinched (see the viewport meta), so the gesture is free.
    const pinch = useRef<{ distance: number; zoom: number } | null>(null);

    const touchSpread = (touches: React.TouchList) => {
        const [a, b] = [touches[0], touches[1]];
        return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    };

    const handlePinchStart = (e: React.TouchEvent) => {
        if (e.touches.length !== 2 || !zoomCapabilities) return;
        pinch.current = { distance: touchSpread(e.touches), zoom };
    };

    const handlePinchMove = (e: React.TouchEvent) => {
        const start = pinch.current;
        if (!start || e.touches.length !== 2 || !zoomCapabilities) return;

        const { min, max, step } = zoomCapabilities;
        const target = start.zoom * (touchSpread(e.touches) / start.distance);
        const next = Math.min(max, Math.max(min, target));

        // Skip sub-step changes: every update is an async applyConstraints call
        if (Math.abs(next - zoom) < (step || 0.1)) return;
        setZoomLevel(next);
    };

    return (
        <div className={`game-area ${layoutMode} players-${totalSlots}`}>
            {slots.map((peer, index) => {
                const target = peer ? peer.id : `empty-${index}`;
                return (
                    <div
                        key={target}
                        className={`player-slot remote ${getSlotClass(target)} ${peer && peer.id === activePlayerId ? 'active-turn' : ''}`}
                        data-player-seat={peer?.id}
                        onClick={() => peer && handlePlayerClick(target)}
                        style={{ cursor: peer ? 'pointer' : 'default' }}
                    >
                        {peer ? (
                            <RemoteSlot
                                peer={peer}
                                baseLifePoints={baseLifePoints}
                                fitMode={videoFitMode}
                                teamLabel={showTeams ? peer.team ?? undefined : undefined}
                                gameType={gameType}
                            />
                        ) : (
                            <div className="video-placeholder">
                                <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
                                    Slot libero — in attesa di un giocatore
                                </p>
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Local player */}
            <div
                className={`player-slot self ${getSlotClass('self')} ${activePlayerId === myId ? 'active-turn' : ''} ${myPlayMode === 'digital' ? 'digital-seat' : ''}`}
                data-player-seat="self"
                onClick={() => handlePlayerClick('self')}
                onTouchStart={myPlayMode === 'digital' ? undefined : handlePinchStart}
                onTouchMove={myPlayMode === 'digital' ? undefined : handlePinchMove}
                onTouchEnd={myPlayMode === 'digital' ? undefined : () => { pinch.current = null; }}
                style={{ cursor: 'pointer' }}
            >
                {error && myPlayMode !== 'digital' && (
                    <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', background: '#EF4444', color: 'white', padding: '8px', borderRadius: '4px', zIndex: 100, fontSize: '12px', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                {myPlayMode === 'digital' ? (
                    <DigitalField
                        field={myField}
                        dropId="self"
                        gameType={gameType}
                        tokens={tokens}
                        onMove={onMoveFieldCard}
                        onReturnToHand={onReturnToHand}
                        onToGraveyard={onToGraveyard}
                        onToExile={onToExile}
                        onToExtra={onToExtra}
                        onUpdateCard={onUpdateFieldCard}
                        onMoveToken={onMoveToken}
                        onChangeToken={onChangeToken}
                    />
                ) : localStream && isVideoEnabled ? (
                    <div className="video-frame">
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className={`rot-${videoRotation}`}
                            style={{ objectFit: videoFitMode }}
                        />
                    </div>
                ) : (
                    <div className="video-placeholder">
                        {localStream ? (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ margin: '0 auto 10px' }}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
                                <p>Audio Only Active</p>
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-muted)' }}>Camera Off</p>
                        )}
                    </div>
                )}

                <TokenOverlay
                    tokens={tokens}
                    gameType={gameType}
                    onMove={onMoveToken}
                    onChange={onChangeToken}
                />

                <PlayerOverlay
                    key={`self-${currentRoomId}-${baseLifePoints}`}
                    name={selfName}
                    isSelf
                    initialLP={baseLifePoints}
                    onLpChange={sendLP}
                    teamLabel={showTeams ? myTeam : undefined}
                    onTeamToggle={showTeams ? () => onTeamChange(myTeam === 'A' ? 'B' : 'A') : undefined}
                    onRotate={rotateVideo}
                    rotation={videoRotation}
                />
            </div>

            {/* Floating Controls */}
            <div className="floating-controls">
                <button
                    className="icon-btn"
                    style={{ background: 'rgba(0,0,0,0.6)' }}
                    title="Schermo Intero"
                    onClick={() => {
                        if (!document.fullscreenElement) {
                            document.documentElement.requestFullscreen().catch(e => {
                                console.error(`Error attempting to enable fullscreen mode: ${e.message} (${e.name})`);
                            });
                        } else {
                            if (document.exitFullscreen) {
                                document.exitFullscreen();
                            }
                        }
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" /></svg>
                </button>
            </div>
        </div>
    );
};

export default GameArea;
