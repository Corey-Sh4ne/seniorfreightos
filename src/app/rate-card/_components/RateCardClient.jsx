'use client';

import { useMemo, useState } from 'react';
import { toPct } from '../_lib/rateCardFields';
import RateCardFormModal from './RateCardFormModal';
import AssignCompaniesModal from './AssignCompaniesModal';

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

const AVATAR_BG = ['#EFF6FF', '#FDF4FF', '#ECFDF5', '#FEF3C7', '#FEE2E2'];
const AVATAR_FG = ['#1D4ED8', '#7E22CE', '#065F46', '#92400E', '#B91C1C'];

function getTier(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('premium') || n.includes('white glove')) {
    return { color: '#F59E0B', bg: '#FEF3C7', fg: '#92400E', label: 'PREMIUM' };
  }
  if (n.includes('standard')) {
    return { color: '#2563EB', bg: '#DBEAFE', fg: '#1D4ED8', label: 'STANDARD' };
  }
  if (n.includes('budget')) {
    return { color: '#6B7280', bg: '#F3F4F6', fg: '#4B5563', label: 'BUDGET' };
  }
  return { color: '#8B5CF6', bg: '#EDE9FE', fg: '#6D28D9', label: 'CUSTOM' };
}

function Metric({ label, value }) {
  return (
    <div>
      <div
        style={{
          fontSize: '11px',
          fontWeight: 600,
          color: '#9CA3AF',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginTop: '2px' }}>
        {value}
      </div>
    </div>
  );
}

function AssignedAvatars({ names }) {
  if (!names || names.length === 0) {
    return <span className="text-sm italic text-gray-400">Unassigned</span>;
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      {names.map((name, idx) => (
        <div key={name} className="flex items-center gap-1.5">
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
            style={{
              backgroundColor: AVATAR_BG[idx % AVATAR_BG.length],
              color: AVATAR_FG[idx % AVATAR_FG.length],
            }}
          >
            {name?.charAt(0).toUpperCase() || '?'}
          </span>
          <span className="text-sm text-gray-700">{name}</span>
        </div>
      ))}
    </div>
  );
}

const ASSIGN_BTN_STYLE = {
  border: '1px solid #E5E7EB',
  borderRadius: '6px',
  padding: '6px 12px',
  fontSize: '13px',
  fontWeight: 500,
  color: '#374151',
  background: 'white',
  cursor: 'pointer',
};

const EDIT_BTN_STYLE = {
  border: '1px solid #2563EB',
  borderRadius: '6px',
  padding: '6px 12px',
  fontSize: '13px',
  fontWeight: 500,
  color: '#2563EB',
  background: 'white',
  cursor: 'pointer',
};

export default function RateCardClient({ rateCards, assignments, clientNames, defaultRates }) {
  const [formModal, setFormModal] = useState(null);
  const [assignCard, setAssignCard] = useState(null);

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
          <h1 className="text-2xl font-bold text-gray-900">Rate Cards</h1>
          <p className="mt-0.5 text-sm text-gray-400">
            Manage pricing templates for your clients
          </p>
        </div>
        <button
          onClick={() => setFormModal({ mode: 'create', card: null })}
          className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 active:bg-blue-800"
        >
          New Rate Card
        </button>
      </header>

      {defaultCard && (
        <section
          style={{
            background: 'white',
            border: '2px solid #E5E7EB',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '32px',
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center">
                <h2 className="text-base font-semibold text-gray-900">{defaultCard.name}</h2>
                <span
                  style={{
                    background: '#F3F4F6',
                    color: '#6B7280',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    marginLeft: '8px',
                  }}
                >
                  DEFAULT
                </span>
              </div>
              <p className="mt-0.5 text-xs text-gray-400">
                Applied to all clients without a custom rate
              </p>
            </div>
            <button
              onClick={() => setFormModal({ mode: 'edit', card: defaultCard })}
              style={EDIT_BTN_STYLE}
            >
              Edit
            </button>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metric label="Receiving" value={`${USD.format(defaultCard.rates.receivingPerLb)}/lb`} />
            <Metric
              label="Storage"
              value={`${USD.format(defaultCard.rates.storagePerLbPerDay)}/lb/day`}
            />
            <Metric label="Freight" value={`${USD.format(defaultCard.rates.freightPerLb)}/lb`} />
            <Metric label="Margin" value={`${toPct(defaultCard.rates.marginPct)}%`} />
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-900">Custom Rate Cards</h2>

        {customCards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center">
            <p className="text-sm text-gray-500">No custom rate cards yet.</p>
            <p className="mt-1 text-xs text-gray-400">
              Create one to apply special pricing to specific companies.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {customCards.map((card) => {
              const assigned = clientsByCard[card.id] ?? [];
              const tier = getTier(card.name);
              return (
                <div
                  key={card.id}
                  className="flex flex-col rounded-xl bg-white p-5 shadow-sm"
                  style={{
                    border: '1px solid #E5E7EB',
                    borderLeft: `4px solid ${tier.color}`,
                  }}
                >
                  <div className="flex items-center">
                    <h3 className="text-sm font-semibold text-gray-900">{card.name}</h3>
                    <span
                      style={{
                        background: tier.bg,
                        color: tier.fg,
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        marginLeft: '8px',
                      }}
                    >
                      {tier.label}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <Metric
                      label="Receiving"
                      value={`${USD.format(card.rates.receivingPerLb)}/lb`}
                    />
                    <Metric
                      label="Storage"
                      value={`${USD.format(card.rates.storagePerLbPerDay)}/lb/day`}
                    />
                    <Metric
                      label="Freight"
                      value={`${USD.format(card.rates.freightPerLb)}/lb`}
                    />
                    <Metric label="Margin" value={`${toPct(card.rates.marginPct)}%`} />
                  </div>

                  <div className="mt-5">
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#9CA3AF',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Assigned to
                    </div>
                    <div className="mt-2">
                      <AssignedAvatars names={assigned} />
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-2">
                    <button onClick={() => setAssignCard(card)} style={ASSIGN_BTN_STYLE}>
                      Assign Companies
                    </button>
                    <button
                      onClick={() => setFormModal({ mode: 'edit', card })}
                      style={EDIT_BTN_STYLE}
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
