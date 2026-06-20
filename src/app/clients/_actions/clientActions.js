'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { query } from '@/db/index';

const UNAUTHORIZED = { error: 'Unauthorized. Admin role required.' };

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) return false;
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  return user.publicMetadata?.role === 'admin';
}

function parseForm(formData) {
  const name = String(formData.get('name') ?? '').trim();
  const contactName = String(formData.get('contact_name') ?? '').trim();
  const contactEmail = String(formData.get('contact_email') ?? '').trim();
  const contactPhone = String(formData.get('contact_phone') ?? '').trim();
  const rateCardRaw = String(formData.get('rate_card_id') ?? '').trim();
  const clerkRaw = String(formData.get('clerk_user_id') ?? '').trim();
  return {
    name,
    contactName,
    contactEmail,
    contactPhone,
    rateCardId: rateCardRaw || null,
    clerkUserId: clerkRaw || null,
  };
}

async function assertClerkUserAvailable(clerkUserId, excludeClientId = null) {
  if (!clerkUserId) return null;

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(clerkUserId);
  if (user.publicMetadata?.role !== 'client_user') {
    return { error: 'Selected Clerk account must have the client_user role.' };
  }

  const params = excludeClientId ? [clerkUserId, excludeClientId] : [clerkUserId];
  const sql = excludeClientId
    ? 'SELECT id FROM clients WHERE clerk_user_id = $1 AND id <> $2 LIMIT 1'
    : 'SELECT id FROM clients WHERE clerk_user_id = $1 LIMIT 1';
  const { rows } = await query(sql, params);
  if (rows.length) return { error: 'That Clerk account is already linked to another client.' };

  return null;
}

async function setClerkClientName(clerkUserId, clientName) {
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(clerkUserId);
  await clerk.users.updateUser(clerkUserId, {
    publicMetadata: { ...user.publicMetadata, clientName },
  });
}

async function clearClerkClientName(clerkUserId) {
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(clerkUserId);
  const meta = { ...user.publicMetadata };
  delete meta.clientName;
  await clerk.users.updateUser(clerkUserId, { publicMetadata: meta });
}

export async function createClient(formData) {
  if (!(await requireAdmin())) return UNAUTHORIZED;

  const data = parseForm(formData);
  if (!data.name) return { error: 'Company name is required.' };

  const linkErr = await assertClerkUserAvailable(data.clerkUserId);
  if (linkErr) return linkErr;

  try {
    const { rows } = await query(
      `INSERT INTO clients (name, contact_name, contact_email, contact_phone, rate_card_id, clerk_user_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [data.name, data.contactName, data.contactEmail, data.contactPhone, data.rateCardId, data.clerkUserId],
    );

    if (data.clerkUserId) await setClerkClientName(data.clerkUserId, data.name);

    revalidatePath('/clients');
    return { success: true, id: rows[0].id };
  } catch (err) {
    if (err.code === '23505') return { error: 'A client with that company name already exists.' };
    throw err;
  }
}

export async function updateClient(clientId, formData) {
  if (!(await requireAdmin())) return UNAUTHORIZED;
  if (!clientId) return { error: 'Missing client id.' };

  const data = parseForm(formData);
  const { rows: existingRows } = await query(
    'SELECT name, clerk_user_id FROM clients WHERE id = $1',
    [clientId],
  );
  if (!existingRows.length) return { error: 'Client not found.' };

  const existing = existingRows[0];
  const linkErr = await assertClerkUserAvailable(data.clerkUserId, clientId);
  if (linkErr) return linkErr;

  const oldClerkId = existing.clerk_user_id || null;
  const newClerkId = data.clerkUserId;

  await query(
    `UPDATE clients
        SET contact_name = $1, contact_email = $2, contact_phone = $3,
            rate_card_id = $4, clerk_user_id = $5, updated_at = NOW()
      WHERE id = $6`,
    [data.contactName, data.contactEmail, data.contactPhone, data.rateCardId, newClerkId, clientId],
  );

  if (oldClerkId && oldClerkId !== newClerkId) await clearClerkClientName(oldClerkId);
  if (newClerkId && newClerkId !== oldClerkId) await setClerkClientName(newClerkId, existing.name);

  revalidatePath('/clients');
  return { success: true };
}
