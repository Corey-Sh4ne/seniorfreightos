import Sidebar      from './Sidebar';
import ViewAsBanner from './ViewAsBanner';

/**
 * Dashboard shell used while an admin is impersonating another view. Keeps the
 * admin sidebar (so they can switch views or exit) and shows the active-view
 * banner above the impersonated content.
 */
export default function ImpersonationView({ viewAs, children }) {
  return (
    <div className="flex h-screen bg-zinc-50 overflow-hidden">
      <Sidebar viewAs={viewAs} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <ViewAsBanner viewAs={viewAs} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
