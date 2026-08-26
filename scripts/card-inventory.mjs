/**
 * Reports how many cards each game actually has, in the local JSON caches and
 * in Supabase, so we know what still needs importing.
 *
 *   node scripts/card-inventory.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DB_DIR = join(ROOT, '..', 'backend', 'python_server', 'data', 'db');

// The seed script expects these exported; read .env.local the same way Next does.
const envPath = join(ROOT, '.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
console.log('env: url', url ? 'set' : 'MISSING', '| service key',
  process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'missing',
  '| anon key', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'missing');

const GAMES = [
  ['yugioh', 'yugioh_cards', null],
  ['pokemon', 'pokemon_cards', 'pokemon_db.json'],
  ['magic', 'magic_cards', 'magic_db.json'],
  ['onepiece', 'onepiece_cards', 'onepiece_db.json'],
  ['riftbound', 'riftbound_cards', null],
  ['dragonball', 'dragonball_cards', null],
];

const supabase = url && key ? createClient(url, key) : null;

for (const [game, table, file] of GAMES) {
  let local = '-';
  if (file) {
    const p = join(DB_DIR, file);
    local = existsSync(p) ? Object.keys(JSON.parse(readFileSync(p, 'utf8'))).length : 'no file';
  }

  let remote = 'n/a';
  if (supabase) {
    const { count, error } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true });
    remote = error ? `ERR ${error.message}` : count;
  }

  console.log(`${game.padEnd(9)} local json: ${String(local).padStart(7)}   supabase: ${remote}`);
}
