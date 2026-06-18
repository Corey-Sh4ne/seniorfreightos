/**
 * Client Portal API — read-only routes for client_user role.
 * Mount at: /api/portal
 *
 * Security contract (enforced at this layer, never UI-only):
 *   - Every query filters by req.clientName, which is stamped from the
 *     authenticated token by roleGuard({ enforceClientScope: true }).
 *   - Pricing fields (rates, margin, overhead) are stripped before every response.
 *   - Internal notes are never returned.
 *   - No write operations exist on this router.
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import db from '../db/index.js';

const router = Router();

const clientOnly = [
  authenticate,
  roleGuard(['client_user'], { enforceClientScope: true }),
];

/** Strip all pricing / internal fields before returning a project to a client. */
function sanitizeProject(project) {
  const {
    // eslint-disable-next-line no-unused-vars
    rates, notes, ...safe
  } = project;
  return safe;
}

// GET /api/portal/projects
// Returns all projects belonging to the authenticated client's organization.
router.get('/projects', ...clientOnly, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, code, client_name, facility_name, facility_address,
              contact_name, contact_email, miles_from_hub, status,
              storage_days, rush_delivery, created_at, updated_at
         FROM projects
        WHERE client_name = $1
        ORDER BY created_at DESC`,
      [req.clientName],
    );
    return res.json(rows);
  } catch {
    return res.status(500).json({ error: 'Failed to fetch projects.' });
  }
});

// GET /api/portal/projects/:id
// Returns a single project summary — verifies clientName before responding.
router.get('/projects/:id', ...clientOnly, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, code, client_name, facility_name, facility_address,
              contact_name, contact_email, miles_from_hub, status,
              storage_days, rush_delivery, created_at, updated_at
         FROM projects
        WHERE id = $1 AND client_name = $2`,
      [req.params.id, req.clientName],
    );
    if (!rows.length) return res.status(404).json({ error: 'Project not found.' });
    return res.json(sanitizeProject(rows[0]));
  } catch {
    return res.status(500).json({ error: 'Failed to fetch project.' });
  }
});

// GET /api/portal/projects/:id/shipments
// Returns receiving progress for a project — no pricing fields exposed.
router.get('/projects/:id/shipments', ...clientOnly, async (req, res) => {
  try {
    const projectCheck = await db.query(
      'SELECT id FROM projects WHERE id = $1 AND client_name = $2',
      [req.params.id, req.clientName],
    );
    if (!projectCheck.rows.length) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const { rows } = await db.query(
      `SELECT id, project_id, vendor, category, description,
              qty, cartons, eta, received
         FROM shipments
        WHERE project_id = $1
        ORDER BY eta ASC`,
      [req.params.id],
    );
    return res.json(rows);
  } catch {
    return res.status(500).json({ error: 'Failed to fetch shipments.' });
  }
});

// GET /api/portal/projects/:id/install-tasks
// Returns install task list for a project — read-only, no pricing data.
router.get('/projects/:id/install-tasks', ...clientOnly, async (req, res) => {
  try {
    const projectCheck = await db.query(
      'SELECT id FROM projects WHERE id = $1 AND client_name = $2',
      [req.params.id, req.clientName],
    );
    if (!projectCheck.rows.length) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const { rows } = await db.query(
      `SELECT id, project_id, type, qty, completed
         FROM install_tasks
        WHERE project_id = $1
        ORDER BY created_at ASC`,
      [req.params.id],
    );
    return res.json(rows);
  } catch {
    return res.status(500).json({ error: 'Failed to fetch install tasks.' });
  }
});

export default router;
