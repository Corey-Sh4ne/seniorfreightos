'use client';

import Modal from '@/app/rate-card/_components/Modal';

/**
 * Centered confirmation dialog used for destructive actions. Renders a title,
 * a body message, and Cancel / Confirm buttons; the confirm button is styled
 * red for delete flows by default and shows a pending state during the action.
 */
export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  pending = false,
  error = null,
  onConfirm,
  onClose,
}) {
  return (
    <Modal title={title} onClose={onClose} maxWidth="max-w-md">
      <div className="space-y-5 px-6 py-5">
        <p className="text-sm leading-relaxed text-zinc-600">{message}</p>

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
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {pending ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
