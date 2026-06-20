'use client';

import { useMemo, useState, useTransition } from 'react';
import Modal from './Modal';
import { assignCompanies } from '../_actions/saveRateCard';

export default function AssignCompaniesModal({ card, clientNames, assignments, rateCards, onClose }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // clientName -> rateCardId currently assigned (any card)
  const assignedTo = useMemo(() => {
    const map = {};
    for (const a of assignments) if (a.rateCardId) map[a.clientName] = a.rateCardId;
    return map;
  }, [assignments]);

  const cardNames = useMemo(() => {
    const map = {};
    for (const c of rateCards) map[c.id] = c.name;
    return map;
  }, [rateCards]);

  const [selected, setSelected] = useState(() => {
    const init = new Set();
    for (const name of clientNames) if (assignedTo[name] === card.id) init.add(name);
    return init;
  });

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? clientNames.filter((n) => n.toLowerCase().includes(q)) : clientNames;
  }, [clientNames, search]);

  function toggle(name) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res = await assignCompanies(card.id, [...selected]);
      if (res?.error) setError(res.error);
      else onClose();
    });
  }

  return (
    <Modal title={`Assign Companies to ${card.name}`} onClose={onClose} maxWidth="max-w-lg">
      <div className="px-6 py-5">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search companies…"
          className="block w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />

        <div className="mt-3 max-h-80 divide-y divide-zinc-100 overflow-y-auto rounded-lg border border-zinc-200">
          {visible.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-zinc-400">No companies found.</p>
          ) : (
            visible.map((name) => {
              const otherCardId = assignedTo[name];
              const onOtherCard = otherCardId && otherCardId !== card.id;
              return (
                <label key={name} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-zinc-50">
                  <input
                    type="checkbox" checked={selected.has(name)} onChange={() => toggle(name)}
                    className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="flex-1 text-sm text-zinc-800">{name}</span>
                  {onOtherCard && !selected.has(name) && (
                    <span className="text-xs text-zinc-400">on {cardNames[otherCardId] ?? 'another card'}</span>
                  )}
                </label>
              );
            })
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100">
            Cancel
          </button>
          <button onClick={handleSave} disabled={pending} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50">
            {pending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
