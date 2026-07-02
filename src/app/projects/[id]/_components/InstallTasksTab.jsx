'use client';

import { useState, useTransition } from 'react';
import Modal from '@/app/rate-card/_components/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import {
  addInstallTask,
  toggleInstallTask,
  updateInstallTask,
  deleteInstallTask,
} from '../_actions/projectActions';

const TYPE_LABELS = {
  assemble:     'Assemble furniture',
  hang_art:     'Hang artwork / mirrors',
  mount_tv:     'Mount TV / fixture',
  place:        'Place & position',
  debris:       'Debris removal / unpack',
  window_treat: 'Install window treatments',
};

const TASK_TYPES = Object.keys(TYPE_LABELS);

// Install tasks are editable up until the install phase begins — after that,
// the checklist reflects work in progress and must not be altered.
const EDITABLE_STATUSES = new Set([
  'prospect', 'quoted', 'denied', 'awarded',
  'receiving', 'staging', 'scheduled', 'delivered',
]);

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

function InstallTaskModal({ projectId, task, onClose }) {
  const isEdit = Boolean(task);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = isEdit
        ? await updateInstallTask(task.id, projectId, fd)
        : await addInstallTask(projectId, fd);
      if (res?.error) setError(res.error);
      else onClose();
    });
  }

  return (
    <Modal
      title={isEdit ? 'Edit Install Task' : 'Add Install Task'}
      subtitle={isEdit ? 'Update this install task' : 'Add a task to the install checklist'}
      onClose={onClose}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Field label="Type" required>
          <select
            name="type"
            defaultValue={task?.type ?? TASK_TYPES[0]}
            className={INPUT_CLS}
          >
            {TASK_TYPES.map((t) => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </select>
        </Field>

        <Field label="Qty" required>
          <input
            name="qty"
            type="number"
            min="1"
            required
            defaultValue={task?.qty ?? 1}
            className={INPUT_CLS}
          />
        </Field>

        <Field label="Notes">
          <input
            name="notes"
            type="text"
            placeholder="Optional notes"
            defaultValue={task?.notes ?? ''}
            className={INPUT_CLS}
          />
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
            {pending ? 'Saving…' : isEdit ? 'Save Changes' : 'Save Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function InstallTasksTab({ installTasks, projectId, projectStatus }) {
  const [pending, startTransition] = useTransition();
  const [showAdd, setShowAdd] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [deletePending, startDeleteTransition] = useTransition();
  const completedCount = installTasks.filter((t) => t.completed).length;

  const canEdit = EDITABLE_STATUSES.has(projectStatus);

  function handleToggle(taskId, completed) {
    startTransition(() => toggleInstallTask(taskId, !completed, projectId));
  }

  function handleDelete() {
    if (!deletingTask) return;
    setDeleteError(null);
    startDeleteTransition(async () => {
      const res = await deleteInstallTask(deletingTask.id, projectId);
      if (res?.error) setDeleteError(res.error);
      else setDeletingTask(null);
    });
  }

  const deleteTaskLabel = deletingTask
    ? (TYPE_LABELS[deletingTask.type] ?? deletingTask.type)
    : '';

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
              {canEdit && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingTask(task)}
                    className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-white"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingTask(task)}
                    className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {showAdd && (
        <InstallTaskModal projectId={projectId} onClose={() => setShowAdd(false)} />
      )}

      {editingTask && (
        <InstallTaskModal
          projectId={projectId}
          task={editingTask}
          onClose={() => setEditingTask(null)}
        />
      )}

      {deletingTask && (
        <ConfirmModal
          title="Delete Install Task?"
          message={`Are you sure you want to delete the "${deleteTaskLabel}" task? This cannot be undone.`}
          confirmLabel="Delete"
          pending={deletePending}
          error={deleteError}
          onConfirm={handleDelete}
          onClose={() => {
            if (deletePending) return;
            setDeletingTask(null);
            setDeleteError(null);
          }}
        />
      )}
    </div>
  );
}
