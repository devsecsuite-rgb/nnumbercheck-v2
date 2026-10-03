import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Disclaimer — NNumberCheck',
  description: 'Important disclaimers about the data provided by NNumberCheck.com.',
alternates: {
    canonical: 'https://nnumbercheck.com/disclaimer',
  },
};

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-sky-600">NNumberCheck</Link>
          <Link href="/" className="text-sm font-medium text-sky-600 hover:underline">← Back to home</Link>
        </div>
      </header>
      <article className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold">Disclaimer</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: October 3, 2026</p>
        <div className="mt-8 bg-amber-50 border-l-4 border-amber-400 p-6 rounded">
          <p className="text-amber-900 font-medium">NNumberCheck.com is a data aggregation service. It is NOT a substitute for a pre-buy inspection, title search, or any professional aircraft evaluation.</p>
        </div>
        <h2 className="mt-10 text-2xl font-bold">Not affiliated with the FAA or NTSB</h2>
        <p className="mt-4 text-slate-700">NNumberCheck.com is an independent service. We are not affiliated with, endorsed by, or acting on behalf of the Federal Aviation Administration (FAA), the National Transportation Safety Board (NTSB), or any other government agency.</p>
        <h2 className="mt-10 text-2xl font-bold">Historical reference only</h2>
        <p className="mt-4 text-slate-700">All aircraft history reports, accident records, ownership chains, and related data are provided for <strong>historical reference only</strong>. The information is not intended to be, and should not be relied upon as, airworthiness data, legal advice, financial advice, or a substitute for official records.</p>
        <h2 className="mt-10 text-2xl font-bold">Verify before you decide</h2>
        <p className="mt-4 text-slate-700">Before purchasing, financing, insuring, or operating any aircraft, you should independently verify all information with:</p>
        <ul className="mt-4 space-y-2 text-slate-700 list-disc pl-6">
          <li>The FAA Aircraft Registry (official records)</li>
          <li>A licensed title company or aviation attorney</li>
          <li>A certified A&amp;P mechanic or IA for a pre-buy inspection</li>
          <li>The aircraft&apos;s logbooks and maintenance records</li>
        </ul>
        <h2 className="mt-10 text-2xl font-bold">Data accuracy limitations</h2>
        <p className="mt-4 text-slate-700">Our data is sourced from public government databases that may contain errors, omissions, or delays. We make no guarantee that the data is complete, current, or error-free. NNumberCheck.com shall not be held liable for any decision made based on the information provided.</p>
        <h2 className="mt-10 text-2xl font-bold">No warranty of airworthiness</h2>
        <p className="mt-4 text-slate-700">The presence or absence of accidents, incidents, or airworthiness directives in our reports does not constitute a warranty of airworthiness. Only the FAA and qualified aviation professionals can make that determination.</p>
        <h2 className="mt-10 text-2xl font-bold">Contact</h2>
        <p className="mt-4 text-slate-700">If you have concerns about the data or this disclaimer, contact us at <a href="mailto:support@nnumbercheck.com" className="text-sky-600 hover:underline">support@nnumbercheck.com</a></p>
      </article>
    </div>
  );
}
