-- ============================================================
-- PlayTCG.online — Yu-Gi-Oh! card metadata for deck building
-- Run this in the Supabase SQL Editor, then re-run:
--   node scripts/seed-cards.mjs yugioh
-- ============================================================

-- -------------------------------------------------------
-- 1. Metadata needed to build and validate a deck
--    Every field below already comes back from the YGOPRODeck
--    call the seed script makes; it simply used to discard them.
-- -------------------------------------------------------
ALTER TABLE yugioh_cards
  ADD COLUMN IF NOT EXISTS type       TEXT,      -- "Effect Monster", "Spell Card", "Link Monster"...
  ADD COLUMN IF NOT EXISTS frame_type TEXT,      -- normal | effect | fusion | synchro | xyz | link | spell | trap | ...
  ADD COLUMN IF NOT EXISTS race       TEXT,      -- monster race, or Spell/Trap subtype (Continuous, Quick-Play...)
  ADD COLUMN IF NOT EXISTS attribute  TEXT,
  ADD COLUMN IF NOT EXISTS level      SMALLINT,  -- level / rank, and link rating for Link monsters
  ADD COLUMN IF NOT EXISTS atk        INTEGER,
  ADD COLUMN IF NOT EXISTS def        INTEGER,
  ADD COLUMN IF NOT EXISTS archetype  TEXT,
  ADD COLUMN IF NOT EXISTS desc_en    TEXT,
  ADD COLUMN IF NOT EXISTS desc_it    TEXT,
  ADD COLUMN IF NOT EXISTS ban_tcg    TEXT,      -- Banned | Limited | Semi-Limited | NULL (unlimited)
  ADD COLUMN IF NOT EXISTS ban_ocg    TEXT;

-- -------------------------------------------------------
-- 2. Main deck vs Extra deck
--    Derived once here instead of being re-implemented in every
--    query and in the client. Pendulum variants matter: an
--    "effect_pendulum" monster belongs to the Main deck while a
--    "fusion_pendulum" belongs to the Extra deck, so the check is
--    by prefix rather than by exact frame type.
-- -------------------------------------------------------
ALTER TABLE yugioh_cards
  ADD COLUMN IF NOT EXISTS is_extra_deck BOOLEAN
  GENERATED ALWAYS AS (
    frame_type LIKE 'fusion%'
    OR frame_type LIKE 'synchro%'
    OR frame_type LIKE 'xyz%'
    OR frame_type LIKE 'link%'
  ) STORED;

-- Tokens and Speed Duel skill cards are never part of a constructed
-- deck, so the deck builder filters them out of search results.
CREATE INDEX IF NOT EXISTS yugioh_frame_type_idx ON yugioh_cards (frame_type);
CREATE INDEX IF NOT EXISTS yugioh_archetype_idx  ON yugioh_cards (archetype);

-- -------------------------------------------------------
-- 3. Fix Row Level Security
--    The original policies were granted TO anon only. A signed-in
--    user acts as `authenticated`, so they could not read the card
--    tables at all. It went unnoticed because every search goes
--    through the API route with the anon key, but the deck builder
--    loads a saved deck's cards straight from the browser.
-- -------------------------------------------------------
DROP POLICY IF EXISTS "anon can read yugioh"   ON yugioh_cards;
DROP POLICY IF EXISTS "anon can read pokemon"  ON pokemon_cards;
DROP POLICY IF EXISTS "anon can read magic"    ON magic_cards;
DROP POLICY IF EXISTS "anon can read onepiece" ON onepiece_cards;

DROP POLICY IF EXISTS "read yugioh"   ON yugioh_cards;
DROP POLICY IF EXISTS "read pokemon"  ON pokemon_cards;
DROP POLICY IF EXISTS "read magic"    ON magic_cards;
DROP POLICY IF EXISTS "read onepiece" ON onepiece_cards;

CREATE POLICY "read yugioh"   ON yugioh_cards   FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "read pokemon"  ON pokemon_cards  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "read magic"    ON magic_cards    FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "read onepiece" ON onepiece_cards FOR SELECT TO anon, authenticated USING (true);
