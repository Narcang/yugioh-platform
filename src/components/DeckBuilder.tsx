"use client";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import CardSearchInput, { CardSearchResult } from './CardSearchInput';
import {
    DECK_SECTIONS,
    DeckCard,
    DeckContents,
    DeckSection,
    countSection,
    emptyDeck,
    groupEntries,
    getFormatRules,
    getSectionLabel,
    hasExtraSection,
    hasSideSection,
    isCommanderCandidate,
    isDeckable,
    remainingCopies,
    restrictionLabel,
    sectionFor,
    validateDeck,
} from '@/lib/deckRules';
import {
    DeckMeta,
    LoadedDeck,
    deckToRows,
    entryImageUrl,
    loadDeck,
    previewImageUrl,
    searchResultToDeckCard,
} from '@/lib/decks';

interface DeckBuilderProps {
    deckId: string;
    /** Server-rendered public deck, so the page has content before hydration. */
    initialData: LoadedDeck | null;
}

function searchHint(rules: ReturnType<typeof getFormatRules>): string {
    if (rules.extraRole === 'leader') {
        return 'Il Leader va da solo nel riquadro Leader. Il mazzo deve essere dei suoi colori.';
    }
    if (rules.extraRole === 'legend') {
        return 'Il Legend va da solo nel riquadro Legend. I Battlefield nei tre slot, le Rune restano fuori (12 carte dei suoi domini).';
    }
    if (rules.extraRole === 'commander') {
        return 'La prima creatura leggendaria diventa il Commander. Puoi spostarla dal mazzo.';
    }
    if (hasExtraSection(rules)) {
        return 'Le carte finiscono automaticamente nel Main o nell\'Extra Deck. Il testo resta in ricerca, così aggiungi più copie di seguito.';
    }
    return 'Il testo resta in ricerca, così aggiungi più copie di seguito.';
}

const DeckBuilder: React.FC<DeckBuilderProps> = ({ deckId, initialData }) => {
    const router = useRouter();
    const { user, isLoading: isAuthLoading } = useAuth();

    const [meta, setMeta] = useState<DeckMeta | null>(initialData?.meta ?? null);
    const [deck, setDeck] = useState<DeckContents>(initialData?.deck ?? emptyDeck());
    const [isLoading, setIsLoading] = useState(!initialData);
    const [notFound, setNotFound] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [savedAt, setSavedAt] = useState<number | null>(null);
    const [zoomed, setZoomed] = useState<DeckCard | null>(null);
    // Follows the pointer through the list and keeps the last card once it
    // leaves, so the panel never blinks back to empty while you read it.
    const [hovered, setHovered] = useState<DeckCard | null>(null);

    const isOwner = !!user && !!meta && meta.owner_id === user.id;
    const canEdit = isOwner;

    // A private deck is invisible to the anonymous server render, so it can only
    // be loaded once the session is available in the browser.
    useEffect(() => {
        if (initialData || isAuthLoading) return;

        let cancelled = false;
        (async () => {
            setIsLoading(true);
            const loaded = await loadDeck(supabase, deckId);
            if (cancelled) return;
            if (!loaded) {
                setNotFound(true);
            } else {
                setMeta(loaded.meta);
                setDeck(loaded.deck);
            }
            setIsLoading(false);
        })();

        return () => { cancelled = true; };
    }, [deckId, initialData, isAuthLoading, user?.id]);

    const rules = useMemo(
        () => getFormatRules(meta?.game_type ?? 'Yugioh', meta?.format ?? ''),
        [meta?.game_type, meta?.format]
    );

    const validation = useMemo(
        () => validateDeck(deck, meta?.game_type ?? 'Yugioh', meta?.format ?? ''),
        [deck, meta?.game_type, meta?.format]
    );

    const visibleSections = useMemo(
        () => DECK_SECTIONS.filter((s) => {
            if (s === 'extra') return hasExtraSection(rules);
            if (s === 'side') return hasSideSection(rules);
            return true;
        }),
        [rules]
    );

    // Before anything is hovered the panel shows the first card rather than a
    // hole in the layout.
    const preview = hovered ?? deck.main[0]?.card ?? deck.extra[0]?.card ?? null;

    const addCard = useCallback((result: CardSearchResult) => {
        if (!meta) return;
        const card = searchResultToDeckCard(result, meta.game_type);

        setDeck((prev) => {
            if (remainingCopies(prev, card, rules) <= 0) return prev;

            let section = sectionFor(card, rules);
            if (
                rules.extraRole === 'commander' &&
                isCommanderCandidate(card) &&
                countSection(prev, 'extra') === 0
            ) {
                section = 'extra';
            }

            const next = { ...prev, [section]: [...prev[section]] };
            const index = next[section].findIndex((e) => e.card.cardId === card.cardId);
            if (index >= 0) {
                next[section][index] = {
                    ...next[section][index],
                    quantity: next[section][index].quantity + 1,
                };
            } else {
                next[section].push({ card, quantity: 1 });
                next[section].sort((a, b) => a.card.name.localeCompare(b.card.name));
            }
            return next;
        });
        setIsDirty(true);
    }, [meta, rules]);

    const changeQuantity = useCallback((section: DeckSection, cardId: string, delta: number) => {
        setDeck((prev) => {
            const list = prev[section];
            const index = list.findIndex((e) => e.card.cardId === cardId);
            if (index < 0) return prev;

            const entry = list[index];
            const quantity = entry.quantity + delta;
            if (delta > 0 && remainingCopies(prev, entry.card, rules) <= 0) {
                return prev;
            }

            const next = { ...prev, [section]: [...list] };
            if (quantity <= 0) {
                next[section].splice(index, 1);
            } else {
                next[section][index] = { ...entry, quantity };
            }
            return next;
        });
        setIsDirty(true);
    }, [rules]);

    const moveToSide = useCallback((from: DeckSection, cardId: string) => {
        const to: DeckSection = from === 'side' ? 'main' : 'side';
        setDeck((prev) => {
            const source = prev[from];
            const index = source.findIndex((e) => e.card.cardId === cardId);
            if (index < 0) return prev;
            const entry = source[index];

            // Moving back out of the Side deck must respect where the card
            // actually belongs, or an Xyz monster would land in the Main deck.
            const target: DeckSection = to === 'main' ? sectionFor(entry.card, rules) : 'side';

            const next = {
                ...prev,
                [from]: [...source],
                [target]: [...prev[target]],
            };
            next[from].splice(index, 1);

            const existing = next[target].findIndex((e) => e.card.cardId === cardId);
            if (existing >= 0) {
                next[target][existing] = {
                    ...next[target][existing],
                    quantity: next[target][existing].quantity + entry.quantity,
                };
            } else {
                next[target].push(entry);
                next[target].sort((a, b) => a.card.name.localeCompare(b.card.name));
            }
            return next;
        });
        setIsDirty(true);
    }, [rules]);

    const moveToExtra = useCallback((from: DeckSection, cardId: string) => {
        setDeck((prev) => {
            const source = prev[from];
            const index = source.findIndex((e) => e.card.cardId === cardId);
            if (index < 0) return prev;
            const entry = source[index];
            const target: DeckSection = from === 'extra' ? 'main' : 'extra';

            const next = {
                ...prev,
                [from]: [...source],
                [target]: [...prev[target]],
            };
            next[from].splice(index, 1);

            if (target === 'extra') {
                // A commander/leader slot holds one card. If one is already
                // there, swap it back into the main deck.
                if (next.extra.length > 0) {
                    const displaced = next.extra[0];
                    next.extra = [{ ...entry, quantity: 1 }];
                    const rest = entry.quantity > 1 ? [{ ...entry, quantity: entry.quantity - 1 }] : [];
                    next.main = [...next.main.filter((e) => e.card.cardId !== cardId), displaced, ...rest];
                    next.main.sort((a, b) => a.card.name.localeCompare(b.card.name));
                    return next;
                }
            }

            const existing = next[target].findIndex((e) => e.card.cardId === cardId);
            if (existing >= 0) {
                next[target][existing] = {
                    ...next[target][existing],
                    quantity: next[target][existing].quantity + entry.quantity,
                };
            } else {
                next[target].push(entry);
                next[target].sort((a, b) => a.card.name.localeCompare(b.card.name));
            }
            return next;
        });
        setIsDirty(true);
    }, []);

    const handleSave = async () => {
        if (!canEdit || !meta) return;
        setIsSaving(true);
        setSaveError(null);
        try {
            const coverCard =
                (rules.extraRole && deck.extra[0]?.card) ||
                deck.main[0]?.card ||
                deck.extra[0]?.card ||
                null;
            const cover =
                meta.game_type === 'Riftbound'
                    ? coverCard?.imageUrl || coverCard?.imageLarge || coverCard?.cardId || null
                    : coverCard?.cardId || null;

            const { error } = await supabase.rpc('save_deck', {
                p_deck_id: deckId,
                p_cards: deckToRows(deck),
                p_is_legal: validation.isLegal,
            });
            if (error) throw error;

            if (cover !== meta.cover_card_id) {
                await supabase.from('decks').update({ cover_card_id: cover }).eq('id', deckId);
                setMeta({ ...meta, cover_card_id: cover, is_legal: validation.isLegal });
            } else {
                setMeta({ ...meta, is_legal: validation.isLegal });
            }

            setIsDirty(false);
            setSavedAt(Date.now());
        } catch (err) {
            console.error('[DeckBuilder] save failed', err);
            setSaveError(err instanceof Error ? err.message : 'Salvataggio non riuscito.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!canEdit) return;
        if (!confirm('Eliminare definitivamente questo mazzo?')) return;
        const { error } = await supabase.from('decks').delete().eq('id', deckId);
        if (error) {
            setSaveError(error.message);
            return;
        }
        router.push('/decks/mine');
    };

    const toggleVisibility = async () => {
        if (!canEdit || !meta) return;
        const nextValue = !meta.is_public;
        const { error } = await supabase
            .from('decks')
            .update({ is_public: nextValue })
            .eq('id', deckId);
        if (error) {
            setSaveError(error.message);
            return;
        }
        setMeta({ ...meta, is_public: nextValue });
    };

    // Leaving with unsaved changes is easy to do by accident on a page that
    // otherwise looks like a document.
    useEffect(() => {
        if (!isDirty) return;
        const warn = (e: BeforeUnloadEvent) => e.preventDefault();
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [isDirty]);

    const renderEntry = (
        section: DeckSection,
        entry: { card: DeckCard; quantity: number }
    ) => {
        const ban = restrictionLabel(entry.card, rules);
        const gameType = meta?.game_type ?? 'Yugioh';

        return (
            <li
                key={entry.card.cardId}
                className="deck-entry"
                onMouseEnter={() => setHovered(entry.card)}
                onFocus={() => setHovered(entry.card)}
            >
                <button
                    className="entry-thumb"
                    onClick={() => setZoomed(entry.card)}
                    aria-label={`Ingrandisci ${entry.card.name}`}
                >
                    <img
                        src={entryImageUrl(entry.card, gameType)}
                        alt={entry.card.name}
                        loading="lazy"
                    />
                    <span className="entry-qty">×{entry.quantity}</span>
                </button>

                <div className="entry-info">
                    <span className="entry-name">{entry.card.name}</span>
                    {ban && <span className="entry-ban">{ban}</span>}
                </div>

                {canEdit && (
                    <div className="entry-actions">
                        <button
                            onClick={() => changeQuantity(section, entry.card.cardId, -1)}
                            aria-label="Rimuovi una copia"
                        >−</button>
                        <button
                            onClick={() => changeQuantity(section, entry.card.cardId, 1)}
                            aria-label="Aggiungi una copia"
                        >+</button>
                        {hasSideSection(rules) &&
                            !(rules.extraRole && rules.extraRole !== 'extra' && section === 'extra') && (
                            <button
                                className="move"
                                onClick={() => moveToSide(section, entry.card.cardId)}
                            >
                                {section === 'side' ? '↑ Deck' : `↓ ${rules.sideLabel ?? 'Side'}`}
                            </button>
                        )}
                        {(rules.extraRole === 'commander' || rules.extraRole === 'leader' || rules.extraRole === 'legend') && section !== 'side' && (
                            <button
                                className="move"
                                onClick={() => moveToExtra(section, entry.card.cardId)}
                            >
                                {section === 'extra'
                                    ? '↓ Deck'
                                    : rules.extraRole === 'leader'
                                        ? '↑ Leader'
                                        : rules.extraRole === 'legend'
                                            ? '↑ Legend'
                                            : '↑ Commander'}
                            </button>
                        )}
                    </div>
                )}
            </li>
        );
    };

    if (isLoading || isAuthLoading) {
        return <div className="decks-notice">Caricamento del mazzo…</div>;
    }

    if (notFound || !meta) {
        return (
            <div className="decks-empty">
                <h2>Mazzo non trovato</h2>
                <p>Il mazzo non esiste, è stato eliminato oppure è privato.</p>
                <Link href="/decks" className="deck-btn primary">Esplora i mazzi pubblici</Link>
            </div>
        );
    }

    return (
        <>
            <header className="decks-header">
                <div>
                    <h1>{meta.name}</h1>
                    <p>
                        {meta.game_type} · {meta.format}
                        {' · '}
                        <span className={validation.isLegal ? 'deck-badge legal' : 'deck-badge illegal'}>
                            {validation.isLegal ? 'Legale' : 'Non legale'}
                        </span>
                        {!meta.is_public && <span className="deck-badge private" style={{ marginLeft: 6 }}>Privato</span>}
                    </p>
                    {meta.description && <p style={{ marginTop: 8 }}>{meta.description}</p>}
                </div>

                {canEdit && (
                    <div className="builder-actions">
                        <button className="deck-btn" onClick={toggleVisibility}>
                            {meta.is_public ? 'Rendi privato' : 'Rendi pubblico'}
                        </button>
                        <button className="deck-btn danger" onClick={handleDelete}>Elimina</button>
                        <button
                            className="deck-btn primary"
                            onClick={handleSave}
                            disabled={isSaving || !isDirty}
                        >
                            {isSaving ? 'Salvataggio…' : isDirty ? 'Salva mazzo' : 'Salvato'}
                        </button>
                    </div>
                )}
            </header>

            {saveError && <div className="decks-error" style={{ marginBottom: 16 }}>{saveError}</div>}
            {savedAt && !isDirty && !saveError && (
                <div className="decks-notice">Mazzo salvato.</div>
            )}

            {!canEdit && (
                <div className="decks-notice">
                    Stai guardando un mazzo pubblico in sola lettura.
                    {!user && ' Accedi per costruire i tuoi.'}
                </div>
            )}

            <div className="builder-layout">
                <aside className="builder-preview" aria-hidden="true">
                    <div className="preview-sticky">
                        {preview ? (
                            <>
                                <img
                                    key={preview.cardId}
                                    src={previewImageUrl(preview, meta.game_type)}
                                    alt={preview.name}
                                />
                                <span className="preview-name">{preview.name}</span>
                            </>
                        ) : (
                            <div className="preview-blank">
                                Passa il mouse su una carta per vederla qui.
                            </div>
                        )}
                    </div>
                </aside>

                <div className="builder-main">
                    {canEdit && (
                        <div className="builder-search">
                            <CardSearchInput
                                gameType={meta.game_type}
                                onSelect={addCard}
                                placeholder="Cerca una carta da aggiungere…"
                                keepQueryOnSelect
                                filter={(c) => isDeckable(c, meta.game_type)}
                            />
                            <span className="search-hint">
                                {searchHint(rules)}
                            </span>
                        </div>
                    )}

                    {visibleSections.map((section) => {
                        const entries = deck[section];
                        const count = validation.counts[section];
                        const max = section === 'main' ? rules.main.max : section === 'extra' ? rules.extra.max : rules.side.max;
                        const min = section === 'main' ? rules.main.min : section === 'extra' ? rules.extra.min : (rules.side.min ?? 0);
                        const outOfRange = count > max || count < min;

                        return (
                            <section key={section} className="deck-section">
                                <div className="deck-section-head">
                                    <h2>{getSectionLabel(section, rules)}</h2>
                                    <span className={outOfRange ? 'section-count out' : 'section-count'}>
                                        {min === max ? `${count} / ${max}` : `${count} / ${min}–${max}`}
                                    </span>
                                </div>

                                {entries.length === 0 ? (
                                    <p className="deck-section-empty">
                                        {canEdit ? 'Nessuna carta ancora.' : 'Vuoto.'}
                                    </p>
                                ) : (
                                    <div className="deck-groups">
                                        {groupEntries(entries, meta.game_type).map((group) => (
                                            <div key={group.group} className="deck-group">
                                                <div className="deck-group-head">
                                                    <h3>{group.label}</h3>
                                                    <span>{group.count}</span>
                                                </div>
                                                <ul className="deck-card-list">
                                                    {group.entries.map((entry) => renderEntry(section, entry))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        );
                    })}
                </div>

                <aside className="builder-legality">
                    <h2>Legalità</h2>
                    <div className={validation.isLegal ? 'legality-state ok' : 'legality-state ko'}>
                        {validation.isLegal
                            ? 'Il mazzo rispetta le regole del formato.'
                            : `${validation.issues.length} ${validation.issues.length === 1 ? 'problema' : 'problemi'} da sistemare.`}
                    </div>

                    {validation.issues.length > 0 && (
                        <ul className="issue-list">
                            {validation.issues.map((issue, i) => (
                                <li key={`${issue.code}-${issue.cardId ?? i}`}>{issue.message}</li>
                            ))}
                        </ul>
                    )}

                    <dl className="rules-list">
                        <div><dt>Main</dt><dd>{rules.main.min === rules.main.max ? rules.main.min : `${rules.main.min}–${rules.main.max}`}</dd></div>
                        {hasExtraSection(rules) && (
                            <div><dt>{rules.extraLabel ?? 'Extra'}</dt><dd>{rules.extra.min === rules.extra.max ? rules.extra.max : `max ${rules.extra.max}`}</dd></div>
                        )}
                        {hasSideSection(rules) && (
                            <div>
                                <dt>{rules.sideLabel ?? 'Side'}</dt>
                                <dd>
                                    {rules.side.min && rules.side.min === rules.side.max
                                        ? rules.side.max
                                        : `max ${rules.side.max}`}
                                </dd>
                            </div>
                        )}
                        <div><dt>Copie</dt><dd>{rules.maxCopies}</dd></div>
                        <div>
                            <dt>Legalità</dt>
                            <dd>
                                {rules.banlist
                                    ? `lista ban ${rules.banlist.toUpperCase()}`
                                    : rules.legalitySource === 'onepiece'
                                        ? 'lista limitata da inserire'
                                        : rules.legalitySource === 'riftbound'
                                            ? 'lista ban Standard'
                                            : rules.legalityFormat ?? 'nessuna'}
                            </dd>
                        </div>
                    </dl>

                    <p className="legality-note">
                        Il mazzo si salva comunque: il badge dice solo se è pronto per un torneo.
                    </p>
                </aside>
            </div>

            {zoomed && (
                <div className="card-zoom" onClick={() => setZoomed(null)}>
                    <div className="card-zoom-inner" onClick={(e) => e.stopPropagation()}>
                        <img src={previewImageUrl(zoomed, meta.game_type)} alt={zoomed.name} />
                        <div>
                            <h3>{zoomed.name}</h3>
                            <p>{zoomed.typeLine || zoomed.cardType || zoomed.frameType || zoomed.supertype}</p>
                            <button className="deck-btn" onClick={() => setZoomed(null)}>Chiudi</button>
                        </div>
                    </div>
                </div>
            )}


        </>
    );
};

export default DeckBuilder;
