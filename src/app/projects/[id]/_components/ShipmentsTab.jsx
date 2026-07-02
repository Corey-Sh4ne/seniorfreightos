'use client';

import { useState, useTransition } from 'react';
import Modal from '@/app/rate-card/_components/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import {
  addShipment,
  markShipmentReceived,
  updateShipment,
  deleteShipment,
} from '../_actions/projectActions';

const DATE_FMT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day:   'numeric',
  timeZone: 'UTC',
});

const CATEGORIES = [
  'Casegoods', 'Seating', 'Mattresses & Bedding', 'Window Treatments',
  'Art & Decor', 'Lighting', 'Signage', 'Appliances', 'Flooring',
  'Outdoor Furniture', 'Fitness Equipment',
];

// Shipments are only editable while the project is still in the pre-receiving
// stages. Once warehouse work starts, the shipment list becomes the record.
const EDITABLE_STATUSES = new Set(['prospect', 'quoted', 'denied', 'awarded']);

const INPUT_CLS =
  'block w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 ' +
  'shadow-sm placeholder:text-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none';

function formatEta(isoDate) {
  if (!isoDate) return '—';
  return DATE_FMT.format(new Date(isoDate));
}

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

function ShipmentModal({ projectId, shipment, onClose }) {
  const isEdit = Boolean(shipment);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = isEdit
        ? await updateShipment(shipment.id, projectId, fd)
        : await addShipment(projectId, fd);
      if (res?.error) setError(res.error);
      else onClose();
    });
  }

  return (
    <Modal
      title={isEdit ? 'Edit Shipment' : 'Add Shipment'}
      subtitle={isEdit ? 'Update the shipment details' : 'Log a new shipment on this project'}
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Field label="Vendor" required>
          <input
            name="vendor"
            type="text"
            required
            defaultValue={shipment?.vendor ?? ''}
            className={INPUT_CLS}
          />
        </Field>

        <Field label="Category" required>
          <select
            name="category"
            defaultValue={shipment?.category ?? CATEGORIES[0]}
            className={INPUT_CLS}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>

        <Field label="Description" required>
          <input
            name="description"
            type="text"
            required
            defaultValue={shipment?.description ?? ''}
            className={INPUT_CLS}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Qty" required>
            <input
              name="qty"
              type="number"
              min="1"
              required
              defaultValue={shipment?.qty ?? 1}
              className={INPUT_CLS}
            />
          </Field>
          <Field label="Weight per unit (lbs)" required>
            <input
              name="weight_per_unit_lbs"
              type="number"
              min="0"
              step="0.01"
              required
              defaultValue={shipment?.weightPerUnitLbs ?? 0}
              className={INPUT_CLS}
            />
          </Field>
          <Field label="Cartons">
            <input
              name="cartons"
              type="number"
              min="0"
              defaultValue={shipment?.cartons ?? 0}
              className={INPUT_CLS}
            />
          </Field>
          <Field label="ETA">
            <input
              name="eta"
              type="date"
              defaultValue={shipment?.eta ?? ''}
              className={INPUT_CLS}
            />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-zinc-200 pt-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {pending ? 'Saving…' : isEdit ? 'Save Changes' : 'Save Shipment'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function ShipmentsTab({ shipments, projectId, projectStatus }) {
  const [pending, startTransition] = useTransition();
  const [showAdd, setShowAdd] = useState(false);
  const [editingShipment, setEditingShipment] = useState(null);
  const [deletingShipment, setDeletingShipment] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [deletePending, startDeleteTransition] = useTransition();

  const canEdit = EDITABLE_STATUSES.has(projectStatus);

  function handleToggle(shipmentId, currentReceived) {
    startTransition(() => markShipmentReceived(shipmentId, !currentReceived, projectId));
  }

  function handleDelete() {
    if (!deletingShipment) return;
    setDeleteError(null);
    startDeleteTransition(async () => {
      const res = await deleteShipment(deletingShipment.id, projectId);
      if (res?.error) setDeleteError(res.error);
      else setDeletingShipment(null);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">Shipments</h3>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          + Add Shipment
        </button>
      </div>

      <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
              <th className="px-4 py-3 text-left">Vendor</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-4 py-3 text-right">Lbs/Unit</th>
              <th className="px-4 py-3 text-right">Total Wt</th>
              <th className="px-4 py-3 text-left">ETA</th>
              <th className="px-4 py-3 text-center">Received</th>
              {canEdit && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {shipments.map((s) => (
              <tr key={s.id} className="hover:bg-zinc-50 transition-colors">
                <td className="px-4 py-3 font-medium text-zinc-900">{s.vendor}</td>
                <td className="px-4 py-3 text-zinc-500 text-xs">{s.category}</td>
                <td className="px-4 py-3 text-zinc-600">{s.description}</td>
                <td className="px-4 py-3 text-right text-zinc-700">{s.qty}</td>
                <td className="px-4 py-3 text-right text-zinc-500">{s.weightPerUnitLbs} lb</td>
                <td className="px-4 py-3 text-right font-semibold text-zinc-900">
                  {(s.qty * s.weightPerUnitLbs).toLocaleString()} lb
                </td>
                <td className="px-4 py-3 text-zinc-500">{formatEta(s.eta)}</td>
                <td className="px-4 py-3 text-center">
                  {s.received ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                      ✓ Received
                    </span>
                  ) : (
                    <button
                      onClick={() => handleToggle(s.id, s.received)}
                      disabled={pending}
                      className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100
                                 border border-emerald-300 text-emerald-700 text-xs font-medium
                                 px-3 py-1 rounded-md transition-colors disabled:opacity-50"
                    >
                      Mark Received
                    </button>
                  )}
                </td>
                {canEdit && (
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingShipment(s)}
                        className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingShipment(s)}
                        className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}

            {!shipments.length && (
              <tr>
                <td colSpan={canEdit ? 9 : 8} className="px-4 py-10 text-center text-zinc-400 text-sm">
                  No shipments on this project yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <ShipmentModal projectId={projectId} onClose={() => setShowAdd(false)} />
      )}

      {editingShipment && (
        <ShipmentModal
          projectId={projectId}
          shipment={editingShipment}
          onClose={() => setEditingShipment(null)}
        />
      )}

      {deletingShipment && (
        <ConfirmModal
          title="Delete Shipment?"
          message={`Are you sure you want to delete this shipment from ${deletingShipment.vendor}? This cannot be undone.`}
          confirmLabel="Delete"
          pending={deletePending}
          error={deleteError}
          onConfirm={handleDelete}
          onClose={() => {
            if (deletePending) return;
            setDeletingShipment(null);
            setDeleteError(null);
          }}
        />
      )}
    </div>
  );
}
