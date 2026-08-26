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

/** What the extra section is for. Yu-Gi-Oh uses a real Extra Deck; the others
 *  borrow the slot for the one card that is not in the main deck. */
export type ExtraRole = 'extra' | 'leader' | 'commander';

export interface FormatRules {
  main: { min: number; max: number };
  extra: { min: number; max: number };
  side: { max: number };
  maxCopies: number;
  banlist: 'tcg' | 'ocg' | null;
  /** Traditional: forbidden cards are playable, but only one copy. */
  bannedAsLimited?: boolean;
  extraRole?: ExtraRole | null;
  extraLabel?: string;
  hasSideDeck?: boolean;
  /**
   * Key in the card's `legalities` JSON. Magic stores lowercase Scryfall
   * format names; Pokemon stores Standard/Expanded/Unlimited.
   */
  legalityFormat?: string;
  legalitySource?: 'yugioh' | 'scryfall' | 'pokemon' | 'onepiece';
  /** Commander and One Piece: every card's colours must fit the extra card. */
  colorFromExtra?: boolean;
}

const YUGIOH_ADVANCED: FormatRules = {
  main: { min: 40, max: 60 },
  extra: { min: 0, max: 15 },
  side: { max: 15 },
  maxCopies: 3,
  banlist: 'tcg',
  extraRole: 'extra',
  extraLabel: 'Extra Deck',
  hasSideDeck: true,
  legalitySource: 'yugioh',
};

const YUGIOH_FORMAT_RULES: Record<string, FormatRules> = {
  'Advanced (TCG)': YUGIOH_ADVANCED,
  Traditional: { ...YUGIOH_ADVANCED, bannedAsLimited: true },
  'GOAT Format': { ...YUGIOH_ADVANCED, banlist: null },
  'Edison Format': { ...YUGIOH_ADVANCED, banlist: null },
  'Speed Duel': {
    main: { min: 20, max: 30 },
    extra: { min: 0, max: 5 },
    side: { max: 6 },
    maxCopies: 3,
    banlist: null,
    extraRole: 'extra',
    extraLabel: 'Extra Deck',
    hasSideDeck: true,
    legalitySource: 'yugioh',
  },
  'Rush Duel': {
    main: { min: 40, max: 60 },
    extra: { min: 0, max: 0 },
    side: { max: 15 },
    maxCopies: 3,
    banlist: null,
    extraRole: null,
    hasSideDeck: true,
    legalitySource: 'yugioh',
  },
};

const MAGIC_CONSTRUCTED: Omit<FormatRules, 'legalityFormat'> = {
  main: { min: 60, max: 250 },
  extra: { min: 0, max: 0 },
  side: { max: 15 },
  maxCopies: 4,
  banlist: null,
  extraRole: null,
  hasSideDeck: true,
  legalitySource: 'scryfall',
};

const MAGIC_FORMAT_RULES: Record<string, FormatRules> = {
  Standard: { ...MAGIC_CONSTRUCTED, legalityFormat: 'standard' },
  Modern: { ...MAGIC_CONSTRUCTED, legalityFormat: 'modern' },
  Pioneer: { ...MAGIC_CONSTRUCTED, legalityFormat: 'pioneer' },
  Legacy: { ...MAGIC_CONSTRUCTED, legalityFormat: 'legacy' },
  Vintage: { ...MAGIC_CONSTRUCTED, legalityFormat: 'vintage' },
  Pauper: { ...MAGIC_CONSTRUCTED, legalityFormat: 'pauper' },
  Commander: {
    main: { min: 99, max: 99 },
    extra: { min: 1, max: 1 },
    side: { max: 0 },
    maxCopies: 1,
    banlist: null,
    extraRole: 'commander',
    extraLabel: 'Commander',
    hasSideDeck: false,
    legalitySource: 'scryfall',
    legalityFormat: 'commander',
    colorFromExtra: true,
  },
};

function pokemonRules(format: string): FormatRules {
  return {
    main: { min: 60, max: 60 },
    extra: { min: 0, max: 0 },
    side: { max: 0 },
    maxCopies: 4,
    banlist: null,
    extraRole: null,
    hasSideDeck: false,
    legalitySource: 'pokemon',
    legalityFormat: format,
  };
}

const POKEMON_FORMAT_RULES: Record<string, FormatRules> = {
  Standard: pokemonRules('standard'),
  Expanded: pokemonRules('expanded'),
  Unlimited: pokemonRules('unlimited'),
};

const ONEPIECE_STANDARD: FormatRules = {
  main: { min: 50, max: 50 },
  extra: { min: 1, max: 1 },
  side: { max: 0 },
  maxCopies: 4,
  banlist: null,
  extraRole: 'leader',
  extraLabel: 'Leader',
  hasSideDeck: false,
  legalitySource: 'onepiece',
  colorFromExtra: true,
};

const DEFAULT_RULES: FormatRules = {
  main: { min: 40, max: 60 },
  extra: { min: 0, max: 15 },
  side: { max: 15 },
  maxCopies: 3,
  banlist: null,
  extraRole: 'extra',
  extraLabel: 'Extra Deck',
  hasSideDeck: true,
};

/** Games whose card data is complete enough to build a deck today. */
export const DECK_BUILDER_GAMES = ['Yugioh', 'Magic', 'Pokemon', 'One Piece'];

export function isDeckBuilderSupported(gameType: string): boolean {
  return DECK_BUILDER_GAMES.includes(gameType);
}

export function getFormatRules(gameType: string, format: string): FormatRules {
  if (gameType === 'Yugioh') return YUGIOH_FORMAT_RULES[format] ?? YUGIOH_ADVANCED;
  if (gameType === 'Magic') {
    return MAGIC_FORMAT_RULES[format] ?? { ...MAGIC_CONSTRUCTED, legalityFormat: format.toLowerCase() };
  }
  if (gameType === 'Pokemon') return POKEMON_FORMAT_RULES[format] ?? pokemonRules(format.toLowerCase());
  if (gameType === 'One Piece') return ONEPIECE_STANDARD;
  return DEFAULT_RULES;
}

export function hasExtraSection(rules: FormatRules): boolean {
  return Boolean(rules.extraRole) && rules.extra.max > 0;
}

export function hasSideSection(rules: FormatRules): boolean {
  return rules.hasSideDeck !== false && rules.side.max > 0;
}

export function formatRulesHint(rules: FormatRules): string {
  const parts: string[] = [];
  if (rules.main.min === rules.main.max) parts.push(`Main ${rules.main.min} carte`);
  else parts.push(`Main ${rules.main.min}–${rules.main.max} carte`);

  if (hasExtraSection(rules)) {
    const label = rules.extraLabel ?? 'Extra';
    if (rules.extra.min === rules.extra.max) parts.push(`${label} ${rules.extra.max}`);
    else if (rules.extra.min > 0) parts.push(`${label} ${rules.extra.min}–${rules.extra.max}`);
    else parts.push(`${label} max ${rules.extra.max}`);
  }
  if (hasSideSection(rules)) parts.push(`Side max ${rules.side.max}`);
  parts.push(rules.maxCopies === 1 ? '1 copia per carta' : `${rules.maxCopies} copie per carta`);
  if (rules.banlist) parts.push(`lista ban ${rules.banlist.toUpperCase()}`);
  else if (rules.legalitySource === 'scryfall' || rules.legalitySource === 'pokemon') {
    parts.push('legalità dal catalogo');
  } else if (rules.legalitySource === 'onepiece') {
    parts.push('lista limitata ancora da inserire');
  }
  if (rules.colorFromExtra && rules.extraRole === 'leader') parts.push('colori del Leader');
  if (rules.colorFromExtra && rules.extraRole === 'commander') parts.push('color identity del Commander');
  return `${parts.join(', ')}.`;
}

// ----------------------------------------------------------------
// Deck contents
// ----------------------------------------------------------------

export interface DeckCard {
  cardId: string;
  name: string;
  imageUrl: string | null;
  imageLarge?: string | null;
  frameType: string | null;
  isExtraDeck: boolean;
  banTcg: BanStatus;
  banOcg: BanStatus;
  legalities?: Record<string, string> | null;
  colors?: string[];
  colorIdentity?: string[];
  typeLine?: string | null;
  manaCost?: string | null;
  layout?: string | null;
  oracleId?: string | null;
  supertype?: string | null;
  subtypes?: string[];
  rules?: string[];
  cardType?: string | null;
  banStatus?: string | null;
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

export function isDeckable(
  card: {
    frame_type?: string | null;
    layout?: string | null;
    card_type?: string | null;
  },
  gameType: string
): boolean {
  if (gameType === 'Yugioh') return isDeckableFrame(card.frame_type);
  if (gameType === 'One Piece') return card.card_type !== 'DON';
  if (gameType === 'Magic') {
    const layout = card.layout ?? '';
    return !['token', 'double_faced_token', 'emblem', 'art_series'].includes(layout);
  }
  return true;
}

export function isCommanderCandidate(card: Pick<DeckCard, 'typeLine'>): boolean {
  const type = card.typeLine ?? '';
  return /Legendary/i.test(type) && (/Creature/i.test(type) || /Planeswalker/i.test(type));
}

export function sectionFor(
  card: Pick<DeckCard, 'isExtraDeck' | 'cardType'>,
  rules?: FormatRules
): DeckSection {
  if (rules?.extraRole === 'leader' && card.cardType === 'LEADER') return 'extra';
  if (card.isExtraDeck) return 'extra';
  return 'main';
}

export function isBasicLand(card: Pick<DeckCard, 'typeLine'>): boolean {
  const type = card.typeLine ?? '';
  return /\bBasic\b/i.test(type) && /\bLand\b/i.test(type);
}

export function isBasicEnergy(card: Pick<DeckCard, 'supertype' | 'subtypes'>): boolean {
  return card.supertype === 'Energy' && (card.subtypes ?? []).some((s) => s === 'Basic');
}

export function isAceSpec(card: Pick<DeckCard, 'rules'>): boolean {
  return (card.rules ?? []).some((line) => /ACE SPEC/i.test(line));
}

export function isRadiant(card: Pick<DeckCard, 'subtypes'>): boolean {
  return (card.subtypes ?? []).some((s) => /radiant/i.test(s));
}

function legalityValue(card: Pick<DeckCard, 'legalities'>, format: string | undefined): string {
  if (!format || !card.legalities) return '';
  const raw = card.legalities[format] ?? card.legalities[format.toLowerCase()] ?? '';
  return String(raw).toLowerCase().replace(/[\s-]/g, '_');
}

// ----------------------------------------------------------------
// Grouping inside a section
// ----------------------------------------------------------------

export type CardGroup = string;

const YUGIOH_GROUP_ORDER = ['monster', 'spell', 'trap', 'fusion', 'synchro', 'xyz', 'link'];
const MAGIC_GROUP_ORDER = ['creature', 'planeswalker', 'instant', 'sorcery', 'enchantment', 'artifact', 'battle', 'land', 'other'];
const POKEMON_GROUP_ORDER = ['pokemon', 'supporter', 'item', 'stadium', 'tool', 'trainer', 'energy'];
const ONEPIECE_GROUP_ORDER = ['leader', 'character', 'event', 'stage', 'don', 'other'];

export const CARD_GROUP_ORDER: CardGroup[] = YUGIOH_GROUP_ORDER;

export function groupFor(card: DeckCard, gameType = 'Yugioh'): CardGroup {
  if (gameType === 'Magic') {
    const type = card.typeLine ?? '';
    if (/\bCreature\b/i.test(type)) return 'creature';
    if (/\bPlaneswalker\b/i.test(type)) return 'planeswalker';
    if (/\bInstant\b/i.test(type)) return 'instant';
    if (/\bSorcery\b/i.test(type)) return 'sorcery';
    if (/\bEnchantment\b/i.test(type)) return 'enchantment';
    if (/\bArtifact\b/i.test(type)) return 'artifact';
    if (/\bBattle\b/i.test(type)) return 'battle';
    if (/\bLand\b/i.test(type)) return 'land';
    return 'other';
  }
  if (gameType === 'Pokemon') {
    const superType = (card.supertype ?? '').toLowerCase();
    if (superType.includes('pokémon') || superType.includes('pokemon')) return 'pokemon';
    if (superType === 'energy') return 'energy';
    const subs = (card.subtypes ?? []).map((s) => s.toLowerCase());
    if (subs.includes('supporter')) return 'supporter';
    if (subs.includes('stadium')) return 'stadium';
    if (subs.includes('pokémon tool') || subs.includes('pokemon tool')) return 'tool';
    if (subs.includes('item')) return 'item';
    if (superType === 'trainer') return 'trainer';
    return 'other';
  }
  if (gameType === 'One Piece') {
    const kind = (card.cardType ?? '').toLowerCase();
    if (ONEPIECE_GROUP_ORDER.includes(kind)) return kind;
    return 'other';
  }

  const frame = card.frameType ?? '';
  if (frame === 'spell') return 'spell';
  if (frame === 'trap') return 'trap';
  if (frame.startsWith('fusion')) return 'fusion';
  if (frame.startsWith('synchro')) return 'synchro';
  if (frame.startsWith('xyz')) return 'xyz';
  if (frame.startsWith('link')) return 'link';
  return 'monster';
}

export function getGroupLabel(group: CardGroup): string {
  switch (group) {
    case 'monster': return 'Mostri';
    case 'spell': return 'Magie';
    case 'trap': return 'Trappole';
    case 'fusion': return 'Fusione';
    case 'synchro': return 'Synchro';
    case 'xyz': return 'Xyz';
    case 'link': return 'Link';
    case 'creature': return 'Creature';
    case 'planeswalker': return 'Planeswalker';
    case 'instant': return 'Istantanei';
    case 'sorcery': return 'Stregonerie';
    case 'enchantment': return 'Incantesimi';
    case 'artifact': return 'Artefatti';
    case 'battle': return 'Battaglie';
    case 'land': return 'Terre';
    case 'pokemon': return 'Pokémon';
    case 'supporter': return 'Aiuto';
    case 'item': return 'Strumenti';
    case 'stadium': return 'Stadi';
    case 'tool': return 'Oggetti Pokémon';
    case 'trainer': return 'Allenatori';
    case 'energy': return 'Energie';
    case 'leader': return 'Leader';
    case 'character': return 'Personaggi';
    case 'event': return 'Eventi';
    case 'stage': return 'Stage';
    case 'don': return 'DON!!';
    default: return 'Altro';
  }
}

function groupOrderFor(gameType: string): CardGroup[] {
  if (gameType === 'Magic') return MAGIC_GROUP_ORDER;
  if (gameType === 'Pokemon') return POKEMON_GROUP_ORDER;
  if (gameType === 'One Piece') return ONEPIECE_GROUP_ORDER;
  return YUGIOH_GROUP_ORDER;
}

export interface DeckGroup<T> {
  group: CardGroup;
  label: string;
  count: number;
  entries: T[];
}

/** Splits a section into its non-empty groups, in display order. */
export function groupEntries<T extends { card: DeckCard; quantity: number }>(
  entries: T[],
  gameType = 'Yugioh'
): DeckGroup<T>[] {
  const buckets = new Map<CardGroup, T[]>();
  for (const entry of entries) {
    const group = groupFor(entry.card, gameType);
    const bucket = buckets.get(group);
    if (bucket) bucket.push(entry);
    else buckets.set(group, [entry]);
  }

  const leftover = [...buckets.keys()].filter((g) => !groupOrderFor(gameType).includes(g));
  return [...groupOrderFor(gameType), ...leftover].flatMap((group) => {
    const found = buckets.get(group);
    if (!found?.length) return [];
    return [{
      group,
      label: getGroupLabel(group),
      count: found.reduce((sum, e) => sum + e.quantity, 0),
      entries: found,
    }];
  });
}

export function countSection(deck: DeckContents, section: DeckSection): number {
  return deck[section].reduce((sum, entry) => sum + entry.quantity, 0);
}

/** Copies of a printing across every section. */
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

/** Official copy limits are by name, not by printing. */
export function countCopiesByName(deck: DeckContents, name: string): number {
  const key = name.trim().toLowerCase();
  return DECK_SECTIONS.reduce(
    (sum, section) =>
      sum +
      deck[section]
        .filter((entry) => entry.card.name.trim().toLowerCase() === key)
        .reduce((s, entry) => s + entry.quantity, 0),
    0
  );
}

function countMatching(deck: DeckContents, pred: (card: DeckCard) => boolean): number {
  return DECK_SECTIONS.reduce(
    (sum, section) =>
      sum +
      deck[section]
        .filter((entry) => pred(entry.card))
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
  | 'extra-too-small'
  | 'extra-too-large'
  | 'side-too-large'
  | 'too-many-copies'
  | 'banned'
  | 'wrong-section'
  | 'color-identity'
  | 'ace-spec-limit'
  | 'radiant-limit';

export interface DeckIssue {
  code: DeckIssueCode;
  severity: 'error' | 'warning';
  message: string;
  section?: DeckSection;
  cardId?: string;
  cardName?: string;
}

/** Copies a card is allowed under the format's banlist / legality table. */
export function allowedCopies(card: DeckCard, rules: FormatRules): number {
  if (rules.legalitySource === 'scryfall' && rules.legalityFormat) {
    const status = legalityValue(card, rules.legalityFormat);
    if (status === 'banned' || status === 'not_legal' || status === '') return 0;
    if (status === 'restricted') return 1;
    if (isBasicLand(card)) return 99;
    return rules.maxCopies;
  }

  if (rules.legalitySource === 'pokemon' && rules.legalityFormat) {
    const status = legalityValue(card, rules.legalityFormat);
    if (status !== 'legal') return 0;
    if (isBasicEnergy(card)) return 99;
    if (isAceSpec(card) || isRadiant(card)) return 1;
    return rules.maxCopies;
  }

  if (rules.legalitySource === 'onepiece') {
    const status = (card.banStatus ?? '').toLowerCase();
    if (status === 'forbidden' || status === 'banned') return 0;
    if (status === 'limited') return 1;
    if (card.cardType === 'LEADER') return 1;
    return rules.maxCopies;
  }

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

/**
 * How many more copies can be added right now. Deck-wide unique constraints
 * (ACE SPEC, Radiant, a second Leader) live here because allowedCopies cannot
 * see the rest of the deck.
 */
export function remainingCopies(deck: DeckContents, card: DeckCard, rules: FormatRules): number {
  const limit = allowedCopies(card, rules);
  if (limit === 0) return 0;

  if (isAceSpec(card) && countMatching(deck, isAceSpec) >= 1 && countCopies(deck, card.cardId) === 0) {
    return 0;
  }
  if (isRadiant(card) && countMatching(deck, isRadiant) >= 1 && countCopies(deck, card.cardId) === 0) {
    return 0;
  }
  if (rules.extraRole === 'leader' && card.cardType === 'LEADER' && countSection(deck, 'extra') >= rules.extra.max) {
    return 0;
  }

  const used = countCopiesByName(deck, card.name);
  return Math.max(0, limit - used);
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
  if (counts.extra < rules.extra.min) {
    issues.push({
      code: 'extra-too-small',
      severity: 'error',
      section: 'extra',
      message:
        rules.extraRole === 'leader'
          ? 'Serve un Leader.'
          : rules.extraRole === 'commander'
            ? 'Serve un Commander.'
            : `${rules.extraLabel ?? 'Extra Deck'} ha ${counts.extra} carte, il minimo è ${rules.extra.min}.`,
    });
  }
  if (counts.extra > rules.extra.max) {
    issues.push({
      code: 'extra-too-large',
      severity: 'error',
      section: 'extra',
      message: `${rules.extraLabel ?? 'Extra Deck'} ha ${counts.extra} carte, il massimo è ${rules.extra.max}.`,
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

  if (countMatching(deck, isAceSpec) > 1) {
    issues.push({
      code: 'ace-spec-limit',
      severity: 'error',
      message: 'Un mazzo può contenere una sola carta ACE SPEC.',
    });
  }
  if (countMatching(deck, isRadiant) > 1) {
    issues.push({
      code: 'radiant-limit',
      severity: 'error',
      message: 'Un mazzo può contenere un solo Pokémon Radiant.',
    });
  }

  const extraCard = deck.extra[0]?.card;
  const extraColors =
    rules.extraRole === 'commander'
      ? extraCard?.colorIdentity ?? extraCard?.colors ?? []
      : extraCard?.colors ?? [];

  const seen = new Map<string, DeckCard>();
  for (const section of DECK_SECTIONS) {
    for (const entry of deck[section]) {
      seen.set(entry.card.name.trim().toLowerCase(), entry.card);

      const expected = sectionFor(entry.card, rules);
      if (section === 'side') continue;

      if (rules.extraRole === 'commander' && section === 'extra') continue;

      if (section !== expected) {
        if (rules.extraRole === 'leader' && expected === 'extra') {
          issues.push({
            code: 'wrong-section',
            severity: 'error',
            section,
            cardId: entry.card.cardId,
            cardName: entry.card.name,
            message: `${entry.card.name} è un Leader e va nel riquadro Leader.`,
          });
        } else if (rules.extraRole === 'extra' || !rules.extraRole) {
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

      if (rules.colorFromExtra && extraCard && section !== 'extra') {
        const cardColors =
          rules.extraRole === 'commander'
            ? entry.card.colorIdentity ?? entry.card.colors ?? []
            : entry.card.colors ?? [];
        const illegal = cardColors.filter((c) => !extraColors.includes(c));
        if (illegal.length > 0) {
          issues.push({
            code: 'color-identity',
            severity: 'error',
            cardId: entry.card.cardId,
            cardName: entry.card.name,
            message:
              rules.extraRole === 'leader'
                ? `${entry.card.name} non è di un colore del Leader.`
                : `${entry.card.name} è fuori dalla color identity del Commander.`,
          });
        }
      }
    }
  }

  for (const card of seen.values()) {
    const total = countCopiesByName(deck, card.name);
    const limit = allowedCopies(card, rules);

    if (limit === 0) {
      issues.push({
        code: 'banned',
        severity: 'error',
        cardId: card.cardId,
        cardName: card.name,
        message: `${card.name} non è legale in questo formato.`,
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

export function getSectionLabel(section: DeckSection, rules?: FormatRules): string {
  if (section === 'extra' && rules?.extraLabel) return rules.extraLabel;
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

export function restrictionLabel(card: DeckCard, rules: FormatRules): string | null {
  if (rules.legalitySource === 'yugioh') {
    return getBanLabel(rules.banlist === 'ocg' ? card.banOcg : card.banTcg);
  }
  if (rules.legalitySource === 'scryfall' && rules.legalityFormat) {
    const status = legalityValue(card, rules.legalityFormat);
    if (status === 'banned') return 'Bannata';
    if (status === 'restricted') return 'Restricted';
    if (status === 'not_legal' || status === '') return 'Non legale';
    return null;
  }
  if (rules.legalitySource === 'pokemon' && rules.legalityFormat) {
    if (legalityValue(card, rules.legalityFormat) !== 'legal') return 'Non legale';
    if (isAceSpec(card)) return 'ACE SPEC';
    if (isRadiant(card)) return 'Radiant';
    return null;
  }
  if (rules.legalitySource === 'onepiece') {
    const status = (card.banStatus ?? '').toLowerCase();
    if (status === 'forbidden' || status === 'banned') return 'Vietata';
    if (status === 'limited') return 'Limitata';
  }
  return null;
}
