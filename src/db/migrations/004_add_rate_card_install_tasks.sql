-- Migration: 004_add_rate_card_install_tasks
-- Adds install_task_rates JSONB column to rate_cards so per-task labor
-- rate overrides can be stored alongside the core freight/overhead rates.

ALTER TABLE rate_cards
  ADD COLUMN IF NOT EXISTS install_task_rates JSONB NOT NULL DEFAULT '{}';
