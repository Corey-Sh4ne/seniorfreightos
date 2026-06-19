'use client';

import { useState } from 'react';
import ShipmentsTab from './ShipmentsTab';
import InstallTasksTab from './InstallTasksTab';

const TABS = [
  { id: 'shipments',     label: 'Shipments' },
  { id: 'install-tasks', label: 'Install Tasks' },
];

export default function PortalDetailTabs({ shipments, installTasks }) {
  const [active, setActive] = useState('shipments');

  const counts = {
    'shipments':     shipments.length,
    'install-tasks': installTasks.length,
  };

  return (
    <div>
      <div className="flex border-b border-zinc-200 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={[
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              active === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300',
            ].join(' ')}
          >
            {tab.label}
            <span
              className={[
                'text-xs font-semibold px-1.5 py-0.5 rounded-full',
                active === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-zinc-100 text-zinc-500',
              ].join(' ')}
            >
              {counts[tab.id]}
            </span>
          </button>
        ))}
      </div>

      {active === 'shipments'     && <ShipmentsTab shipments={shipments} />}
      {active === 'install-tasks' && <InstallTasksTab installTasks={installTasks} />}
    </div>
  );
}
