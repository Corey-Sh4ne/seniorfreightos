'use client';

import { markShipmentReceived, markInstallTaskComplete } from '../_actions/opsActions';

const TASK_TYPE_LABELS = {
  assemble: 'Assemble furniture',
  hang_art: 'Hang artwork / mirrors',
  mount_tv: 'Mount TV / fixture',
  place: 'Place & position',
  debris: 'Debris removal / unpack',
  window_treat: 'Install window treatments',
};

const CHECKBOX =
  'h-4 w-4 rounded border-zinc-300 text-emerald-600 accent-emerald-600 disabled:cursor-not-allowed disabled:opacity-60';

/** A freely-toggleable shipment row (receiving stage). */
export function ShipmentRow({ item, projectId, editable, run }) {
  return (
    <label className={`flex items-center gap-3 px-5 py-2.5 ${editable ? 'cursor-pointer' : 'cursor-default'}`}>
      <input
        type="checkbox"
        checked={item.received}
        disabled={!editable}
        onChange={() => run(() => markShipmentReceived(item.id, projectId, !item.received))}
        className={CHECKBOX}
      />
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-medium ${item.received ? 'text-zinc-400 line-through' : 'text-zinc-800'}`}>
          {item.vendor}
        </p>
        <p className="text-xs text-zinc-400">
          {item.category} · {item.qty} {item.qty === 1 ? 'unit' : 'units'}
        </p>
      </div>
    </label>
  );
}

/** A freely-toggleable install-task row (installing stage). */
export function TaskRow({ item, projectId, editable, run }) {
  return (
    <label className={`flex items-center gap-3 px-5 py-2.5 ${editable ? 'cursor-pointer' : 'cursor-default'}`}>
      <input
        type="checkbox"
        checked={item.completed}
        disabled={!editable}
        onChange={() => run(() => markInstallTaskComplete(item.id, projectId, !item.completed))}
        className={CHECKBOX}
      />
      <span className={`flex-1 text-sm ${item.completed ? 'text-zinc-400 line-through' : 'text-zinc-700'}`}>
        <span className="font-medium">{TASK_TYPE_LABELS[item.type] ?? item.type}</span>
        <span className="ml-1 text-zinc-400">({item.qty} {item.qty === 1 ? 'unit' : 'units'})</span>
      </span>
    </label>
  );
}
