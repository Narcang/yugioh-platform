/**
 * Deck legality rules per game and format.
 *
 * Validation is advisory: a deck can always be saved, and the result of
 * validateDeck() only decides whether it is flagged as legal. Problems are
 * returned as structured objects rather than sentences so the builder can
 * highlight the offending card instead of just printing a list.
 */

export type DeckSection = 'main' | 'extra' | 'side';

export const DECK_SECTIONS: DeckSection[] = ['main', 'extra', 'side'];

/**
 * Banlist status as YGOPRODeck spells it. The forbidden tier is "Forbidden"
 * there, which is also the official wording; "Banned" is accepted because it is
 * the term the community uses and an import could easily carry it.
 */
export type BanStatus = 'Forbidden' | 'Banned' | 'Limited' | 'Semi-Limited' | null;

export interface FormatRules {
  main: { min: number; max: number };
  extra: { max: number };
  side: { max: number };
  maxCopies: number;
  banlist: 'tcg' | 'ocg' | null;
  /** Traditional: forbidden cards are playable, but only one copy. */
  bannedAsLimited?: boolean;
  /** Formats without an Extra Deck (Rush Duel) hide the section entirely. */
  hasExtraDeck?: boolean;
}

const YUGIOH_ADVANCED: FormatRules = {
  main: { min: 40, max: 60 },
  extra: { max: 15 },
  side: { max: 15 },
  maxCopies: 3,
  banlist: 'tcg',
  hasExtraDeck: true,
};

const YUGIOH_FORMAT_RULES: Record<string, FormatRules> = {
  'Advanced (TCG)': YUGIOH_ADVANCED,
  // Same construction limits, but forbidden cards come back as Limited.
  'Traditional': { ...YUGIOH_ADVANCED, bannedAsLimited: true },
  // Retro formats use their own historical lists, which we do not have.
  // Sizes still apply; restrictions are not enforced.
  'GOAT Format': { ...YUGIOH_ADVANCED, banlist: null },
  'Edison Format': { ...YUGIOH_ADVANCED, banlist: null },
  'Speed Duel': {
    main: { min: 20, max: 30 },
    extra: { max: 5 },
    side: { max: 6 },
    maxCopies: 3,
    banlist: null,
    hasExtraDeck: true,
  },
  'Rush Duel': {
    main: { min: 40, max: 60 },
    extra: { max: 0 },
    side: { max: 15 },
    maxCopies: 3,
    banlist: null,
    hasExtraDeck: false,
  },
};

const DEFAULT_RULES: FormatRules = {
  main: { min: 40, max: 60 },
  extra: { max: 15 },
  side: { max: 15 },
  maxCopies: 3,
  banlist: null,
  hasExtraDeck: true,
};

/** Games whose card data is complete enough to build a deck today. */
export const DECK_BUILDER_GAMES = ['Yugioh'];

export function isDeckBuilderSupported(gameType: string): boolean {
  return DECK_BUILDER_GAMES.includes(gameType);
}

export function getFormatRules(gameType: string, format: string): FormatRules {
  if (gameType === 'Yugioh') {
    return YUGIOH_FORMAT_RULES[format] ?? YUGIOH_ADVANCED;
  }
  return DEFAULT_RULES;
}

// ----------------------------------------------------------------
// Deck contents
// ----------------------------------------------------------------

export interface DeckCard {
  cardId: string;
  name: string;
  imageUrl: string | null;
  frameType: string | null;
  isExtraDeck: boolean;
  banTcg: BanStatus;
  banOcg: BanStatus;
}

export type DeckContents = Record<DeckSection, { card: DeckCard; quantity: number }[]>;

export function emptyDeck(): DeckContents {
  return { main: [], extra: [], side: [] };
}

/**
 * Where a card belongs. Fusion/Synchro/Xyz/Link monsters — including their
 * Pendulum variants — go to the Extra Deck; everything else to the Main Deck.
 * The database computes the same flag in the is_extra_deck column, so this is
 * only a fallback for cards fetched without it.
 */
export function isExtraDeckFrame(frameType: string | null | undefined): boolean {
  if (!frameType) return false;
  return /^(fusion|synchro|xyz|link)/.test(frameType);
}

/** Tokens and Speed Duel Skill cards can never be part of a constructed deck. */
export function isDeckableFrame(frameType: string | null | undefined): boolean {
  return frameType !== 'token' && frameType !== 'skill';
}

export function sectionFor(card: Pick<DeckCard, 'isExtraDeck'>): DeckSection {
  return card.isExtraDeck ? 'extra' : 'main';
}

export function countSection(deck: DeckContents, section: DeckSection): number {
  return deck[section].reduce((sum, entry) => sum + entry.quantity, 0);
}

/** Copies of a card across every section — the limit is deck-wide. */
export function countCopies(deck: DeckContents, cardId: string): number {
  return DECK_SECTIONS.reduce(
    (sum, section) =>
      sum +
      deck[section]
        .filter((entry) => entry.card.cardId === cardId)
        .reduce((s, entry) => s + entry.quantity, 0),
    0
  );
}

// ----------------------------------------------------------------
// Validation
// ----------------------------------------------------------------

export type DeckIssueCode =
  | 'main-too-small'
  | 'main-too-large'
  | 'extra-too-large'
  | 'side-too-large'
  | 'too-many-copies'
  | 'banned'
  | 'wrong-section';

export interface DeckIssue {
  code: DeckIssueCode;
  severity: 'error' | 'warning';
  message: string;
  section?: DeckSection;
  cardId?: string;
  cardName?: string;
}

/** Copies a card is allowed under the format's banlist. */
export function allowedCopies(card: DeckCard, rules: FormatRules): number {
  if (!rules.banlist) return rules.maxCopies;

  const status = rules.banlist === 'ocg' ? card.banOcg : card.banTcg;
  switch (status) {
    case 'Forbidden':
    case 'Banned':
      return rules.bannedAsLimited ? 1 : 0;
    case 'Limited':
      return 1;
    case 'Semi-Limited':
      return 2;
    default:
      return rules.maxCopies;
  }
}

export interface DeckValidation {
  isLegal: boolean;
  issues: DeckIssue[];
  counts: Record<DeckSection, number>;
}

export function validateDeck(
  deck: DeckContents,
  gameType: string,
  format: string
): DeckValidation {
  const rules = getFormatRules(gameType, format);
  const issues: DeckIssue[] = [];

  const counts = {
    main: countSection(deck, 'main'),
    extra: countSection(deck, 'extra'),
    side: countSection(deck, 'side'),
  };

  if (counts.main < rules.main.min) {
    issues.push({
      code: 'main-too-small',
      severity: 'error',
      section: 'main',
      message: `Il Main Deck ha ${counts.main} carte, il minimo è ${rules.main.min}.`,
    });
  }
  if (counts.main > rules.main.max) {
    issues.push({
      code: 'main-too-large',
      severity: 'error',
      section: 'main',
      message: `Il Main Deck ha ${counts.main} carte, il massimo è ${rules.main.max}.`,
    });
  }
  if (counts.extra > rules.extra.max) {
    issues.push({
      code: 'extra-too-large',
      severity: 'error',
      section: 'extra',
      message: `L'Extra Deck ha ${counts.extra} carte, il massimo è ${rules.extra.max}.`,
    });
  }
  if (counts.side > rules.side.max) {
    issues.push({
      code: 'side-too-large',
      severity: 'error',
      section: 'side',
      message: `Il Side Deck ha ${counts.side} carte, il massimo è ${rules.side.max}.`,
    });
  }

  // Copy limits are deck-wide, so they are checked once per distinct card.
  const seen = new Map<string, DeckCard>();
  for (const section of DECK_SECTIONS) {
    for (const entry of deck[section]) {
      seen.set(entry.card.cardId, entry.card);

      const expected = sectionFor(entry.card);
      if (section !== 'side' && section !== expected) {
        issues.push({
          code: 'wrong-section',
          severity: 'error',
          section,
          cardId: entry.card.cardId,
          cardName: entry.card.name,
          message: `${entry.card.name} appartiene ${expected === 'extra' ? "all'Extra Deck" : 'al Main Deck'}.`,
        });
      }
    }
  }

  for (const card of seen.values()) {
    const total = countCopies(deck, card.cardId);
    const limit = allowedCopies(card, rules);

    if (limit === 0) {
      issues.push({
        code: 'banned',
        severity: 'error',
        cardId: card.cardId,
        cardName: card.name,
        message: `${card.name} è vietata in questo formato.`,
      });
    } else if (total > limit) {
      issues.push({
        code: 'too-many-copies',
        severity: 'error',
        cardId: card.cardId,
        cardName: card.name,
        message: `${card.name}: ${total} copie, il massimo è ${limit}.`,
      });
    }
  }

  return {
    isLegal: !issues.some((issue) => issue.severity === 'error'),
    issues,
    counts,
  };
}

export function getSectionLabel(section: DeckSection): string {
  switch (section) {
    case 'main':
      return 'Main Deck';
    case 'extra':
      return 'Extra Deck';
    case 'side':
      return 'Side Deck';
  }
}

export function getBanLabel(status: BanStatus): string | null {
  switch (status) {
    case 'Forbidden':
    case 'Banned':
      return 'Vietata';
    case 'Limited':
      return 'Limitata';
    case 'Semi-Limited':
      return 'Semi-limitata';
    default:
      return null;
  }
}
