-- Migration: 006_add_quote_columns
-- Adds the columns needed for the quote flow that connects the admin Pricing
-- Quote tab to the client portal:
--   quoted_price — the itemized quote breakdown snapshot saved at send time
--   accepted_at  — when the client accepted the quote (status -> awarded)
-- Also extends the status CHECK constraint to permit the new 'denied' status,
-- which a client sets when rejecting a quote. Without this, denyQuote() would
-- violate the constraint added in 005_add_delivered_project_status.

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS quoted_price JSONB,
  ADD COLUMN IF NOT EXISTS accepted_at  TIMESTAMPTZ;

ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;

ALTER TABLE projects
  ADD CONSTRAINT projects_status_check
  CHECK (status IN (
    'prospect','quoted','denied','awarded','receiving','staging',
    'scheduled','delivered','installing','complete','invoiced'
  ));
