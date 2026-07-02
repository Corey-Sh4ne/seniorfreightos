ALTER TABLE projects ADD COLUMN IF NOT EXISTS invoice_number text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS invoice_generated_at timestamptz;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS invoice_status text
  CHECK (invoice_status IN ('draft', 'sent', 'paid')) DEFAULT NULL;
