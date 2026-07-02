'use client';

const DATE_FMT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

function formatTimestamp(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  // en-US default renders as "Jun 20, 2026, 2:34 PM" — swap the second comma
  // for "at" so it reads "Jun 20, 2026 at 2:34 PM" per the spec.
  return DATE_FMT.format(d).replace(/,(?=[^,]*$)/, ' at');
}

const ROLE_PILL_STYLES = {
  admin:              'bg-blue-50 text-blue-700 border-blue-200',
  dispatcher:         'bg-amber-50 text-amber-700 border-amber-200',
  install_crew_lead:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  client_user:        'bg-purple-50 text-purple-700 border-purple-200',
};

function roleLabel(role) {
  if (!role) return 'Unknown';
  return role
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function RolePill({ role }) {
  const style = ROLE_PILL_STYLES[role] ?? 'bg-zinc-100 text-zinc-700 border-zinc-200';
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${style}`}>
      {roleLabel(role)}
    </span>
  );
}

export default function ActivityLogTab({ entries }) {
  if (!entries?.length) {
    return (
      <div className="bg-white rounded-lg border border-zinc-200 p-8 text-center">
        <p className="text-sm text-zinc-500">No activity recorded yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-zinc-200 p-6 max-w-3xl">
      <h3 className="text-sm font-semibold text-zinc-700 mb-6">Project History</h3>
      <ol className="relative">
        {/* Vertical timeline rail */}
        <span
          aria-hidden="true"
          className="absolute left-[7px] top-1 bottom-1 w-px bg-zinc-200"
        />
        {entries.map((entry) => (
          <li key={entry.id} className="relative pl-8 pb-6 last:pb-0">
            {/* Timeline dot */}
            <span
              aria-hidden="true"
              className="absolute left-0 top-1.5 h-[15px] w-[15px] rounded-full border-2 border-white bg-blue-500 ring-1 ring-zinc-200"
            />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-zinc-900 leading-snug">
                {entry.action}
              </p>
              {entry.detail && (
                <p className="text-xs text-zinc-500 leading-relaxed">
                  {entry.detail}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-xs text-zinc-600">{entry.actorName}</span>
                <RolePill role={entry.actorRole} />
                <span className="text-xs text-zinc-400">
                  · {formatTimestamp(entry.createdAt)}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
