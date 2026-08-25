"use client";
import React, { useState, useEffect } from 'react';
import {
    MatchMode,
    getAllowedPlayerCounts,
    getDefaultPlayerCount,
    getAllowedMatchModes,
    getDefaultMatchMode,
    getMatchModeLabel,
    getPlayerCountLabel,
    getBaseLifePoints,
    GAME_FORMATS,
} from '@/lib/gameConfig';

interface CreateRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (roomData: RoomData) => void;
}

export interface RoomData {
    name: string;
    gameType: string;
    format: string;
    description: string;
    isPublic: boolean;
    language: string;
    maxPlayers: number;
    matchMode: MatchMode;
}

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [gameType, setGameType] = useState('Yugioh');
    const [format, setFormat] = useState(GAME_FORMATS['Yugioh'][0]);
    const [language, setLanguage] = useState('ITA');
    const [isPublic, setIsPublic] = useState(true);
    const [description, setDescription] = useState('');
    const [maxPlayers, setMaxPlayers] = useState(() => getDefaultPlayerCount('Yugioh', GAME_FORMATS['Yugioh'][0]));
    const [matchMode, setMatchMode] = useState<MatchMode>('ffa');

    const allowedPlayerCounts = getAllowedPlayerCounts(gameType, format);
    const allowedMatchModes = getAllowedMatchModes(maxPlayers);
    const baseLife = getBaseLifePoints(gameType, format);

    // Update format when game type changes
    useEffect(() => {
        setFormat(GAME_FORMATS[gameType][0]);
    }, [gameType]);

    // Clamp player count to what the current game/format allows
    useEffect(() => {
        const allowed = getAllowedPlayerCounts(gameType, format);
        setMaxPlayers((prev) => (allowed.includes(prev) ? prev : getDefaultPlayerCount(gameType, format)));
    }, [gameType, format]);

    // Keep match mode valid for the selected player count
    useEffect(() => {
        const allowed = getAllowedMatchModes(maxPlayers);
        setMatchMode((prev) => (allowed.includes(prev) ? prev : getDefaultMatchMode(gameType, maxPlayers)));
    }, [gameType, maxPlayers]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCreate({ name, gameType, format, isPublic, description, language, maxPlayers, matchMode });
        onClose();
        // Reset form
        setName('');
        setDescription('');
    };

    return (
        <div className="modal-overlay">
            <div className="create-room-modal">
                <div className="modal-header">
                    <h2>Crea nuova partita</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-section">
                        <label className="input-label">Nome Lobby</label>
                        <input
                            type="text"
                            className="text-input"
                            placeholder="Inserisci il nome della stanza..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-row" style={{ display: 'flex', gap: '12px' }}>
                        <div className="form-section" style={{ flex: 1 }}>
                            <label className="input-label">Gioco</label>
                            <select
                                className="select-input"
                                value={gameType}
                                onChange={(e) => setGameType(e.target.value)}
                            >
                                {Object.keys(GAME_FORMATS).map(game => (
                                    <option key={game} value={game}>{game}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-section" style={{ flex: 1 }}>
                            <label className="input-label">Lingua</label>
                            <select
                                className="select-input"
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                            >
                                <option value="ITA">Italiano</option>
                                <option value="ENG">English</option>
                                <option value="ESP">Español</option>
                                <option value="DEU">Deutsch</option>
                                <option value="FRA">Français</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-section">
                        <label className="input-label">Formato</label>
                        <select
                            className="select-input"
                            value={format}
                            onChange={(e) => setFormat(e.target.value)}
                        >
                            {GAME_FORMATS[gameType].map(fmt => (
                                <option key={fmt} value={fmt}>{fmt}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-row" style={{ display: 'flex', gap: '12px' }}>
                        <div className="form-section" style={{ flex: 1 }}>
                            <label className="input-label">Giocatori</label>
                            <select
                                className="select-input"
                                value={maxPlayers}
                                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                                disabled={allowedPlayerCounts.length === 1}
                            >
                                {allowedPlayerCounts.map(count => (
                                    <option key={count} value={count}>{getPlayerCountLabel(count)}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-section" style={{ flex: 1 }}>
                            <label className="input-label">Modalità</label>
                            <select
                                className="select-input"
                                value={matchMode}
                                onChange={(e) => setMatchMode(e.target.value as MatchMode)}
                                disabled={allowedMatchModes.length === 1}
                            >
                                {allowedMatchModes.map(mode => (
                                    <option key={mode} value={mode}>{getMatchModeLabel(mode, maxPlayers)}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <p className="helper-text" style={{ marginTop: '-8px' }}>
                        {allowedPlayerCounts.length === 1
                            ? `${gameType} ${format} si gioca solo in 1 contro 1.`
                            : `${maxPlayers} giocatori, ${getMatchModeLabel(matchMode, maxPlayers).toLowerCase()}.`}
                        {' '}Vita iniziale: {baseLife} per giocatore.
                    </p>

                    <div className="form-section checkbox-section">
                        <label className="toggle-switch-container">
                            <span className="input-label" style={{ marginBottom: 0 }}>Partita Pubblica</span>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={isPublic}
                                    onChange={(e) => setIsPublic(e.target.checked)}
                                />
                                <span className="slider round"></span>
                            </label>
                        </label>
                        <p className="helper-text">
                            {isPublic ? 'Chiunque può unirsi alla partita.' : 'La partita sarà accessibile solo tramite invito.'}
                        </p>
                    </div>

                    <div className="form-section">
                        <label className="input-label">Descrizione (Facoltativa)</label>
                        <textarea
                            className="text-input textarea"
                            placeholder="Aggiungi dettagli..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>Annulla</button>
                        <button type="submit" className="btn-primary">Crea Lobby</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateRoomModal;
