-- ============================================================
-- PlayTCG.online — Riftbound card catalogue
--
-- RiftScribe is the only open source for the full list. Riot's own API
-- needs an app review and a licence, which the builder does not need.
-- Ban status is stored on the row because RiftScribe's is_banned flag
-- is currently always false.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS riftbound_cards (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  image_url         TEXT,
  image_large       TEXT,
  set_code          TEXT,
  collector_number  TEXT,
  rarity            TEXT,
  card_type         TEXT,
  faction           TEXT,
  domains           TEXT[],
  energy            INTEGER,
  might             INTEGER,
  power             INTEGER,
  keywords          TEXT[],
  ban_status        TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS riftbound_name_idx ON riftbound_cards (name);
CREATE INDEX IF NOT EXISTS riftbound_type_idx ON riftbound_cards (card_type);
CREATE INDEX IF NOT EXISTS riftbound_name_trgm_idx ON riftbound_cards USING gin (name gin_trgm_ops);

ALTER TABLE riftbound_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read riftbound" ON riftbound_cards
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "service can write riftbound" ON riftbound_cards
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT SELECT ON riftbound_cards TO anon, authenticated;
GRANT ALL ON riftbound_cards TO service_role;
