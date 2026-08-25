/**
 * seed-cards.mjs
 *
 * Populates Supabase card tables from:
 *  - YGOPRODeck API  → yugioh_cards
 *  - pokemon_db.json → pokemon_cards
 *  - magic_db.json   → magic_cards
 *  - onepiece_db.json → onepiece_cards
 *
 * Usage:
 *   node scripts/seed-cards.mjs                 # every game
 *   node scripts/seed-cards.mjs yugioh          # one game
 *   node scripts/seed-cards.mjs banlist         # refresh only the Yu-Gi-Oh
 *                                               # forbidden/limited list
 *
 * The banlist changes a few times a year, and refreshing it does not need a
 * full re-download: `banlist` fetches only the restricted cards and updates
 * their status, which is a few hundred rows instead of ~14,500.
 *
 * Required env vars (set in .env.local or export before running):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Optional (only needed if you want to also call the Pokemon API during seed):
 *   POKEMON_TCG_API_KEY
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ----------------------------------------------------------------
// Config
// ----------------------------------------------------------------
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    '❌  Missing env vars: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const DB_DIR = join(__dirname, '..', '..', 'backend', 'python_server', 'data', 'db');

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------
async function upsertBatch(table, rows, batchSize = 500) {
  let inserted = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase
      .from(table)
      .upsert(batch, { onConflict: 'id' });
    if (error) {
      console.error(`  ⚠️  Batch ${Math.floor(i / batchSize) + 1} error:`, error.message);
    } else {
      inserted += batch.length;
      process.stdout.write(
        `\r  ↳ ${inserted}/${rows.length} rows inserted...`
      );
    }
  }
  console.log('');
}

// ----------------------------------------------------------------
// 1. Yu-Gi-Oh! — fetch from YGOPRODeck API (paginated)
// ----------------------------------------------------------------
async function fetchAllYugiohCards(lang) {
  // The API default is English. For other languages pass ?language=XX
  // language=en is NOT a valid param (returns 400).
  const PAGE_SIZE = 500;
  const langParam = lang === 'en' ? '' : `&language=${lang}`;
  const label = lang.toUpperCase();
  let offset = 0;
  let allCards = [];

  while (true) {
    const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?num=${PAGE_SIZE}&offset=${offset}${langParam}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`YGOPRODeck [${label}] fetch failed at offset ${offset}: ${res.status}`);
    const data = await res.json();
    const cards = data.data ?? [];
    allCards = allCards.concat(cards);
    process.stdout.write(`\r  ↳ [${label}] fetched ${allCards.length}/${data.meta?.total_rows ?? '?'} cards...`);
    if ((data.meta?.rows_remaining ?? 0) === 0 || cards.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  console.log('');
  return allCards;
}

// A "?" ATK/DEF comes back as -2 from the API, which would look like a real
// stat in the builder. Null is the honest answer.
function stat(value) {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function mapYugiohCard(card, italian) {
  const it = italian[card.id];
  return {
    id: String(card.id),
    name_en: card.name,
    name_it: it?.name ?? null,
    image_url: `https://images.ygoprodeck.com/images/cards_cropped/${card.id}.jpg`,
    type: card.type ?? null,
    frame_type: card.frameType ?? null,
    race: card.race ?? null,
    attribute: card.attribute ?? null,
    // Link monsters carry their rating in linkval and report level 0, so the
    // rating would be lost by simply preferring level.
    level: stat(card.linkval ?? card.level),
    atk: stat(card.atk),
    def: stat(card.def),
    archetype: card.archetype ?? null,
    desc_en: card.desc ?? null,
    desc_it: it?.desc ?? null,
    ban_tcg: card.banlist_info?.ban_tcg ?? null,
    ban_ocg: card.banlist_info?.ban_ocg ?? null,
  };
}

async function seedYugioh() {
  console.log('\n🃏  Seeding Yu-Gi-Oh! cards from YGOPRODeck API...');

  // Fetch English (default) and Italian in parallel
  const [enCards, itCards] = await Promise.all([
    fetchAllYugiohCards('en'),
    fetchAllYugiohCards('it'),
  ]);

  // Italian lookup  { id → { name, desc } }
  const italian = {};
  for (const card of itCards) {
    italian[card.id] = { name: card.name, desc: card.desc };
  }

  const rows = enCards.map((card) => mapYugiohCard(card, italian));

  console.log(`  Found ${rows.length} cards`);
  await upsertBatch('yugioh_cards', rows);
  console.log(`  ✅ Yu-Gi-Oh! done`);
}

// ----------------------------------------------------------------
// 1b. Yu-Gi-Oh! banlist refresh only
// ----------------------------------------------------------------
async function seedYugiohBanlist() {
  console.log('\n🚫  Refreshing Yu-Gi-Oh! banlist...');

  const restricted = [];
  for (const list of ['tcg', 'ocg']) {
    const res = await fetch(
      `https://db.ygoprodeck.com/api/v7/cardinfo.php?banlist=${list}`
    );
    if (!res.ok) throw new Error(`YGOPRODeck banlist [${list}] failed: ${res.status}`);
    const data = await res.json();
    restricted.push(...(data.data ?? []));
  }

  // The same card shows up once per list it appears on; keep one row carrying
  // both statuses.
  const byId = new Map();
  for (const card of restricted) {
    const id = String(card.id);
    const existing = byId.get(id) ?? { id };
    byId.set(id, {
      ...existing,
      ban_tcg: card.banlist_info?.ban_tcg ?? existing.ban_tcg ?? null,
      ban_ocg: card.banlist_info?.ban_ocg ?? existing.ban_ocg ?? null,
    });
  }
  // A brand new card cannot be upserted from banlist data alone (name_en is
  // NOT NULL), and one such row would fail its whole batch. Keep only cards we
  // already have; a full seed will pick up the rest.
  const { data: known, error: knownError } = await supabase
    .from('yugioh_cards')
    .select('id')
    .in('id', [...byId.keys()]);
  if (knownError) throw new Error(`Could not read existing cards: ${knownError.message}`);
  const knownIds = new Set((known ?? []).map((r) => r.id));

  const missing = [...byId.keys()].filter((id) => !knownIds.has(id));
  if (missing.length) {
    console.log(`  ℹ️  ${missing.length} restricted cards are not in the DB yet — run a full seed`);
  }

  const rows = [...byId.values()].filter((r) => knownIds.has(r.id));
  const restrictedIds = rows.map((r) => r.id);

  // Cards that left the list keep a stale status until they are cleared.
  const { error: clearError } = await supabase
    .from('yugioh_cards')
    .update({ ban_tcg: null, ban_ocg: null })
    .not('id', 'in', `(${restrictedIds.join(',')})`)
    .or('ban_tcg.not.is.null,ban_ocg.not.is.null');
  if (clearError) console.error('  ⚠️  Could not clear old statuses:', clearError.message);

  console.log(`  Found ${rows.length} restricted cards`);
  await upsertBatch('yugioh_cards', rows);
  console.log('  ✅ Banlist done');
}

// ----------------------------------------------------------------
// 2. Pokemon — load from JSON file
// ----------------------------------------------------------------
async function seedPokemon() {
  console.log('\n⚡  Seeding Pokemon cards from local JSON...');

  const raw = readFileSync(join(DB_DIR, 'pokemon_db.json'), 'utf-8');
  const db = JSON.parse(raw);

  const rows = Object.values(db).map((c) => ({
    id: c.id,
    name: c.name,
    image_url: c.image_url ?? '',
    set_name: c.set ?? '',
    number: c.number ?? '',
    types: c.types ?? [],
    supertype: c.supertype ?? '',
  }));

  console.log(`  Found ${rows.length} cards`);
  await upsertBatch('pokemon_cards', rows, 200);
  console.log(`  ✅ Pokemon done`);
}

// ----------------------------------------------------------------
// 3. Magic: The Gathering — load from JSON file
// ----------------------------------------------------------------
async function seedMagic() {
  console.log('\n🔮  Seeding Magic cards from local JSON...');

  const raw = readFileSync(join(DB_DIR, 'magic_db.json'), 'utf-8');
  const db = JSON.parse(raw);

  const rows = Object.values(db).map((c) => ({
    id: c.id,
    name: c.name,
    image_url: c.image_url ?? '',
    set_name: c.set ?? '',
    rarity: c.rarity ?? '',
    cmc: c.cmc ?? 0,
    type: c.type ?? '',
    oracle_text: c.oracle_text ?? '',
  }));

  console.log(`  Found ${rows.length} cards`);
  await upsertBatch('magic_cards', rows, 200);
  console.log(`  ✅ Magic done`);
}

// ----------------------------------------------------------------
// 4. One Piece — load from JSON file
// ----------------------------------------------------------------
async function seedOnePiece() {
  console.log('\n☠️   Seeding One Piece cards from local JSON...');

  const raw = readFileSync(join(DB_DIR, 'onepiece_db.json'), 'utf-8');
  const db = JSON.parse(raw);

  const rows = Object.values(db).map((c) => ({
    id: c.id,
    name: c.name,
    image_url: c.image_url ?? '',
    set_name: c.set ?? '',
    rarity: c.rarity ?? '',
    type: c.type ?? '',
    text: c.text ?? '',
    color: c.color ?? '',
    cost: c.cost ?? '',
    power: c.power ?? '',
    counter: c.counter ?? '',
  }));

  console.log(`  Found ${rows.length} cards`);
  await upsertBatch('onepiece_cards', rows, 200);
  console.log(`  ✅ One Piece done`);
}

// ----------------------------------------------------------------
// Main
// ----------------------------------------------------------------
(async () => {
  console.log('🚀  PlayTCG — Card DB Seed Script');
  console.log(`    Supabase: ${SUPABASE_URL}`);

  const args = process.argv.slice(2);
  const runAll = args.length === 0;
  const games = runAll
    ? ['yugioh', 'pokemon', 'magic', 'onepiece']
    : args;

  try {
    // Standalone: refreshing the banlist should not re-download 14,500 cards.
    if (!runAll && games.includes('banlist')) {
      await seedYugiohBanlist();
      console.log('\n🎉  Banlist refreshed!');
      return;
    }

    if (games.includes('yugioh'))   await seedYugioh();
    if (games.includes('pokemon'))  await seedPokemon();
    if (games.includes('magic'))    await seedMagic();
    if (games.includes('onepiece')) await seedOnePiece();

    console.log('\n🎉  Seed completed successfully!');
  } catch (err) {
    console.error('\n❌  Seed failed:', err);
    process.exit(1);
  }
})();
