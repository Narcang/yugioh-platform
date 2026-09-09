"use client";
import React, { useState, useEffect } from 'react';
import {
    MatchMode,
    PlayMode,
    SkillLevel,
    SKILL_LEVELS,
    getAllowedPlayerCounts,
    getDefaultPlayerCount,
    getAllowedMatchModes,
    getDefaultMatchMode,
    getBaseLifePoints,
    GAME_FORMATS,
    isSkillLevel,
    skillLabelKey,
} from '@/lib/gameConfig';
import { PlayModePicker } from '@/components/PlayModePicker';
import { useLocale } from '@/context/LocaleContext';

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
    password: string | null;
    language: string;
    maxPlayers: number;
    matchMode: MatchMode;
    playMode: PlayMode;
    deckId: string | null;
    skillLevel: SkillLevel | null;
}

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [gameType, setGameType] = useState('Yugioh');
    const [format, setFormat] = useState(GAME_FORMATS['Yugioh'][0]);
    const [language, setLanguage] = useState('ITA');
    const [isPublic, setIsPublic] = useState(true);
    const [password, setPassword] = useState('');
    const [description, setDescription] = useState('');
    const [maxPlayers, setMaxPlayers] = useState(() => getDefaultPlayerCount('Yugioh', GAME_FORMATS['Yugioh'][0]));
    const [matchMode, setMatchMode] = useState<MatchMode>('ffa');
    const [playMode, setPlayMode] = useState<PlayMode>('physical');
    const [deckId, setDeckId] = useState('');
    const [skillLevel, setSkillLevel] = useState<SkillLevel | null>(null);
    const { t } = useLocale();

    const allowedPlayerCounts = getAllowedPlayerCounts(gameType, format);
    const allowedMatchModes = getAllowedMatchModes(maxPlayers);
    const baseLife = getBaseLifePoints(gameType, format);

    const modeLabel = (mode: MatchMode, players: number) => {
        if (players === 2) return t.lobby.mode1v1;
        if (mode === 'teams') return t.lobby.modeTeams;
        return t.lobby.modeFfa;
    };

    const playerCountLabel = (count: number) =>
        count === 2 ? t.lobby.players2 : t.lobby.playersN.replace('{n}', String(count));

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

    const passwordOk = isPublic || password.trim().length >= 4;
    const canSubmit = Boolean(name.trim()) && passwordOk && !(playMode === 'digital' && !deckId);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        onCreate({
            name: name.trim(),
            gameType,
            format,
            isPublic,
            password: isPublic ? null : password.trim(),
            description: description.trim(),
            language,
            maxPlayers,
            matchMode,
            playMode,
            deckId: playMode === 'digital' ? deckId || null : null,
            skillLevel,
        });
        onClose();
        setName('');
        setDescription('');
        setPassword('');
        setIsPublic(true);
    };

    return (
        <div className="modal-overlay">
            <div className="create-room-modal">
                <div className="modal-header">
                    <h2>{t.lobby.createTitle}</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-section">
                        <label className="input-label">{t.lobby.createName}</label>
                        <input
                            type="text"
                            className="text-input"
                            placeholder={t.lobby.createNamePh}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-row" style={{ display: 'flex', gap: '12px' }}>
                        <div className="form-section" style={{ flex: 1 }}>
                            <label className="input-label">{t.lobby.createGame}</label>
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
                            <label className="input-label">{t.lobby.createLanguage}</label>
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
                                <option value="POR">Português</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-section">
                        <label className="input-label">{t.lobby.createFormat}</label>
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
                            <label className="input-label">{t.lobby.createPlayers}</label>
                            <select
                                className="select-input"
                                value={maxPlayers}
                                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                                disabled={allowedPlayerCounts.length === 1}
                            >
                                {allowedPlayerCounts.map(count => (
                                    <option key={count} value={count}>{playerCountLabel(count)}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-section" style={{ flex: 1 }}>
                            <label className="input-label">{t.lobby.createMode}</label>
                            <select
                                className="select-input"
                                value={matchMode}
                                onChange={(e) => setMatchMode(e.target.value as MatchMode)}
                                disabled={allowedMatchModes.length === 1}
                            >
                                {allowedMatchModes.map(mode => (
                                    <option key={mode} value={mode}>{modeLabel(mode, maxPlayers)}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <p className="helper-text" style={{ marginTop: '-8px' }}>
                        {allowedPlayerCounts.length === 1
                            ? t.lobby.createOnly1v1.replace('{game}', gameType).replace('{format}', format)
                            : t.lobby.createSummary.replace('{n}', String(maxPlayers)).replace('{mode}', modeLabel(matchMode, maxPlayers).toLowerCase())}
                        {' '}{t.lobby.createLife.replace('{lp}', String(baseLife))}
                    </p>

                    <div className="form-section">
                        <label className="input-label">{t.lobby.skillLevel}</label>
                        <select
                            className="select-input"
                            value={skillLevel ?? ''}
                            onChange={(e) => {
                                const next = Number(e.target.value);
                                setSkillLevel(isSkillLevel(next) ? next : null);
                            }}
                        >
                            <option value="">{t.lobby.skillAny}</option>
                            {SKILL_LEVELS.map((level) => (
                                <option key={level} value={level}>
                                    {t.lobby.skill[skillLabelKey(gameType, level)]}
                                </option>
                            ))}
                        </select>
                        <p className="helper-text">{t.lobby.skillHint}</p>
                    </div>

                    <PlayModePicker
                        gameType={gameType}
                        playMode={playMode}
                        deckId={deckId}
                        onPlayMode={setPlayMode}
                        onDeckId={setDeckId}
                    />

                    <div className="form-section checkbox-section">
                        <label className="toggle-switch-container">
                            <span className="input-label" style={{ marginBottom: 0 }}>{t.lobby.publicMatch}</span>
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
                            {isPublic ? t.lobby.publicHint : t.lobby.privateHint}
                        </p>
                    </div>

                    {!isPublic && (
                        <div className="form-section">
                            <label className="input-label">{t.lobby.roomPassword}</label>
                            <input
                                type="password"
                                className="text-input"
                                placeholder={t.lobby.roomPasswordPh}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="new-password"
                                minLength={4}
                                required
                            />
                            <p className="helper-text">{t.lobby.roomPasswordNeed}</p>
                        </div>
                    )}

                    <div className="form-section">
                        <label className="input-label">{t.lobby.roomDescription}</label>
                        <textarea
                            className="text-input textarea"
                            placeholder={t.lobby.roomDescriptionPh}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>{t.lobby.cancel}</button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={!canSubmit}
                        >
                            {t.lobby.createSubmit}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateRoomModal;
