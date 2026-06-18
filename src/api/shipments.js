/**
 * Shipments API — CRUD scoped to a parent project.
 * Mount at: /api/projects/:projectId/shipments
 * Router must be created with mergeParams: true so :projectId is accessible.
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import { SHIPMENT_CATEGORIES } from '../models/Shipment.js';
import db from '../db/index.js';

const router = Router({ mergeParams: true });

const OPS        = ['admin', 'dispatcher'];
const READ_STAFF = ['admin', 'dispatcher', 'install_crew_lead'];

// GET /api/projects/:projectId/shipments
router.get(
  '/',
  authenticate,
  roleGuard(READ_STAFF),
  async (req, res) => {
    try {
      const { rows } = await db.query(
        'SELECT * FROM shipments WHERE project_id = $1 ORDER BY eta ASC',
        [req.params.projectId],
      );
      return res.json(rows);
    } catch {
      return res.status(500).json({ error: 'Failed to fetch shipments.' });
    }
  },
);

// POST /api/projects/:projectId/shipments
router.post(
  '/',
  authenticate,
  roleGuard(OPS),
  async (req, res) => {
    try {
      const {
        vendor, category, description,
        qty, weightPerUnitLbs, cartons, eta,
      } = req.body;

      if (!SHIPMENT_CATEGORIES.includes(category)) {
        return res.status(400).json({
          error: `Invalid category. Must be one of: ${SHIPMENT_CATEGORIES.join(', ')}.`,
        });
      }

      if (!weightPerUnitLbs || weightPerUnitLbs <= 0) {
        return res.status(400).json({ error: 'weightPerUnitLbs is required and must be > 0.' });
      }

      const { rows } = await db.query(
        `INSERT INTO shipments
           (project_id, vendor, category, description,
            qty, weight_per_unit_lbs, cartons, eta, received)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,false)
         RETURNING *`,
        [
          req.params.projectId, vendor, category, description,
          qty, weightPerUnitLbs, cartons, eta ?? null,
        ],
      );
      return res.status(201).json(rows[0]);
    } catch {
      return res.status(500).json({ error: 'Failed to create shipment.' });
    }
  },
);

// GET /api/projects/:projectId/shipments/:id
router.get(
  '/:id',
  authenticate,
  roleGuard(READ_STAFF),
  async (req, res) => {
    try {
      const { rows } = await db.query(
        'SELECT * FROM shipments WHERE id = $1 AND project_id = $2',
        [req.params.id, req.params.projectId],
      );
      if (!rows.length) return res.status(404).json({ error: 'Shipment not found.' });
      return res.json(rows[0]);
    } catch {
      return res.status(500).json({ error: 'Failed to fetch shipment.' });
    }
  },
);

// PUT /api/projects/:projectId/shipments/:id
router.put(
  '/:id',
  authenticate,
  roleGuard(OPS),
  async (req, res) => {
    try {
      const {
        vendor, category, description,
        qty, weightPerUnitLbs, cartons, eta, received,
      } = req.body;

      if (category && !SHIPMENT_CATEGORIES.includes(category)) {
        return res.status(400).json({
          error: `Invalid category. Must be one of: ${SHIPMENT_CATEGORIES.join(', ')}.`,
        });
      }

      const { rows } = await db.query(
        `UPDATE shipments
            SET vendor = $1, category = $2, description = $3,
                qty = $4, weight_per_unit_lbs = $5, cartons = $6,
                eta = $7, received = $8
          WHERE id = $9 AND project_id = $10
          RETURNING *`,
        [
          vendor, category, description,
          qty, weightPerUnitLbs, cartons,
          eta ?? null, received ?? false,
          req.params.id, req.params.projectId,
        ],
      );
      if (!rows.length) return res.status(404).json({ error: 'Shipment not found.' });
      return res.json(rows[0]);
    } catch {
      return res.status(500).json({ error: 'Failed to update shipment.' });
    }
  },
);

// DELETE /api/projects/:projectId/shipments/:id
router.delete(
  '/:id',
  authenticate,
  roleGuard(['admin']),
  async (req, res) => {
    try {
      const { rowCount } = await db.query(
        'DELETE FROM shipments WHERE id = $1 AND project_id = $2',
        [req.params.id, req.params.projectId],
      );
      if (!rowCount) return res.status(404).json({ error: 'Shipment not found.' });
      return res.status(204).end();
    } catch {
      return res.status(500).json({ error: 'Failed to delete shipment.' });
    }
  },
);

export default router;
