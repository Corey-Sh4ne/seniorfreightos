'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { query } from '@/db/index';
import { AMOUNT_FIELDS, PERCENT_FIELDS, INSTALL_TASK_KEYS } from '../_lib/rateCardFields';

/** Verify the caller is an admin via the Clerk API (session claims can be stale). */
async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) return false;
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  return user.publicMetadata?.role === 'admin';
}

const UNAUTHORIZED = { error: 'Unauthorized. Admin role required.' };

/** Validate + normalize a rates object. Returns { values, installTaskRates } or { error }. */
function normalizeRates(name, rates) {
  if (!name || !String(name).trim()) {
    return { error: 'Rate card name is required.' };
  }
  if (!rates || typeof rates !== 'object') {
    return { error: 'Rate values are required.' };
  }

  const values = {};
  for (const key of [...AMOUNT_FIELDS, ...PERCENT_FIELDS]) {
    const v = Number(rates[key]);
    if (!Number.isFinite(v) || v < 0) {
      return { error: `Invalid value for "${key}". Must be a non-negative number.` };
    }
    values[key] = v;
  }

  const installTaskRates = {};
  for (const key of INSTALL_TASK_KEYS) {
    const v = Number(rates.installTaskRates?.[key] ?? 0);
    if (!Number.isFinite(v) || v < 0) {
      return { error: `Invalid value for install task "${key}".` };
    }
    installTaskRates[key] = v;
  }

  return { values, installTaskRates };
}

/** Build the full rates object (stored in the rate_cards.rates jsonb column). */
function ratesJson({ values, installTaskRates }) {
  return JSON.stringify({ ...values, installTaskRates });
}

/** Update an existing rate card's name + rates. */
export async function saveRateCard(rateCardId, name, rates) {
  if (!(await requireAdmin())) return UNAUTHORIZED;
  if (!rateCardId) return { error: 'Missing rate card id.' };

  const norm = normalizeRates(name, rates);
  if (norm.error) return { error: norm.error };

  await query(
    `UPDATE rate_cards SET name = $1, rates = $2, updated_at = NOW() WHERE id = $3`,
    [String(name).trim(), ratesJson(norm), rateCardId],
  );

  revalidatePath('/rate-card');
  return { success: true };
}

/** Insert a new (non-default) rate card. */
export async function createRateCard(name, rates) {
  if (!(await requireAdmin())) return UNAUTHORIZED;

  const norm = normalizeRates(name, rates);
  if (norm.error) return { error: norm.error };

  await query(
    `INSERT INTO rate_cards (name, rates, is_default) VALUES ($1, $2, FALSE)`,
    [String(name).trim(), ratesJson(norm)],
  );

  revalidatePath('/rate-card');
  return { success: true };
}

/** Delete a rate card. The default card cannot be deleted. */
export async function deleteRateCard(rateCardId) {
  if (!(await requireAdmin())) return UNAUTHORIZED;
  if (!rateCardId) return { error: 'Missing rate card id.' };

  const { rows } = await query('SELECT is_default FROM rate_cards WHERE id = $1', [rateCardId]);
  if (!rows.length) return { error: 'Rate card not found.' };
  if (rows[0].is_default) return { error: 'The default rate card cannot be deleted.' };

  // client_rate_assignments.rate_card_id is ON DELETE SET NULL, so existing
  // assignments are detached rather than blocking the delete.
  await query('DELETE FROM rate_cards WHERE id = $1', [rateCardId]);

  revalidatePath('/rate-card');
  return { success: true };
}

/**
 * Assign a set of client companies to a rate card. Selected clients are upserted
 * onto this card (overriding any prior card); clients previously on this card but
 * no longer selected have their assignment removed.
 */
export async function assignCompanies(rateCardId, clientNames) {
  if (!(await requireAdmin())) return UNAUTHORIZED;
  if (!rateCardId) return { error: 'Missing rate card id.' };

  const names = Array.isArray(clientNames)
    ? clientNames.map((n) => String(n)).filter(Boolean)
    : [];

  if (names.length > 0) {
    await query(
      `INSERT INTO client_rate_assignments (client_name, rate_card_id)
       SELECT unnest($1::text[]), $2
       ON CONFLICT (client_name)
       DO UPDATE SET rate_card_id = EXCLUDED.rate_card_id, updated_at = NOW()`,
      [names, rateCardId],
    );
  }

  await query(
    `DELETE FROM client_rate_assignments
      WHERE rate_card_id = $1 AND NOT (client_name = ANY($2::text[]))`,
    [rateCardId, names],
  );

  revalidatePath('/rate-card');
  return { success: true };
}
