'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { UserButton } from '@clerk/nextjs';
import { setViewAs } from '../_actions/viewAsActions';
import { VIEW_AS_OPTIONS, parseClientName } from '../_lib/viewAsOptions';

const ADMIN_NAV_PRIMARY = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Projects',  href: '/projects'  },
  { label: 'Clients',   href: '/clients'   },
  { label: 'Rate Card', href: '/rate-card' },
];

const ADMIN_NAV_BOTTOM = [
  { label: 'Settings', href: '/settings' },
];

// Dispatcher and client views collapse to a single entry point. Both render
// inline at /dashboard, which re-reads the cookie to pick the correct view.
const DISPATCHER_NAV = [{ label: 'Order Management', href: '/dashboard' }];
const CLIENT_NAV     = [{ label: 'My Projects',      href: '/dashboard' }];

/**
 * Resolve the active view into the data the sidebar needs to render:
 * which nav links to show and the optional branding badge under the header.
 */
function resolveView(viewAs) {
  if (viewAs === 'dispatcher') {
    return { primary: DISPATCHER_NAV, bottom: [], badge: 'Dispatcher' };
  }
  const clientName = parseClientName(viewAs);
  if (clientName) {
    return { primary: CLIENT_NAV, bottom: [], badge: clientName };
  }
  return { primary: ADMIN_NAV_PRIMARY, bottom: ADMIN_NAV_BOTTOM, badge: null };
}

function NavLink({ href, label, active }) {
  return (
    <Link
      href={href}
      className={[
        'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
        active
          ? 'bg-blue-600 text-white'
          : 'text-slate-300 hover:bg-white/10 hover:text-white',
      ].join(' ')}
    >
      {label}
    </Link>
  );
}

function ViewAsSelect({ viewAs }) {
  const [pending, startTransition] = useTransition();
  const current = viewAs && viewAs !== '' ? viewAs : 'admin';

  function onChange(e) {
    const value = e.target.value;
    // setViewAs sets the cookie then redirects to /dashboard, which resets to
    // the new view's default page — no client-side refresh needed here.
    startTransition(() => setViewAs(value));
  }

  return (
    <div className="px-1 pb-2">
      <label
        htmlFor="view-as"
        className="block px-2 mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500"
      >
        View As
      </label>
      <select
        id="view-as"
        value={current}
        onChange={onChange}
        disabled={pending}
        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {VIEW_AS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function Sidebar({ viewAs = 'admin' }) {
  const pathname = usePathname();
  const { primary, bottom, badge } = resolveView(viewAs);

  return (
    <aside className="w-56 bg-slate-900 flex flex-col shrink-0 h-screen sticky top-0">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-slate-700/60">
        <p className="text-white font-semibold text-sm tracking-tight leading-tight">
          SeniorFreightOS
        </p>
        <p className="text-white/50 text-xs mt-0.5">Olson Resource Group</p>
        {badge && (
          <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-semibold uppercase tracking-wide">
            {badge}
          </span>
        )}
      </div>

      {/* Primary nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {primary.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            active={pathname === item.href || pathname.startsWith(item.href + '/')}
          />
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="px-3 pb-4 border-t border-white/10 pt-3 mt-3 space-y-0.5">
        <ViewAsSelect viewAs={viewAs} />
        {bottom.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            active={pathname === item.href}
          />
        ))}
        <div className="px-3 pt-3 flex items-center gap-2">
          <UserButton afterSignOutUrl="/sign-in" />
          <span className="text-xs text-slate-500">v0.1.0 · Internal</span>
        </div>
      </div>
    </aside>
  );
}
