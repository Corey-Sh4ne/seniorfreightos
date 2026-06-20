'use client';

import { useState, useTransition } from 'react';
import Modal from '@/app/rate-card/_components/Modal';
import { addInstallTask, toggleInstallTask } from '../_actions/projectActions';

const TYPE_LABELS = {
  assemble:     'Assemble furniture',
  hang_art:     'Hang artwork / mirrors',
  mount_tv:     'Mount TV / fixture',
  place:        'Place & position',
  debris:       'Debris removal / unpack',
  window_treat: 'Install window treatments',
};

const TASK_TYPES = Object.keys(TYPE_LABELS);

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

function AddInstallTaskModal({ projectId, onClose }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await addInstallTask(projectId, fd);
      if (res?.error) setError(res.error);
      else onClose();
    });
  }

  return (
    <Modal title="Add Install Task" subtitle="Add a task to the install checklist" onClose={onClose} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Field label="Type" required>
          <select name="type" defaultValue={TASK_TYPES[0]} className={INPUT_CLS}>
            {TASK_TYPES.map((t) => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </select>
        </Field>

        <Field label="Qty" required>
          <input name="qty" type="number" min="1" defaultValue="1" required className={INPUT_CLS} />
        </Field>

        <Field label="Notes">
          <input name="notes" type="text" placeholder="Optional notes" className={INPUT_CLS} />
        </Field>

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
            {pending ? 'Saving…' : 'Save Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function InstallTasksTab({ installTasks, projectId }) {
  const [pending, startTransition] = useTransition();
  const [showAdd, setShowAdd] = useState(false);
  const completedCount = installTasks.filter((t) => t.completed).length;

  function handleToggle(taskId, completed) {
    startTransition(() => toggleInstallTask(taskId, !completed, projectId));
  }

  return (
    <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-zinc-200 bg-zinc-50">
        <h3 className="text-sm font-semibold text-zinc-900">Install Tasks</h3>
        <div className="flex items-center gap-4">
          <span className="text-sm text-emerald-600 font-medium">
            {completedCount} of {installTasks.length} complete
          </span>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            + Add Task
          </button>
        </div>
      </div>

      {installTasks.length === 0 ? (
        <p className="px-4 py-10 text-center text-zinc-400 text-sm">
          No install tasks on this project yet.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {installTasks.map((task) => (
            <li key={task.id} className="flex items-start gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors">
              <input
                type="checkbox"
                id={`task-${task.id}`}
                checked={task.completed}
                onChange={() => handleToggle(task.id, task.completed)}
                disabled={pending}
                className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-emerald-600
                           accent-emerald-600 cursor-pointer disabled:opacity-50"
              />
              <label
                htmlFor={`task-${task.id}`}
                className={`flex-1 text-sm cursor-pointer select-none ${
                  task.completed ? 'line-through text-zinc-400' : 'text-zinc-700'
                }`}
              >
                <span className="font-medium">
                  {TYPE_LABELS[task.type] ?? task.type}
                </span>
                <span className="text-zinc-400 ml-1">
                  ({task.qty} {task.qty === 1 ? 'unit' : 'units'})
                </span>
                {task.notes && (
                  <span className="block text-xs text-zinc-400 mt-0.5">{task.notes}</span>
                )}
              </label>
            </li>
          ))}
        </ul>
      )}

      {showAdd && (
        <AddInstallTaskModal projectId={projectId} onClose={() => setShowAdd(false)} />
      )}
    </div>
  );
}
