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
            <Link href="/n" className="text-sky-600 hover:underline">
              Get the full report →
            </Link>
          </p>
        </div>
      </section>

    </div>
  );
}
