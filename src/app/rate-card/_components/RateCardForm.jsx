'use client';

import { useActionState } from 'react';
import { saveRateCard } from '../_actions/saveRateCard';

const INSTALL_TASKS = [
  { key: 'assemble_furniture',       label: 'Assemble Furniture' },
  { key: 'hang_artwork',             label: 'Hang Artwork' },
  { key: 'mount_tv_fixture',         label: 'Mount TV / Fixture' },
  { key: 'place_and_position',       label: 'Place & Position' },
  { key: 'debris_removal',           label: 'Debris Removal' },
  { key: 'install_window_treatments', label: 'Install Window Treatments' },
];

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
        type="number" name={name}
        defaultValue={defaultValue} placeholder={placeholder}
        step={step} min="0" required
        className={INPUT_CLS}
      />
    </div>
  );
}

function Section({ title, description, children }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm p-6">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-zinc-400">{description}</p>}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </div>
  );
}

/** Convert a stored decimal (0.09) to a display percentage (9). */
function toPct(v) { return parseFloat((v * 100).toFixed(6)); }

export default function RateCardForm({ rates, defaultRates }) {
  const [state, action, pending] = useActionState(saveRateCard, { success: false, error: null });

  return (
    <form action={action} className="space-y-5">
      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Rate card saved successfully.
        </div>
      )}

      <Section title="Receiving" description="Inbound handling cost applied to total shipment weight">
        <Field label="Rate per lb" name="receivingPerLb" unit="$/lb"
          defaultValue={rates.receivingPerLb} placeholder={defaultRates.receivingPerLb} step="0.001" />
      </Section>

      <Section title="Storage" description="Staging cost while freight is consolidated at the hub">
        <Field label="Rate per lb / day" name="storagePerLbPerDay" unit="$/lb/day"
          defaultValue={rates.storagePerLbPerDay} placeholder={defaultRates.storagePerLbPerDay} step="0.001" />
      </Section>

      <Section title="Freight" description="Outbound consolidated freight rates and surcharges (percentages as whole numbers)">
        <Field label="Rate per lb" name="freightPerLb" unit="$/lb"
          defaultValue={rates.freightPerLb} placeholder={defaultRates.freightPerLb} step="0.001" />
        <Field label="Minimum charge" name="freightMinimum" unit="$"
          defaultValue={rates.freightMinimum} placeholder={defaultRates.freightMinimum} step="1" />
        <Field label="Fuel surcharge" name="fuelSurchargePct" unit="%"
          defaultValue={toPct(rates.fuelSurchargePct)} placeholder={toPct(defaultRates.fuelSurchargePct)} step="0.01" />
        <Field label="Rush surcharge" name="rushSurchargePct" unit="%"
          defaultValue={toPct(rates.rushSurchargePct)} placeholder={toPct(defaultRates.rushSurchargePct)} step="0.01" />
      </Section>

      <Section title="Install Tasks" description="Per-unit labor rates">
        {INSTALL_TASKS.map(({ key, label }) => (
          <Field key={key} label={label} name={`install_${key}`} unit="$/unit"
            defaultValue={rates.installTaskRates?.[key] ?? 0}
            placeholder={rates.installTaskRates?.[key] ?? 0}
            step="0.01" />
        ))}
      </Section>

      <Section title="Overhead & Margin" description="Applied to the direct cost subtotal (as whole number percentages)">
        <Field label="Overhead" name="overheadPct" unit="%"
          defaultValue={toPct(rates.overheadPct)} placeholder={toPct(defaultRates.overheadPct)} step="0.01" />
        <Field label="Margin" name="marginPct" unit="%"
          defaultValue={toPct(rates.marginPct)} placeholder={toPct(defaultRates.marginPct)} step="0.01" />
      </Section>

      <div className="flex items-center justify-end gap-4 pb-4">
        <p className="text-xs text-zinc-400">
          Percentages entered as whole numbers (e.g. 9&nbsp;=&nbsp;9%)
        </p>
        <button
          type="submit" disabled={pending}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save Rate Card'}
        </button>
      </div>
    </form>
  );
}
