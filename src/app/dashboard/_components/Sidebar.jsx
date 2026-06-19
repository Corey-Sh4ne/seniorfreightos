'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';

const NAV_PRIMARY = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Projects',  href: '/projects'  },
  { label: 'Clients',   href: '/clients'   },
  { label: 'Rate Card', href: '/rate-card' },
];

const NAV_BOTTOM = [
  { label: 'Settings', href: '/settings' },
];

function NavLink({ href, label, active }) {
  return (
    <Link
      href={href}
      className={[
        'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
        active
          ? 'bg-blue-600 text-white'
          : 'text-slate-300 hover:bg-slate-800 hover:text-white',
      ].join(' ')}
    >
      {label}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-slate-900 flex flex-col shrink-0 h-screen sticky top-0">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-slate-700/60">
        <p className="text-white font-semibold text-sm tracking-tight leading-tight">
          SeniorFreightOS
        </p>
        <p className="text-slate-500 text-xs mt-0.5">Olson Resource Group</p>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_PRIMARY.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            active={pathname === item.href || pathname.startsWith(item.href + '/')}
          />
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="px-3 pb-4 border-t border-slate-700/60 pt-3 space-y-0.5">
        {NAV_BOTTOM.map((item) => (
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
