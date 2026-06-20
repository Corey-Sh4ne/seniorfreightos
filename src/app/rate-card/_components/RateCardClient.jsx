'use client';

import { useMemo, useState } from 'react';
import { toPct } from '../_lib/rateCardFields';
import RateCardFormModal from './RateCardFormModal';
import AssignCompaniesModal from './AssignCompaniesModal';

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function Stat({ label, value }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-zinc-900">{value}</dd>
    </div>
  );
}

export default function RateCardClient({ rateCards, assignments, clientNames, defaultRates }) {
  const [formModal, setFormModal] = useState(null);   // { mode, card }
  const [assignCard, setAssignCard] = useState(null); // rate card

  const defaultCard = rateCards.find((c) => c.isDefault) ?? null;
  const customCards = rateCards.filter((c) => !c.isDefault);

  const clientsByCard = useMemo(() => {
    const map = {};
    for (const a of assignments) {
      if (!a.rateCardId) continue;
      (map[a.rateCardId] ??= []).push(a.clientName);
    }
    return map;
  }, [assignments]);

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold leading-tight text-zinc-900">Rate Cards</h1>
          <p className="mt-0.5 text-sm text-zinc-400">Manage pricing templates for your clients</p>
        </div>
        <button
          onClick={() => setFormModal({ mode: 'create', card: null })}
          className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 active:bg-blue-800"
        >
          New Rate Card
        </button>
      </header>

      {defaultCard && (
        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">{defaultCard.name}</h2>
              <p className="mt-0.5 text-xs text-zinc-400">Applied to all clients without a custom rate</p>
            </div>
            <button
              onClick={() => setFormModal({ mode: 'edit', card: defaultCard })}
              className="shrink-0 rounded-lg border border-zinc-200 px-3.5 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              Edit
            </button>
          </div>
          <dl className="mt-5 grid grid-cols-3 gap-4">
            <Stat label="Receiving" value={`${USD.format(defaultCard.rates.receivingPerLb)}/lb`} />
            <Stat label="Freight" value={`${USD.format(defaultCard.rates.freightPerLb)}/lb`} />
            <Stat label="Margin" value={`${toPct(defaultCard.rates.marginPct)}%`} />
          </dl>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-900">Custom Rate Cards</h2>

        {customCards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-10 text-center">
            <p className="text-sm text-zinc-500">No custom rate cards yet.</p>
            <p className="mt-1 text-xs text-zinc-400">
              Create one to apply special pricing to specific companies.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {customCards.map((card) => {
              const assigned = clientsByCard[card.id] ?? [];
              return (
                <div key={card.id} className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-zinc-900">{card.name}</h3>
                  <dl className="mt-3 grid grid-cols-2 gap-3">
                    <Stat label="Freight" value={`${USD.format(card.rates.freightPerLb)}/lb`} />
                    <Stat label="Margin" value={`${toPct(card.rates.marginPct)}%`} />
                  </dl>
                  <div className="mt-4">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">Assigned to</p>
                    <p className="mt-1 text-sm text-zinc-700">
                      {assigned.length > 0 ? assigned.join(', ') : (
                        <span className="text-zinc-400">No companies assigned</span>
                      )}
                    </p>
                  </div>
                  <div className="mt-5 flex items-center gap-2">
                    <button
                      onClick={() => setAssignCard(card)}
                      className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                    >
                      Assign Companies
                    </button>
                    <button
                      onClick={() => setFormModal({ mode: 'edit', card })}
                      className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {formModal && (
        <RateCardFormModal
          mode={formModal.mode}
          card={formModal.card}
          defaultRates={defaultRates}
          onClose={() => setFormModal(null)}
        />
      )}

      {assignCard && (
        <AssignCompaniesModal
          card={assignCard}
          clientNames={clientNames}
          assignments={assignments}
          rateCards={rateCards}
          onClose={() => setAssignCard(null)}
        />
      )}
    </div>
  );
}
