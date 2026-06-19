'use server';

import { redirect } from 'next/navigation';
import { query } from '@/db/index';

/**
 * Generate the next project code in FTE-YYYY-### format.
 * Queries the DB for the highest existing code this year, then increments.
 */
async function generateProjectCode() {
  const year = new Date().getFullYear();
  const prefix = `FTE-${year}-`;

  const { rows } = await query(
    `SELECT code FROM projects WHERE code LIKE $1 ORDER BY code DESC LIMIT 1`,
    [`${prefix}%`],
  );

  let nextNum = 1;
  if (rows.length > 0) {
    const lastNum = parseInt(rows[0].code.slice(prefix.length), 10);
    if (!isNaN(lastNum)) nextNum = lastNum + 1;
  }

  return `${prefix}${String(nextNum).padStart(3, '0')}`;
}

/**
 * Server Action — validate form data, insert a new project row, and redirect.
 * Signature follows useActionState: (prevState, formData) => state | never
 */
export async function createProject(prevState, formData) {
  const clientName   = formData.get('client_name')?.trim()   ?? '';
  const facilityName = formData.get('facility_name')?.trim() ?? '';
  const milesFromHub = parseFloat(formData.get('miles_from_hub') ?? '0') || 0;
  const storageDays  = parseInt(formData.get('storage_days')  ?? '0', 10) || 0;
  const rushDelivery = formData.get('rush_delivery') === 'on';
  const notes        = formData.get('notes')?.trim() ?? '';

  const errors = {};
  if (!clientName)   errors.client_name   = 'Client name is required.';
  if (!facilityName) errors.facility_name = 'Facility name is required.';

  if (Object.keys(errors).length > 0) return { errors };

  const code = await generateProjectCode();

  const { rows } = await query(
    `INSERT INTO projects
       (code, client_name, facility_name, facility_address,
        contact_name, contact_email, miles_from_hub, storage_days,
        rush_delivery, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id`,
    [code, clientName, facilityName, '', '', '',
     milesFromHub, storageDays, rushDelivery, notes],
  );

  redirect(`/projects/${rows[0].id}`);
}
