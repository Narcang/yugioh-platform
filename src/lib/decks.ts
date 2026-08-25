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

/** Just the artwork, cropped square. Used for deck covers. */
export function cardImageUrl(cardId: string): string {
  return `https://images.ygoprodeck.com/images/cards_cropped/${cardId}.jpg`;
}

/**
 * The whole card, frame and text included. The cropped art alone is not enough
 * to tell two cards apart in a list, let alone read one.
 */
export function cardFullImageUrl(cardId: string): string {
  return `https://images.ygoprodeck.com/images/cards/${cardId}.jpg`;
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

const DECK_META_COLUMNS =
  'id, owner_id, game_type, format, name, description, is_public, is_legal, cover_card_id, created_at, updated_at';

export interface LoadedDeck {
  meta: DeckMeta;
  deck: DeckContents;
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

  // Only Yu-Gi-Oh has the metadata needed to resolve a card today; other games
  // will get their own table here as their data is imported.
  if ((meta as DeckMeta).game_type !== 'Yugioh') {
    return { meta: meta as DeckMeta, deck: emptyDeck() };
  }

  const { data: cards } = await client
    .from('yugioh_cards')
    .select(YUGIOH_DECK_COLUMNS)
    .in('id', [...new Set(cardRows.map((r) => r.card_id))]);

  const byId = new Map<string, DeckCard>();
  for (const row of (cards ?? []) as unknown as YugiohCardRow[]) {
    byId.set(row.id, toDeckCard(row));
  }

  return { meta: meta as DeckMeta, deck: buildDeckContents(cardRows, byId) };
}
