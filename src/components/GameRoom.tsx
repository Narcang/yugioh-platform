"use client";
import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import RightPanel from '@/components/RightPanel';
import GameArea from '@/components/GameArea';
import DiceModal from '@/components/DiceModal';
import TableGuideModal from '@/components/TableGuideModal';
import TurnNotification from '@/components/TurnNotification';
import PhaseNotification from '@/components/PhaseNotification';
import { DigitalHand, type FieldPlayOpts } from '@/components/DigitalBoard';
import { TokenPalette } from '@/components/Tokens';
import { useLayout } from '@/context/LayoutContext';
import { useMedia } from '@/context/MediaContext';
import { useAuth } from '@/context/AuthContext';
import { useWebRTC } from '@/hooks/useWebRTC';
import { supabase } from '@/lib/supabaseClient';
import { loadDeck } from '@/lib/decks';
import {
    boardFromDeck,
    drawFrom,
    moveCard,
    shuffleLibrary,
    toPublicBoard,
    type BoardZone,
    type PlayerBoard,
} from '@/lib/digitalBoard';
import { applyTokenDrop, tokensLeavingCard, type TableToken, type TokenDrop } from '@/lib/tokens';

const GameRoom: React.FC = () => {
    const { currentRoomId, matchMode, playMode, selectedDeckId, gameType } = useLayout();
    const { localStream, videoRotation } = useMedia();
    const { profile, user } = useAuth();
    const username = profile?.username || user?.email?.split('@')[0] || 'Duelist';

    const {
        peers,
        remoteStream,
        sendCard,
        latestReceivedCard,
        dataChannelState,
        sendLP,
        sendPhase,
        sendBoard,
        sendTokens,
        sendRoll,
        latestReceivedRoll,
        latestReceivedPhase,
        myId,
        myTeam,
        setMyTeam,
        turnOrder,
        activePlayerId,
        activePlayerName,
        isMyTurn,
        passTurn,
        iceConnectionState,
        connectionLogs,
        sendPing,
        reconnect,
    } = useWebRTC(currentRoomId, localStream, username, matchMode, videoRotation, playMode);

    const { setCurrentPhase, applyTurn, setCurrentTurn, currentTurn, isTurnChanging } = useLayout();
    const [board, setBoard] = useState<PlayerBoard | null>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [tokens, setTokens] = useState<TableToken[]>([]);

    useEffect(() => {
        setTokens([]);
    }, [currentRoomId]);

    useEffect(() => {
        if (playMode !== 'digital' || !selectedDeckId) {
            setBoard(null);
            return;
        }
        let cancelled = false;
        loadDeck(supabase, selectedDeckId).then((loaded) => {
            if (cancelled || !loaded) return;
            setBoard(boardFromDeck(loaded.deck, loaded.meta.game_type || gameType));
        });
        return () => {
            cancelled = true;
        };
    }, [playMode, selectedDeckId, gameType]);

    useEffect(() => {
        if (playMode !== 'digital' || !board) return;
        sendBoard(toPublicBoard(board));
    }, [board, playMode, sendBoard]);

    useEffect(() => {
        sendTokens(tokens);
    }, [tokens, sendTokens]);

    useEffect(() => {
        if (latestReceivedPhase && currentTurn === 'opponent' && !isTurnChanging) {
            setCurrentPhase(latestReceivedPhase);
        }
    }, [latestReceivedPhase, setCurrentPhase, currentTurn, isTurnChanging]);

    const lastAppliedTurnRef = React.useRef<string | null>(null);
    const isFirstTurnRef = React.useRef(true);
    useEffect(() => {
        if (!activePlayerId || lastAppliedTurnRef.current === activePlayerId) return;
        lastAppliedTurnRef.current = activePlayerId;
        const mine = activePlayerId === myId;

        if (isFirstTurnRef.current) {
            isFirstTurnRef.current = false;
            setCurrentTurn(mine ? 'self' : 'opponent');
            return;
        }
        applyTurn(mine ? 'self' : 'opponent', activePlayerId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activePlayerId, myId]);

    const moveOnField = (instanceId: string, x: number, y: number) => {
        setBoard((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                field: prev.field.map((card) =>
                    card.instanceId === instanceId ? { ...card, x, y } : card
                ),
            };
        });
    };

    const dropOnField = (instanceId: string, x: number, y: number, opts?: FieldPlayOpts) => {
        setBoard((prev) => (prev ? moveCard(prev, instanceId, 'field', { ...opts, x, y }) : prev));
    };

    const relocate = (instanceId: string, zone: BoardZone, opts?: FieldPlayOpts) => {
        setBoard((prev) => (prev ? moveCard(prev, instanceId, zone, opts) : prev));
        if (zone !== 'field') {
            setTokens((prev) => tokensLeavingCard(prev, instanceId));
        }
    };

    const updateFieldCard = (instanceId: string, patch: FieldPlayOpts) => {
        setBoard((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                field: prev.field.map((card) =>
                    card.instanceId === instanceId ? { ...card, ...patch } : card
                ),
            };
        });
    };

    const placeToken = (kind: string, drop: NonNullable<TokenDrop>) => {
        setTokens((prev) => applyTokenDrop(prev, null, kind, drop, gameType));
    };

    const moveToken = (id: string, drop: NonNullable<TokenDrop>) => {
        setTokens((prev) => {
            const current = prev.find((item) => item.id === id);
            if (!current) return prev;
            return applyTokenDrop(prev, id, current.kind, drop, gameType);
        });
    };

    const changeToken = (id: string, patch: { count?: number } | 'remove') => {
        setTokens((prev) => {
            if (patch === 'remove') return prev.filter((item) => item.id !== id);
            return prev.map((item) => (item.id === id ? { ...item, ...patch } : item));
        });
    };

    return (
        <div className={`game-room-container${playMode === 'digital' ? ' has-digital-hand' : ''}`}>
            <Sidebar
                sendPhase={sendPhase}
                passTurn={passTurn}
                isMyTurn={isMyTurn}
                activePlayerName={activePlayerName}
                turnPosition={turnOrder.indexOf(activePlayerId ?? '') + 1}
                playerCount={turnOrder.length}
            />
            <GameArea
                peers={peers}
                selfName={username}
                sendLP={sendLP}
                myId={myId}
                myTeam={myTeam}
                onTeamChange={setMyTeam}
                activePlayerId={activePlayerId}
                myPlayMode={playMode}
                myField={board?.field ?? []}
                gameType={gameType}
                onMoveFieldCard={moveOnField}
                onReturnToHand={(id) => relocate(id, 'hand')}
                onToGraveyard={(id) => relocate(id, 'graveyard')}
                onToExile={(id) => relocate(id, 'exile')}
                onToExtra={(id) => relocate(id, 'extra')}
                onUpdateFieldCard={updateFieldCard}
                tokens={tokens}
                onMoveToken={moveToken}
                onChangeToken={changeToken}
            />
            <RightPanel
                remoteStream={remoteStream}
                onDeclareCard={sendCard}
                lastReceivedCard={latestReceivedCard}
                dataChannelState={dataChannelState}
                iceConnectionState={iceConnectionState}
                connectionLogs={connectionLogs}
                sendPing={sendPing}
                reconnect={reconnect}
            />

            {playMode === 'digital' && board && (
                <DigitalHand
                    board={board}
                    gameType={gameType}
                    draggingId={draggingId}
                    setDraggingId={setDraggingId}
                    onDraw={() => setBoard((prev) => (prev ? drawFrom(prev, 'library') : prev))}
                    onShuffle={() => setBoard((prev) => (prev ? shuffleLibrary(prev) : prev))}
                    onRelocate={relocate}
                    onDropOnField={dropOnField}
                />
            )}

            <DiceModal
                selfName={username}
                sendRoll={sendRoll}
                latestReceivedRoll={latestReceivedRoll}
            />
            <TableGuideModal />
            <TokenPalette onPlace={placeToken} />
            <TurnNotification />
            <PhaseNotification />
        </div>
    );
};

export default GameRoom;
