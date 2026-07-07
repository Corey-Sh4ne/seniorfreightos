// Ordered pipeline-friendly labels for the keys written by ops confirmations.
const STAGE_LABELS = [
  { key: 'receiving',    label: 'Receiving' },
  { key: 'consolidating', label: 'Consolidating' },
  { key: 'departed',     label: 'Out for Delivery' },
  { key: 'delivered',    label: 'Delivered' },
  { key: 'installing',   label: 'Installing' },
];

/**
 * Read-only stage notes shown to the client. Renders nothing when no stage
 * notes have been recorded so the section doesn't clutter an early project.
 */
export default function StageNotes({ stageNotes = {} }) {
  const entries = STAGE_LABELS
    .map((s) => ({ ...s, note: stageNotes?.[s.key] }))
    .filter((s) => typeof s.note === 'string' && s.note.trim().length > 0);

  if (entries.length === 0) return null;

  return (
    <section
      style={{
        background: 'white',
        border: '1px solid #E5E7EB',
        borderRadius: '12px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        padding: '20px 24px',
        marginBottom: '16px',
      }}
    >
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-zinc-900">
          Updates from your logistics team
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500">
          Notes left by the operations team as your project moves through each stage.
        </p>
      </div>
      <ul className="space-y-4">
        {entries.map(({ key, label, note }) => (
          <li key={key} className="border-l-2 border-blue-200 pl-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              {label}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
              {note}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
