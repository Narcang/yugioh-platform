import games from './scanner-games.json';

export type ScannerGame = keyof typeof games;
export const scannerGames = games;
export function isScannerGame(value: string): value is ScannerGame {
 return Object.hasOwn(games, value);
}
