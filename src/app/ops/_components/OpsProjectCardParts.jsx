'use client';

import {
  resetToReceiving,
  resetToStaging,
  resetToScheduled,
  resetToDelivered,
  resetToInstalling,
} from '../_actions/opsActions';
import { ActionButton, ActiveContent } from './OpsStageSections';

const RESET_BTN =
  'shrink-0 rounded border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-50 disabled:opacity-50';

// Collapsed summary lines for stages already finished, in pipeline order. Each
// carries the reset that steps the project back to the START of that stage. The
// reset is only ever offered on the most-recently-completed (last) line.
const SUMMARY_STEPS = [
  { label: '✓ Shipments Received', resetLabel: 'Reset to Receiving', reset: resetToReceiving,
    prompt: 'Reset to Receiving? This reopens the shipments checklist.' },
  { label: '✓ Consolidated', resetLabel: 'Reset to Consolidating', reset: resetToStaging,
    prompt: 'Reset to Consolidating?' },
  { label: '✓ Departed', resetLabel: 'Reset to Out for Delivery', reset: resetToScheduled,
    prompt: 'Reset to Out for Delivery?' },
  { label: '✓ Delivered', resetLabel: 'Reset to Delivered', reset: resetToDelivered,
    prompt: 'Reset to Delivered? This reopens the install task checklist.' },
  { label: '✓ Installation Complete', resetLabel: 'Reset to Installing', reset: resetToInstalling,
    prompt: 'Reset to Installing? This reopens the install task checklist.' },
];

// Number of SUMMARY_STEPS collapsed (completed) at each status.
const COMPLETED_SUMMARIES = {
  awarded: 0, receiving: 0, staging: 1, scheduled: 2,
  delivered: 3, installing: 4, complete: 5, invoiced: 5,
};

/** Single muted line for a finished stage, with an optional reset on the right. */
function CollapsedSummary({ label, resetLabel, prompt, onReset, pending, run }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-2.5">
      <span className="text-sm text-zinc-400">{label}</span>
      {resetLabel && (
        <ActionButton
          label={resetLabel}
          prompt={prompt}
          onAction={onReset}
          pending={pending}
          run={run}
          className={RESET_BTN}
        />
      )}
    </div>
  );
}

/**
 * Stage-based body: collapsed summaries for finished stages followed by the one
 * active section. Future stages are not rendered at all.
 *
 * @param {object}   props
 * @param {object}   props.project     - Project with id, status, shipments, installTasks.
 * @param {boolean}  props.pending     - Whether a transition is in flight.
 * @param {function} props.run         - Wraps a server action in a transition.
 * @param {boolean}  props.allReceived - True when every shipment is checked.
 * @param {boolean}  props.allComplete - True when every install task is checked.
 */
export function StageFlow({ project, pending, run, allReceived, allComplete }) {
  const { id, status } = project;
  const completed = COMPLETED_SUMMARIES[status] ?? 0;
  const summaries = SUMMARY_STEPS.slice(0, completed);

  return (
    <div>
      {summaries.length > 0 && (
        <div className="divide-y divide-zinc-100 border-t border-zinc-100">
          {summaries.map((step, i) => {
            const isLast = i === summaries.length - 1;
            return (
              <CollapsedSummary
                key={step.label}
                label={step.label}
                resetLabel={isLast ? step.resetLabel : null}
                prompt={isLast ? step.prompt : null}
                onReset={isLast ? () => step.reset(id) : null}
                pending={pending}
                run={run}
              />
            );
          })}
        </div>
      )}
      <ActiveContent
        project={project}
        pending={pending}
        run={run}
        allReceived={allReceived}
        allComplete={allComplete}
      />
    </div>
  );
}
