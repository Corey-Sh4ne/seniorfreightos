import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth, clerkClient } from '@clerk/nextjs/server';
import QuoteBreakdown from '@/components/QuoteBreakdown';
import { getProjectById } from '../_data/getProject';
import PrintButton from './_components/PrintButton';

export const dynamic = 'force-dynamic';

const DATE_FMT = new Intl.DateTimeFormat('en-US', {
  month: 'long', day: 'numeric', year: 'numeric',
});

const STATUS_PILL = {
  draft: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  sent:  'bg-blue-50 text-blue-700 border-blue-200',
  paid:  'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default async function InvoicePage({ params }) {
  const { id } = await params;

  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const role = user.publicMetadata?.role ?? null;
  if (role !== 'admin') redirect('/dashboard');

  const project = await getProjectById(id);
  if (!project) notFound();
  if (!project.invoiceNumber) redirect(`/projects/${id}`);

  const generatedDate = project.invoiceGeneratedAt
    ? new Date(project.invoiceGeneratedAt)
    : new Date();
  const dueDate = new Date(generatedDate);
  dueDate.setDate(dueDate.getDate() + 30);

  const status = project.invoiceStatus ?? 'draft';
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <div className="min-h-screen bg-zinc-100 print:bg-white">
      {/* On-screen top bar; hidden when printing */}
      <div className="print:hidden bg-white border-b border-zinc-200">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between gap-3">
          <Link
            href={`/projects/${id}`}
            className="text-blue-600 text-xs font-semibold hover:underline"
          >
            ← Back to project
          </Link>
          <PrintButton />
        </div>
      </div>

      {/* Printable invoice sheet */}
      <div className="max-w-4xl mx-auto bg-white shadow-sm print:shadow-none my-8 print:my-0 p-10 print:p-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-200 pb-6 mb-8">
          <div>
            <p className="text-xl font-extrabold text-zinc-900">SeniorFreightOS</p>
            <p className="text-sm text-zinc-500 mt-0.5">Olson Resource Group</p>
            <p className="text-xs text-zinc-500 mt-2">FF&amp;E Logistics · Senior Living</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold text-zinc-900 tracking-wide">INVOICE</p>
            <span className={`mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_PILL[status]}`}>
              <span className="text-[8px] leading-none">●</span>
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Invoice + Bill To */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 mb-2">
              Bill To
            </p>
            <p className="text-sm font-semibold text-zinc-900">{project.clientName}</p>
            {project.facilityName && (
              <p className="text-sm text-zinc-700">{project.facilityName}</p>
            )}
            {project.facilityAddress && (
              <p className="text-sm text-zinc-700">{project.facilityAddress}</p>
            )}
            {project.contactName && (
              <p className="text-sm text-zinc-700 mt-2">Attn: {project.contactName}</p>
            )}
            {project.contactEmail && (
              <p className="text-sm text-zinc-600">{project.contactEmail}</p>
            )}
          </div>

          <div className="text-right">
            <div className="mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                Invoice #
              </p>
              <p className="text-sm font-semibold text-zinc-900">{project.invoiceNumber}</p>
            </div>
            <div className="mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                Date
              </p>
              <p className="text-sm text-zinc-900">{DATE_FMT.format(generatedDate)}</p>
            </div>
            <div className="mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                Due Date
              </p>
              <p className="text-sm text-zinc-900">{DATE_FMT.format(dueDate)}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                Project
              </p>
              <p className="text-sm text-zinc-900">{project.code}</p>
            </div>
          </div>
        </div>

        {/* Itemized breakdown */}
        <div className="mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 mb-3">
            Charges
          </p>
          {project.quotedPrice ? (
            <QuoteBreakdown breakdown={project.quotedPrice} theme="light" />
          ) : (
            <p className="text-sm text-zinc-500 italic">
              No quote breakdown is available for this project.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-200 pt-6 text-center">
          <p className="text-sm text-zinc-600">
            Thank you for your business — Olson Resource Group
          </p>
        </div>
      </div>

      <style>{`
        @media print {
          @page { margin: 0.5in; }
          html, body { background: white; }
        }
      `}</style>
    </div>
  );
}
