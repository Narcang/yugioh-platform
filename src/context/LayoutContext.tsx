"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { getBaseLifePoints, getFirstPhase, MatchMode } from '@/lib/gameConfig';

type LayoutMode = 'grid' | 'fullscreen' | 'boxed'; // grid=50/50, fullscreen=100/0, boxed=PIP
// 'self' for the local player, otherwise a remote peer id
type SpotlightTarget = string;
type TurnState = 'self' | 'opponent';

interface LayoutContextType {
    layoutMode: LayoutMode;
    spotlightTarget: SpotlightTarget;
    isSidebarCollapsed: boolean;
    isSettingsOpen: boolean;
    autoSwitchSpotlight: boolean;
    isDiceModalOpen: boolean;
    appView: 'landing' | 'lobby' | 'game';
    currentRoomId: string | null;
    videoFitMode: 'cover' | 'contain';
    setVideoFitMode: (mode: 'cover' | 'contain') => void;
    currentTurn: TurnState;
    setCurrentTurn: (turn: TurnState) => void;
    isTurnChanging: boolean;
    switchTurn: () => void;
    /** Applies a turn decided by the mesh, optionally spotlighting the active seat */
    applyTurn: (turn: TurnState, spotlightId?: string) => void;
    selfTimeLeft: number;
    opponentTimeLeft: number;
    timeLimit: number;
    setTimeLimit: (minutes: number) => void;
    setLayoutMode: (mode: LayoutMode) => void;
    setSpotlightTarget: (target: SpotlightTarget) => void;
    setIsSidebarCollapsed: (collapsed: boolean) => void;
    setIsSettingsOpen: (isOpen: boolean) => void;
    setAutoSwitchSpotlight: (autoSwitch: boolean) => void;
    setIsDiceModalOpen: (isOpen: boolean) => void;
    setAppView: (view: 'landing' | 'lobby' | 'game') => void;
    setCurrentRoomId: (id: string | null) => void;
    currentPhase: string;
    setCurrentPhase: (phase: string) => void;
    gameType: string;
    setGameType: (type: string) => void;
    gameFormat: string;
    setGameFormat: (format: string) => void;
    baseLifePoints: number;
    maxPlayers: number;
    setMaxPlayers: (count: number) => void;
    matchMode: MatchMode;
    setMatchMode: (mode: MatchMode) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid');
    const [spotlightTarget, setSpotlightTarget] = useState<SpotlightTarget>('opponent'); // Default to watching opponent
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [autoSwitchSpotlight, setAutoSwitchSpotlight] = useState(false);
    const [isDiceModalOpen, setIsDiceModalOpen] = useState(false);
    const [appView, setAppView] = useState<'landing' | 'lobby' | 'game'>('landing');
    const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
    const [videoFitMode, setVideoFitMode] = useState<'cover' | 'contain'>('contain');

    // Turn State
    const [currentTurn, setCurrentTurn] = useState<TurnState>('self'); // Default to self for now
    const [isTurnChanging, setIsTurnChanging] = useState(false);

    // Timer State
    const [timeLimit, setTimeLimit] = useState(40); // Total Match Time in Minutes
    // Initialize split timers (e.g. 40 total -> 20 each)
    const [selfTimeLeft, setSelfTimeLeft] = useState((40 / 2) * 60);
    const [opponentTimeLeft, setOpponentTimeLeft] = useState((40 / 2) * 60);

    // Phase State
    const [currentPhase, setCurrentPhase] = useState<string>('Draw Phase');
    const [gameType, setGameTypeState] = useState<string>('Yugioh');
    const [gameFormat, setGameFormatState] = useState<string>('Advanced (TCG)');

    const setGameType = (type: string) => {
        setGameTypeState(type);
    };

    const setGameFormat = (format: string) => {
        setGameFormatState(format);
    };

    const baseLifePoints = getBaseLifePoints(gameType, gameFormat);

    // Multiplayer config (2-4 players)
    const [maxPlayers, setMaxPlayers] = useState<number>(2);
    const [matchMode, setMatchMode] = useState<MatchMode>('ffa');


    // Timer Countdown
    React.useEffect(() => {
        if (timeLimit === 0) return; // No limit

        const timer = setInterval(() => {
            if (currentTurn === 'self') {
                setSelfTimeLeft((prev) => {
                    if (prev <= 0) return 0; // Game Over Logic to be handled
                    return prev - 1;
                });
            } else {
                setOpponentTimeLeft((prev) => {
                    if (prev <= 0) return 0;
                    return prev - 1;
                });
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLimit, currentTurn]);

    // Effect to update timers when timeLimit changes (Reset Game)
    React.useEffect(() => {
        const halfTimeSeconds = (timeLimit / 2) * 60;
        setSelfTimeLeft(halfTimeSeconds);
        setOpponentTimeLeft(halfTimeSeconds);
    }, [timeLimit]);

    // The mesh decides who plays, so the turn is applied rather than toggled.
    const applyTurn = (turn: TurnState, spotlightId?: string) => {
        setCurrentTurn(turn);
        setCurrentPhase(getFirstPhase(gameType));
        setIsTurnChanging(true);

        if (autoSwitchSpotlight) {
            setSpotlightTarget(turn === 'self' ? 'self' : spotlightId ?? 'opponent');
        }

        setTimeout(() => setIsTurnChanging(false), 2000); // matches the notification animation
    };

    const switchTurn = () => {
        if (isTurnChanging) return;
        applyTurn(currentTurn === 'self' ? 'opponent' : 'self');
    };

    return (
        <LayoutContext.Provider value={{
            layoutMode,
            spotlightTarget,
            isSidebarCollapsed,
            isSettingsOpen,
            autoSwitchSpotlight,
            isDiceModalOpen,
            appView,
            currentRoomId,
            setLayoutMode,
            setSpotlightTarget,
            setIsSidebarCollapsed,
            setIsSettingsOpen,
            setAutoSwitchSpotlight,
            setIsDiceModalOpen,
            setAppView,
            setCurrentRoomId,
            videoFitMode,
            setVideoFitMode,
            currentTurn,
            isTurnChanging,
            switchTurn,
            applyTurn,
            setCurrentTurn, // Exposed for initialization
            selfTimeLeft,
            opponentTimeLeft,
            timeLimit,
            setTimeLimit,
            currentPhase,
            setCurrentPhase,
            gameType,
            setGameType,
            gameFormat,
            setGameFormat,
            baseLifePoints,
            maxPlayers,
            setMaxPlayers,
            matchMode,
            setMatchMode,
        }}>
            {children}
        </LayoutContext.Provider>
    );
};

export const useLayout = () => {
    const context = useContext(LayoutContext);
    if (context === undefined) {
        throw new Error('useLayout must be used within a LayoutProvider');
    }
    return context;
};
