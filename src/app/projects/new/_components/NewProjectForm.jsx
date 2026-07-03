'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createProject } from '../_actions/createProject';

const INITIAL_STATE = { errors: {} };

function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-500" role="alert">{msg}</p>;
}

function Label({ htmlFor, children, required }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-zinc-700 mb-1">
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  );
}

const INPUT_CLS = [
  'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2',
  'text-sm text-zinc-900 placeholder:text-zinc-400',
  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
  'disabled:opacity-50',
].join(' ');

export default function NewProjectForm({ clients = [] }) {
  const [state, action, pending] = useActionState(createProject, INITIAL_STATE);
  const errors = state?.errors ?? {};

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const comboRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (comboRef.current && !comboRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const trimmed = query.trim();
  const lower = trimmed.toLowerCase();
  const filtered = trimmed
    ? clients.filter((c) => c.name.toLowerCase().includes(lower))
    : clients;
  const selected = clients.find((c) => c.name === query) ?? null;
  const showNotFound = trimmed.length > 0 && !selected;
  const canSubmit = !pending && !!selected;

  return (
    <form action={action} className="space-y-5" noValidate>
      {/* Client Name (combobox) */}
      <div>
        <Label htmlFor="client_name_search" required>Client Name</Label>
        <div className="relative" ref={comboRef}>
          <input
            id="client_name_search"
            type="text"
            autoComplete="off"
            disabled={pending}
            placeholder="Search clients…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls="client-name-listbox"
            className={`${INPUT_CLS} ${
              errors.client_name || showNotFound ? 'border-red-400' : ''
            }`}
          />
          {/* Hidden input is the value submitted with the form */}
          <input
            type="hidden"
            name="client_name"
            value={selected ? selected.name : ''}
          />

          {open && filtered.length > 0 && (
            <ul
              id="client-name-listbox"
              role="listbox"
              className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg"
            >
              {filtered.map((c) => (
                <li
                  key={c.id}
                  role="option"
                  aria-selected={c.name === query}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setQuery(c.name);
                    setOpen(false);
                  }}
                  className={`cursor-pointer px-3 py-2 text-sm hover:bg-zinc-100 ${
                    c.name === query ? 'bg-zinc-50 font-medium' : ''
                  }`}
                >
                  {c.name}
                </li>
              ))}
            </ul>
          )}

          {open && trimmed.length > 0 && filtered.length === 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-500 shadow-lg">
              No matching clients.
            </div>
          )}
        </div>

        {selected && (selected.contact_name || selected.contact_email) && (
          <p className="mt-1.5 text-xs text-zinc-500">
            {selected.contact_name}
            {selected.contact_name && selected.contact_email && ' · '}
            {selected.contact_email}
          </p>
        )}

        {showNotFound && (
          <p className="mt-1 text-xs text-amber-600">
            Client not found — add them on the{' '}
            <Link href="/clients" className="underline hover:text-amber-700">
              Clients page
            </Link>{' '}
            first.
          </p>
        )}

        <FieldError msg={errors.client_name} />
      </div>

      {/* Facility Name */}
      <div>
        <Label htmlFor="facility_name" required>Facility Name</Label>
        <input
          id="facility_name"
          name="facility_name"
          type="text"
          disabled={pending}
          placeholder="e.g. North Campus – Building B"
          className={`${INPUT_CLS} ${errors.facility_name ? 'border-red-400' : ''}`}
        />
        <FieldError msg={errors.facility_name} />
      </div>

      {/* Miles from Hub / Storage Days */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <Label htmlFor="miles_from_hub">Miles from Hub</Label>
          <input
            id="miles_from_hub"
            name="miles_from_hub"
            type="number"
            min="0"
            step="0.1"
            defaultValue="0"
            disabled={pending}
            className={INPUT_CLS}
          />
        </div>
        <div>
          <Label htmlFor="storage_days">Storage Days</Label>
          <input
            id="storage_days"
            name="storage_days"
            type="number"
            min="0"
            step="1"
            defaultValue="0"
            disabled={pending}
            className={INPUT_CLS}
          />
        </div>
      </div>

      {/* Rush Delivery */}
      <div className="flex items-center gap-3">
        <input
          id="rush_delivery"
          name="rush_delivery"
          type="checkbox"
          disabled={pending}
          className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
        />
        <label htmlFor="rush_delivery" className="text-sm font-medium text-zinc-700 cursor-pointer select-none">
          Rush Delivery
          <span className="ml-1.5 text-xs text-zinc-400 font-normal">(surcharge applies)</span>
        </label>
      </div>

      {/* Notes */}
      <div>
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          disabled={pending}
          placeholder="Optional notes about this project…"
          className={`${INPUT_CLS} resize-none`}
        />
      </div>

      {/* Submit / Cancel */}
      <div className="pt-2 space-y-3">
        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
        >
          {pending ? 'Creating…' : 'Create Project'}
        </button>
        <div className="text-center">
          <Link
            href="/dashboard"
            className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </div>
    </form>
  );
}
