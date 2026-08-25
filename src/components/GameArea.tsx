"use client";
import React, { useRef, useEffect } from 'react';
import { useMedia } from '@/context/MediaContext';
import { useLayout } from '@/context/LayoutContext';
import PlayerOverlay from './PlayerOverlay';
import type { RemotePeer } from '@/hooks/useWebRTC';
import type { TeamId } from '@/lib/gameConfig';

interface GameAreaProps {
    peers: RemotePeer[];
    selfName?: string;
    sendLP?: (lp: number) => void;
    myId: string;
    myTeam: TeamId;
    onTeamChange: (team: TeamId) => void;
    activePlayerId: string | null;
}

/** Renders one remote peer's video feed */
const RemoteSlot: React.FC<{
    peer: RemotePeer;
    baseLifePoints: number;
    fitMode: 'cover' | 'contain';
    teamLabel?: string;
}> = ({ peer, baseLifePoints, fitMode, teamLabel }) => {
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
            <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: fitMode,
                    display: peer.stream ? 'block' : 'none',
                }}
            />
            {!peer.stream && (
                <div className="video-placeholder">
                    <p style={{ color: 'var(--text-muted)' }}>In attesa di {peer.username}...</p>
                    <div style={{ width: '30px', height: '30px', border: '2px solid var(--text-muted)', borderTopColor: 'transparent', borderRadius: '50%', margin: '10px auto', animation: 'spin 1s linear infinite' }}></div>
                </div>
            )}

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
}) => {
    const { localStream, isVideoEnabled, error } = useMedia();
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

    return (
        <div className={`game-area ${layoutMode} players-${totalSlots}`}>
            {slots.map((peer, index) => {
                const target = peer ? peer.id : `empty-${index}`;
                return (
                    <div
                        key={target}
                        className={`player-slot remote ${getSlotClass(target)} ${peer && peer.id === activePlayerId ? 'active-turn' : ''}`}
                        onClick={() => peer && handlePlayerClick(target)}
                        style={{ cursor: peer ? 'pointer' : 'default' }}
                    >
                        {peer ? (
                            <RemoteSlot
                                peer={peer}
                                baseLifePoints={baseLifePoints}
                                fitMode={videoFitMode}
                                teamLabel={showTeams ? peer.team ?? undefined : undefined}
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
                className={`player-slot self ${getSlotClass('self')} ${activePlayerId === myId ? 'active-turn' : ''}`}
                onClick={() => handlePlayerClick('self')}
                style={{ cursor: 'pointer' }}
            >
                {error && (
                    <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', background: '#EF4444', color: 'white', padding: '8px', borderRadius: '4px', zIndex: 100, fontSize: '12px', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                {localStream && isVideoEnabled ? (
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        style={{ width: '100%', height: '100%', objectFit: videoFitMode }}
                    />
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

                <PlayerOverlay
                    key={`self-${currentRoomId}-${baseLifePoints}`}
                    name={selfName}
                    isSelf
                    initialLP={baseLifePoints}
                    onLpChange={sendLP}
                    teamLabel={showTeams ? myTeam : undefined}
                    onTeamToggle={showTeams ? () => onTeamChange(myTeam === 'A' ? 'B' : 'A') : undefined}
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
