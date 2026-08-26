/**
 * seed-cards.mjs
 *
 * Populates the Supabase card tables from each game's upstream catalogue:
 *  - YGOPRODeck API         → yugioh_cards    (~14,600 cards)
 *  - PokemonTCG data repo   → pokemon_cards   (~20,300 cards)
 *  - Scryfall bulk data     → magic_cards     (~35,000 unique cards)
 *  - dotgg One Piece API    → onepiece_cards  (~3,000 cards)
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
 * Pokemon deliberately does not use api.pokemontcg.io: that API returns 500s
 * often enough that a 20,000-card import cannot rely on it. The project's own
 * data repository carries the same records, including legalities and
 * regulation marks, as plain files with no key and no rate limit.
 *
 * Required env vars (set in .env.local or export before running):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import { createGunzip } from 'zlib';
import { Readable } from 'stream';
import { createInterface } from 'readline';

// ----------------------------------------------------------------
// Config
// ----------------------------------------------------------------
// Next reads .env.local by itself, a bare node script does not.
try {
  process.loadEnvFile(new URL('../.env.local', import.meta.url));
} catch {
  // Fine: the variables may already be exported in the environment.
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    '❌  Missing env vars: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Scryfall asks clients to identify themselves and to declare what they accept.
const HEADERS = {
  'User-Agent': 'PlayTCG.online/1.0 (card database seed)',
  Accept: 'application/json',
};

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------
async function getJson(url, { allow404 = false } = {}) {
  const res = await fetch(url, { headers: HEADERS });
  if (res.status === 404 && allow404) return null;
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return res.json();
}

// Upstream packs multiple values into one string ("Red/Green", "Slash / Wisdom").
function splitList(value) {
  if (!value) return [];
  return String(value)
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean);
}

function blankToNull(value) {
  const s = value === null || value === undefined ? '' : String(value).trim();
  return s === '' ? null : s;
}

// Set by --dry: parse and map everything, report what would be written, but
// leave the database alone. Useful for checking a mapper against a schema
// before pushing tens of thousands of rows through it.
const DRY_RUN = process.argv.includes('--dry');

async function upsertBatch(table, rows, batchSize = 500) {
  if (DRY_RUN) {
    console.log(`  🅳  dry run: would upsert ${rows.length} rows into ${table}`);
    console.log(`      sample: ${JSON.stringify(rows[0])?.slice(0, 400)}`);
    return;
  }

  let inserted = 0;
  let failed = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase
      .from(table)
      .upsert(batch, { onConflict: 'id' });
    if (error) {
      failed += batch.length;
      console.error(
        `\n  ⚠️  Batch ${Math.floor(i / batchSize) + 1} (${batch.length} rows) failed: ${error.message}`
      );
    } else {
      inserted += batch.length;
    }
    process.stdout.write(`\r  ↳ ${inserted}/${rows.length} rows written...`);
  }
  console.log('');
  // A partial import looks like a success in the logs otherwise, and the
  // missing cards only turn up later as gaps in search.
  if (failed) {
    throw new Error(`${failed} of ${rows.length} rows failed to write into ${table}`);
  }
}

async function deleteStale(table, markerColumn) {
  if (DRY_RUN) {
    console.log(`  🅳  dry run: would delete ${table} rows with ${markerColumn} IS NULL`);
    return;
  }
  const { count, error } = await supabase
    .from(table)
    .delete({ count: 'exact' })
    .is(markerColumn, null);
  if (error) throw new Error(`Could not drop stale ${table} rows: ${error.message}`);
  if (count) console.log(`  ↳ dropped ${count} leftover rows from the old cache`);
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
// 2. Pokemon — the PokemonTCG data repository, one file per set
// ----------------------------------------------------------------
const POKEMON_REPO =
  'https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master';

function mapPokemonCard(card, set) {
  return {
    id: card.id,
    name: card.name,
    // The small art is already 245x342, the right size for search results and
    // deck lists; the hires file is ~900 KB and only worth loading on zoom.
    image_url: card.images?.small ?? '',
    image_large: card.images?.large ?? null,
    set_name: set.name ?? '',
    set_id: set.id,
    set_series: set.series ?? null,
    number: card.number ?? '',
    types: card.types ?? [],
    subtypes: card.subtypes ?? [],
    supertype: card.supertype ?? '',
    hp: blankToNull(card.hp),
    rules: card.rules ?? [],
    evolves_from: card.evolvesFrom ?? null,
    rarity: blankToNull(card.rarity),
    legalities: card.legalities ?? {},
    regulation_mark: card.regulationMark ?? null,
  };
}

async function seedPokemon() {
  console.log('\n⚡  Seeding Pokemon cards from the PokemonTCG data repo...');

  const sets = await getJson(`${POKEMON_REPO}/sets/en.json`);
  console.log(`  ${sets.length} sets to fetch`);

  const rows = [];
  const skipped = [];
  for (const [i, set] of sets.entries()) {
    const cards = await getJson(`${POKEMON_REPO}/cards/en/${set.id}.json`, {
      allow404: true,
    });
    if (!cards) {
      skipped.push(set.id);
      continue;
    }
    for (const card of cards) rows.push(mapPokemonCard(card, set));
    if ((i + 1) % 20 === 0 || i + 1 === sets.length) {
      process.stdout.write(`\r  ↳ set ${i + 1}/${sets.length} (${rows.length} cards)...`);
    }
  }
  console.log('');
  if (skipped.length) console.log(`  ℹ️  no card file for: ${skipped.join(', ')}`);

  console.log(`  Found ${rows.length} cards`);
  await upsertBatch('pokemon_cards', rows, 300);
  await deleteStale('pokemon_cards', 'set_id');
  console.log(`  ✅ Pokemon done`);
}

// ----------------------------------------------------------------
// 3. Magic: The Gathering — Scryfall bulk data
// ----------------------------------------------------------------
// oracle_cards holds one entry per distinct card rather than per printing:
// ~35,000 rows instead of ~110,000, which is what deck building is about.
// Tokens and art cards are not deck cards, so they are dropped.
const MAGIC_SKIPPED_LAYOUTS = new Set([
  'token',
  'double_faced_token',
  'emblem',
  'art_series',
]);

function mapMagicCard(card) {
  const layout = card.layout ?? '';
  if (MAGIC_SKIPPED_LAYOUTS.has(layout)) return null;

  // Split and modal cards keep mana cost, type and art on their faces, and the
  // top-level fields are absent.
  const faces = Array.isArray(card.card_faces) ? card.card_faces : [];
  const front = faces[0] ?? {};
  const images = card.image_uris ?? front.image_uris ?? {};
  const oracleText =
    card.oracle_text ??
    (faces.length
      ? faces.map((f) => f.oracle_text).filter(Boolean).join('\n//\n')
      : '');

  return {
    id: card.id,
    oracle_id: card.oracle_id ?? null,
    name: card.name,
    image_url: images.normal ?? images.small ?? images.large ?? '',
    image_large: images.large ?? images.png ?? null,
    set_name: card.set_name ?? '',
    set_code: card.set ?? null,
    collector_number: card.collector_number ?? null,
    rarity: card.rarity ?? '',
    cmc: card.cmc ?? 0,
    mana_cost: card.mana_cost ?? front.mana_cost ?? null,
    type: card.type_line ?? front.type_line ?? '',
    oracle_text: oracleText,
    colors: card.colors ?? front.colors ?? [],
    color_identity: card.color_identity ?? [],
    legalities: card.legalities ?? {},
    layout,
    keywords: card.keywords ?? [],
  };
}

async function seedMagic() {
  console.log('\n🔮  Seeding Magic cards from Scryfall bulk data...');

  const bulk = await getJson('https://api.scryfall.com/bulk-data');
  const meta = (bulk.data ?? []).find((b) => b.type === 'oracle_cards');
  if (!meta) throw new Error('Scryfall has no oracle_cards bulk file');
  console.log(
    `  ${(meta.compressed_size / 1e6).toFixed(1)} MB gzipped, updated ${meta.updated_at.slice(0, 10)}`
  );

  const res = await fetch(meta.jsonl_download_uri, {
    headers: { 'User-Agent': HEADERS['User-Agent'] },
  });
  if (!res.ok) throw new Error(`Scryfall bulk download → ${res.status}`);

  // The uncompressed file is a few hundred MB, so it is decompressed and
  // parsed a line at a time instead of being held in memory.
  const lines = createInterface({
    input: Readable.fromWeb(res.body).pipe(createGunzip()),
    crlfDelay: Infinity,
  });

  const rows = [];
  let read = 0;
  let dropped = 0;
  for await (const line of lines) {
    if (!line.trim()) continue;
    read += 1;
    const row = mapMagicCard(JSON.parse(line));
    if (row) rows.push(row);
    else dropped += 1;
    if (read % 5000 === 0) process.stdout.write(`\r  ↳ parsed ${read} entries...`);
  }
  console.log(`\r  ↳ parsed ${read} entries, dropped ${dropped} tokens/art cards`);

  console.log(`  Found ${rows.length} cards`);
  await upsertBatch('magic_cards', rows, 250);
  // The old Python cache stored printing IDs that are not in oracle_cards, so
  // they survive an upsert. They have no oracle_id; the new rows always do.
  await deleteStale('magic_cards', 'oracle_id');
  console.log(`  ✅ Magic done`);
}

// ----------------------------------------------------------------
// 4. One Piece — dotgg
// ----------------------------------------------------------------
// The only open source for the full catalogue. It returns a column list plus
// rows of values rather than objects, and it carries no legality data, so the
// restricted list lives in ban_status and is maintained by hand.
const ONEPIECE_URL =
  'https://api.dotgg.gg/cgfw/getcards?game=onepiece&mode=indexed';

function mapOnePieceCard(get) {
  const id = get('id');
  return {
    id,
    name: get('name'),
    image_url: `https://static.dotgg.gg/onepiece/card/${id}.webp`,
    set_name: get('CardSets') ?? '',
    set_code: get('set'),
    rarity: get('rarity') ?? '',
    card_type: get('cardType'),
    // "Type" upstream is the traits line, e.g. "The Four Emperors/Whitebeard
    // Pirates" — not the kind of card, which is cardType.
    type: get('Type') ?? '',
    text: get('Effect') ?? '',
    color: get('Color') ?? '',
    colors: splitList(get('Color')),
    attribute: splitList(get('Attribute')).join('/') || null,
    cost: get('Cost') ?? '',
    power: get('Power') ?? '',
    counter: get('Counter') ?? '',
    life: get('Life'),
    trigger: get('Trigger'),
  };
}

async function seedOnePiece() {
  console.log('\n☠️   Seeding One Piece cards from dotgg...');

  const payload = await getJson(ONEPIECE_URL);
  const names = payload.names ?? [];
  const index = new Map(names.map((n, i) => [n, i]));
  const at = (row, name) => blankToNull(row[index.get(name)]);

  const rows = (payload.data ?? [])
    // Japanese rows duplicate every card, and each card also repeats once per
    // alternate art (id "OP06-081_p1" against id_normal "OP06-081"). A deck
    // holds cards, not printings, so only the base English row is kept.
    .filter(
      (row) =>
        at(row, 'language') === 'en' &&
        at(row, 'id') === at(row, 'id_normal')
    )
    .map((row) => mapOnePieceCard((name) => at(row, name)));

  console.log(`  Found ${rows.length} cards`);
  await upsertBatch('onepiece_cards', rows, 300);
  await deleteStale('onepiece_cards', 'card_type');
  console.log(`  ✅ One Piece done`);
}

// ----------------------------------------------------------------
// Main
// ----------------------------------------------------------------
(async () => {
  console.log('🚀  PlayTCG — Card DB Seed Script');
  console.log(`    Supabase: ${SUPABASE_URL}`);

  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const runAll = args.length === 0;
  const games = runAll
    ? ['yugioh', 'pokemon', 'magic', 'onepiece']
    : args;
  if (DRY_RUN) console.log('    Mode: dry run, nothing will be written');

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
