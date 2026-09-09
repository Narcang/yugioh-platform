export type DiceRoll = {
    id: string;
    fromName: string;
    kind: 'coin' | 'dice';
    sides?: number;
    value: number | 'heads' | 'tails';
};

export function newDiceRollId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
