import Link from 'next/link';
import type { Metadata } from 'next';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'NNumberCheck vs Aero-Space Reports — Aircraft History Comparison',
  description:
    'Compare NNumberCheck with Aero-Space Reports. See turnaround time, price, data included, and why NNumberCheck delivers a modern instant report for $149.',
  alternates: {
    canonical: 'https://nnumbercheck.com/compare/aero-space-reports',
  },
  openGraph: {
    title: 'NNumberCheck vs Aero-Space Reports',
    description:
      'Instant aircraft history vs 24–48 hour turnaround. Compare price, data, and speed.',
    url: 'https://nnumbercheck.com/compare/aero-space-reports',
    type: 'website',
  },
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How is NNumberCheck different from Aero-Space Reports?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'NNumberCheck is an instant, self-serve aircraft history report for $149. It includes FAA registration data, 44 years of NTSB accident history, and serial-number-matched Airworthiness Directives. Aero-Space Reports is a traditional title company that offers manual title searches with a 24–48 hour turnaround, typically starting around $85 for a basic search and up to $190 for comprehensive packages.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does NNumberCheck offer title insurance?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. NNumberCheck is a data aggregation service, not a title company. We do not offer title insurance or legal guarantees. For a formal title search with insurance coverage, we recommend using a licensed title company.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I use both NNumberCheck and Aero-Space Reports?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Many buyers use NNumberCheck for instant preliminary research and then order a formal title search from a title company for legal due diligence. The two services serve different purposes and complement each other well.',
      },
    },
  ],
};

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd).replace(/</g, '\\u003c'),
        }}
      />

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

      <section className="bg-gradient-to-b from-sky-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
            NNumberCheck vs Aero-Space Reports
          </h1>
          <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto">
            Both services help buyers research aircraft history, but they work
            very differently. Here is an honest comparison to help you decide
            which is right for your situation.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-16">
        {/* Comparison table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-6 py-4 font-semibold text-slate-900">
                  Feature
                </th>
                <th className="text-center px-6 py-4 font-semibold text-sky-600">
                  NNumberCheck
                </th>
                <th className="text-center px-6 py-4 font-semibold text-slate-700">
                  Aero-Space Reports
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <CompareRow
                label="Price"
                ours="$149 (one-time)"
                theirs="$85–$190"
              />
              <CompareRow
                label="Turnaround time"
                ours="Instant"
                theirs="24–48 hours"
              />
              <CompareRow
                label="Order method"
                ours="Self-serve online"
                theirs="Manual order form"
              />
              <CompareRow
                label="FAA registration data"
                ours={true}
                theirs={true}
              />
              <CompareRow
                label="NTSB accident history (1982–present)"
                ours={true}
                theirs="Limited"
              />
              <CompareRow
                label="Airworthiness Directives (serial-number matched)"
                ours={true}
                theirs={false}
              />
              <CompareRow
                label="Ownership chain"
                ours={true}
                theirs={true}
              />
              <CompareRow
                label="Downloadable PDF"
                ours={true}
                theirs={true}
              />
              <CompareRow
                label="Title insurance"
                ours={false}
                theirs={false}
              />
              <CompareRow
                label="Legal guarantee"
                ours={false}
                theirs={true}
              />
            </tbody>
          </table>
        </div>

        {/* When to use which */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <div className="border border-sky-200 bg-sky-50 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-slate-900">
              Use NNumberCheck if...
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li>✓ You need an answer in minutes, not days</li>
              <li>✓ You want comprehensive history in one report</li>
              <li>✓ You're doing preliminary research on multiple aircraft</li>
              <li>✓ You want serial-number-level AD applicability</li>
              <li>✓ You prefer self-serve checkout</li>
            </ul>
          </div>
          <div className="border border-slate-200 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-slate-900">
              Use Aero-Space Reports if...
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li>✓ You need a formal title search with legal standing</li>
              <li>✓ Your lender or insurer requires a licensed title report</li>
              <li>✓ You want a human to verify records manually</li>
              <li>✓ You need title insurance for a transaction</li>
            </ul>
          </div>
        </div>

        {/* Bottom line */}
        <div className="mt-12 border border-slate-200 rounded-2xl p-8 bg-slate-50">
          <h2 className="text-2xl font-bold text-slate-900">Bottom line</h2>
          <p className="mt-4 text-slate-700 leading-relaxed">
            NNumberCheck and Aero-Space Reports serve different stages of the
            aircraft buying process. NNumberCheck is designed for fast,
            self-serve preliminary research. Aero-Space Reports is designed for
            formal title work that requires legal standing and human
            verification.
          </p>
          <p className="mt-4 text-slate-700 leading-relaxed">
            Many buyers use both: NNumberCheck first to quickly screen
            potential purchases, then Aero-Space Reports when they're ready to
            commit to a specific aircraft. There is no conflict between the two
            — they complement each other.
          </p>
        </div>

        {/* Honest disclaimer */}
        <div className="mt-8 text-xs text-slate-500 text-center max-w-3xl mx-auto">
          Aero-Space Reports is an independent company. NNumberCheck is not
          affiliated with, endorsed by, or sponsored by Aero-Space Reports.
          The comparison above is based on publicly available information as of
          October 2026. Prices and features may change — verify details directly
          with Aero-Space Reports before making a decision.
        </div>

        {/* CTA */}
        <div className="mt-12 bg-sky-600 text-white rounded-2xl p-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold">
            Try NNumberCheck for free
          </h2>
          <p className="mt-3 text-sky-100 max-w-2xl mx-auto">
            Enter any US N-number and see registration details, accident
            history, and a preview of applicable ADs. No signup required.
          </p>
          <Link
            href="/"
            className="mt-8 inline-block bg-white text-sky-600 px-8 py-3 rounded-xl font-semibold hover:bg-sky-50 transition"
          >
            Start Free Lookup
          </Link>
        </div>
      </section>

    </div>
  );
}

function CompareRow({
  label,
  ours,
  theirs,
}: {
  label: string;
  ours: string | boolean;
  theirs: string | boolean;
}) {
  const render = (value: string | boolean) => {
    if (value === true)
      return (
        <span className="text-emerald-600 font-semibold">✓ Yes</span>
      );
    if (value === false)
      return <span className="text-slate-400">✗ No</span>;
    return <span className="text-slate-700">{value}</span>;
  };

  return (
    <tr>
      <td className="px-6 py-4 text-slate-700">{label}</td>
      <td className="px-6 py-4 text-center">{render(ours)}</td>
      <td className="px-6 py-4 text-center">{render(theirs)}</td>
    </tr>
  );
}
