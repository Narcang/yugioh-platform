import type { SupabaseClient } from '@supabase/supabase-js';
import {
  BanStatus,
  DeckCard,
  DeckContents,
  DeckSection,
  DECK_SECTIONS,
  emptyDeck,
  isExtraDeckFrame,
} from './deckRules';

/** A deck row as stored, without its cards. */
export interface DeckMeta {
  id: string;
  owner_id: string;
  game_type: string;
  format: string;
  name: string;
  description: string | null;
  is_public: boolean;
  is_legal: boolean;
  cover_card_id: string | null;
  created_at: string;
  updated_at: string;
}

/** A public deck as exposed by the public_decks view. */
export interface PublicDeckSummary {
  id: string;
  game_type: string;
  format: string;
  name: string;
  description: string | null;
  is_legal: boolean;
  cover_card_id: string | null;
  updated_at: string;
  owner_id: string;
  owner_username: string | null;
  main_count: number;
}

export interface DeckCardRow {
  card_id: string;
  section: DeckSection;
  quantity: number;
}

export const DECKS_TABLE = 'decks';
export const DECK_CARDS_TABLE = 'deck_cards';

/** Just the artwork, cropped square. Used for Yu-Gi-Oh deck covers. */
export function cardImageUrl(cardId: string): string {
  return `https://images.ygoprodeck.com/images/cards_cropped/${cardId}.jpg`;
}

/**
 * The whole Yu-Gi-Oh card, frame and text included. The cropped art alone is
 * not enough to tell two cards apart in a list, let alone read one.
 */
export function cardFullImageUrl(cardId: string): string {
  return `https://images.ygoprodeck.com/images/cards/${cardId}.jpg`;
}

/** Cover art for a deck tile, using each game's public CDN. */
export function coverImageUrl(gameType: string, cardId: string): string {
  switch (gameType) {
    case 'Pokemon': {
      const dash = cardId.indexOf('-');
      if (dash > 0) {
        const set = cardId.slice(0, dash);
        const number = cardId.slice(dash + 1);
        return `https://images.pokemontcg.io/${set}/${number}.png`;
      }
      return cardImageUrl(cardId);
    }
    case 'Magic':
      return `https://cards.scryfall.io/normal/front/${cardId[0]}/${cardId[1]}/${cardId}.jpg`;
    case 'One Piece':
      return `https://static.dotgg.gg/onepiece/card/${cardId}.webp`;
    case 'Dragon Ball':
      return `https://www.dbs-cardgame.com/fw/images/cards/card/en/${cardId}_f.webp`;
    default:
      if (/^https?:\/\//i.test(cardId)) return cardId;
      return cardImageUrl(cardId);
  }
}

/** Thumbnail in the deck list. Yu-Gi-Oh keeps the full frame at 44px. */
export function entryImageUrl(card: DeckCard, gameType: string): string {
  if (gameType === 'Yugioh') return cardFullImageUrl(card.cardId);
  return card.imageUrl || card.imageLarge || coverImageUrl(gameType, card.cardId);
}

/** Hover preview and zoom. */
export function previewImageUrl(card: DeckCard, gameType: string): string {
  if (gameType === 'Yugioh') return cardFullImageUrl(card.cardId);
  return card.imageLarge || card.imageUrl || coverImageUrl(gameType, card.cardId);
}

interface YugiohCardRow {
  id: string;
  name_en: string;
  name_it: string | null;
  image_url: string | null;
  frame_type: string | null;
  is_extra_deck: boolean | null;
  ban_tcg: string | null;
  ban_ocg: string | null;
}

export function toDeckCard(row: YugiohCardRow): DeckCard {
  return {
    cardId: row.id,
    name: row.name_it ?? row.name_en,
    imageUrl: row.image_url ?? cardImageUrl(row.id),
    frameType: row.frame_type,
    isExtraDeck: row.is_extra_deck ?? isExtraDeckFrame(row.frame_type),
    banTcg: (row.ban_tcg as BanStatus) ?? null,
    banOcg: (row.ban_ocg as BanStatus) ?? null,
  };
}

function blankCard(id: string, name: string, imageUrl: string | null): DeckCard {
  return {
    cardId: id,
    name,
    imageUrl,
    frameType: null,
    isExtraDeck: false,
    banTcg: null,
    banOcg: null,
  };
}

export function searchResultToDeckCard(
  result: {
    id: string;
    name: string;
    image_url?: string | null;
    image_large?: string | null;
    frame_type?: string | null;
    is_extra_deck?: boolean | null;
    ban_tcg?: string | null;
    ban_ocg?: string | null;
    legalities?: Record<string, string> | null;
    colors?: string[];
    color_identity?: string[];
    type?: string | null;
    mana_cost?: string | null;
    layout?: string | null;
    oracle_id?: string | null;
    supertype?: string | null;
    subtypes?: string[];
    rules?: string[];
    card_type?: string | null;
    ban_status?: string | null;
  },
  gameType: string
): DeckCard {
  if (gameType === 'Yugioh') {
    return {
      cardId: result.id,
      name: result.name,
      imageUrl: result.image_url ?? cardImageUrl(result.id),
      frameType: result.frame_type ?? null,
      isExtraDeck: result.is_extra_deck ?? isExtraDeckFrame(result.frame_type),
      banTcg: (result.ban_tcg as BanStatus) ?? null,
      banOcg: (result.ban_ocg as BanStatus) ?? null,
    };
  }

  const card = blankCard(result.id, result.name, result.image_url ?? null);
  card.imageLarge = result.image_large ?? null;
  card.legalities = result.legalities ?? null;
  card.colors = result.colors ?? [];
  card.colorIdentity = result.color_identity ?? [];
  card.typeLine = result.type ?? null;
  card.manaCost = result.mana_cost ?? null;
  card.layout = result.layout ?? null;
  card.oracleId = result.oracle_id ?? null;
  card.supertype = result.supertype ?? null;
  card.subtypes = result.subtypes ?? [];
  card.rules = result.rules ?? [];
  card.cardType = result.card_type ?? null;
  card.banStatus = result.ban_status ?? null;
  card.isExtraDeck = result.card_type === 'LEADER' || result.card_type === 'Legend';
  return card;
}

/**
 * Turns stored rows into deck contents, keeping the section that was saved.
 * A card whose section is no longer valid (an errata moved it, say) still
 * shows up where it was put; validateDeck reports it instead of silently
 * relocating it, so the owner sees what changed.
 */
export function buildDeckContents(
  rows: DeckCardRow[],
  cards: Map<string, DeckCard>
): DeckContents {
  const deck = emptyDeck();

  for (const row of rows) {
    const card = cards.get(row.card_id);
    if (!card) continue;
    const section = DECK_SECTIONS.includes(row.section) ? row.section : 'main';
    deck[section].push({ card, quantity: row.quantity });
  }

  for (const section of DECK_SECTIONS) {
    deck[section].sort((a, b) => a.card.name.localeCompare(b.card.name));
  }
  return deck;
}

export function deckToRows(deck: DeckContents): DeckCardRow[] {
  return DECK_SECTIONS.flatMap((section) =>
    deck[section].map((entry) => ({
      card_id: entry.card.cardId,
      section,
      quantity: entry.quantity,
    }))
  );
}

export const YUGIOH_DECK_COLUMNS =
  'id, name_en, name_it, image_url, frame_type, is_extra_deck, ban_tcg, ban_ocg';

const POKEMON_DECK_COLUMNS =
  'id, name, image_url, image_large, types, subtypes, supertype, rules, legalities, regulation_mark';

const MAGIC_DECK_COLUMNS =
  'id, oracle_id, name, image_url, image_large, type, mana_cost, colors, color_identity, legalities, layout';

const ONEPIECE_DECK_COLUMNS =
  'id, name, image_url, type, card_type, colors, color, ban_status';

const DECK_META_COLUMNS =
  'id, owner_id, game_type, format, name, description, is_public, is_legal, cover_card_id, created_at, updated_at';

export interface LoadedDeck {
  meta: DeckMeta;
  deck: DeckContents;
}

async function loadCardsForGame(
  client: SupabaseClient,
  gameType: string,
  ids: string[]
): Promise<Map<string, DeckCard>> {
  const byId = new Map<string, DeckCard>();
  if (ids.length === 0) return byId;

  if (gameType === 'Yugioh') {
    const { data } = await client.from('yugioh_cards').select(YUGIOH_DECK_COLUMNS).in('id', ids);
    for (const row of (data ?? []) as unknown as YugiohCardRow[]) {
      byId.set(row.id, toDeckCard(row));
    }
    return byId;
  }

  if (gameType === 'Pokemon') {
    const { data } = await client.from('pokemon_cards').select(POKEMON_DECK_COLUMNS).in('id', ids);
    for (const row of data ?? []) {
      const r = row as {
        id: string;
        name: string;
        image_url: string | null;
        image_large: string | null;
        subtypes: string[] | null;
        supertype: string | null;
        rules: string[] | null;
        legalities: Record<string, string> | null;
      };
      const card = blankCard(r.id, r.name, r.image_url);
      card.imageLarge = r.image_large;
      card.subtypes = r.subtypes ?? [];
      card.supertype = r.supertype;
      card.rules = r.rules ?? [];
      card.legalities = r.legalities;
      byId.set(r.id, card);
    }
    return byId;
  }

  if (gameType === 'Magic') {
    const { data } = await client.from('magic_cards').select(MAGIC_DECK_COLUMNS).in('id', ids);
    for (const row of data ?? []) {
      const r = row as {
        id: string;
        oracle_id: string | null;
        name: string;
        image_url: string | null;
        image_large: string | null;
        type: string | null;
        mana_cost: string | null;
        colors: string[] | null;
        color_identity: string[] | null;
        legalities: Record<string, string> | null;
        layout: string | null;
      };
      const card = blankCard(r.id, r.name, r.image_url);
      card.imageLarge = r.image_large;
      card.oracleId = r.oracle_id;
      card.typeLine = r.type;
      card.manaCost = r.mana_cost;
      card.colors = r.colors ?? [];
      card.colorIdentity = r.color_identity ?? [];
      card.legalities = r.legalities;
      card.layout = r.layout;
      byId.set(r.id, card);
    }
    return byId;
  }

  if (gameType === 'One Piece') {
    const { data } = await client.from('onepiece_cards').select(ONEPIECE_DECK_COLUMNS).in('id', ids);
    for (const row of data ?? []) {
      const r = row as {
        id: string;
        name: string;
        image_url: string | null;
        card_type: string | null;
        colors: string[] | null;
        color: string | null;
        ban_status: string | null;
      };
      const card = blankCard(r.id, r.name, r.image_url);
      card.cardType = r.card_type;
      card.colors = r.colors ?? [];
      card.banStatus = r.ban_status;
      card.isExtraDeck = r.card_type === 'LEADER';
      byId.set(r.id, card);
    }
    return byId;
  }

  if (gameType === 'Riftbound') {
    const { data } = await client
      .from('riftbound_cards')
      .select('id, name, image_url, image_large, card_type, domains, ban_status, set_code, rarity')
      .in('id', ids);
    for (const row of data ?? []) {
      const r = row as {
        id: string;
        name: string;
        image_url: string | null;
        image_large: string | null;
        card_type: string | null;
        domains: string[] | null;
        ban_status: string | null;
      };
      const card = blankCard(r.id, r.name, r.image_url);
      card.imageLarge = r.image_large;
      card.cardType = r.card_type;
      card.colors = r.domains ?? [];
      card.banStatus = r.ban_status;
      card.isExtraDeck = r.card_type === 'Legend';
      byId.set(r.id, card);
    }
    return byId;
  }

  if (gameType === 'Dragon Ball') {
    const { data } = await client
      .from('dragonball_cards')
      .select('id, name, image_url, image_large, card_type, colors, color, ban_status')
      .in('id', ids);
    for (const row of data ?? []) {
      const r = row as {
        id: string;
        name: string;
        image_url: string | null;
        image_large: string | null;
        card_type: string | null;
        colors: string[] | null;
        color: string | null;
        ban_status: string | null;
      };
      const card = blankCard(r.id, r.name, r.image_url);
      card.imageLarge = r.image_large;
      card.cardType = r.card_type;
      card.colors = r.colors ?? [];
      card.banStatus = r.ban_status;
      card.isExtraDeck = r.card_type === 'LEADER';
      byId.set(r.id, card);
    }
  }

  return byId;
}

/**
 * Loads a deck and resolves its cards.
 *
 * Takes the client as an argument so the same code serves both the server
 * render of a public deck (anonymous client) and the owner's browser session.
 * RLS decides what comes back, so there is no visibility check here.
 */
export async function loadDeck(
  client: SupabaseClient,
  deckId: string
): Promise<LoadedDeck | null> {
  const { data: meta, error } = await client
    .from(DECKS_TABLE)
    .select(DECK_META_COLUMNS)
    .eq('id', deckId)
    .maybeSingle();

  if (error || !meta) return null;

  const { data: rows } = await client
    .from(DECK_CARDS_TABLE)
    .select('card_id, section, quantity')
    .eq('deck_id', deckId);

  const cardRows = (rows ?? []) as DeckCardRow[];
  if (cardRows.length === 0) {
    return { meta: meta as DeckMeta, deck: emptyDeck() };
  }

  const byId = await loadCardsForGame(
    client,
    (meta as DeckMeta).game_type,
    [...new Set(cardRows.map((r) => r.card_id))]
  );

  return { meta: meta as DeckMeta, deck: buildDeckContents(cardRows, byId) };
}
