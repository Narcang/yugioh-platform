"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import DeckCardLink from '@/components/DeckCardLink';
import { DECKS_TABLE, DeckMeta } from '@/lib/decks';

export default function MyDecksPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const [decks, setDecks] = useState<DeckMeta[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isAuthLoading || !user) return;

        let cancelled = false;
        (async () => {
            const { data, error: queryError } = await supabase
                .from(DECKS_TABLE)
                .select('*')
                .eq('owner_id', user.id)
                .order('updated_at', { ascending: false });

            if (cancelled) return;
            if (queryError) {
                console.error('[decks/mine] query failed', queryError);
                setError(queryError.message);
                setDecks([]);
            } else {
                setDecks((data ?? []) as DeckMeta[]);
            }
        })();

        return () => { cancelled = true; };
    }, [user, isAuthLoading]);

    if (isAuthLoading) {
        return <div className="decks-notice">Caricamento…</div>;
    }

    if (!user) {
        return (
            <div className="decks-empty">
                <h2>Serve un account</h2>
                <p>Usa il tasto Accedi qui in alto per vedere e modificare i tuoi mazzi.</p>
                <Link href="/decks" className="deck-btn">Intanto guarda i mazzi pubblici</Link>
            </div>
        );
    }

    if (decks === null) {
        return <div className="decks-notice">Caricamento dei tuoi mazzi…</div>;
    }

    return (
        <>
            <header className="decks-header">
                <div>
                    <h1>I tuoi mazzi</h1>
                    <p>
                        Tutti i mazzi che hai creato, pubblici e privati. Aprine uno per
                        modificarlo.
                    </p>
                </div>
                <Link href="/decks/new" className="deck-btn primary">Crea un mazzo</Link>
            </header>

            {error && <div className="decks-error" style={{ marginBottom: 16 }}>{error}</div>}

            {decks.length === 0 ? (
                <div className="decks-empty">
                    <h2>Nessun mazzo ancora</h2>
                    <p>Costruisci il primo: scegli gioco e formato e aggiungi le carte.</p>
                    <Link href="/decks/new" className="deck-btn primary">Crea un mazzo</Link>
                </div>
            ) : (
                <div className="deck-grid">
                    {decks.map((deck) => (
                        <DeckCardLink
                            key={deck.id}
                            id={deck.id}
                            name={deck.name}
                            gameType={deck.game_type}
                            format={deck.format}
                            isLegal={deck.is_legal}
                            coverCardId={deck.cover_card_id}
                            isPublic={deck.is_public}
                        />
                    ))}
                </div>
            )}
        </>
    );
}
