'use client';

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-4 py-2 transition-colors"
    >
      Print / Save as PDF
    </button>
  );
}
