-- ============================================================
-- PlayTCG.online — Card database tables
-- Run this in the Supabase SQL Editor to create all card tables
-- ============================================================

-- -------------------------------------------------------
-- 1. Yu-Gi-Oh! cards
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS yugioh_cards (
  id          TEXT PRIMARY KEY,
  name_en     TEXT NOT NULL,
  name_it     TEXT,
  image_url   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS yugioh_name_en_idx ON yugioh_cards (name_en);
CREATE INDEX IF NOT EXISTS yugioh_name_it_idx ON yugioh_cards (name_it);

-- -------------------------------------------------------
-- 2. Pokemon cards
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS pokemon_cards (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  image_url   TEXT,
  set_name    TEXT,
  number      TEXT,
  types       TEXT[],
  supertype   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pokemon_name_idx ON pokemon_cards (name);

-- -------------------------------------------------------
-- 3. Magic: The Gathering cards
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS magic_cards (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  image_url   TEXT,
  set_name    TEXT,
  rarity      TEXT,
  cmc         NUMERIC,
  type        TEXT,
  oracle_text TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS magic_name_idx ON magic_cards (name);

-- -------------------------------------------------------
-- 4. One Piece cards
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS onepiece_cards (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  image_url   TEXT,
  set_name    TEXT,
  rarity      TEXT,
  type        TEXT,
  text        TEXT,
  color       TEXT,
  cost        TEXT,
  power       TEXT,
  counter     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS onepiece_name_idx ON onepiece_cards (name);

-- -------------------------------------------------------
-- Row Level Security
-- Allow anonymous reads (card search from the frontend)
-- Allow service role writes (seeding + caching new cards)
-- -------------------------------------------------------
ALTER TABLE yugioh_cards  ENABLE ROW LEVEL SECURITY;
ALTER TABLE pokemon_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE magic_cards   ENABLE ROW LEVEL SECURITY;
ALTER TABLE onepiece_cards ENABLE ROW LEVEL SECURITY;

-- Anon SELECT
CREATE POLICY "anon can read yugioh"   ON yugioh_cards   FOR SELECT TO anon USING (true);
CREATE POLICY "anon can read pokemon"  ON pokemon_cards  FOR SELECT TO anon USING (true);
CREATE POLICY "anon can read magic"    ON magic_cards    FOR SELECT TO anon USING (true);
CREATE POLICY "anon can read onepiece" ON onepiece_cards FOR SELECT TO anon USING (true);

-- Service role INSERT/UPDATE (upsert from seed script + runtime caching)
CREATE POLICY "service can write yugioh"   ON yugioh_cards   FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service can write pokemon"  ON pokemon_cards  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service can write magic"    ON magic_cards    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service can write onepiece" ON onepiece_cards FOR ALL TO service_role USING (true) WITH CHECK (true);
