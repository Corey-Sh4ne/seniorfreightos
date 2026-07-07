export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import Sidebar from '@/app/dashboard/_components/Sidebar';
import { query } from '@/db/index';
import { rowToRateCard } from './_lib/rateCardFields';
import { DEFAULT_RATE_CARD } from '@/models/RateCard';
import RateCardClient from './_components/RateCardClient';

export const metadata = {
  title: 'Rate Cards — SeniorFreightOS',
};

export default async function RateCardPage() {
  await auth();

  const [cardsRes, assignmentsRes, clientsRes] = await Promise.all([
    query('SELECT * FROM rate_cards ORDER BY is_default DESC, name ASC'),
    query('SELECT client_name, rate_card_id FROM client_rate_assignments'),
    query(
      `SELECT DISTINCT client_name FROM projects
        WHERE client_name IS NOT NULL AND client_name <> ''
        ORDER BY client_name ASC`,
    ),
  ]);

  const rateCards = cardsRes.rows.map(rowToRateCard);
  const assignments = assignmentsRes.rows.map((r) => ({
    clientName: r.client_name,
    rateCardId: r.rate_card_id,
  }));
  const clientNames = clientsRes.rows.map((r) => r.client_name);

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <RateCardClient
            rateCards={rateCards}
            assignments={assignments}
            clientNames={clientNames}
            defaultRates={DEFAULT_RATE_CARD}
          />
        </main>
      </div>
    </div>
  );
}
