'use client';

import { useState } from 'react';
import Modal from '@/app/rate-card/_components/Modal';

/**
 * Confirmation dialog for advancing a stage. Wraps the standard confirm/cancel
 * prompt with an optional note textarea whose value is passed to `onConfirm`
 * so the caller can persist it on the project.
 */
export default function StageConfirmModal({
  title,
  message,
  placeholder,
  confirmLabel = 'Confirm',
  pending = false,
  error = null,
  onConfirm,
  onClose,
}) {
  const [note, setNote] = useState('');

  return (
    <Modal title={title} onClose={onClose} maxWidth="max-w-md">
      <div className="space-y-5 px-6 py-5">
        <p className="text-sm leading-relaxed text-zinc-600">{message}</p>

        <div>
          <label
            htmlFor="stage-note"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500"
          >
            Add a note (optional)
          </label>
          <textarea
            id="stage-note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={placeholder}
            disabled={pending}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
          <p className="mt-1 text-xs text-zinc-400">
            Visible on the project detail and to the client.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

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
            type="button"
            onClick={() => onConfirm(note.trim())}
            disabled={pending}
            className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {pending ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
