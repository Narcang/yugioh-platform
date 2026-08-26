-- ============================================================
-- PlayTCG.online — Metadata for Pokemon, Magic and One Piece
--
-- Migration 003 gave Yu-Gi-Oh the columns its deck builder needs. This does
-- the same for the other three games, so their builders can check format
-- legality instead of just counting cards.
--
-- Each game reports legality differently (Magic has ~20 formats, Pokemon has
-- three, One Piece publishes no machine-readable list at all), so legality
-- lives in a JSONB column per card rather than a fixed set of columns.
-- ============================================================

-- Card search is ILIKE '%name%'. That is a sequential scan without trigram
-- indexes, which was survivable on 574 Magic cards and is not on 35,000.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- -------------------------------------------------------
-- Pokemon
-- -------------------------------------------------------
ALTER TABLE pokemon_cards
  ADD COLUMN IF NOT EXISTS subtypes        TEXT[],
  ADD COLUMN IF NOT EXISTS hp              TEXT,
  -- Copy limits hide in the rules text: ACE SPEC and Radiant cards are
  -- one-per-deck, and they announce it there rather than in a flag.
  ADD COLUMN IF NOT EXISTS rules           TEXT[],
  ADD COLUMN IF NOT EXISTS evolves_from    TEXT,
  ADD COLUMN IF NOT EXISTS set_id          TEXT,
  ADD COLUMN IF NOT EXISTS set_series      TEXT,
  ADD COLUMN IF NOT EXISTS rarity          TEXT,
  ADD COLUMN IF NOT EXISTS image_large     TEXT,
  ADD COLUMN IF NOT EXISTS legalities      JSONB,
  -- Standard rotates by regulation mark, so the mark decides legality for
  -- future seasons without us re-importing every card.
  ADD COLUMN IF NOT EXISTS regulation_mark TEXT;

-- -------------------------------------------------------
-- Magic: The Gathering
-- -------------------------------------------------------
ALTER TABLE magic_cards
  -- Two printings of the same card share an oracle_id, and the four-copy and
  -- singleton rules are about the card, not the printing.
  ADD COLUMN IF NOT EXISTS oracle_id        TEXT,
  ADD COLUMN IF NOT EXISTS mana_cost        TEXT,
  ADD COLUMN IF NOT EXISTS colors           TEXT[],
  -- Commander decks are constrained by colour identity, not by colours.
  ADD COLUMN IF NOT EXISTS color_identity   TEXT[],
  ADD COLUMN IF NOT EXISTS legalities       JSONB,
  ADD COLUMN IF NOT EXISTS layout           TEXT,
  ADD COLUMN IF NOT EXISTS set_code         TEXT,
  ADD COLUMN IF NOT EXISTS collector_number TEXT,
  ADD COLUMN IF NOT EXISTS image_large      TEXT,
  ADD COLUMN IF NOT EXISTS keywords         TEXT[];

CREATE INDEX IF NOT EXISTS magic_oracle_id_idx ON magic_cards (oracle_id);

-- -------------------------------------------------------
-- One Piece
-- -------------------------------------------------------
ALTER TABLE onepiece_cards
  -- The existing "type" column holds the traits (e.g. "Straw Hat Crew").
  -- This is the card kind: LEADER, CHARACTER, EVENT, STAGE or DON.
  ADD COLUMN IF NOT EXISTS card_type  TEXT,
  -- Multicolour cards arrive as "Red/Green" upstream; split so a deck can be
  -- checked against its leader's colours with an array overlap.
  ADD COLUMN IF NOT EXISTS colors     TEXT[],
  ADD COLUMN IF NOT EXISTS attribute  TEXT,
  ADD COLUMN IF NOT EXISTS life       TEXT,
  ADD COLUMN IF NOT EXISTS trigger    TEXT,
  ADD COLUMN IF NOT EXISTS set_code   TEXT,
  -- No upstream source publishes this, so it is maintained by hand.
  ADD COLUMN IF NOT EXISTS ban_status TEXT;

CREATE INDEX IF NOT EXISTS onepiece_card_type_idx ON onepiece_cards (card_type);

-- -------------------------------------------------------
-- Name search
-- -------------------------------------------------------
CREATE INDEX IF NOT EXISTS yugioh_name_en_trgm_idx   ON yugioh_cards   USING gin (name_en gin_trgm_ops);
CREATE INDEX IF NOT EXISTS yugioh_name_it_trgm_idx   ON yugioh_cards   USING gin (name_it gin_trgm_ops);
CREATE INDEX IF NOT EXISTS pokemon_name_trgm_idx     ON pokemon_cards  USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS magic_name_trgm_idx       ON magic_cards    USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS onepiece_name_trgm_idx    ON onepiece_cards USING gin (name gin_trgm_ops);
