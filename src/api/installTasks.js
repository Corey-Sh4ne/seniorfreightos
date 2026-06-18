/**
 * Install Tasks API — CRUD scoped to a parent project.
 * Mount at: /api/projects/:projectId/install-tasks
 * Router must be created with mergeParams: true so :projectId is accessible.
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import { INSTALL_TASK_TYPES } from '../models/InstallTask.js';
import db from '../db/index.js';

const router = Router({ mergeParams: true });

const ALL_STAFF   = ['admin', 'dispatcher', 'install_crew_lead'];
const OPS         = ['admin', 'dispatcher'];

// GET /api/projects/:projectId/install-tasks
router.get(
  '/',
  authenticate,
  roleGuard(ALL_STAFF),
  async (req, res) => {
    try {
      const { rows } = await db.query(
        'SELECT * FROM install_tasks WHERE project_id = $1 ORDER BY created_at ASC',
        [req.params.projectId],
      );
      return res.json(rows);
    } catch {
      return res.status(500).json({ error: 'Failed to fetch install tasks.' });
    }
  },
);

// POST /api/projects/:projectId/install-tasks
router.post(
  '/',
  authenticate,
  roleGuard(OPS),
  async (req, res) => {
    try {
      const { type, qty, notes } = req.body;

      if (!INSTALL_TASK_TYPES.includes(type)) {
        return res.status(400).json({
          error: `Invalid type. Must be one of: ${INSTALL_TASK_TYPES.join(', ')}.`,
        });
      }

      if (!qty || qty <= 0) {
        return res.status(400).json({ error: 'qty is required and must be > 0.' });
      }

      const { rows } = await db.query(
        `INSERT INTO install_tasks (project_id, type, qty, notes, completed)
         VALUES ($1, $2, $3, $4, false)
         RETURNING *`,
        [req.params.projectId, type, qty, notes ?? null],
      );
      return res.status(201).json(rows[0]);
    } catch {
      return res.status(500).json({ error: 'Failed to create install task.' });
    }
  },
);

// GET /api/projects/:projectId/install-tasks/:id
router.get(
  '/:id',
  authenticate,
  roleGuard(ALL_STAFF),
  async (req, res) => {
    try {
      const { rows } = await db.query(
        'SELECT * FROM install_tasks WHERE id = $1 AND project_id = $2',
        [req.params.id, req.params.projectId],
      );
      if (!rows.length) return res.status(404).json({ error: 'Install task not found.' });
      return res.json(rows[0]);
    } catch {
      return res.status(500).json({ error: 'Failed to fetch install task.' });
    }
  },
);

// PUT /api/projects/:projectId/install-tasks/:id
// install_crew_lead may only toggle `completed`; OPS may update all fields.
router.put(
  '/:id',
  authenticate,
  roleGuard(ALL_STAFF),
  async (req, res) => {
    try {
      const { type, qty, notes, completed } = req.body;
      const isCrewLead = req.user.role === 'install_crew_lead';

      if (isCrewLead) {
        // Crew leads may only update the completed flag and notes.
        const { rows } = await db.query(
          `UPDATE install_tasks
              SET completed = $1, notes = $2
            WHERE id = $3 AND project_id = $4
            RETURNING *`,
          [completed ?? false, notes ?? null, req.params.id, req.params.projectId],
        );
        if (!rows.length) return res.status(404).json({ error: 'Install task not found.' });
        return res.json(rows[0]);
      }

      if (type && !INSTALL_TASK_TYPES.includes(type)) {
        return res.status(400).json({
          error: `Invalid type. Must be one of: ${INSTALL_TASK_TYPES.join(', ')}.`,
        });
      }

      const { rows } = await db.query(
        `UPDATE install_tasks
            SET type = $1, qty = $2, notes = $3, completed = $4
          WHERE id = $5 AND project_id = $6
          RETURNING *`,
        [type, qty, notes ?? null, completed ?? false, req.params.id, req.params.projectId],
      );
      if (!rows.length) return res.status(404).json({ error: 'Install task not found.' });
      return res.json(rows[0]);
    } catch {
      return res.status(500).json({ error: 'Failed to update install task.' });
    }
  },
);

// DELETE /api/projects/:projectId/install-tasks/:id
router.delete(
  '/:id',
  authenticate,
  roleGuard(['admin']),
  async (req, res) => {
    try {
      const { rowCount } = await db.query(
        'DELETE FROM install_tasks WHERE id = $1 AND project_id = $2',
        [req.params.id, req.params.projectId],
      );
      if (!rowCount) return res.status(404).json({ error: 'Install task not found.' });
      return res.status(204).end();
    } catch {
      return res.status(500).json({ error: 'Failed to delete install task.' });
    }
  },
);

export default router;
