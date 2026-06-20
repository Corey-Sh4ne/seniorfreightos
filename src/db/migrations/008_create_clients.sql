-- Migration: 008_create_clients
-- First-class client records with optional rate card and Clerk portal linkage.

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  contact_name text NOT NULL DEFAULT '',
  contact_email text NOT NULL DEFAULT '',
  contact_phone text NOT NULL DEFAULT '',
  clerk_user_id text,
  rate_card_id uuid REFERENCES rate_cards(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

INSERT INTO clients (name) VALUES
  ('Brookdale Senior Living'),
  ('Sunrise Senior Living'),
  ('Direct Supply')
ON CONFLICT (name) DO NOTHING;
