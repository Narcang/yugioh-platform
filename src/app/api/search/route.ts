import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// Read client: uses the anon key (always available, respects RLS SELECT policies)
const supabase = createClient(
  SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Write client: uses the service role key to cache new cards from external APIs.
// Falls back gracefully to the anon client if the key is not configured.
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseWriter = serviceKey
  ? createClient(SUPABASE_URL, serviceKey)
  : supabase;

const POKEMON_API_KEY = process.env.POKEMON_TCG_API_KEY ?? '';

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
async function searchYugioh(q: string) {
  const { data, error } = await supabase
    .from('yugioh_cards')
    .select('id, name_en, name_it, image_url')
    .or(`name_en.ilike.%${q}%,name_it.ilike.%${q}%`)
    .limit(20);

  if (error) throw error;

  const results = (data ?? []).map((c) => ({
    id: c.id,
    name: c.name_it ?? c.name_en,
    image_url:
      c.image_url ??
      `https://images.ygoprodeck.com/images/cards_cropped/${c.id}.jpg`,
  }));

  return NextResponse.json({ results });
}

// ----------------------------------------------------------------
// Pokemon
// ----------------------------------------------------------------
async function searchPokemon(q: string) {
  const { data, error } = await supabase
    .from('pokemon_cards')
    .select('id, name, image_url, set_name, number')
    .ilike('name', `%${q}%`)
    .limit(20);

  if (error) throw error;

  let results = (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    image_url: c.image_url,
    set: c.set_name,
    number: c.number,
  }));

  // External fallback: PokemonTCG API
  if (results.length < 5 && POKEMON_API_KEY) {
    try {
      const resp = await fetch(
        `https://api.pokemontcg.io/v2/cards?q=name:"*${encodeURIComponent(q)}*"&pageSize=10`,
        { headers: { 'X-Api-Key': POKEMON_API_KEY } }
      );
      if (resp.ok) {
        const apiData = await resp.json();
        const existing = new Set(results.map((r) => r.id));
        const newCards = (apiData.data ?? []).filter(
          (c: Record<string, unknown>) => !existing.has(c.id as string)
        );
        if (newCards.length > 0) {
          const rows = newCards.map((c: Record<string, unknown>) => {
            const images = c.images as Record<string, string> | undefined;
            const set = c.set as Record<string, string> | undefined;
            return {
              id: c.id as string,
              name: c.name as string,
              image_url: images?.large ?? images?.small ?? '',
              set_name: set?.name ?? '',
              number: (c.number as string) ?? '',
              types: (c.types as string[]) ?? [],
              supertype: (c.supertype as string) ?? '',
            };
          });
          await supabaseWriter
            .from('pokemon_cards')
            .upsert(rows, { onConflict: 'id' });
          results = [
            ...results,
            ...rows.map((r) => ({
              id: r.id,
              name: r.name,
              image_url: r.image_url,
              set: r.set_name,
              number: r.number,
            })),
          ].slice(0, 20);
        }
      }
    } catch (e) {
      console.error('[search/pokemon] external fallback failed:', e);
    }
  }

  return NextResponse.json({ results });
}

// ----------------------------------------------------------------
// Magic: The Gathering  (Scryfall)
// ----------------------------------------------------------------
async function searchMagic(q: string) {
  const { data, error } = await supabase
    .from('magic_cards')
    .select('id, name, image_url, set_name, rarity, type, oracle_text')
    .ilike('name', `%${q}%`)
    .limit(20);

  if (error) throw error;

  let results = (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    image_url: c.image_url,
    set: c.set_name,
    rarity: c.rarity,
    type: c.type,
    oracle_text: c.oracle_text,
  }));

  // External fallback: Scryfall
  if (results.length < 5) {
    try {
      const resp = await fetch(
        `https://api.scryfall.com/cards/search?q=${encodeURIComponent(q)}`
      );
      if (resp.ok) {
        const apiData = await resp.json();
        const existing = new Set(results.map((r) => r.id));
        const newCards = (apiData.data ?? []).filter(
          (c: Record<string, unknown>) => !existing.has(c.id as string)
        );
        if (newCards.length > 0) {
          const rows = newCards.map((c: Record<string, unknown>) => {
            const imageUris = c.image_uris as Record<string, string> | undefined;
            const cardFaces = c.card_faces as Array<{ image_uris?: Record<string, string> }> | undefined;
            const image_url =
              imageUris?.normal ??
              cardFaces?.[0]?.image_uris?.normal ??
              '';
            return {
              id: c.id as string,
              name: c.name as string,
              image_url,
              set_name: (c.set_name as string) ?? '',
              rarity: (c.rarity as string) ?? '',
              cmc: (c.cmc as number) ?? 0,
              type: (c.type_line as string) ?? '',
              oracle_text: (c.oracle_text as string) ?? '',
            };
          });
          await supabaseWriter
            .from('magic_cards')
            .upsert(rows, { onConflict: 'id' });
          results = [
            ...results,
            ...rows.map((r) => ({
              id: r.id,
              name: r.name,
              image_url: r.image_url,
              set: r.set_name,
              rarity: r.rarity,
              type: r.type,
              oracle_text: r.oracle_text,
            })),
          ].slice(0, 20);
        }
      }
    } catch (e) {
      console.error('[search/magic] external fallback failed:', e);
    }
  }

  return NextResponse.json({ results });
}

// ----------------------------------------------------------------
// One Piece
// ----------------------------------------------------------------
async function searchOnePiece(q: string) {
  const { data, error } = await supabase
    .from('onepiece_cards')
    .select(
      'id, name, image_url, set_name, rarity, type, text, color, cost, power, counter'
    )
    .ilike('name', `%${q}%`)
    .limit(20);

  if (error) throw error;

  const results = (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    image_url: c.image_url,
    set: c.set_name,
    rarity: c.rarity,
    type: c.type,
    text: c.text,
    color: c.color,
    cost: c.cost,
    power: c.power,
    counter: c.counter,
  }));

  return NextResponse.json({ results });
}
