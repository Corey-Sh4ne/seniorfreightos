export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Sidebar from '@/app/dashboard/_components/Sidebar';
import RateCardForm from './_components/RateCardForm';
import { loadRateCard } from './_actions/saveRateCard';
import { DEFAULT_RATE_CARD } from '@/models/RateCard';

export const metadata = {
  title: 'Rate Card — SeniorFreightOS',
};

export default async function RateCardPage() {
  const { sessionClaims } = await auth();

  if (sessionClaims?.metadata?.role !== 'admin') {
    redirect('/dashboard');
  }

  const rates = await loadRateCard();

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="shrink-0 border-b border-zinc-200 bg-white px-6 py-4">
          <h1 className="text-lg font-semibold leading-tight text-zinc-900">Rate Card</h1>
          <p className="mt-0.5 text-xs text-zinc-400">
            Company-wide pricing rates used when quoting new projects
          </p>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-5">
          <div className="mx-auto max-w-4xl">
            <RateCardForm rates={rates} defaultRates={DEFAULT_RATE_CARD} />
          </div>
        </main>
      </div>
    </div>
  );
}
