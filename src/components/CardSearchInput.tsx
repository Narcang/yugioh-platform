"use client";
import React, { useState, useEffect, useRef } from 'react';

/**
 * Shared card search box.
 *
 * Used both to declare a card during a match and to add a card to a deck, so
 * the two never drift apart. The caller decides what selecting a result means.
 */

export interface CardSearchResult {
    id: string;
    name: string;
    image_url: string;
    image_large?: string | null;
    /** Yu-Gi-Oh only: decides Main vs Extra deck and copy limits. */
    type?: string | null;
    frame_type?: string | null;
    is_extra_deck?: boolean | null;
    ban_tcg?: string | null;
    ban_ocg?: string | null;
    desc?: string | null;
    /** Other games carry their rules text under their own key. */
    oracle_text?: string | null;
    text?: string | null;
    /** Shared across Magic, Pokemon and One Piece. */
    legalities?: Record<string, string> | null;
    /** Pokemon */
    subtypes?: string[];
    supertype?: string | null;
    regulation_mark?: string | null;
    rules?: string[];
    /** Magic */
    oracle_id?: string | null;
    mana_cost?: string | null;
    color_identity?: string[];
    colors?: string[];
    layout?: string | null;
    /** One Piece */
    card_type?: string | null;
    ban_status?: string | null;
}

interface CardSearchInputProps {
    gameType: string;
    onSelect: (card: CardSearchResult) => void;
    placeholder?: string;
    autoFocus?: boolean;
    /** Hide results the caller cannot use, e.g. Tokens in a deck. */
    filter?: (card: CardSearchResult) => boolean;
    /** Keep the query after a pick, so several copies can be added in a row. */
    keepQueryOnSelect?: boolean;
}

const MIN_QUERY_LENGTH = 3;

const CardSearchInput: React.FC<CardSearchInputProps> = ({
    gameType,
    onSelect,
    placeholder = 'Cerca carta (es. Mago Nero)...',
    autoFocus = false,
    filter,
    keepQueryOnSelect = false,
}) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<CardSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const requestId = useRef(0);

    useEffect(() => {
        if (query.trim().length < MIN_QUERY_LENGTH) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            const id = ++requestId.current;
            setIsSearching(true);
            try {
                const res = await fetch(
                    `/api/search?q=${encodeURIComponent(query)}&gameType=${encodeURIComponent(gameType || 'Yugioh')}`
                );
                const data = await res.json();
                // A slower earlier request must not overwrite newer results.
                if (id !== requestId.current) return;
                setResults(data.results ?? []);
            } catch (e) {
                console.error('[CardSearchInput] search failed', e);
                if (id === requestId.current) setResults([]);
            } finally {
                if (id === requestId.current) setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query, gameType]);

    const visible = filter ? results.filter(filter) : results;

    const handleSelect = (card: CardSearchResult) => {
        onSelect(card);
        if (!keepQueryOnSelect) {
            setQuery('');
            setResults([]);
        }
    };

    return (
        <div className="card-search">
            <div className="search-wrapper">
                <input
                    type="text"
                    placeholder={placeholder}
                    className="search-input"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus={autoFocus}
                />
                {isSearching && <div className="search-spinner" />}
                {query && !isSearching && (
                    <button
                        className="search-clear"
                        onClick={() => { setQuery(''); setResults([]); }}
                        aria-label="Cancella la ricerca"
                    >
                        ✕
                    </button>
                )}
            </div>

            {visible.length > 0 && (
                <div className="search-results-list">
                    {visible.map((res) => (
                        <div
                            key={res.id}
                            className="search-result-item"
                            onClick={() => handleSelect(res)}
                        >
                            <img src={res.image_url} alt="" />
                            <span className="result-name">{res.name}</span>
                            {res.type && <span className="result-type">{res.type}</span>}
                        </div>
                    ))}
                </div>
            )}

            <style jsx>{`
                .card-search {
                    position: relative;
                }
                .search-wrapper {
                    position: relative;
                }
                .search-input {
                    width: 100%;
                    padding: 10px 32px 10px 10px;
                    background: #222;
                    border: 1px solid #444;
                    color: white;
                    border-radius: 6px;
                    font-size: 14px;
                }
                .search-input:focus {
                    outline: none;
                    border-color: #FCD34D;
                }
                .search-spinner {
                    position: absolute;
                    right: 10px;
                    top: 10px;
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .search-clear {
                    position: absolute;
                    right: 6px;
                    top: 6px;
                    background: none;
                    border: none;
                    color: #888;
                    cursor: pointer;
                    font-size: 13px;
                    padding: 4px 6px;
                    line-height: 1;
                }
                .search-clear:hover {
                    color: #fff;
                }
                .search-results-list {
                    max-height: 320px;
                    overflow-y: auto;
                    background: #222;
                    border-radius: 6px;
                    border: 1px solid #444;
                    position: absolute;
                    top: calc(100% + 4px);
                    left: 0;
                    right: 0;
                    z-index: 100;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
                }
                .search-result-item {
                    padding: 8px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                    border-bottom: 1px solid #333;
                }
                .search-result-item:hover {
                    background-color: #333;
                }
                .search-result-item img {
                    width: 30px;
                    height: 44px;
                    object-fit: cover;
                    flex-shrink: 0;
                    border-radius: 2px;
                }
                .result-name {
                    font-size: 14px;
                    flex: 1;
                    min-width: 0;
                }
                .result-type {
                    font-size: 10px;
                    color: #888;
                    white-space: nowrap;
                }
            `}</style>
        </div>
    );
};

export default CardSearchInput;
