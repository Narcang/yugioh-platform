"use client";
import React, { useEffect, Suspense } from 'react';
import { useLayout } from '@/context/LayoutContext';
import GameRoom from '@/components/GameRoom';
import LandingPage from '@/components/LandingPage';
import Lobby from '@/components/Lobby';
import SettingsModal from '@/components/SettingsModal';
import { useSearchParams } from 'next/navigation';

import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { getFirstPhase } from '@/lib/gameConfig';

function RoomUrlHandler() {
  const { setAppView, setCurrentRoomId, setGameType, setGameFormat, setCurrentPhase, setCurrentTurn } = useLayout();
  const searchParams = useSearchParams();
  const { user } = useAuth();


  useEffect(() => {
    const roomId = searchParams.get('room');
    if (roomId) {
      const fetchRoomDetails = async () => {
        try {
          const { data: room, error } = await supabase
            .from('rooms')
            .select('settings, host_id, format')
            .eq('id', roomId)
            .single();

          if (room) {
            const gameType = room.settings?.gameType || 'Yugioh';
            setGameType(gameType);
            setGameFormat(room.format || 'Advanced (TCG)');
            setCurrentPhase(getFirstPhase(gameType));

            // 3. Set Initial Turn
            // If user is the host, they go first (Self). Otherwise, they are Guest (Opponent turn).
            if (user && user.id === room.host_id) {
              setCurrentTurn('self');
            } else {
              setCurrentTurn('opponent');
            }
          }
        } catch (err) {
          console.error("Error fetching room details:", err);
        }

        setCurrentRoomId(roomId);
        setAppView('game');
      };

      fetchRoomDetails();
    }
  }, [searchParams, setCurrentRoomId, setAppView, setGameType, setGameFormat, setCurrentPhase, setCurrentTurn, user]);

  return null;
}

export default function Home() {
  const { appView } = useLayout();

  return (
    <main className="app-container">
      <Suspense fallback={null}>
        <RoomUrlHandler />
      </Suspense>
      {appView === 'landing' && <LandingPage />}
      {appView === 'lobby' && <Lobby />}
      {appView === 'game' && <GameRoom />}
      <SettingsModal />
    </main>
  );
}


