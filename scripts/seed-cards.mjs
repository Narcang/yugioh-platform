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
 *   node scripts/seed-cards.mjs
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
async function fetchAllYugiohCards(language = 'en') {
  const PAGE_SIZE = 500;
  let offset = 0;
  let allCards = [];

  while (true) {
    const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?num=${PAGE_SIZE}&offset=${offset}&language=${language}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`YGOPRODeck ${language.toUpperCase()} fetch failed at offset ${offset}: ${res.status}`);
    const data = await res.json();
    const cards = data.data ?? [];
    allCards = allCards.concat(cards);
    process.stdout.write(`\r  ↳ [${language.toUpperCase()}] fetched ${allCards.length}/${data.meta?.total_rows ?? '?'} cards...`);
    if (data.meta?.rows_remaining === 0 || cards.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  console.log('');
  return allCards;
}

async function seedYugioh() {
  console.log('\n🃏  Seeding Yu-Gi-Oh! cards from YGOPRODeck API...');

  const [enCards, itCards] = await Promise.all([
    fetchAllYugiohCards('en'),
    fetchAllYugiohCards('it'),
  ]);

  // Build Italian name lookup  { id → name_it }
  const itNames = {};
  for (const card of itCards) {
    itNames[card.id] = card.name;
  }

  const rows = enCards.map((card) => ({
    id: String(card.id),
    name_en: card.name,
    name_it: itNames[card.id] ?? null,
    image_url: `https://images.ygoprodeck.com/images/cards_cropped/${card.id}.jpg`,
  }));

  console.log(`  Found ${rows.length} cards`);
  await upsertBatch('yugioh_cards', rows);
  console.log(`  ✅ Yu-Gi-Oh! done`);
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
