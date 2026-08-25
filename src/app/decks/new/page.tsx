"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { GAME_FORMATS, GAME_TYPES } from '@/lib/gameConfig';
import { getFormatRules, isDeckBuilderSupported } from '@/lib/deckRules';
import { DECKS_TABLE } from '@/lib/decks';

export default function NewDeckPage() {
    const router = useRouter();
    const { user, isLoading } = useAuth();

    const [gameType, setGameType] = useState('Yugioh');
    const [format, setFormat] = useState(GAME_FORMATS['Yugioh'][0]);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setFormat(GAME_FORMATS[gameType][0]);
    }, [gameType]);

    const rules = getFormatRules(gameType, format);
    const supported = isDeckBuilderSupported(gameType);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !name.trim()) return;

        setIsSaving(true);
        setError(null);
        try {
            const { data, error: insertError } = await supabase
                .from(DECKS_TABLE)
                .insert([{
                    owner_id: user.id,
                    game_type: gameType,
                    format,
                    name: name.trim(),
                    description: description.trim() || null,
                    is_public: isPublic,
                    // An empty deck is never legal; the builder recomputes this on save.
                    is_legal: false,
                }])
                .select('id')
                .single();

            if (insertError) throw insertError;
            router.push(`/decks/${data.id}`);
        } catch (err) {
            console.error('[decks/new] create failed', err);
            setError(err instanceof Error ? err.message : 'Impossibile creare il mazzo.');
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="decks-notice">Caricamento…</div>;
    }

    if (!user) {
        return (
            <div className="decks-empty">
                <h2>Serve un account</h2>
                <p>Accedi per creare e salvare i tuoi mazzi.</p>
                <Link href="/" className="deck-btn primary">Vai al login</Link>
            </div>
        );
    }

    return (
        <>
            <header className="decks-header">
                <div>
                    <h1>Crea un mazzo</h1>
                    <p>
                        Scegli gioco e formato: le regole di costruzione vengono applicate
                        mentre aggiungi le carte.
                    </p>
                </div>
            </header>

            <form className="deck-form" onSubmit={handleSubmit}>
                <div className="deck-field">
                    <label htmlFor="deck-game">Gioco</label>
                    <select
                        id="deck-game"
                        value={gameType}
                        onChange={(e) => setGameType(e.target.value)}
                    >
                        {GAME_TYPES.map((game) => (
                            <option key={game} value={game} disabled={!isDeckBuilderSupported(game)}>
                                {game}{isDeckBuilderSupported(game) ? '' : ' — in arrivo'}
                            </option>
                        ))}
                    </select>
                    {!supported && (
                        <span className="hint">
                            Per ora il database carte è completo solo per Yu-Gi-Oh!.
                        </span>
                    )}
                </div>

                <div className="deck-field">
                    <label htmlFor="deck-format">Formato</label>
                    <select
                        id="deck-format"
                        value={format}
                        onChange={(e) => setFormat(e.target.value)}
                    >
                        {GAME_FORMATS[gameType].map((f) => (
                            <option key={f} value={f}>{f}</option>
                        ))}
                    </select>
                    <span className="hint">
                        Main {rules.main.min}-{rules.main.max} carte
                        {rules.hasExtraDeck ? `, Extra max ${rules.extra.max}` : ', nessun Extra Deck'}
                        , Side max {rules.side.max}, {rules.maxCopies} copie per carta
                        {rules.banlist ? `, lista ban ${rules.banlist.toUpperCase()}` : ', nessuna lista ban'}.
                    </span>
                </div>

                <div className="deck-field">
                    <label htmlFor="deck-name">Nome del mazzo</label>
                    <input
                        id="deck-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Es. Blue-Eyes Control"
                        maxLength={80}
                        required
                    />
                </div>

                <div className="deck-field">
                    <label htmlFor="deck-desc">Descrizione (opzionale)</label>
                    <textarea
                        id="deck-desc"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Come si gioca, combo principali, matchup…"
                        rows={3}
                        maxLength={500}
                    />
                </div>

                <div className="deck-field">
                    <label>Visibilità</label>
                    <div className="deck-visibility">
                        <button
                            type="button"
                            className={isPublic ? '' : 'selected'}
                            onClick={() => setIsPublic(false)}
                        >
                            <strong>Privato</strong>
                            <span>Solo tu puoi vederlo</span>
                        </button>
                        <button
                            type="button"
                            className={isPublic ? 'selected' : ''}
                            onClick={() => setIsPublic(true)}
                        >
                            <strong>Pubblico</strong>
                            <span>Compare in Esplora</span>
                        </button>
                    </div>
                </div>

                {error && <div className="decks-error">{error}</div>}

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        type="submit"
                        className="deck-btn primary"
                        disabled={isSaving || !name.trim() || !supported}
                    >
                        {isSaving ? 'Creazione…' : 'Crea e aggiungi carte'}
                    </button>
                    <Link href="/decks/mine" className="deck-btn">Annulla</Link>
                </div>
            </form>
        </>
    );
}
