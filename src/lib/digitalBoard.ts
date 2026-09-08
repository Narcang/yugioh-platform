import type { DeckCard, DeckContents } from './deckRules';
import { previewImageUrl } from './decks';

export interface BoardCard {
    instanceId: string;
    cardId: string;
    name: string;
    imageUrl: string;
    /** 0–1, relative to the field. Ignored in hand/library. */
    x?: number;
    y?: number;
}

export interface PlayerBoard {
    library: BoardCard[];
    extra: BoardCard[];
    hand: BoardCard[];
    field: BoardCard[];
    graveyard: BoardCard[];
}

/** What opponents are allowed to see. Hand and library stay private. */
export interface PublicBoardView {
    playMode: 'digital';
    libraryCount: number;
    extraCount: number;
    handCount: number;
    graveyardCount: number;
    field: BoardCard[];
}

export function emptyBoard(): PlayerBoard {
    return { library: [], extra: [], hand: [], field: [], graveyard: [] };
}

export function toPublicBoard(board: PlayerBoard): PublicBoardView {
    return {
        playMode: 'digital',
        libraryCount: board.library.length,
        extraCount: board.extra.length,
        handCount: board.hand.length,
        graveyardCount: board.graveyard.length,
        field: board.field,
    };
}

function expandSection(entries: { card: DeckCard; quantity: number }[], gameType: string): BoardCard[] {
    const cards: BoardCard[] = [];
    for (const entry of entries) {
        const imageUrl = previewImageUrl(entry.card, gameType);
        for (let i = 0; i < entry.quantity; i++) {
            cards.push({
                instanceId: crypto.randomUUID(),
                cardId: entry.card.cardId,
                name: entry.card.name,
                imageUrl,
            });
        }
    }
    return cards;
}

function shuffle<T>(items: T[]): T[] {
    const next = [...items];
    for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
    }
    return next;
}

export function boardFromDeck(deck: DeckContents, gameType: string): PlayerBoard {
    return {
        library: shuffle(expandSection(deck.main, gameType)),
        extra: expandSection(deck.extra, gameType),
        hand: [],
        field: [],
        graveyard: [],
    };
}

export function drawFrom(board: PlayerBoard, pile: 'library' | 'extra'): PlayerBoard {
    const source = [...board[pile]];
    const card = source.pop();
    if (!card) return board;
    return { ...board, [pile]: source, hand: [...board.hand, card] };
}

export function shuffleLibrary(board: PlayerBoard): PlayerBoard {
    return { ...board, library: shuffle(board.library) };
}
