/**
 * Per-game rules: starting life, allowed player counts and match modes.
 */

export type MatchMode = 'ffa' | 'teams';

/**
 * Base life / HP values per game type and format.
 * Used when creating or joining a lobby.
 */
export function getBaseLifePoints(gameType: string, format: string): number {
  const fmt = format.toLowerCase();

  switch (gameType) {
    case 'Yugioh':
      if (fmt.includes('speed')) return 4000;
      return 8000;

    case 'Magic':
      if (fmt.includes('commander')) return 40;
      return 20;

    case 'Pokemon':
      // Prize cards remaining (standard win condition)
      return 6;

    case 'One Piece':
      // Typical leader life in standard play
      return 5;

    case 'Dragon Ball':
      return 8;

    case 'Riftbound':
      return 20;

    default:
      return 8000;
  }
}

/** Suggested +/- step size for the LP counter UI */
export function getDefaultLpStep(baseLp: number): number {
  if (baseLp <= 10) return 1;
  if (baseLp <= 100) return 5;
  if (baseLp <= 1000) return 100;
  return 1000;
}

export function getFirstPhase(gameType: string): string {
  switch (gameType) {
    case 'Magic':
      return 'Beginning Phase';
    case 'One Piece':
      return 'Refresh Phase';
    case 'Dragon Ball':
      return 'Charge Phase';
    case 'Riftbound':
      return 'Awaken Phase';
    default:
      return 'Draw Phase';
  }
}

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;

/**
 * Player counts a given game/format supports.
 * Reflects official play patterns: most TCGs are strictly 1v1, while
 * Magic Commander and Riftbound are built around multiplayer pods, and
 * Yu-Gi-Oh supports 4-player Tag Duels.
 */
export function getAllowedPlayerCounts(gameType: string, format: string): number[] {
  const fmt = format.toLowerCase();

  switch (gameType) {
    case 'Yugioh':
      // Speed/Rush Duel are 1v1 only; other formats allow Tag Duel (2v2)
      if (fmt.includes('speed') || fmt.includes('rush')) return [2];
      return [2, 4];

    case 'Magic':
      if (fmt.includes('commander')) return [2, 3, 4];
      return [2];

    case 'Riftbound':
      return [2, 3, 4];

    default:
      return [2];
  }
}

export function getDefaultPlayerCount(gameType: string, format: string): number {
  const allowed = getAllowedPlayerCounts(gameType, format);
  // Commander pods are typically 4-player
  if (gameType === 'Magic' && format.toLowerCase().includes('commander')) return 4;
  return allowed[0];
}

/** Teams (2v2) only make sense with an even number of players above 2 */
export function getAllowedMatchModes(playerCount: number): MatchMode[] {
  if (playerCount === 4) return ['ffa', 'teams'];
  return ['ffa'];
}

export function getDefaultMatchMode(gameType: string, playerCount: number): MatchMode {
  if (playerCount !== 4) return 'ffa';
  // A 4-player Yu-Gi-Oh match is a Tag Duel, which is always 2v2
  if (gameType === 'Yugioh') return 'teams';
  return 'ffa';
}

export function getMatchModeLabel(mode: MatchMode, playerCount: number): string {
  if (playerCount === 2) return '1 contro 1';
  if (mode === 'teams') return 'Squadre 2v2';
  return 'Tutti contro tutti';
}

export function getPlayerCountLabel(count: number): string {
  return count === 2 ? '2 giocatori (1v1)' : `${count} giocatori`;
}
