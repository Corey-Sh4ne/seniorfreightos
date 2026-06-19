'use client';

import { useTransition } from 'react';
import { toggleInstallTask } from '../_actions/projectActions';

const TYPE_LABELS = {
  assemble:     'Assemble furniture',
  hang_art:     'Hang artwork / mirrors',
  mount_tv:     'Mount TV / fixture',
  place:        'Place & position',
  debris:       'Debris removal / unpack',
  window_treat: 'Install window treatments',
};

export default function InstallTasksTab({ installTasks, projectId }) {
  const [pending, startTransition] = useTransition();
  const completedCount = installTasks.filter((t) => t.completed).length;

  function handleToggle(taskId, completed) {
    startTransition(() => toggleInstallTask(taskId, !completed, projectId));
  }

  return (
    <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 bg-zinc-50">
        <h3 className="text-sm font-semibold text-zinc-900">Install Tasks</h3>
        <span className="text-sm text-emerald-600 font-medium">
          {completedCount} of {installTasks.length} complete
        </span>
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
    </div>
  );
}
