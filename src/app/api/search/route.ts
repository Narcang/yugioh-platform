import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// Read client: uses the anon key (always available, respects RLS SELECT policies)
const supabase = createClient(
  SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() ?? '';
  const gameType = searchParams.get('gameType') ?? 'Yugioh';

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    switch (gameType) {
      case 'Yugioh':
        return await searchYugioh(q);
      case 'Pokemon':
        return await searchPokemon(q);
      case 'Magic':
      case 'Magic: The Gathering':
        return await searchMagic(q);
      case 'OnePiece':
      case 'One Piece':
        return await searchOnePiece(q);
      case 'Riftbound':
        return await searchRiftbound(q);
      default:
        return NextResponse.json({ results: [] });
    }
  } catch (err) {
    console.error('[search] error:', err);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}

// ----------------------------------------------------------------
// Yu-Gi-Oh!
// ----------------------------------------------------------------
// Deck building needs more than a name and a picture: the frame type decides
// whether a card goes to the Main or the Extra deck, and the banlist status
// decides how many copies are allowed.
const YUGIOH_FULL_COLUMNS =
  'id, name_en, name_it, image_url, type, frame_type, is_extra_deck, ban_tcg, ban_ocg, desc_en, desc_it, atk, def, level, attribute, race, archetype';
const YUGIOH_BASE_COLUMNS = 'id, name_en, name_it, image_url';

interface YugiohRow {
  id: string;
  name_en: string;
  name_it: string | null;
  image_url: string | null;
  type?: string | null;
  frame_type?: string | null;
  is_extra_deck?: boolean | null;
  ban_tcg?: string | null;
  ban_ocg?: string | null;
  desc_en?: string | null;
  desc_it?: string | null;
  atk?: number | null;
  def?: number | null;
  level?: number | null;
  attribute?: string | null;
  race?: string | null;
  archetype?: string | null;
}

async function searchYugioh(q: string) {
  const filter = `name_en.ilike.%${q}%,name_it.ilike.%${q}%`;

  let { data, error } = await supabase
    .from('yugioh_cards')
    .select(YUGIOH_FULL_COLUMNS)
    .or(filter)
    .order('name_en')
    .limit(20)
    .overrideTypes<YugiohRow[]>();

  // The metadata columns arrived in migration 003. Until it has been applied,
  // fall back to the original projection so search keeps working — the deck
  // builder is the only caller that needs the extra fields.
  if (error) {
    console.warn('[search/yugioh] metadata columns unavailable:', error.message);
    ({ data, error } = await supabase
      .from('yugioh_cards')
      .select(YUGIOH_BASE_COLUMNS)
      .or(filter)
      .order('name_en')
      .limit(20)
      .overrideTypes<YugiohRow[]>());
  }

  if (error) throw error;

  const results = (data ?? []).map((c) => ({
    id: c.id,
    name: c.name_it ?? c.name_en,
    name_en: c.name_en,
    image_url:
      c.image_url ??
      `https://images.ygoprodeck.com/images/cards_cropped/${c.id}.jpg`,
    type: c.type ?? null,
    frame_type: c.frame_type ?? null,
    is_extra_deck: c.is_extra_deck ?? null,
    ban_tcg: c.ban_tcg ?? null,
    ban_ocg: c.ban_ocg ?? null,
    desc: c.desc_it ?? c.desc_en ?? null,
    atk: c.atk ?? null,
    def: c.def ?? null,
    level: c.level ?? null,
    attribute: c.attribute ?? null,
    race: c.race ?? null,
    archetype: c.archetype ?? null,
  }));

  return NextResponse.json({ results });
}

// The catalogues are complete, so a miss is a miss: calling the official
// APIs on every sparse query used to fill the old 200-card cache, and now
// would only add latency (and, for Pokemon, 502s).

const POKEMON_FULL_COLUMNS =
  'id, name, image_url, image_large, set_name, set_id, number, types, subtypes, supertype, hp, rarity, legalities, regulation_mark, rules';
const POKEMON_BASE_COLUMNS = 'id, name, image_url, set_name, number';

interface PokemonRow {
  id: string;
  name: string;
  image_url: string | null;
  image_large?: string | null;
  set_name: string | null;
  set_id?: string | null;
  number: string | null;
  types?: string[] | null;
  subtypes?: string[] | null;
  supertype?: string | null;
  hp?: string | null;
  rarity?: string | null;
  legalities?: Record<string, string> | null;
  regulation_mark?: string | null;
  rules?: string[] | null;
}

async function searchPokemon(q: string) {
  let { data, error } = await supabase
    .from('pokemon_cards')
    .select(POKEMON_FULL_COLUMNS)
    .ilike('name', `%${q}%`)
    .order('name')
    .limit(20)
    .overrideTypes<PokemonRow[]>();

  if (error) {
    console.warn('[search/pokemon] metadata columns unavailable:', error.message);
    ({ data, error } = await supabase
      .from('pokemon_cards')
      .select(POKEMON_BASE_COLUMNS)
      .ilike('name', `%${q}%`)
      .order('name')
      .limit(20)
      .overrideTypes<PokemonRow[]>());
  }

  if (error) throw error;

  const results = (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    image_url: c.image_url,
    image_large: c.image_large ?? null,
    set: c.set_name,
    set_id: c.set_id ?? null,
    number: c.number,
    types: c.types ?? [],
    subtypes: c.subtypes ?? [],
    supertype: c.supertype ?? null,
    hp: c.hp ?? null,
    rarity: c.rarity ?? null,
    legalities: c.legalities ?? null,
    regulation_mark: c.regulation_mark ?? null,
    rules: c.rules ?? [],
  }));

  return NextResponse.json({ results });
}

const MAGIC_FULL_COLUMNS =
  'id, oracle_id, name, image_url, image_large, set_name, set_code, rarity, cmc, mana_cost, type, oracle_text, colors, color_identity, legalities, layout, keywords';
const MAGIC_BASE_COLUMNS = 'id, name, image_url, set_name, rarity, type, oracle_text';

interface MagicRow {
  id: string;
  oracle_id?: string | null;
  name: string;
  image_url: string | null;
  image_large?: string | null;
  set_name: string | null;
  set_code?: string | null;
  rarity: string | null;
  cmc?: number | null;
  mana_cost?: string | null;
  type: string | null;
  oracle_text: string | null;
  colors?: string[] | null;
  color_identity?: string[] | null;
  legalities?: Record<string, string> | null;
  layout?: string | null;
  keywords?: string[] | null;
}

async function searchMagic(q: string) {
  let { data, error } = await supabase
    .from('magic_cards')
    .select(MAGIC_FULL_COLUMNS)
    .ilike('name', `%${q}%`)
    .order('name')
    .limit(20)
    .overrideTypes<MagicRow[]>();

  if (error) {
    console.warn('[search/magic] metadata columns unavailable:', error.message);
    ({ data, error } = await supabase
      .from('magic_cards')
      .select(MAGIC_BASE_COLUMNS)
      .ilike('name', `%${q}%`)
      .order('name')
      .limit(20)
      .overrideTypes<MagicRow[]>());
  }

  if (error) throw error;

  const results = (data ?? []).map((c) => ({
    id: c.id,
    oracle_id: c.oracle_id ?? null,
    name: c.name,
    image_url: c.image_url,
    image_large: c.image_large ?? null,
    set: c.set_name,
    set_code: c.set_code ?? null,
    rarity: c.rarity,
    cmc: c.cmc ?? null,
    mana_cost: c.mana_cost ?? null,
    type: c.type,
    oracle_text: c.oracle_text,
    colors: c.colors ?? [],
    color_identity: c.color_identity ?? [],
    legalities: c.legalities ?? null,
    layout: c.layout ?? null,
    keywords: c.keywords ?? [],
  }));

  return NextResponse.json({ results });
}

const ONEPIECE_FULL_COLUMNS =
  'id, name, image_url, set_name, set_code, rarity, type, card_type, text, color, colors, cost, power, counter, attribute, life, trigger, ban_status';
const ONEPIECE_BASE_COLUMNS =
  'id, name, image_url, set_name, rarity, type, text, color, cost, power, counter';

interface OnePieceRow {
  id: string;
  name: string;
  image_url: string | null;
  set_name: string | null;
  set_code?: string | null;
  rarity: string | null;
  type: string | null;
  card_type?: string | null;
  text: string | null;
  color: string | null;
  colors?: string[] | null;
  cost: string | null;
  power: string | null;
  counter: string | null;
  attribute?: string | null;
  life?: string | null;
  trigger?: string | null;
  ban_status?: string | null;
}

async function searchOnePiece(q: string) {
  let { data, error } = await supabase
    .from('onepiece_cards')
    .select(ONEPIECE_FULL_COLUMNS)
    .ilike('name', `%${q}%`)
    .order('name')
    .limit(20)
    .overrideTypes<OnePieceRow[]>();

  if (error) {
    console.warn('[search/onepiece] metadata columns unavailable:', error.message);
    ({ data, error } = await supabase
      .from('onepiece_cards')
      .select(ONEPIECE_BASE_COLUMNS)
      .ilike('name', `%${q}%`)
      .order('name')
      .limit(20)
      .overrideTypes<OnePieceRow[]>());
  }

  if (error) throw error;

  const results = (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    image_url: c.image_url,
    set: c.set_name,
    set_code: c.set_code ?? null,
    rarity: c.rarity,
    type: c.type,
    card_type: c.card_type ?? null,
    text: c.text,
    color: c.color,
    colors: c.colors ?? [],
    cost: c.cost,
    power: c.power,
    counter: c.counter,
    attribute: c.attribute ?? null,
    life: c.life ?? null,
    trigger: c.trigger ?? null,
    ban_status: c.ban_status ?? null,
  }));

  return NextResponse.json({ results });
}

const RIFTBOUND_COLUMNS =
  'id, name, image_url, image_large, set_code, rarity, card_type, domains, energy, might, power, ban_status';

interface RiftboundRow {
  id: string;
  name: string;
  image_url: string | null;
  image_large?: string | null;
  set_code: string | null;
  rarity: string | null;
  card_type: string | null;
  domains?: string[] | null;
  energy?: number | null;
  might?: number | null;
  power?: number | null;
  ban_status?: string | null;
}

async function searchRiftbound(q: string) {
  const { data, error } = await supabase
    .from('riftbound_cards')
    .select(RIFTBOUND_COLUMNS)
    .ilike('name', `%${q}%`)
    .order('name')
    .limit(20)
    .overrideTypes<RiftboundRow[]>();

  if (error) throw error;

  const results = (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    image_url: c.image_url,
    image_large: c.image_large ?? null,
    set: c.set_code,
    rarity: c.rarity,
    type: c.card_type,
    card_type: c.card_type,
    colors: c.domains ?? [],
    ban_status: c.ban_status ?? null,
  }));

  return NextResponse.json({ results });
}
