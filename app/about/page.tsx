import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About NNumberCheck — Aircraft History Reports',
  description: 'Learn how NNumberCheck helps buyers, brokers, and owners make smarter aircraft decisions with instant FAA registry and NTSB accident data.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-sky-600">NNumberCheck</Link>
          <Link href="/" className="text-sm font-medium text-sky-600 hover:underline">← Back to home</Link>
        </div>
      </header>
      <article className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold">About NNumberCheck</h1>
        <p className="mt-6 text-lg text-slate-600">
          NNumberCheck makes it easy to look up the history of any US-registered aircraft in seconds. Enter an N-number and get registration details, 44 years of accident records, and ownership information — pulled directly from public FAA and NTSB data.
        </p>
        <h2 className="mt-12 text-2xl font-bold">Why we built this</h2>
        <p className="mt-4 text-slate-700">
          Buying or selling an aircraft is a six- or seven-figure decision, but the information needed to make that decision is scattered across government databases that weren&apos;t designed for consumers. Pilots, brokers, and buyers deserve a simpler way to check an aircraft&apos;s background before committing.
        </p>
        <p className="mt-4 text-slate-700">
          NNumberCheck aggregates public FAA registry data and NTSB accident records into one clean, instant report. No phone calls, no waiting, no middleman.
        </p>
        <h2 className="mt-12 text-2xl font-bold">Who it&apos;s for</h2>
        <ul className="mt-4 space-y-2 text-slate-700 list-disc pl-6">
          <li><strong>Buyers</strong> — verify an aircraft&apos;s past before you make an offer.</li>
          <li><strong>Brokers and dealers</strong> — run bulk lookups and generate reports for your clients.</li>
          <li><strong>Owners</strong> — check your own aircraft&apos;s public record.</li>
          <li><strong>Lenders and insurers</strong> — verify registration, ownership, and history.</li>
        </ul>
        <h2 className="mt-12 text-2xl font-bold">Our data sources</h2>
        <ul className="mt-4 space-y-2 text-slate-700 list-disc pl-6">
          <li>FAA Releasable Aircraft Database (public domain, updated daily)</li>
          <li>NTSB Aviation Accident Reports (public domain, 1982–present)</li>
        </ul>
        <h2 className="mt-12 text-2xl font-bold">Contact</h2>
        <p className="mt-4 text-slate-700">
          Questions, feedback, or partnership inquiries?{' '}
          <a href="mailto:support@nnumbercheck.com" className="text-sky-600 hover:underline">support@nnumbercheck.com</a>
        </p>
        <p className="mt-12 text-xs text-slate-500 border-t border-slate-200 pt-6">
          NNumberCheck.com is not affiliated with the FAA, NTSB, or any government agency. All information is provided for historical reference only.
        </p>
      </article>
    </div>
  );
}
