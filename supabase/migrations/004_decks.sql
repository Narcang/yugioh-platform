-- ============================================================
-- PlayTCG.online — Deck builder
-- Run this in the Supabase SQL Editor after 003_yugioh_card_metadata.sql
-- ============================================================

-- -------------------------------------------------------
-- 1. Decks
--    is_legal caches the result of the rules engine so the
--    explore page can show badges without loading the cards of
--    every deck it lists.
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS decks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  game_type     TEXT NOT NULL,
  format        TEXT NOT NULL,
  name          TEXT NOT NULL,
  description   TEXT,
  is_public     BOOLEAN NOT NULL DEFAULT FALSE,
  is_legal      BOOLEAN NOT NULL DEFAULT FALSE,
  cover_card_id TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS decks_owner_idx  ON decks (owner_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS decks_public_idx ON decks (game_type, updated_at DESC) WHERE is_public;

-- -------------------------------------------------------
-- 2. Deck contents
--    A relational table rather than a JSONB blob: "which decks
--    play this card" is then an index lookup instead of a scan
--    over every deck.
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS deck_cards (
  deck_id   UUID NOT NULL REFERENCES decks (id) ON DELETE CASCADE,
  card_id   TEXT NOT NULL,
  section   TEXT NOT NULL CHECK (section IN ('main', 'extra', 'side')),
  quantity  SMALLINT NOT NULL CHECK (quantity > 0 AND quantity <= 99),
  PRIMARY KEY (deck_id, card_id, section)
);

CREATE INDEX IF NOT EXISTS deck_cards_card_idx ON deck_cards (card_id);

-- -------------------------------------------------------
-- 3. updated_at
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION touch_deck_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS decks_touch_updated_at ON decks;
CREATE TRIGGER decks_touch_updated_at
  BEFORE UPDATE ON decks
  FOR EACH ROW EXECUTE FUNCTION touch_deck_updated_at();

-- -------------------------------------------------------
-- 4. Row Level Security
--    Readable if public or yours; writable only if yours.
-- -------------------------------------------------------
ALTER TABLE decks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE deck_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read decks"   ON decks;
DROP POLICY IF EXISTS "insert decks" ON decks;
DROP POLICY IF EXISTS "update decks" ON decks;
DROP POLICY IF EXISTS "delete decks" ON decks;

CREATE POLICY "read decks" ON decks FOR SELECT TO anon, authenticated
  USING (is_public OR owner_id = auth.uid());

CREATE POLICY "insert decks" ON decks FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "update decks" ON decks FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "delete decks" ON decks FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "read deck cards"  ON deck_cards;
DROP POLICY IF EXISTS "write deck cards" ON deck_cards;

CREATE POLICY "read deck cards" ON deck_cards FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM decks d
    WHERE d.id = deck_cards.deck_id
      AND (d.is_public OR d.owner_id = auth.uid())
  ));

CREATE POLICY "write deck cards" ON deck_cards FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM decks d WHERE d.id = deck_cards.deck_id AND d.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM decks d WHERE d.id = deck_cards.deck_id AND d.owner_id = auth.uid()
  ));

-- -------------------------------------------------------
-- 5. Atomic save
--    The Supabase client cannot run a multi-statement
--    transaction, so replacing a deck's contents from the browser
--    would leave the deck empty if the insert failed after the
--    delete. One function, one transaction.
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION save_deck(
  p_deck_id  UUID,
  p_cards    JSONB,
  p_is_legal BOOLEAN DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_owner UUID;
BEGIN
  SELECT owner_id INTO v_owner FROM decks WHERE id = p_deck_id;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Deck not found';
  END IF;

  IF v_owner <> auth.uid() THEN
    RAISE EXCEPTION 'Not your deck';
  END IF;

  DELETE FROM deck_cards WHERE deck_id = p_deck_id;

  INSERT INTO deck_cards (deck_id, card_id, section, quantity)
  SELECT
    p_deck_id,
    c ->> 'card_id',
    c ->> 'section',
    (c ->> 'quantity')::SMALLINT
  FROM jsonb_array_elements(COALESCE(p_cards, '[]'::jsonb)) AS c;

  UPDATE decks
  SET is_legal = COALESCE(p_is_legal, is_legal)
  WHERE id = p_deck_id;
END;
$$;

-- SECURITY INVOKER (the default) keeps RLS in force inside the
-- function, so the ownership check above is a clearer error rather
-- than the only line of defence.
GRANT EXECUTE ON FUNCTION save_deck(UUID, JSONB, BOOLEAN) TO authenticated;

-- -------------------------------------------------------
-- 6. Explore feed
--    Public decks need the author's name, but opening up the whole
--    profiles table to anonymous readers to get one column is too
--    much. This view exposes exactly the projection the explore
--    page needs and nothing else, and its WHERE clause makes
--    private decks unreachable through it.
-- -------------------------------------------------------
CREATE OR REPLACE VIEW public_decks AS
SELECT
  d.id,
  d.game_type,
  d.format,
  d.name,
  d.description,
  d.is_legal,
  d.cover_card_id,
  d.updated_at,
  d.owner_id,
  p.username AS owner_username,
  (SELECT COALESCE(SUM(dc.quantity), 0)
     FROM deck_cards dc
    WHERE dc.deck_id = d.id AND dc.section = 'main') AS main_count
FROM decks d
LEFT JOIN profiles p ON p.id = d.owner_id
WHERE d.is_public;

GRANT SELECT ON public_decks TO anon, authenticated;
