export const dynamic = 'force-dynamic';

import { auth, clerkClient } from '@clerk/nextjs/server';
import Sidebar from '@/app/dashboard/_components/Sidebar';
import { query } from '@/db/index';
import ClientsClient from './_components/ClientsClient';

export const metadata = {
  title: 'Clients — SeniorFreightOS',
};

function mapClientRow(r) {
  return {
    id: r.id,
    name: r.name,
    contactName: r.contact_name,
    contactEmail: r.contact_email,
    contactPhone: r.contact_phone,
    clerkUserId: r.clerk_user_id,
    rateCardId: r.rate_card_id,
    rateCardName: r.rate_card_name ?? null,
  };
}

function mapClerkUser(u) {
  const name = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username || 'Unnamed';
  const email = u.emailAddresses?.[0]?.emailAddress ?? '';
  return { id: u.id, name, email };
}

// Clerk's getUserList is rate-limited (HTTP 429) and is the only call here that
// reaches an external service. Isolate it so a transient failure — including a
// stalled connection — leaves the page renderable with an empty link dropdown
// instead of hanging the whole request.
const CLERK_LIST_TIMEOUT_MS = 5000;

async function listClientUsers() {
  const timeout = new Promise((resolve) =>
    setTimeout(() => resolve({ timedOut: true }), CLERK_LIST_TIMEOUT_MS),
  );

  try {
    const c = await clerkClient();
    const result = await Promise.race([
      c.users.getUserList({ limit: 100 }),
      timeout,
    ]);
    if (result?.timedOut) {
      console.error('[clients] Clerk getUserList timed out after', CLERK_LIST_TIMEOUT_MS, 'ms');
      return [];
    }
    return result.data
      .filter((u) => u.publicMetadata?.role === 'client_user')
      .map(mapClerkUser);
  } catch (err) {
    console.error('[clients] Clerk getUserList failed:', err?.status, err?.message);
    return [];
  }
}

export default async function ClientsPage() {
  await auth();

  const [clientsRes, rateCardsRes, clerkUsers] = await Promise.all([
    query(
      `SELECT c.id, c.name, c.contact_name, c.contact_email, c.contact_phone,
              c.clerk_user_id, c.rate_card_id, rc.name AS rate_card_name
         FROM clients c
         LEFT JOIN rate_cards rc ON c.rate_card_id = rc.id
         ORDER BY c.name ASC`,
    ),
    query('SELECT id, name, is_default FROM rate_cards ORDER BY is_default DESC, name ASC'),
    listClientUsers(),
  ]);

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <ClientsClient
            clients={clientsRes.rows.map(mapClientRow)}
            rateCards={rateCardsRes.rows.map((r) => ({
              id: r.id,
              name: r.name,
              isDefault: r.is_default,
            }))}
            clerkUsers={clerkUsers}
          />
        </main>
      </div>
    </div>
  );
}
