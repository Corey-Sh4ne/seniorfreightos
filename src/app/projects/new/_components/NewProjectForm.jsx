'use client';

import { useActionState } from 'react';
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

export default function NewProjectForm() {
  const [state, action, pending] = useActionState(createProject, INITIAL_STATE);
  const errors = state?.errors ?? {};

  return (
    <form action={action} className="space-y-5" noValidate>
      {/* Client Name */}
      <div>
        <Label htmlFor="client_name" required>Client Name</Label>
        <input
          id="client_name"
          name="client_name"
          type="text"
          autoComplete="organization"
          disabled={pending}
          placeholder="e.g. Sunrise Senior Living"
          className={`${INPUT_CLS} ${errors.client_name ? 'border-red-400' : ''}`}
        />
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
      <div className="grid grid-cols-2 gap-4">
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
      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-zinc-900 hover:bg-zinc-700 active:bg-zinc-800 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors"
        >
          {pending ? 'Creating…' : 'Create Project'}
        </button>
        <Link
          href="/dashboard"
          className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
