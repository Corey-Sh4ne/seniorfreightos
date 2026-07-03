'use client';

import { useState, useTransition } from 'react';
import Modal from './Modal';
import { INSTALL_TASKS, toPct } from '../_lib/rateCardFields';
import { saveRateCard, createRateCard, deleteRateCard } from '../_actions/saveRateCard';

const INPUT_CLS =
  'block w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 ' +
  'shadow-sm placeholder:text-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none';

function Field({ label, name, defaultValue, placeholder, step = '0.001', unit }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-zinc-600">
        {label}
        {unit && <span className="ml-1 font-normal text-zinc-400">{unit}</span>}
      </label>
      <input
        type="number" name={name} defaultValue={defaultValue} placeholder={placeholder}
        step={step} min="0" required className={INPUT_CLS}
      />
    </div>
  );
}

function Section({ title, children, first = false }) {
  return (
    <div style={{ marginTop: first ? 0 : '20px' }}>
      <h3
        style={{
          fontSize: '13px',
          fontWeight: 700,
          color: '#374151',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '12px',
          paddingBottom: '8px',
          borderBottom: '2px solid #E5E7EB',
        }}
      >
        {title}
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </div>
  );
}

function buildRates(fd) {
  const num = (k) => parseFloat(fd.get(k));
  const pct = (k) => parseFloat(fd.get(k)) / 100;
  const rates = {
    receivingPerLb:     num('receivingPerLb'),
    storagePerLbPerDay: num('storagePerLbPerDay'),
    freightPerLb:       num('freightPerLb'),
    freightMinimum:     num('freightMinimum'),
    fuelSurchargePct:   pct('fuelSurchargePct'),
    rushSurchargePct:   pct('rushSurchargePct'),
    overheadPct:        pct('overheadPct'),
    marginPct:          pct('marginPct'),
    installTaskRates:   {},
  };
  for (const { key } of INSTALL_TASKS) rates.installTaskRates[key] = num(`install_${key}`);
  return rates;
}

export default function RateCardFormModal({ mode, card, defaultRates, onClose }) {
  const isEdit = mode === 'edit';
  const isCustom = isEdit && !card.isDefault;
  const r = isEdit ? card.rates : null;

  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const name = fd.get('name');
    const rates = buildRates(fd);
    startTransition(async () => {
      const res = isEdit ? await saveRateCard(card.id, name, rates) : await createRateCard(name, rates);
      if (res?.error) setError(res.error);
      else onClose();
    });
  }

  function handleDelete() {
    setError(null);
    setDeleting(true);
    startTransition(async () => {
      const res = await deleteRateCard(card.id);
      if (res?.error) { setError(res.error); setDeleting(false); setConfirmDelete(false); }
      else onClose();
    });
  }

  // Edit shows stored values; create leaves inputs empty with the default as a hint.
  const amt = (key) => (isEdit ? r[key] : undefined);
  const amtPh = (key) => defaultRates[key];
  const pctVal = (key) => (isEdit ? toPct(r[key]) : undefined);
  const pctPh = (key) => toPct(defaultRates[key]);
  const task = (key) => (isEdit ? (r.installTaskRates?.[key] ?? 0) : undefined);

  return (
    <Modal
      title={isEdit ? `Edit ${card.name}` : 'New Rate Card'}
      subtitle={isEdit ? 'Update this rate card’s pricing' : 'Create a pricing template for your clients'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-6 px-6 py-5">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="space-y-1">
          <label className="block text-xs font-medium text-zinc-600">Rate Card Name</label>
          <input
            type="text" name="name" required defaultValue={isEdit ? card.name : ''}
            placeholder="e.g. Premium Clients" className={INPUT_CLS}
          />
        </div>

        <Section title="Receiving" first>
          <Field label="Rate per lb" name="receivingPerLb" unit="$/lb" defaultValue={Number(amt('receivingPerLb')) || 0} placeholder="e.g. 0.09" />
        </Section>

        <Section title="Storage">
          <Field label="Rate per lb / day" name="storagePerLbPerDay" unit="$/lb/day" defaultValue={Number(amt('storagePerLbPerDay')) || 0} placeholder="e.g. 0.05" />
        </Section>

        <Section title="Freight">
          <Field label="Rate per lb" name="freightPerLb" unit="$/lb" defaultValue={Number(amt('freightPerLb')) || 0} placeholder="e.g. 0.17" />
          <Field label="Minimum charge" name="freightMinimum" unit="$" step="1" defaultValue={Number(amt('freightMinimum')) || 0} placeholder="e.g. 500" />
          <Field label="Fuel surcharge" name="fuelSurchargePct" unit="%" step="0.01" defaultValue={Number(pctVal('fuelSurchargePct')) || 0} placeholder="e.g. 15" />
          <Field label="Rush surcharge" name="rushSurchargePct" unit="%" step="0.01" defaultValue={Number(pctVal('rushSurchargePct')) || 0} placeholder="e.g. 10" />
        </Section>

        <Section title="Install Tasks">
          {INSTALL_TASKS.map(({ key, label }) => (
            <Field key={key} label={label} name={`install_${key}`} unit="$/unit" step="0.01" defaultValue={Number(task(key)) || 0} placeholder="e.g. 25" />
          ))}
        </Section>

        <Section title="Overhead & Margin">
          <Field label="Overhead" name="overheadPct" unit="%" step="0.01" defaultValue={Number(pctVal('overheadPct')) || 0} placeholder="e.g. 5" />
          <Field label="Margin" name="marginPct" unit="%" step="0.01" defaultValue={Number(pctVal('marginPct')) || 0} placeholder="e.g. 18" />
        </Section>

        <div className="flex items-center justify-between gap-4 border-t border-zinc-200 pt-5">
          {isCustom ? (
            <button
              type="button" onClick={() => setConfirmDelete(true)} disabled={pending}
              className="rounded-lg border border-red-200 px-3.5 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
            >
              Delete this Rate Card
            </button>
          ) : <span />}
          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100">
              Cancel
            </button>
            <button type="submit" disabled={pending} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50">
              {pending && !deleting ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </form>

      {confirmDelete && (
        <Modal title="Delete Rate Card?" onClose={() => setConfirmDelete(false)} maxWidth="max-w-md">
          <div className="px-6 py-5">
            <p className="text-sm text-zinc-600">
              Are you sure you want to delete <span className="font-medium text-zinc-900">{card.name}</span>? This
              cannot be undone. Any projects using this rate card will retain their quoted prices but will need a new
              rate card assigned before requoting.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button onClick={() => setConfirmDelete(false)} disabled={deleting} className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} className="rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
}
