'use client';

// Ordered pipeline-friendly labels for the keys written by opsActions.
const STAGE_LABELS = [
  { key: 'receiving',    label: 'Receiving' },
  { key: 'consolidating', label: 'Consolidating' },
  { key: 'departed',     label: 'Out for Delivery' },
  { key: 'delivered',    label: 'Delivered' },
  { key: 'installing',   label: 'Installing' },
];

export default function NotesTab({ notes, stageNotes = {} }) {
  const entries = STAGE_LABELS
    .map((s) => ({ ...s, note: stageNotes?.[s.key] }))
    .filter((s) => typeof s.note === 'string' && s.note.trim().length > 0);

  return (
    <div className="max-w-2xl space-y-4">
      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <h3 className="mb-3 text-sm font-semibold text-zinc-700">Notes — Admin only</h3>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-600">
          {notes || 'No notes recorded.'}
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <h3 className="mb-3 text-sm font-semibold text-zinc-700">Stage Notes</h3>
        {entries.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No stage notes recorded yet. Dispatchers can leave a note when confirming each stage.
          </p>
        ) : (
          <ul className="space-y-3">
            {entries.map(({ key, label, note }) => (
              <li key={key} className="border-l-2 border-blue-200 pl-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  {label}
                </p>
                <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
                  {note}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
