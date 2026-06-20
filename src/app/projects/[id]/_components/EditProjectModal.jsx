'use client';

import { useState, useTransition } from 'react';
import Modal from '@/app/rate-card/_components/Modal';
import { updateProject } from '../_actions/projectActions';

const INPUT_CLS =
  'block w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 ' +
  'shadow-sm placeholder:text-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none';

function Field({ label, required, children }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-zinc-600">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function ReadOnlyRow({ label, value }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="text-sm font-medium text-zinc-900">{value}</p>
    </div>
  );
}

export default function EditProjectModal({ project, onClose }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateProject(project.id, fd);
      if (res?.error) setError(res.error);
      else onClose();
    });
  }

  return (
    <Modal
      title="Edit Project"
      subtitle="Update facility, contact, and logistics fields"
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
          <ReadOnlyRow label="Project Code" value={project.code} />
          <ReadOnlyRow label="Client" value={project.clientName} />
        </div>

        <Field label="Facility Name" required>
          <input
            name="facility_name"
            type="text"
            required
            defaultValue={project.facilityName ?? ''}
            className={INPUT_CLS}
          />
        </Field>

        <Field label="Facility Address">
          <input
            name="facility_address"
            type="text"
            defaultValue={project.facilityAddress ?? ''}
            className={INPUT_CLS}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Contact Name">
            <input
              name="contact_name"
              type="text"
              defaultValue={project.contactName ?? ''}
              className={INPUT_CLS}
            />
          </Field>
          <Field label="Contact Email">
            <input
              name="contact_email"
              type="email"
              defaultValue={project.contactEmail ?? ''}
              className={INPUT_CLS}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Miles from Hub">
            <input
              name="miles_from_hub"
              type="number"
              min="0"
              step="0.1"
              defaultValue={project.milesFromHub ?? 0}
              className={INPUT_CLS}
            />
          </Field>
          <Field label="Storage Days">
            <input
              name="storage_days"
              type="number"
              min="0"
              step="1"
              defaultValue={project.storageDays ?? 0}
              className={INPUT_CLS}
            />
          </Field>
        </div>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="rush_delivery"
            defaultChecked={!!project.rushDelivery}
            className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <span className="text-sm font-medium text-zinc-700 select-none">
            Rush Delivery
            <span className="ml-1.5 text-xs text-zinc-400 font-normal">(surcharge applies)</span>
          </span>
        </label>

        <Field label="Notes">
          <textarea
            name="notes"
            rows={4}
            defaultValue={project.notes ?? ''}
            placeholder="Internal notes about this project…"
            className={`${INPUT_CLS} resize-none`}
          />
        </Field>

        <div className="flex items-center justify-end gap-3 border-t border-zinc-200 pt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {pending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
