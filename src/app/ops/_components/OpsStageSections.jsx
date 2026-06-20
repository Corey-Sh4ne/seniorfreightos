'use client';

import {
  confirmStartReceiving,
  confirmReceiving,
  confirmConsolidated,
  confirmDeparted,
  confirmDelivered,
  confirmInstallComplete,
} from '../_actions/opsActions';
import { ShipmentRow, TaskRow } from './OpsChecklistRows';

const PRIMARY_BTN =
  'rounded-md bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50';
const CONFIRM_BTN =
  'rounded-md bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50';

/** A button that optionally gates its action behind a window.confirm prompt. */
export function ActionButton({ label, prompt, onAction, pending, run, className = CONFIRM_BTN }) {
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!prompt || window.confirm(prompt)) run(onAction);
      }}
      className={className}
    >
      {label}
    </button>
  );
}

/** White, bordered card holding the project's single active stage. */
function ActiveSection({ title, children }) {
  return (
    <div className="m-4 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-100 px-5 py-3">
        <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

/** Bottom action row inside an ActiveSection. */
function SectionFooter({ prompt, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 bg-zinc-50/60 px-5 py-3.5">
      {prompt && <p className="text-sm text-zinc-600">{prompt}</p>}
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  );
}

// Checklist stages: a freely-toggleable list that reveals a confirm button only
// once every row is checked.
const CHECKLIST_STAGES = {
  receiving: {
    title: 'Receiving Shipments',
    empty: 'No shipments on this project.',
    items: (p) => p.shipments,
    Row: ShipmentRow,
    ready: (f) => f.allReceived,
    footer: 'All shipments are checked in.',
    label: 'Confirm All Received',
    confirm: 'Mark all shipments received and advance to Consolidating? This cannot be undone.',
    action: confirmReceiving,
  },
  installing: {
    title: 'Install Tasks',
    empty: 'No install tasks on this project.',
    items: (p) => p.installTasks,
    Row: TaskRow,
    ready: (f) => f.allComplete,
    footer: 'All installation tasks are checked off.',
    label: 'Confirm Installation Complete',
    confirm: 'Confirm all installation tasks complete? This cannot be undone.',
    action: confirmInstallComplete,
  },
};

// Confirm-only stages: a prompt and a single confirm button, no checklist.
const SIMPLE_STAGES = {
  staging: {
    title: 'Consolidating', footer: 'Freight consolidated and ready for delivery?',
    label: 'Confirm Ready for Delivery',
    confirm: 'Confirm freight is consolidated and ready for delivery? This cannot be undone.',
    action: confirmConsolidated,
  },
  scheduled: {
    title: 'Out for Delivery', footer: 'Confirm truck has departed for delivery?',
    label: 'Confirm Departed', confirm: 'Confirm truck has departed? This cannot be undone.',
    action: confirmDeparted,
  },
  delivered: {
    title: 'Confirm Delivery', footer: 'Confirm delivery at facility?',
    label: 'Confirm Delivered', confirm: 'Confirm delivery at facility? This cannot be undone.',
    action: confirmDelivered,
  },
};

/**
 * The single active stage section matching the project's current status. Returns
 * null for finished states (complete / invoiced), which render no active stage.
 */
export function ActiveContent({ project, pending, run, allReceived, allComplete }) {
  const { status, id } = project;

  if (status === 'awarded') {
    return (
      <ActiveSection title="Receiving">
        <div className="px-5 py-4">
          <ActionButton
            label="Start Receiving"
            onAction={() => confirmStartReceiving(id)}
            pending={pending}
            run={run}
            className={PRIMARY_BTN}
          />
        </div>
      </ActiveSection>
    );
  }

  const list = CHECKLIST_STAGES[status];
  if (list) {
    const { Row } = list;
    const items = list.items(project);
    return (
      <ActiveSection title={list.title}>
        {items.length === 0 ? (
          <p className="px-5 py-6 text-center text-xs text-zinc-400">{list.empty}</p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {items.map((item) => (
              <li key={item.id}>
                <Row item={item} projectId={id} editable={!pending} run={run} />
              </li>
            ))}
          </ul>
        )}
        {list.ready({ allReceived, allComplete }) && (
          <SectionFooter prompt={list.footer}>
            <ActionButton
              label={list.label}
              prompt={list.confirm}
              onAction={() => list.action(id)}
              pending={pending}
              run={run}
            />
          </SectionFooter>
        )}
      </ActiveSection>
    );
  }

  const simple = SIMPLE_STAGES[status];
  if (simple) {
    return (
      <ActiveSection title={simple.title}>
        <SectionFooter prompt={simple.footer}>
          <ActionButton
            label={simple.label}
            prompt={simple.confirm}
            onAction={() => simple.action(id)}
            pending={pending}
            run={run}
          />
        </SectionFooter>
      </ActiveSection>
    );
  }

  return null;
}
