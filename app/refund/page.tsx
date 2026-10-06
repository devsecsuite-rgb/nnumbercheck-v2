import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund Policy — NNumberCheck',
  description: 'Refund policy for NNumberCheck aircraft history reports.',
};

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-sky-600">
            NNumberCheck
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-sky-600 hover:underline"
          >
            ← Back to home
          </Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold">Refund Policy</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: October 6, 2026</p>

        <div className="mt-8 bg-sky-50 border-l-4 border-sky-400 p-6 rounded">
          <p className="text-sky-900 font-medium">
            We offer a full refund within 30 days if the report fails to
            deliver or contains a technical error. Because our reports are
            digital products delivered instantly, refunds are not available
            for change of mind after the report has been viewed.
          </p>
        </div>

        <h2 className="mt-10 text-2xl font-bold">1. Digital product refunds</h2>
        <p className="mt-4 text-slate-700">
          NNumberCheck sells digital reports that are delivered instantly upon
          purchase. Because the product is consumed immediately and cannot be
          &ldquo;returned,&rdquo; we follow the standard policy for digital
          goods: <strong>all sales are final once the report has been
          accessed</strong>, except in the cases described below.
        </p>

        <h2 className="mt-10 text-2xl font-bold">2. When you qualify for a refund</h2>
        <p className="mt-4 text-slate-700">
          We will issue a full refund if any of the following apply:
        </p>
        <ul className="mt-4 space-y-2 text-slate-700 list-disc pl-6">
          <li>
            <strong>Technical failure</strong> — the report did not generate,
            did not load, or was incomplete due to an error on our side.
          </li>
          <li>
            <strong>Duplicate charge</strong> — you were charged more than
            once for the same report.
          </li>
          <li>
            <strong>Unauthorized charge</strong> — the purchase was made
            without your permission. Please contact us immediately.
          </li>
        </ul>

        <h2 className="mt-10 text-2xl font-bold">3. When you do not qualify for a refund</h2>
        <p className="mt-4 text-slate-700">
          We do not issue refunds for:
        </p>
        <ul className="mt-4 space-y-2 text-slate-700 list-disc pl-6">
          <li>
            <strong>Change of mind</strong> — you decided you no longer need
            the report after viewing it.
          </li>
          <li>
            <strong>Disagreement with the data</strong> — the report accurately
            reflects public FAA and NTSB records, which we do not control.
          </li>
          <li>
            <strong>Incomplete data</strong> — some aircraft have limited
            public records. Our disclaimer on the report explains this
            limitation.
          </li>
        </ul>

        <h2 className="mt-10 text-2xl font-bold">4. How to request a refund</h2>
        <p className="mt-4 text-slate-700">
          Email{' '}
          <a
            href="mailto:support@nnumbercheck.com"
            className="text-sky-600 hover:underline"
          >
            support@nnumbercheck.com
          </a>{' '}
          with:
        </p>
        <ul className="mt-4 space-y-2 text-slate-700 list-disc pl-6">
          <li>Your Paddle transaction ID (shown on your receipt)</li>
          <li>The N-number of the aircraft</li>
          <li>A brief description of the issue</li>
        </ul>
        <p className="mt-4 text-slate-700">
          We respond to all refund requests within 2 business days.
        </p>

        <h2 className="mt-10 text-2xl font-bold">5. Processing time</h2>
        <p className="mt-4 text-slate-700">
          Approved refunds are processed through Paddle, our payment provider.
          Once issued, refunds typically appear on your statement within:
        </p>
        <ul className="mt-4 space-y-2 text-slate-700 list-disc pl-6">
          <li>5–10 business days for credit/debit cards</li>
          <li>3–5 business days for PayPal</li>
          <li>1–2 business days for other payment methods</li>
        </ul>

        <h2 className="mt-10 text-2xl font-bold">6. Contact</h2>
        <p className="mt-4 text-slate-700">
          For all refund questions:{' '}
          <a
            href="mailto:support@nnumbercheck.com"
            className="text-sky-600 hover:underline"
          >
            support@nnumbercheck.com
          </a>
        </p>

        <p className="mt-12 text-xs text-slate-500 border-t border-slate-200 pt-6">
          This refund policy is provided in accordance with Paddle&apos;s
          Seller Terms and applicable consumer protection laws.
        </p>
      </article>
    </div>
  );
}
