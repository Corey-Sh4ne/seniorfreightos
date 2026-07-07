'use client';

import { useMemo, useState } from 'react';
import ClientFormModal from './ClientFormModal';

const AVATAR_BG = ['#EFF6FF', '#FDF4FF', '#ECFDF5'];
const AVATAR_FG = ['#1D4ED8', '#7E22CE', '#065F46'];

function getTierBadgeStyle(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('premium') || n.includes('white glove')) {
    return { background: '#FEF3C7', color: '#92400E', border: '1px solid #F59E0B' };
  }
  if (n.includes('standard')) {
    return { background: '#DBEAFE', color: '#1D4ED8', border: '1px solid #2563EB' };
  }
  if (n.includes('budget')) {
    return { background: '#F3F4F6', color: '#4B5563', border: '1px solid #6B7280' };
  }
  return { background: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB' };
}

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

export default function ClientsClient({ clients, rateCards, clerkUsers, projectCounts = {} }) {
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
                {['Company', 'Contact', 'Rate Card', 'Projects', 'Clerk Account', ''].map((col) => (
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
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-zinc-400">
                    No clients yet. Add your first client to get started.
                  </td>
                </tr>
              ) : (
                clients.map((client, idx) => (
                  <tr key={client.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors duration-100">
                    <td className="px-4 py-3 font-semibold text-zinc-900 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: AVATAR_BG[idx % AVATAR_BG.length],
                            color: AVATAR_FG[idx % AVATAR_FG.length],
                          }}
                        >
                          {client.name?.charAt(0).toUpperCase() || '?'}
                        </span>
                        {client.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      <div>{client.contactName || '—'}</div>
                      {client.contactEmail && (
                        <div className="text-xs text-zinc-400">{client.contactEmail}</div>
                      )}
                      <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
                        {client.contactPhone || ''}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        style={{
                          ...getTierBadgeStyle(client.rateCardName),
                          borderRadius: '6px',
                          padding: '3px 10px',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        {client.rateCardName || 'Default'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span style={{ fontWeight: 700, color: '#111827' }}>
                        {projectCounts[client.name] || 0}
                      </span>
                      <span style={{ fontSize: '12px', color: '#9CA3AF', marginLeft: '4px' }}>
                        projects
                      </span>
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
