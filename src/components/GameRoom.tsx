"use client";
import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import RightPanel from '@/components/RightPanel';
import GameArea from '@/components/GameArea';
import DiceModal from '@/components/DiceModal';
import TurnNotification from '@/components/TurnNotification';
import PhaseNotification from '@/components/PhaseNotification';
import { DigitalHand } from '@/components/DigitalBoard';
import { useLayout } from '@/context/LayoutContext';
import { useMedia } from '@/context/MediaContext';
import { useAuth } from '@/context/AuthContext';
import { useWebRTC } from '@/hooks/useWebRTC';
import { supabase } from '@/lib/supabaseClient';
import { loadDeck } from '@/lib/decks';
import {
    boardFromDeck,
    drawFrom,
    shuffleLibrary,
    toPublicBoard,
    type PlayerBoard,
} from '@/lib/digitalBoard';

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

    const dropOnField = (instanceId: string, x: number, y: number) => {
        setBoard((prev) => {
            if (!prev) return prev;
            const card = prev.hand.find((c) => c.instanceId === instanceId);
            if (!card) return prev;
            return {
                ...prev,
                hand: prev.hand.filter((c) => c.instanceId !== instanceId),
                field: [...prev.field, { ...card, x, y }],
            };
        });
    };

    const returnToHand = (instanceId: string) => {
        setBoard((prev) => {
            if (!prev) return prev;
            const card = prev.field.find((c) => c.instanceId === instanceId);
            if (!card) return prev;
            const { x: _x, y: _y, ...rest } = card;
            return {
                ...prev,
                field: prev.field.filter((c) => c.instanceId !== instanceId),
                hand: [...prev.hand, rest],
            };
        });
    };

    const toGraveyard = (instanceId: string) => {
        setBoard((prev) => {
            if (!prev) return prev;
            const card =
                prev.hand.find((c) => c.instanceId === instanceId) ??
                prev.field.find((c) => c.instanceId === instanceId);
            if (!card) return prev;
            return {
                ...prev,
                hand: prev.hand.filter((c) => c.instanceId !== instanceId),
                field: prev.field.filter((c) => c.instanceId !== instanceId),
                graveyard: [...prev.graveyard, card],
            };
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
                onMoveFieldCard={moveOnField}
                onReturnToHand={returnToHand}
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
                    draggingId={draggingId}
                    setDraggingId={setDraggingId}
                    onDraw={() => setBoard((prev) => (prev ? drawFrom(prev, 'library') : prev))}
                    onDrawExtra={() => setBoard((prev) => (prev ? drawFrom(prev, 'extra') : prev))}
                    onShuffle={() => setBoard((prev) => (prev ? shuffleLibrary(prev) : prev))}
                    onToGraveyard={toGraveyard}
                    onDropOnField={dropOnField}
                />
            )}

            <DiceModal />
            <TurnNotification />
            <PhaseNotification />
        </div>
    );
};

export default GameRoom;
