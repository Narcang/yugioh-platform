export interface TableToken {
    id: string;
    kind: string;
    count: number;
    /** 0–1, relative to the player's seat. */
    x: number;
    y: number;
    /** Digital field card this token sits on. */
    attachedTo?: string;
}

export interface TokenDef {
    kind: string;
    /** Short mark on the chip (often the game term itself). */
    mark: string;
    stackable: boolean;
    hue: string;
}

const MAGIC: TokenDef[] = [
    { kind: 'p1p1', mark: '+1/+1', stackable: true, hue: '#2f6b3a' },
    { kind: 'm1m1', mark: '−1/−1', stackable: true, hue: '#6b2f2f' },
    { kind: 'indestructible', mark: 'IND', stackable: false, hue: '#8a6a1a' },
    { kind: 'trample', mark: 'TR', stackable: false, hue: '#3d5a2a' },
    { kind: 'flying', mark: 'FLY', stackable: false, hue: '#2a4a6b' },
    { kind: 'hexproof', mark: 'HEX', stackable: false, hue: '#3a2a6b' },
    { kind: 'deathtouch', mark: 'DT', stackable: false, hue: '#1f4a32' },
    { kind: 'lifelink', mark: 'LL', stackable: false, hue: '#6b2a4a' },
    { kind: 'shield', mark: '🛡', stackable: true, hue: '#4a5a6b' },
    { kind: 'generic', mark: '●', stackable: true, hue: '#3a3a3a' },
];

const YUGIOH: TokenDef[] = [
    { kind: 'generic', mark: '●', stackable: true, hue: '#3a3a3a' },
    { kind: 'spell', mark: '☆', stackable: true, hue: '#3a4a7a' },
    { kind: 'atk', mark: 'ATK', stackable: true, hue: '#7a2a2a' },
    { kind: 'def', mark: 'DEF', stackable: true, hue: '#2a4a7a' },
];

const POKEMON: TokenDef[] = [
    { kind: 'damage', mark: '10', stackable: true, hue: '#7a2a2a' },
    { kind: 'burned', mark: 'BRN', stackable: false, hue: '#8a4a12' },
    { kind: 'poisoned', mark: 'PSN', stackable: false, hue: '#4a2a6b' },
    { kind: 'asleep', mark: 'SLP', stackable: false, hue: '#2a4a6b' },
    { kind: 'confused', mark: 'CNF', stackable: false, hue: '#6b5a12' },
    { kind: 'paralyzed', mark: 'PAR', stackable: false, hue: '#8a8a1a' },
];

const ONE_PIECE: TokenDef[] = [
    { kind: 'don', mark: 'DON', stackable: true, hue: '#8a5a12' },
    { kind: 'rest', mark: 'REST', stackable: false, hue: '#4a4a6b' },
    { kind: 'generic', mark: '●', stackable: true, hue: '#3a3a3a' },
];

const DRAGON_BALL: TokenDef[] = [
    { kind: 'energy', mark: 'E', stackable: true, hue: '#8a6a12' },
    { kind: 'combo', mark: 'COMBO', stackable: true, hue: '#6b2a2a' },
    { kind: 'generic', mark: '●', stackable: true, hue: '#3a3a3a' },
];

const RIFTBOUND: TokenDef[] = [
    { kind: 'generic', mark: '●', stackable: true, hue: '#3a3a3a' },
    { kind: 'wound', mark: 'WND', stackable: true, hue: '#6b2a2a' },
    { kind: 'shield', mark: '🛡', stackable: true, hue: '#4a5a6b' },
    { kind: 'stun', mark: 'STUN', stackable: false, hue: '#5a4a2a' },
];

const BY_GAME: Record<string, TokenDef[]> = {
    Magic: MAGIC,
    Yugioh: YUGIOH,
    Pokemon: POKEMON,
    'One Piece': ONE_PIECE,
    'Dragon Ball': DRAGON_BALL,
    Riftbound: RIFTBOUND,
};

const ALL_DEFS = [...MAGIC, ...YUGIOH, ...POKEMON, ...ONE_PIECE, ...DRAGON_BALL, ...RIFTBOUND];

export function tokensForGame(gameType: string): TokenDef[] {
    return BY_GAME[gameType] ?? MAGIC;
}

export function tokenDef(kind: string, gameType?: string): TokenDef {
    const fromGame = gameType ? tokensForGame(gameType).find((item) => item.kind === kind) : undefined;
    return fromGame ?? ALL_DEFS.find((item) => item.kind === kind) ?? {
        kind,
        mark: '●',
        stackable: true,
        hue: '#3a3a3a',
    };
}

export type TokenDrop =
    | { seat: 'self'; cardId: string; x: number; y: number }
    | { seat: 'self'; x: number; y: number }
    | null;

export function resolveTokenDrop(clientX: number, clientY: number): TokenDrop {
    const el = document.elementFromPoint(clientX, clientY);
    if (!el) return null;
    const seat = el.closest('[data-player-seat]') as HTMLElement | null;
    if (seat?.dataset.playerSeat !== 'self') return null;
    const box = seat.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (clientX - box.left) / box.width));
    const y = Math.min(1, Math.max(0, (clientY - box.top) / box.height));
    const card = el.closest('[data-digital-card]') as HTMLElement | null;
    if (card?.dataset.digitalCard && seat.contains(card)) {
        return { seat: 'self', cardId: card.dataset.digitalCard, x, y };
    }
    return { seat: 'self', x, y };
}

export function mergeToken(tokens: TableToken[], next: TableToken, stackable: boolean): TableToken[] {
    if (!stackable) {
        const withoutDup = next.attachedTo
            ? tokens.filter((item) => !(item.kind === next.kind && item.attachedTo === next.attachedTo))
            : tokens;
        return [...withoutDup, next];
    }
    const match = tokens.findIndex((item) => {
        if (item.kind !== next.kind) return false;
        if ((item.attachedTo ?? '') !== (next.attachedTo ?? '')) return false;
        if (next.attachedTo) return true;
        return Math.hypot(item.x - next.x, item.y - next.y) < 0.07;
    });
    if (match >= 0) {
        const copy = [...tokens];
        copy[match] = {
            ...copy[match],
            count: copy[match].count + next.count,
            x: next.x,
            y: next.y,
            attachedTo: next.attachedTo,
        };
        return copy;
    }
    return [...tokens, next];
}

export function tokensLeavingCard(tokens: TableToken[], instanceId: string): TableToken[] {
    return tokens.filter((item) => item.attachedTo !== instanceId);
}

export function applyTokenDrop(
    tokens: TableToken[],
    id: string | null,
    kind: string,
    drop: NonNullable<TokenDrop>,
    gameType: string
): TableToken[] {
    const def = tokenDef(kind, gameType);
    const attachedTo = 'cardId' in drop ? drop.cardId : undefined;
    const next: TableToken = {
        id: id ?? crypto.randomUUID(),
        kind,
        count: 1,
        x: drop.x,
        y: drop.y,
        attachedTo,
    };
    const rest = id ? tokens.filter((item) => item.id !== id) : tokens;
    return mergeToken(rest, next, def.stackable);
}
