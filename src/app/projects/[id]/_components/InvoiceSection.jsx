'use client';

import { useTransition } from 'react';
import { generateInvoice, updateInvoiceStatus } from '../_actions/projectActions';

const DATE_FMT = new Intl.DateTimeFormat('en-US', {
  month: 'short', day: 'numeric', year: 'numeric',
});

const STATUS_PILL = {
  draft: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  sent:  'bg-blue-50 text-blue-700 border-blue-200',
  paid:  'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default function InvoiceSection({ project }) {
  const [pending, startTransition] = useTransition();
  const {
    id, invoiceNumber, invoiceGeneratedAt, invoiceStatus,
  } = project;

  function handleGenerate() {
    if (!window.confirm(
      `Generate an invoice for ${project.code}? The project will move to the Invoiced stage.`,
    )) return;
    startTransition(async () => {
      const res = await generateInvoice(id);
      if (res?.error) window.alert(res.error);
    });
  }

  function handleStatus(next) {
    startTransition(async () => {
      const res = await updateInvoiceStatus(id, next);
      if (res?.error) window.alert(res.error);
    });
  }

  if (!invoiceNumber) {
    return (
      <div className="bg-white border-b border-zinc-200 px-4 pb-4 shrink-0">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50/60 px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-blue-900">Ready to invoice</p>
            <p className="text-xs text-blue-700/80 mt-0.5">
              This project is complete. Generate an invoice to bill the client.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={pending}
            className="shrink-0 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-semibold text-xs px-4 py-2 transition-colors"
          >
            {pending ? 'Generating…' : 'Generate Invoice'}
          </button>
        </div>
      </div>
    );
  }

  const generatedStr = invoiceGeneratedAt
    ? DATE_FMT.format(new Date(invoiceGeneratedAt))
    : '—';
  const pillClass = STATUS_PILL[invoiceStatus] ?? STATUS_PILL.draft;
  const statusLabel = invoiceStatus
    ? invoiceStatus.charAt(0).toUpperCase() + invoiceStatus.slice(1)
    : 'Draft';

  return (
    <div className="bg-white border-b border-zinc-200 px-4 pb-4 shrink-0">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-zinc-900">{invoiceNumber}</p>
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${pillClass}`}>
              <span className="text-[8px] leading-none">●</span>
              {statusLabel}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">Generated {generatedStr}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={`/projects/${id}/invoice`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-white"
          >
            Download Invoice
          </a>
          {invoiceStatus !== 'sent' && invoiceStatus !== 'paid' && (
            <button
              type="button"
              onClick={() => handleStatus('sent')}
              disabled={pending}
              className="rounded-lg border border-blue-300 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors"
            >
              Mark as Sent
            </button>
          )}
          {invoiceStatus !== 'paid' && (
            <button
              type="button"
              onClick={() => handleStatus('paid')}
              disabled={pending}
              className="rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors"
            >
              Mark as Paid
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
