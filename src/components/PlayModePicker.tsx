"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { listOwnedDecks, type DeckMeta } from '@/lib/decks';
import type { PlayMode } from '@/lib/gameConfig';

interface PlayModePickerProps {
    gameType: string;
    playMode: PlayMode;
    deckId: string;
    onPlayMode: (mode: PlayMode) => void;
    onDeckId: (id: string) => void;
}

export const PlayModePicker: React.FC<PlayModePickerProps> = ({
    gameType,
    playMode,
    deckId,
    onPlayMode,
    onDeckId,
}) => {
    const { t } = useLocale();
    const { user } = useAuth();
    const [decks, setDecks] = useState<DeckMeta[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user || playMode !== 'digital') return;
        let cancelled = false;
        setLoading(true);
        listOwnedDecks(supabase, user.id, gameType).then((rows) => {
            if (cancelled) return;
            setDecks(rows);
            setLoading(false);
            if (rows[0]) onDeckId(rows[0].id);
        });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, gameType, playMode]);

    return (
        <div className="form-section">
            <label className="input-label">{t.play.howYouPlay}</label>
            <p className="helper-text">{t.play.howYouPlayHint}</p>
            <div className="play-mode-toggle">
                <button
                    type="button"
                    className={playMode === 'physical' ? 'play-mode-btn active' : 'play-mode-btn'}
                    onClick={() => onPlayMode('physical')}
                >
                    {t.play.physical}
                </button>
                <button
                    type="button"
                    className={playMode === 'digital' ? 'play-mode-btn active' : 'play-mode-btn'}
                    onClick={() => onPlayMode('digital')}
                >
                    {t.play.digital}
                </button>
            </div>
            {playMode === 'digital' && (
                <div style={{ marginTop: 12 }}>
                    {!user ? (
                        <p className="helper-text">{t.play.needAccount}</p>
                    ) : loading ? (
                        <p className="helper-text">{t.auth.loading}</p>
                    ) : decks.length === 0 ? (
                        <p className="helper-text">{t.play.noDecks}</p>
                    ) : (
                        <>
                            <label className="input-label">{t.play.pickDeck}</label>
                            <select
                                className="select-input"
                                value={deckId}
                                onChange={(e) => onDeckId(e.target.value)}
                            >
                                {decks.map((deck) => (
                                    <option key={deck.id} value={deck.id}>
                                        {deck.name} — {deck.format}
                                    </option>
                                ))}
                            </select>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

interface JoinPlayModalProps {
    isOpen: boolean;
    gameType: string;
    onCancel: () => void;
    onConfirm: (playMode: PlayMode, deckId: string | null) => void;
}

export const JoinPlayModal: React.FC<JoinPlayModalProps> = ({
    isOpen,
    gameType,
    onCancel,
    onConfirm,
}) => {
    const { t } = useLocale();
    const [playMode, setPlayMode] = useState<PlayMode>('physical');
    const [deckId, setDeckId] = useState('');

    if (!isOpen) return null;

    const canContinue = playMode === 'physical' || Boolean(deckId);

    return (
        <div className="modal-overlay">
            <div className="create-room-modal">
                <div className="modal-header">
                    <h2>{t.play.howYouPlay}</h2>
                    <button className="close-btn" onClick={onCancel}>&times;</button>
                </div>
                <div className="modal-form">
                    <PlayModePicker
                        gameType={gameType}
                        playMode={playMode}
                        deckId={deckId}
                        onPlayMode={setPlayMode}
                        onDeckId={setDeckId}
                    />
                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onCancel}>
                            {t.lobby.cancel}
                        </button>
                        <button
                            type="button"
                            className="btn-primary"
                            disabled={!canContinue}
                            onClick={() => onConfirm(playMode, playMode === 'digital' ? deckId : null)}
                        >
                            {t.play.continue}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
