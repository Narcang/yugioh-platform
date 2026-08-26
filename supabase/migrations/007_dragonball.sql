-- ============================================================
-- PlayTCG.online — Dragon Ball Super Card Game Fusion World
--
-- The game type in the app is still "Dragon Ball". Fusion World is the
-- current Bandai game; the older Masters CCG is not imported here.
-- Deckplanet publishes the full list without a key. Official Bandai
-- images are stored from the card number (FB01-001_f.webp).
-- Ban/restricted flags come from the catalogue (March 2026 list).
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS dragonball_cards (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  image_url         TEXT,
  image_large       TEXT,
  set_code          TEXT,
  rarity            TEXT,
  card_type         TEXT,
  color             TEXT,
  colors            TEXT[],
  cost              INTEGER,
  power             TEXT,
  combo_power       TEXT,
  traits            TEXT[],
  ban_status        TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS dragonball_name_idx ON dragonball_cards (name);
CREATE INDEX IF NOT EXISTS dragonball_type_idx ON dragonball_cards (card_type);
CREATE INDEX IF NOT EXISTS dragonball_name_trgm_idx ON dragonball_cards USING gin (name gin_trgm_ops);

ALTER TABLE dragonball_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read dragonball" ON dragonball_cards
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "service can write dragonball" ON dragonball_cards
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT SELECT ON dragonball_cards TO anon, authenticated;
GRANT ALL ON dragonball_cards TO service_role;
