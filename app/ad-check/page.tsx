import Link from 'next/link';
import type { Metadata } from 'next';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Free AD Applicability Check — Find Airworthiness Directives',
  description:
    'Enter any N-number to see which Airworthiness Directives apply to that specific aircraft. Free serial-number-level AD matching. No signup required.',
  alternates: {
    canonical: 'https://nnumbercheck.com/ad-check',
  },
};

export default function AdCheckPage() {
  return (
    <div className="min-h-screen bg-white">
      
      <section className="bg-gradient-to-b from-sky-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
            Free AD Applicability Check
          </h1>
          <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto">
            Enter any US aircraft N-number to see exactly which Airworthiness
            Directives apply to that specific aircraft. Serial-number-level
            matching — no signup required.
          </p>

          <form
            action="/ad-check/result"
            method="get"
            className="mt-10 max-w-xl mx-auto flex flex-col sm:flex-row gap-3"
          >
            <input
              type="text"
              name="n"
              placeholder="Enter N-Number (e.g., N69009)"
              className="flex-1 px-5 py-4 rounded-xl border-2 border-slate-300 focus:border-sky-500 focus:outline-none text-lg font-mono"
              required
              pattern="[Nn]?[0-9]{1,5}[A-Za-z]{0,2}"
              title="Enter a valid N-number, e.g. N69009"
            />
            <button
              type="submit"
              className="bg-sky-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-sky-700 transition"
            >
              Check ADs
            </button>
          </form>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-16 space-y-8">
        <div className="border border-slate-200 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Why this matters
          </h2>
          <p className="text-slate-600 leading-relaxed">
            Airworthiness Directives (ADs) are legally enforceable FAA rules
            that apply to specific aircraft, engines, or components. All
            applicable ADs must be complied with for an aircraft to remain
            legally airworthy. But the FAA's Dynamic Regulatory System (DRS)
            makes it difficult to determine which ADs apply to a specific
            serial number — the system requires manual review of each AD's
            applicability statement.
          </p>
          <p className="mt-4 text-slate-600 leading-relaxed">
            NNumberCheck's free AD Applicability Check automates this process.
            Enter an N-number and we match the aircraft's serial number against
            every AD's applicability range, showing you:
          </p>
          <ul className="mt-4 space-y-2 text-slate-600">
            <li className="flex items-start gap-3">
              <span className="text-red-600 font-bold">●</span>
              <span>
                <strong>Applies</strong> — the AD applies to this aircraft
                based on its serial number
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-amber-600 font-bold">●</span>
              <span>
                <strong>Verify</strong> — no serial range data available; the
                buyer should verify applicability manually
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-slate-400 font-bold">●</span>
              <span>
                <strong>Does not apply</strong> — the serial number falls
                outside the AD's range
              </span>
            </li>
          </ul>
        </div>

        <div className="border border-slate-200 rounded-2xl p-8 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            What you get
          </h2>
          <ul className="space-y-3 text-sm text-slate-600">
            <li>✓ Complete list of potentially applicable ADs for this aircraft</li>
            <li>✓ Serial-number-level applicability for ADs with range data</li>
            <li>✓ Links to official Federal Register documents</li>
            <li>✓ Free — no signup required</li>
          </ul>
          <p className="mt-6 text-sm text-slate-500">
            Want a downloadable PDF and full ownership chain?{' '}
            <Link href="/" className="text-sky-600 hover:underline font-medium">
              Search an N-number →
            </Link>
          </p>
        </div>

        {/* ============================================================ */}
        {/* PHASE 2 UPGRADE: Fan-Out SEO Content for "where to find ADs" */}
        {/* ============================================================ */}
        <div className="border-t border-slate-200 mt-12 pt-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Where to Find Airworthiness Directives for Your Aircraft</h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            Wondering where to find airworthiness directives for a specific aircraft? The official FAA AD search tool (Dynamic Regulatory System) is notoriously difficult to use and often returns broad, confusing results that require manual interpretation.
          </p>
          <p className="text-slate-700 leading-relaxed mb-4">
            Instead of a generic FAA AD search, use our free tool above. Simply enter the N-Number, and our system cross-references the aircraft's <strong>manufacturer serial number</strong> against the entire database of active ADs, showing you exactly which ones apply, which require manual verification, and which do not apply.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-4">Why Generic AD Searches Miss Critical Safety Issues</h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            An Airworthiness Directive might apply to a 1978 Cessna 172 but <em>not</em> a 1998 Cessna 172R, even though they share the same model name. Generic searches often miss this nuance. 
          </p>
          <p className="text-slate-700 leading-relaxed mb-4">
            By tracking the immutable manufacturer serial number, NNumberCheck ensures you are looking at the true, physical history of the airframe you are about to buy, protecting you from costly, unexpected maintenance grounded by an overlooked AD.
          </p>

          {/* Internal linking to keep crawl depth shallow and pass authority */}
          <div className="mt-8 pt-8 border-t border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Related Aircraft Guides</h3>
            <ul className="space-y-2 text-sky-600">
              <li><Link href="/guides/cessna-172-history-and-ad-check" className="hover:underline">Cessna 172 History & AD Lookup Guide</Link></li>
              <li><Link href="/guides/piper-pa-28" className="hover:underline">Piper PA-28 History & AD Lookup Guide</Link></li>
            </ul>
          </div>
        </div>
      </section>

    </div>
  );
}
