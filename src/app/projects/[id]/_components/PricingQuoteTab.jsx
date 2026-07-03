'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import QuoteBreakdown from '@/components/QuoteBreakdown';
import { sendQuote, resendQuote } from '../_actions/projectActions';

const DATE_FMT = new Intl.DateTimeFormat('en-US', {
  month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
});

/** DB install task types → pricingEngine / rate card task types. */
const TASK_TYPE_MAP = {
  assemble: 'assemble_furniture',
  hang_art: 'hang_artwork',
  mount_tv: 'mount_tv_fixture',
  place: 'place_and_position',
  debris: 'debris_removal',
  window_treat: 'install_window_treatments',
};

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Inline pricing math — mirrors src/utils/pricingEngine.js exactly but is kept
 * local to this component so the quote preview recalculates instantly client-side
 * when the rate card selection changes. pricingEngine.js is never imported here.
 */
function buildBreakdown(rates, project, shipments, installTasks) {
  const totalWeight = shipments.reduce((s, sh) => s + sh.qty * sh.weightPerUnitLbs, 0);
  const taskRates = rates.installTaskRates ?? {};

  const receivingCost = round2(totalWeight * rates.receivingPerLb);
  const storageCost = round2(totalWeight * rates.storagePerLbPerDay * project.storageDays);

  const distanceFactor = 1 + Math.max(0, project.milesFromHub - 50) * 0.0015;
  const freightCost = round2(
    Math.max(totalWeight * rates.freightPerLb * distanceFactor, rates.freightMinimum),
  );

  const fuelSurcharge = round2(freightCost * rates.fuelSurchargePct);
  const rushSurcharge = project.rushDelivery
    ? round2((freightCost + fuelSurcharge) * rates.rushSurchargePct)
    : 0;

  const installLineItems = installTasks.map((task) => {
    const type = TASK_TYPE_MAP[task.type] ?? task.type;
    const rate = taskRates[type] ?? 0;
    return { type, qty: task.qty, rate, total: round2(task.qty * rate) };
  });
  const installCost = round2(installLineItems.reduce((s, i) => s + i.total, 0));

  const directCost = round2(
    receivingCost + storageCost + freightCost + fuelSurcharge + rushSurcharge + installCost,
  );
  const overhead = round2(directCost * rates.overheadPct);
  const fullyLoadedCost = round2(directCost + overhead);
  const margin = round2(fullyLoadedCost * rates.marginPct);
  const total = round2(fullyLoadedCost + margin);

  return {
    totalWeight,
    receiving: { weight: totalWeight, rate: rates.receivingPerLb, total: receivingCost },
    storage: { weight: totalWeight, days: project.storageDays, rate: rates.storagePerLbPerDay, total: storageCost },
    freight: { weight: totalWeight, rate: rates.freightPerLb, min: rates.freightMinimum, total: freightCost },
    fuel: { pct: rates.fuelSurchargePct, total: fuelSurcharge },
    rush: project.rushDelivery ? { pct: rates.rushSurchargePct, total: rushSurcharge } : null,
    installTasks: installLineItems,
    installCost,
    subtotal: directCost,
    overhead: { pct: rates.overheadPct, total: overhead },
    margin: { pct: rates.marginPct, total: margin },
    total,
  };
}

function Shell({ children }) {
  return (
    <div className="bg-[#1f3864] rounded-xl p-6 text-white">
      <p className="text-sm font-semibold mb-5">🔒 Pricing Quote — Visible to Admin Only</p>
      {children}
    </div>
  );
}

export default function PricingQuoteTab({
  project, shipments, installTasks,
  rateCards = [], suggestedRateCardId, defaultRateCardId,
  onEmailSent,
}) {
  const { status } = project;
  const [pending, setPending] = useState(false);

  // Build the grouped dropdown ordering: Suggested → Default → Other (A-Z).
  const groups = useMemo(() => {
    const suggested = rateCards.find((c) => c.id === suggestedRateCardId) ?? null;
    const def = rateCards.find((c) => c.id === defaultRateCardId) ?? null;
    const usedIds = new Set([suggested?.id, def?.id].filter(Boolean));
    const others = rateCards
      .filter((c) => !usedIds.has(c.id))
      .sort((a, b) => a.name.localeCompare(b.name));
    return { suggested, def, others };
  }, [rateCards, suggestedRateCardId, defaultRateCardId]);

  // Initial selection: the card already attached to a sent quote, else suggested,
  // else default, else the first available card.
  const initialId =
    (project.rates?.rateCardId && rateCards.some((c) => c.id === project.rates.rateCardId)
      ? project.rates.rateCardId
      : null) ||
    groups.suggested?.id || groups.def?.id || rateCards[0]?.id || '';
  const [selectedId, setSelectedId] = useState(initialId);

  // No rate card configured at all → blocked state, no send button.
  if (rateCards.length === 0) {
    return (
      <Shell>
        <p className="text-blue-100 text-sm mb-4">
          Cannot send a quote — no rate card has been configured yet.
        </p>
        <Link
          href="/rate-card"
          className="inline-flex items-center text-sm font-semibold text-blue-300 hover:text-white transition-colors"
        >
          Set up a rate card →
        </Link>
      </Shell>
    );
  }

  const selectedCard = rateCards.find((c) => c.id === selectedId) ?? rateCards[0];
  const liveBreakdown = buildBreakdown(selectedCard.rates, project, shipments, installTasks);
  const savedBreakdown = project.quotedPrice ?? null;
  const sentAt = project.updatedAt ? DATE_FMT.format(new Date(project.updatedAt)) : null;

  async function handleSend() {
    if (!selectedCard) return window.alert('Select a rate card first.');
    if (!window.confirm(
      `Send this quote to ${project.clientName}? They will receive it on their portal for review.`,
    )) return;
    onEmailSent?.({ to: project.contactEmail, subject: `Quote Ready for Review — ${project.code}` });
    setPending(true);
    try {
      await sendQuote(project.id, selectedCard.id, liveBreakdown);
    } finally {
      setPending(false);
    }
  }

  async function handleResend() {
    onEmailSent?.({ to: project.contactEmail, subject: `Quote Ready for Review — ${project.code}` });
    setPending(true);
    try {
      await resendQuote(project.id, selectedCard.id, liveBreakdown);
    } finally {
      setPending(false);
    }
  }

  // Quote already sent → read-only confirmation + the snapshotted breakdown.
  if (status === 'quoted') {
    return (
      <Shell>
        <div className="bg-emerald-500/15 border border-emerald-400/40 rounded-lg px-4 py-3 mb-5">
          <p className="text-sm font-semibold text-emerald-300">Quote sent — awaiting client response</p>
          {sentAt && <p className="text-xs text-emerald-200/80 mt-0.5">Sent {sentAt}</p>}
        </div>
        <QuoteBreakdown breakdown={savedBreakdown ?? liveBreakdown} theme="dark" />
      </Shell>
    );
  }

  const denied = status === 'denied';
  const canSend = status === 'prospect' || denied;

  return (
    <Shell>
      {denied && (
        <div className="bg-red-500/15 border border-red-400/40 rounded-lg px-4 py-3 mb-5">
          <p className="text-sm font-semibold text-red-300">Client denied this quote</p>
        </div>
      )}

      <label className="block mb-5">
        <span className="block text-xs font-semibold uppercase tracking-wide text-blue-300 mb-1.5">
          Rate Card
        </span>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full max-w-md bg-[#16294a] border border-blue-700 text-white text-sm rounded-lg
                     px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {groups.suggested && (
            <optgroup label="Suggested">
              <option value={groups.suggested.id}>{groups.suggested.name}</option>
            </optgroup>
          )}
          {groups.def && (
            <optgroup label="Default">
              <option value={groups.def.id}>{groups.def.name}</option>
            </optgroup>
          )}
          {groups.others.length > 0 && (
            <optgroup label="Other Rate Cards">
              {groups.others.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </optgroup>
          )}
        </select>
      </label>

      <QuoteBreakdown breakdown={liveBreakdown} theme="dark" />

      {canSend && (
        <div className="mt-5">
          <button
            onClick={denied ? handleResend : handleSend}
            disabled={pending}
            className="bg-blue-500 hover:bg-blue-400 disabled:bg-blue-500/50 disabled:cursor-not-allowed
                       text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
          >
            {pending
              ? (denied ? 'Resending…' : 'Sending…')
              : (denied ? 'Revise & Resend' : 'Send Quote to Client')}
          </button>
        </div>
      )}
    </Shell>
  );
}
