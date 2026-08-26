/**
 * Reports which migrations have landed, by asking for one column each.
 *   node scripts/check-schema.mjs
 */
import { createClient } from '@supabase/supabase-js';

try {
  process.loadEnvFile(new URL('../.env.local', import.meta.url));
} catch {}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CHECKS = [
  ['003', 'yugioh_cards', 'frame_type, is_extra_deck, ban_tcg'],
  ['004', 'decks', 'id, owner_id, format'],
  ['005', 'pokemon_cards', 'legalities, regulation_mark, subtypes'],
  ['005', 'magic_cards', 'oracle_id, legalities, color_identity'],
  ['005', 'onepiece_cards', 'card_type, colors, ban_status'],
];

for (const [migration, table, columns] of CHECKS) {
  const { error } = await supabase.from(table).select(columns).limit(1);
  const state = error ? `MISSING (${error.message.slice(0, 60)})` : 'present';
  console.log(`${migration}  ${table.padEnd(16)} ${state}`);
}
