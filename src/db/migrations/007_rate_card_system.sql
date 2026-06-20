-- Migration: 007_rate_card_system
-- Reworks rate_cards to support multiple NAMED rate cards and adds a join table
-- mapping client companies to a rate card. The original rate_cards table (see
-- src/db/seeds/defaultRateCard.js) had no name/is_default columns and held a
-- single anonymous row, so a `name` column is required for the new UI which
-- lists and orders cards by name.

-- 1. Named rate cards -------------------------------------------------------
ALTER TABLE rate_cards
  ADD COLUMN IF NOT EXISTS name       TEXT        NOT NULL DEFAULT 'Default Rate Card',
  ADD COLUMN IF NOT EXISTS is_default BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Promote the pre-existing single rate card to the default. Idempotent: only
-- runs while no default has been set yet, picking the earliest-created row.
UPDATE rate_cards
   SET is_default = TRUE,
       name       = 'Default Rate Card'
 WHERE id = (SELECT id FROM rate_cards ORDER BY id LIMIT 1)
   AND NOT EXISTS (SELECT 1 FROM rate_cards WHERE is_default = TRUE);

-- Guarantee at most one default rate card.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_rate_cards_default
  ON rate_cards (is_default) WHERE is_default;

-- 2. Per-client rate card assignments --------------------------------------
CREATE TABLE IF NOT EXISTS client_rate_assignments (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name  TEXT        NOT NULL UNIQUE,
  rate_card_id UUID        REFERENCES rate_cards (id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_rate_assignments_rate_card_id
  ON client_rate_assignments (rate_card_id);
