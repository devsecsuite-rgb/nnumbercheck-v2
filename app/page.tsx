import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NNumberCheck — Free Aircraft N-Number Lookup & History',
  description:
  'Instantly look up any US aircraft by N-number. Free registration details, 44 years of NTSB accident history. Full history reports for $149.',
  keywords: [
    'N-number lookup',
    'aircraft history report',
    'FAA registry lookup',
    'NTSB accident records',
    'aircraft registration',
    'aircraft title search',
  ],
    openGraph: {
    title: 'NNumberCheck — Free Aircraft N-Number Lookup',
    description:
      'Look up any US aircraft by N-number. Free registration details and 44 years of NTSB accident history.',
    url: 'https://nnumbercheck.com',
    siteName: 'NNumberCheck',
    type: 'website',
    images: [
      {
        url: 'https://nnumbercheck.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NNumberCheck — Free Aircraft History Lookup',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NNumberCheck — Free Aircraft N-Number Lookup',
    description:
      'Free aircraft history lookup with 44 years of NTSB accident data.',
  },
  alternates: {
    canonical: 'https://nnumbercheck.com',
  },
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: "How do I check an aircraft's history by N-number?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Enter any US N-number (like N12345) into the search box on NNumberCheck.com. You'll instantly see the aircraft's FAA registration details and its complete NTSB accident history from 1982 to present — free, with no signup required.",
      },
    },
    {
      '@type': 'Question',
      name: 'What information is in the free N-number lookup?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "The free lookup includes the aircraft's registration status, manufacturer, model, year, serial number, registered owner city and state, and its full NTSB accident history. No account or payment is required.",
      },
    },
    {
      '@type': 'Question',
      name: 'How far back does the accident history go?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'NNumberCheck includes 87,978 NTSB accident records covering the period from January 1982 through the present — over 44 years of aviation accident history.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is NNumberCheck affiliated with the FAA?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "No. NNumberCheck is an independent data aggregation service. We pull from the FAA's public Releasable Aircraft Database and the NTSB's public accident records, but we are not affiliated with or endorsed by either agency.",
      },
    },
    {
      '@type': 'Question',
      name: 'What does the $149 full history report include?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The full report includes detailed accident records with narratives, FAA registration and airworthiness data, registered owner information, deregistration status, and a downloadable PDF you can share with your broker or lender.',
      },
    },
  ],
};

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* GEO/AEO: FAQPage structured data for AI engines and search.
          Product schema intentionally omitted — digital reports are not
          eligible for Google merchant listings, which requires shipping and
          return policy fields. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd).replace(/</g, '\\u003c'),
        }}
      />

      {/* Header */}
      <header className="border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-sky-600">NNumberCheck</span>
            <span className="text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full font-medium">
              Beta
            </span>
          </a>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#how-it-works" className="hover:text-sky-600">How it works</a>
            <a href="#pricing" className="hover:text-sky-600">Pricing</a>
            <a href="#dealers" className="hover:text-sky-600">For Dealers</a>
            <a
              href="#lookup"
              className="bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition"
            >
              Free Lookup
            </a>
          </nav>
        </div>
      </header>

      {/* Hero — Answer-first H1 and subtitle for AI extractability */}
      <section className="bg-gradient-to-b from-sky-50 to-white">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
            Free N-Number Lookup &amp; Aircraft History Report
          </h1>
          <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
            <strong>
              NNumberCheck is a free aircraft history lookup tool.
            </strong>{' '}
            Enter any US N-number to instantly see FAA registration details and
            44 years of NTSB accident records (87,978 reports, 1982–present).
          </p>

          {/* Search Box */}
          <form
            id="lookup"
            action="/n"
            method="get"
            className="mt-10 max-w-xl mx-auto flex flex-col sm:flex-row gap-3"
          >
            <input
              type="text"
              name="number"
              placeholder="Enter N-Number (e.g., N12345)"
              className="flex-1 px-5 py-4 rounded-xl border-2 border-slate-300 focus:border-sky-500 focus:outline-none text-lg"
              required
              pattern="[Nn]?[0-9]{1,5}[A-Za-z]{0,2}"
              title="Enter a valid N-number, e.g. N12345"
            />
            <button
              type="submit"
              className="bg-sky-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-sky-700 transition"
            >
              Search
            </button>
          </form>
          <p className="mt-3 text-sm text-slate-500">
            Free basic lookup. No signup required.
          </p>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-y border-slate-200 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-wrap justify-center items-center gap-x-10 gap-y-3 text-sm text-slate-500">
          <span>✓ 317,000+ aircraft</span>
          <span>✓ 88,000+ accident records</span>
          <span>✓ Data from 1982 to today</span>
          <span>✓ Instant results</span>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center">
          How it works
        </h2>
        <p className="mt-4 text-center text-slate-600 max-w-2xl mx-auto">
          Three steps from curiosity to confidence.
        </p>

        <div className="mt-14 grid md:grid-cols-3 gap-8">
          {[
            {
              step: '1',
              title: 'Enter the N-Number',
              desc: "Type any US-registered aircraft's tail number into the search box.",
            },
            {
              step: '2',
              title: 'Review the free summary',
              desc: 'See registration details, make, model, year, and accident history instantly.',
            },
            {
              step: '3',
              title: 'Unlock the full report',
              desc: 'Get detailed accident records, ownership information, and a downloadable PDF for $149.',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-lg transition"
            >
              <div className="w-10 h-10 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold">
                {item.step}
              </div>
              <h3 className="mt-5 text-xl font-semibold">{item.title}</h3>
              <p className="mt-2 text-slate-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What's included */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center">
            What&apos;s in the full report
          </h2>
          <p className="mt-4 text-center text-slate-600 max-w-2xl mx-auto">
            Everything you need to make an informed decision before you buy.
          </p>

          <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Complete Accident History',
                desc: 'Full NTSB records for the aircraft, from 1982 to today.',
              },
              {
                title: 'Registration Details',
                desc: 'Current FAA registration, serial, airworthiness, and owner information.',
              },
              {
                title: 'Ownership Information',
                desc: 'Registered owner and their location, sourced from the FAA registry.',
              },
              {
                title: 'Airframe & Engine Data',
                desc: 'Manufacturer, model, year of manufacture, and serial number.',
              },
              {
                title: 'Deregistration Check',
                desc: 'Flags aircraft no longer in the active FAA registry.',
              },
              {
                title: 'Downloadable PDF',
                desc: 'Clean, shareable report you can save or send to your broker.',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-white border border-slate-200 rounded-xl p-6"
              >
                <h3 className="font-semibold text-lg">{f.title}</h3>
                <p className="mt-2 text-slate-600 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ — GEO/AEO extractable Q&A */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center">
          Frequently asked questions
        </h2>
        <p className="mt-4 text-center text-slate-600 max-w-2xl mx-auto">
          Answers to common questions about aircraft history lookup.
        </p>

        <div className="mt-14 space-y-6">
          {[
            {
              q: "How do I check an aircraft's history by N-number?",
              a: "Enter any US N-number (like N12345) into the search box. You'll instantly see the aircraft's FAA registration details and its complete NTSB accident history from 1982 to present — free, with no signup required.",
            },
            {
              q: 'What information is in the free N-number lookup?',
              a: "The free lookup includes the aircraft's registration status, manufacturer, model, year, serial number, registered owner city and state, and its full NTSB accident history.",
            },
            {
              q: 'How far back does the accident history go?',
              a: 'NNumberCheck includes 87,978 NTSB accident records covering the period from January 1982 through the present — over 44 years of aviation accident history.',
            },
            {
              q: 'Is NNumberCheck affiliated with the FAA?',
              a: "No. NNumberCheck is an independent data aggregation service. We pull from the FAA's public Releasable Aircraft Database and the NTSB's public accident records, but we are not affiliated with or endorsed by either agency.",
            },
            {
              q: 'What does the $149 full history report include?',
              a: 'The full report includes detailed accident records, FAA registration and airworthiness data, registered owner information, deregistration status, and a downloadable PDF you can share with your broker or lender.',
            },
          ].map((item) => (
            <div
              key={item.q}
              className="border border-slate-200 rounded-2xl p-6 bg-white"
            >
              <h3 className="text-lg font-semibold text-slate-900">{item.q}</h3>
              <p className="mt-3 text-slate-600">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-center text-slate-600 max-w-2xl mx-auto">
            Pay only for what you need. No subscriptions required.
          </p>

          <div className="mt-14 grid md:grid-cols-3 gap-6">
            {/* Free */}
            <div className="border border-slate-200 rounded-2xl p-8 bg-white">
              <h3 className="text-xl font-semibold">Free Lookup</h3>
              <p className="mt-3 text-4xl font-bold">$0</p>
              <p className="mt-1 text-sm text-slate-500">Always free</p>
              <ul className="mt-6 space-y-3 text-slate-600 text-sm">
                <li>✓ Registration status</li>
                <li>✓ Make, model, year</li>
                <li>✓ Owner city &amp; state</li>
                <li>✓ Full accident history</li>
              </ul>
              <a
                href="#lookup"
                className="mt-8 block text-center border border-sky-600 text-sky-600 py-3 rounded-xl font-semibold hover:bg-sky-50 transition"
              >
                Start Free Search
              </a>
            </div>

            {/* Full Report */}
            <div className="border-2 border-sky-600 rounded-2xl p-8 relative bg-sky-50/50">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sky-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                Most Popular
              </span>
              <h3 className="text-xl font-semibold">Full History Report</h3>
              <p className="mt-3 text-4xl font-bold">$149</p>
              <p className="mt-1 text-sm text-slate-500">One-time payment</p>
              <ul className="mt-6 space-y-3 text-slate-700 text-sm">
                <li>✓ Everything in Free</li>
                <li>✓ Detailed accident records</li>
                <li>✓ Registration &amp; airworthiness</li>
                <li>✓ Ownership information</li>
                <li>✓ Deregistration status</li>
                <li>✓ Downloadable PDF report</li>
              </ul>
              <a
                href="#lookup"
                className="mt-8 block text-center bg-sky-600 text-white py-3 rounded-xl font-semibold hover:bg-sky-700 transition"
              >
                Get Full Report
              </a>
            </div>

            {/* Dealer */}
            <div id="dealers" className="border border-slate-200 rounded-2xl p-8 bg-white">
              <h3 className="text-xl font-semibold">Dealer Plan</h3>
              <p className="mt-3 text-4xl font-bold">
                $199<span className="text-lg font-normal text-slate-500">/mo</span>
              </p>
              <p className="mt-1 text-sm text-slate-500">For brokers &amp; dealers</p>
              <ul className="mt-6 space-y-3 text-slate-600 text-sm">
                <li>✓ Unlimited lookups</li>
                <li>✓ Bulk N-number search</li>
                <li>✓ API access</li>
                <li>✓ Priority support</li>
                <li>✓ White-label PDF reports</li>
              </ul>
              <a
                href="mailto:support@nnumbercheck.com?subject=Dealer%20Plan%20Inquiry"
                className="mt-8 block text-center border border-slate-900 text-slate-900 py-3 rounded-xl font-semibold hover:bg-slate-100 transition"
              >
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-sky-600 text-white">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold">
            Know the aircraft before you buy
          </h2>
          <p className="mt-4 text-sky-100 text-lg">
            Skip the guesswork. Get the full picture in seconds.
          </p>
          <a
            href="#lookup"
            className="mt-8 inline-block bg-white text-sky-600 px-8 py-4 rounded-xl font-semibold hover:bg-sky-50 transition"
          >
            Search an N-Number
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-xl font-bold text-sky-600">NNumberCheck</div>
              <p className="mt-3 text-sm text-slate-500">
                Aircraft history reports for smarter buying decisions.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-slate-900">Product</h4>
              <ul className="mt-3 space-y-2 text-sm text-slate-500">
                <li><a href="#how-it-works" className="hover:text-sky-600">How it works</a></li>
                <li><a href="#pricing" className="hover:text-sky-600">Pricing</a></li>
                <li><a href="#lookup" className="hover:text-sky-600">Free lookup</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-slate-900">Company</h4>
              <ul className="mt-3 space-y-2 text-sm text-slate-500">
                <li><a href="/about" className="hover:text-sky-600">About</a></li>
                <li><a href="mailto:support@nnumbercheck.com" className="hover:text-sky-600">Contact</a></li>
                <li><a href="#dealers" className="hover:text-sky-600">For Dealers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-slate-900">Legal</h4>
              <ul className="mt-3 space-y-2 text-sm text-slate-500">
                <li><a href="/privacy" className="hover:text-sky-600">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-sky-600">Terms of Service</a></li>
                <li><a href="/refund" className="hover:text-sky-600">Refund Policy</a></li>
                <li><a href="/disclaimer" className="hover:text-sky-600">Disclaimer</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-slate-200 text-xs text-slate-500 flex flex-col md:flex-row justify-between gap-4">
            <p>© {new Date().getFullYear()} NNumberCheck.com. All rights reserved.</p>
            <p className="max-w-xl">
              Not affiliated with the FAA or NTSB. For historical reference only.
              Verify all information with official records before making any
              purchase or safety decision.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
