-- Migration: 002_create_shipments
-- Creates the shipments table matching the Shipment typedef in src/models/Shipment.js

CREATE TABLE IF NOT EXISTS shipments (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID        NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  vendor              TEXT        NOT NULL,
  category            TEXT        NOT NULL
                                  CHECK (category IN (
                                    'Casegoods','Seating','Mattresses & Bedding',
                                    'Window Treatments','Art & Decor','Lighting',
                                    'Signage','Appliances','Flooring',
                                    'Outdoor Furniture','Fitness Equipment'
                                  )),
  description         TEXT        NOT NULL DEFAULT '',
  qty                 INTEGER     NOT NULL DEFAULT 1,
  weight_per_unit_lbs NUMERIC     NOT NULL DEFAULT 0,
  cartons             INTEGER     NOT NULL DEFAULT 0,
  eta                 DATE,
  received            BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_shipments_project_id ON shipments (project_id);
