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
    faceDown?: boolean;
    position?: 'attack' | 'defense';
}

export interface InspectedCard {
    instanceId: string;
    name: string;
    imageUrl: string;
}

export interface PlayerBoard {
    library: BoardCard[];
    extra: BoardCard[];
    hand: BoardCard[];
    field: BoardCard[];
    graveyard: BoardCard[];
    exile: BoardCard[];
}

export type BoardZone = keyof PlayerBoard;
export type OpenPile = 'graveyard' | 'exile';

const ZONES: BoardZone[] = ['library', 'extra', 'hand', 'field', 'graveyard', 'exile'];

/** What opponents are allowed to see. Hand and library stay private. */
export interface PublicBoardView {
    playMode: 'digital';
    libraryCount: number;
    extraCount: number;
    handCount: number;
    graveyardCount: number;
    exileCount: number;
    field: BoardCard[];
    graveyard: BoardCard[];
    exile: BoardCard[];
}

export function emptyBoard(): PlayerBoard {
    return { library: [], extra: [], hand: [], field: [], graveyard: [], exile: [] };
}

export function toPublicBoard(board: PlayerBoard): PublicBoardView {
    return {
        playMode: 'digital',
        libraryCount: board.library.length,
        extraCount: board.extra.length,
        handCount: board.hand.length,
        graveyardCount: board.graveyard.length,
        exileCount: board.exile.length,
        graveyard: board.graveyard,
        exile: board.exile,
        field: board.field.map((card) =>
            card.faceDown
                ? {
                      instanceId: card.instanceId,
                      cardId: '',
                      name: '',
                      imageUrl: '',
                      x: card.x,
                      y: card.y,
                      faceDown: true,
                      position: card.position,
                  }
                : card
        ),
    };
}

export function usesBattlePosition(gameType: string): boolean {
    return gameType === 'Yugioh';
}

export function nextFieldSlot(field: BoardCard[]): { x: number; y: number } {
    const i = field.length;
    return {
        x: 0.2 + (i % 5) * 0.15,
        y: 0.4 + Math.floor(i / 5) * 0.22,
    };
}

export function stripFieldState(card: BoardCard): BoardCard {
    return {
        instanceId: card.instanceId,
        cardId: card.cardId,
        name: card.name,
        imageUrl: card.imageUrl,
    };
}

export function takeCard(board: PlayerBoard, instanceId: string): { board: PlayerBoard; card: BoardCard } | null {
    for (const zone of ZONES) {
        const card = board[zone].find((item) => item.instanceId === instanceId);
        if (!card) continue;
        return {
            card,
            board: {
                ...board,
                [zone]: board[zone].filter((item) => item.instanceId !== instanceId),
            },
        };
    }
    return null;
}

export function placeCard(
    board: PlayerBoard,
    card: BoardCard,
    zone: BoardZone,
    opts?: { faceDown?: boolean; position?: 'attack' | 'defense'; x?: number; y?: number }
): PlayerBoard {
    const clean = stripFieldState(card);
    if (zone === 'field') {
        const slot = nextFieldSlot(board.field);
        return {
            ...board,
            field: [
                ...board.field,
                {
                    ...clean,
                    x: opts?.x ?? slot.x,
                    y: opts?.y ?? slot.y,
                    faceDown: opts?.faceDown ?? false,
                    position: opts?.position ?? 'attack',
                },
            ],
        };
    }
    return { ...board, [zone]: [...board[zone], clean] };
}

export function moveCard(
    board: PlayerBoard,
    instanceId: string,
    zone: BoardZone,
    opts?: { faceDown?: boolean; position?: 'attack' | 'defense'; x?: number; y?: number }
): PlayerBoard {
    const taken = takeCard(board, instanceId);
    if (!taken) return board;
    return placeCard(taken.board, taken.card, zone, opts);
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
        exile: [],
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
