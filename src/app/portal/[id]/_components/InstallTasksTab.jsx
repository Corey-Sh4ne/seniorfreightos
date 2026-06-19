export default function InstallTasksTab({ installTasks }) {
  if (!installTasks.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-6 h-6 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-zinc-600">No install tasks yet</p>
        <p className="text-xs text-zinc-400 mt-1">Tasks will appear here once scheduled.</p>
      </div>
    );
  }

  const completedCount = installTasks.filter((t) => t.completed).length;
  const pct = Math.round((completedCount / installTasks.length) * 100);

  return (
    <div className="space-y-5">
      {/* Progress header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-zinc-700">
            {completedCount} of {installTasks.length} task{installTasks.length !== 1 ? 's' : ''} complete
          </span>
          <span className="text-xs font-semibold text-zinc-400">{pct}%</span>
        </div>
        <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-400 rounded-full transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Task list */}
      <div className="divide-y divide-zinc-100">
        {installTasks.map((t) => (
          <div key={t.id} className="flex items-center justify-between py-3.5 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={[
                  'w-5 h-5 rounded-full flex items-center justify-center shrink-0',
                  t.completed
                    ? 'bg-emerald-500'
                    : 'border-2 border-zinc-300 bg-white',
                ].join(' ')}
              >
                {t.completed && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span
                className={[
                  'text-sm capitalize',
                  t.completed
                    ? 'text-zinc-400 line-through'
                    : 'text-zinc-800 font-medium',
                ].join(' ')}
              >
                {t.type.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs text-zinc-400 tabular-nums">
                {t.qty.toLocaleString()} units
              </span>
              <span
                className={[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
                  t.completed
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : 'bg-zinc-50 text-zinc-600 border-zinc-200',
                ].join(' ')}
              >
                {t.completed ? 'Done' : 'Pending'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
