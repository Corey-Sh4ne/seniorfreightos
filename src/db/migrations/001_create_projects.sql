-- Migration: 001_create_projects
-- Creates the projects table matching the Project typedef in src/models/Project.js

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS projects (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code             TEXT        NOT NULL UNIQUE,
  client_name      TEXT        NOT NULL,
  facility_name    TEXT        NOT NULL,
  facility_address TEXT        NOT NULL,
  contact_name     TEXT        NOT NULL,
  contact_email    TEXT        NOT NULL,
  miles_from_hub   NUMERIC     NOT NULL DEFAULT 0,
  status           TEXT        NOT NULL DEFAULT 'prospect'
                               CHECK (status IN (
                                 'prospect','quoted','awarded','receiving',
                                 'staging','scheduled','installing','complete','invoiced'
                               )),
  storage_days     INTEGER     NOT NULL DEFAULT 0,
  rush_delivery    BOOLEAN     NOT NULL DEFAULT FALSE,
  rates            JSONB       NOT NULL DEFAULT '{}',
  notes            TEXT        NOT NULL DEFAULT '',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_client_name ON projects (client_name);
CREATE INDEX IF NOT EXISTS idx_projects_status      ON projects (status);
