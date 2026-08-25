import { createClient } from '@supabase/supabase-js';

/**
 * Anonymous read-only client for server components.
 *
 * Separate from the browser client because that one persists a session in
 * localStorage, which does not exist on the server. This client carries no
 * user, so it only ever sees what RLS exposes to `anon` — public decks and
 * card data.
 */
export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder',
  {
    auth: { persistSession: false, autoRefreshToken: false },
  }
);
