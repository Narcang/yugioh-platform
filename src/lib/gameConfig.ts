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
