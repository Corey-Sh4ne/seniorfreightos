-- Migration: 003_create_install_tasks
-- Creates the install_tasks table matching the InstallTask typedef in src/models/InstallTask.js

CREATE TABLE IF NOT EXISTS install_tasks (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID    NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  type       TEXT    NOT NULL
                     CHECK (type IN (
                       'assemble','hang_art','mount_tv','place','debris','window_treat'
                     )),
  qty        INTEGER NOT NULL DEFAULT 1,
  notes      TEXT    NOT NULL DEFAULT '',
  completed  BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_install_tasks_project_id ON install_tasks (project_id);
