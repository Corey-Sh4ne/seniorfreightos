import Link from 'next/link';
import Sidebar from '@/app/dashboard/_components/Sidebar';
import NewProjectForm from './_components/NewProjectForm';
import { query } from '@/db/index';

export const metadata = {
  title: 'New Project — SeniorFreightOS',
};

export const dynamic = 'force-dynamic';

export default async function NewProjectPage() {
  const { rows: clients } = await query(
    'SELECT id, name, contact_name, contact_email FROM clients ORDER BY name ASC',
  );

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-zinc-200 h-14 flex items-center px-6 gap-3 shrink-0">
          <Link
            href="/dashboard"
            className="text-blue-600 text-xs font-semibold whitespace-nowrap hover:underline shrink-0"
          >
            ← All Projects
          </Link>
          <h1 className="text-sm font-bold text-zinc-900">New Project</h1>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-[560px] bg-white rounded-xl border border-gray-200 shadow-sm p-8">
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '24px' }}>
              New Project
            </h2>
            <p className="text-xs text-zinc-500 mb-6">
              A project code (FTE-YYYY-###) will be auto-generated on save.
              Fields marked <span className="text-red-500 font-semibold">*</span> are required.
            </p>
            <NewProjectForm clients={clients} />
          </div>
        </main>
      </div>
    </div>
  );
}
