/**
 * Projects API — full CRUD + status transitions.
 * Mount at: /api/projects
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import { isValidTransition, PIPELINE_STATUSES } from '../utils/statusPipeline.js';
import db from '../db/index.js';

const router = Router();

const STAFF = ['admin', 'dispatcher', 'install_crew_lead'];
const OPS   = ['admin', 'dispatcher'];

// GET /api/projects
router.get(
  '/',
  authenticate,
  roleGuard(STAFF),
  async (req, res) => {
    try {
      const { rows } = await db.query(
        'SELECT * FROM projects ORDER BY created_at DESC',
      );
      return res.json(rows);
    } catch {
      return res.status(500).json({ error: 'Failed to fetch projects.' });
    }
  },
);

// POST /api/projects
router.post(
  '/',
  authenticate,
  roleGuard(['admin']),
  async (req, res) => {
    try {
      const {
        code, clientName, facilityName, facilityAddress,
        contactName, contactEmail, milesFromHub,
        storageDays, rushDelivery, rates, notes,
      } = req.body;

      const { rows } = await db.query(
        `INSERT INTO projects
           (code, client_name, facility_name, facility_address, contact_name,
            contact_email, miles_from_hub, status, storage_days,
            rush_delivery, rates, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         RETURNING *`,
        [
          code, clientName, facilityName, facilityAddress,
          contactName, contactEmail, milesFromHub,
          PIPELINE_STATUSES[0],
          storageDays, rushDelivery, rates ?? null, notes ?? null,
        ],
      );
      return res.status(201).json(rows[0]);
    } catch {
      return res.status(500).json({ error: 'Failed to create project.' });
    }
  },
);

// GET /api/projects/:id
router.get(
  '/:id',
  authenticate,
  roleGuard(STAFF),
  async (req, res) => {
    try {
      const { rows } = await db.query(
        'SELECT * FROM projects WHERE id = $1',
        [req.params.id],
      );
      if (!rows.length) return res.status(404).json({ error: 'Project not found.' });
      return res.json(rows[0]);
    } catch {
      return res.status(500).json({ error: 'Failed to fetch project.' });
    }
  },
);

// PUT /api/projects/:id  (update non-status fields; use PATCH /status for transitions)
router.put(
  '/:id',
  authenticate,
  roleGuard(OPS),
  async (req, res) => {
    try {
      const {
        code, clientName, facilityName, facilityAddress,
        contactName, contactEmail, milesFromHub,
        storageDays, rushDelivery, rates, notes,
      } = req.body;

      const { rows } = await db.query(
        `UPDATE projects
            SET code = $1, client_name = $2, facility_name = $3,
                facility_address = $4, contact_name = $5, contact_email = $6,
                miles_from_hub = $7, storage_days = $8, rush_delivery = $9,
                rates = $10, notes = $11, updated_at = NOW()
          WHERE id = $12
          RETURNING *`,
        [
          code, clientName, facilityName, facilityAddress,
          contactName, contactEmail, milesFromHub,
          storageDays, rushDelivery, rates ?? null, notes ?? null,
          req.params.id,
        ],
      );
      if (!rows.length) return res.status(404).json({ error: 'Project not found.' });
      return res.json(rows[0]);
    } catch {
      return res.status(500).json({ error: 'Failed to update project.' });
    }
  },
);

// DELETE /api/projects/:id
router.delete(
  '/:id',
  authenticate,
  roleGuard(['admin']),
  async (req, res) => {
    try {
      const { rowCount } = await db.query(
        'DELETE FROM projects WHERE id = $1',
        [req.params.id],
      );
      if (!rowCount) return res.status(404).json({ error: 'Project not found.' });
      return res.status(204).end();
    } catch {
      return res.status(500).json({ error: 'Failed to delete project.' });
    }
  },
);

// PATCH /api/projects/:id/status — enforce pipeline transitions
router.patch(
  '/:id/status',
  authenticate,
  roleGuard(OPS),
  async (req, res) => {
    try {
      const { status: newStatus } = req.body;

      if (!PIPELINE_STATUSES.includes(newStatus)) {
        return res.status(400).json({ error: `'${newStatus}' is not a valid status.` });
      }

      const current = await db.query(
        'SELECT status FROM projects WHERE id = $1',
        [req.params.id],
      );
      if (!current.rows.length) return res.status(404).json({ error: 'Project not found.' });

      const currentStatus = current.rows[0].status;
      if (!isValidTransition(currentStatus, newStatus)) {
        return res.status(422).json({
          error: `Cannot transition from '${currentStatus}' to '${newStatus}'.`,
        });
      }

      const { rows } = await db.query(
        `UPDATE projects SET status = $1, updated_at = NOW()
          WHERE id = $2 RETURNING *`,
        [newStatus, req.params.id],
      );
      return res.json(rows[0]);
    } catch {
      return res.status(500).json({ error: 'Failed to update status.' });
    }
  },
);

export default router;
