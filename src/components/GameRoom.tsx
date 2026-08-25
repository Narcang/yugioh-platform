"use client";
import React from 'react';
import Sidebar from '@/components/Sidebar';
import RightPanel from '@/components/RightPanel';
import GameArea from '@/components/GameArea';
import DiceModal from '@/components/DiceModal';
import TurnNotification from '@/components/TurnNotification';
import PhaseNotification from '@/components/PhaseNotification';
import { useLayout } from '@/context/LayoutContext';
import { useMedia } from '@/context/MediaContext';
import { useAuth } from '@/context/AuthContext';
import { useWebRTC } from '@/hooks/useWebRTC';


const GameRoom: React.FC = () => {
    const { currentRoomId, matchMode } = useLayout();
    const { localStream, videoRotation } = useMedia();
    const { profile, user } = useAuth(); // Get user profile
    const username = profile?.username || user?.email?.split('@')[0] || 'Duelist';

    const {
        peers,
        remoteStream,
        sendCard,
        latestReceivedCard,
        dataChannelState,
        sendLP,
        sendPhase,
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
        reconnect
    } = useWebRTC(currentRoomId, localStream, username, matchMode, videoRotation);

    const { setCurrentPhase, applyTurn, setCurrentTurn, currentTurn, isTurnChanging } = useLayout();

    React.useEffect(() => {
        // Only update phase from opponent if it's THEIR turn and we aren't switching
        if (latestReceivedPhase && currentTurn === 'opponent' && !isTurnChanging) {
            setCurrentPhase(latestReceivedPhase);
        }
    }, [latestReceivedPhase, setCurrentPhase, currentTurn, isTurnChanging]);

    // Mirror the mesh turn into the layout state that drives the UI
    const lastAppliedTurnRef = React.useRef<string | null>(null);
    const isFirstTurnRef = React.useRef(true);
    React.useEffect(() => {
        if (!activePlayerId || lastAppliedTurnRef.current === activePlayerId) return;
        lastAppliedTurnRef.current = activePlayerId;
        const mine = activePlayerId === myId;

        // Entering the room should not trigger the turn announcement
        if (isFirstTurnRef.current) {
            isFirstTurnRef.current = false;
            setCurrentTurn(mine ? 'self' : 'opponent');
            return;
        }
        applyTurn(mine ? 'self' : 'opponent', activePlayerId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activePlayerId, myId]);

    return (
        <div className="game-room-container">
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

            <DiceModal />
            <TurnNotification />
            <PhaseNotification />
        </div>
    );
};

export default GameRoom;
