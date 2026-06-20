'use client';

import { useMemo, useState } from 'react';
import ClientFormModal from './ClientFormModal';

function LinkBadge({ linked }) {
  return linked ? (
    <span className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
      Linked
    </span>
  ) : (
    <span className="inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-500">
      Not linked
    </span>
  );
}

export default function ClientsClient({ clients, rateCards, clerkUsers }) {
  const [modal, setModal] = useState(null);

  const otherLinkedClerkIds = useMemo(
    () =>
      clients
        .filter((c) => !modal?.client || c.id !== modal.client.id)
        .map((c) => c.clerkUserId)
        .filter(Boolean),
    [clients, modal?.client],
  );

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold leading-tight text-zinc-900">Clients</h1>
          <p className="mt-0.5 text-sm text-zinc-400">Manage client companies and portal access</p>
        </div>
        <button
          onClick={() => setModal({ mode: 'create', client: null })}
          className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 active:bg-blue-800"
        >
          Add Client
        </button>
      </header>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/80">
                {['Company', 'Contact', 'Rate Card', 'Clerk Account', ''].map((col) => (
                  <th
                    key={col || 'actions'}
                    className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-400 whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-zinc-400">
                    No clients yet. Add your first client to get started.
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id} className="border-b border-zinc-100 last:border-0">
                    <td className="px-4 py-3 font-semibold text-zinc-900 whitespace-nowrap">{client.name}</td>
                    <td className="px-4 py-3 text-zinc-600">
                      <div>{client.contactName || '—'}</div>
                      {client.contactEmail && (
                        <div className="text-xs text-zinc-400">{client.contactEmail}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">
                      {client.rateCardName ?? 'Default'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <LinkBadge linked={Boolean(client.clerkUserId)} />
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => setModal({ mode: 'edit', client })}
                        className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <ClientFormModal
          mode={modal.mode}
          client={modal.client}
          rateCards={rateCards}
          clerkUsers={clerkUsers}
          linkedClerkIds={otherLinkedClerkIds}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
