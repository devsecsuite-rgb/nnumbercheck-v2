'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';

// Mock data — will be replaced with real FAA/NTSB data
const MOCK_DATA: Record<string, {
  nNumber: string;
  make: string;
  model: string;
  year: number;
  serialNumber: string;
  ownerCity: string;
  ownerState: string;
  registrationStatus: string;
  airworthinessDate: string;
  accidents: Array<{
    date: string;
    location: string;
    severity: string;
    summary: string;
  }>;
}> = {
  N12345: {
    nNumber: 'N12345',
    make: 'Cessna',
    model: '172S Skyhawk',
    year: 2005,
    serialNumber: '172S98765',
    ownerCity: 'Wichita',
    ownerState: 'KS',
    registrationStatus: 'Valid',
    airworthinessDate: '2005-08-15',
    accidents: [
      {
        date: '2018-06-12',
        location: 'Denver, CO',
        severity: 'Minor',
        summary: 'Hard landing resulting in propeller strike. No injuries reported.',
      },
    ],
  },
};

function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-sky-600">
          NNumberCheck
        </Link>
        <Link
          href="/"
          className="text-sm font-medium text-sky-600 hover:underline"
        >
          ← New search
        </Link>
      </div>
    </header>
  );
}

function LookupResult() {
  const searchParams = useSearchParams();
  const rawNumber = searchParams.get('number') || '';
  const nNumber = rawNumber.toUpperCase().startsWith('N')
    ? rawNumber.toUpperCase()
    : 'N' + rawNumber.toUpperCase();

  // No number provided
  if (!rawNumber) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <h1 className="text-3xl font-bold">No N-Number provided</h1>
          <p className="mt-4 text-slate-600">
            Please enter an N-number to search.
          </p>
          <Link
            href="/"
            className="mt-8 inline-block bg-sky-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-sky-700 transition"
          >
            Back to search
          </Link>
        </div>
      </div>
    );
  }

  // Invalid format
  const isValid =
    /^N[0-9]{1,5}[A-Z]{0,2}$/.test(nNumber) && nNumber.length <= 6;

  if (!isValid) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <h1 className="text-3xl font-bold">Invalid N-Number</h1>
          <p className="mt-4 text-slate-600">
            &ldquo;{rawNumber}&rdquo; doesn&apos;t look like a valid US N-number.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            N-numbers look like N12345 or N1234A.
          </p>
          <Link
            href="/"
            className="mt-8 inline-block bg-sky-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-sky-700 transition"
          >
            Try again
          </Link>
        </div>
      </div>
    );
  }

  const data = MOCK_DATA[nNumber];

  // Valid format but not in our demo data
  if (!data) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <h1 className="text-3xl font-bold font-mono">{nNumber}</h1>
          <p className="mt-4 text-slate-600">
            We don&apos;t have data for this aircraft in our demo database yet.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            In the full version, we&apos;ll pull real FAA and NTSB records for
            any US-registered aircraft.
          </p>
          <Link
            href="/"
            className="mt-8 inline-block bg-sky-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-sky-700 transition"
          >
            Try a demo N-number
          </Link>
          <p className="mt-4 text-sm text-slate-500">
            Try:{' '}
            <span className="font-mono font-semibold text-slate-900">
              N12345
            </span>
          </p>
        </div>
      </div>
    );
  }

  // Full result
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Demo banner */}
      <div className="bg-amber-50 border-b border-amber-200">
        <div className="max-w-6xl mx-auto px-6 py-3 text-sm text-amber-800 text-center">
          ⚠️ Demo data — real FAA and NTSB records coming soon.
        </div>
      </div>

      {/* Aircraft header */}
      <section className="bg-gradient-to-b from-sky-50 to-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex items-baseline gap-4 flex-wrap">
            <h1 className="text-4xl md:text-5xl font-bold font-mono">
              {data.nNumber}
            </h1>
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
              {data.registrationStatus} Registration
            </span>
          </div>
          <p className="mt-4 text-xl text-slate-700">
            {data.year} {data.make} {data.model}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Serial: {data.serialNumber} • Owner: {data.ownerCity},{' '}
            {data.ownerState}
          </p>
        </div>
      </section>

      {/* Free summary */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold">Free Summary</h2>
        <p className="mt-2 text-slate-600">What we found instantly.</p>

        <div className="mt-8 grid md:grid-cols-2 gap-6">
          {/* Registration */}
          <div className="border border-slate-200 rounded-2xl p-6">
            <h3 className="font-semibold text-lg">Registration</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Status</dt>
                <dd className="font-medium">{data.registrationStatus}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Airworthiness Date</dt>
                <dd className="font-medium">{data.airworthinessDate}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Manufacturer</dt>
                <dd className="font-medium">{data.make}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Model</dt>
                <dd className="font-medium">{data.model}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Year</dt>
                <dd className="font-medium">{data.year}</dd>
              </div>
            </dl>
          </div>

          {/* Accidents */}
          <div className="border border-slate-200 rounded-2xl p-6">
            <h3 className="font-semibold text-lg">Accident History</h3>
            {data.accidents.length === 0 ? (
              <p className="mt-4 text-slate-600 text-sm">
                No accidents found in NTSB records.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {data.accidents.map((acc, i) => (
                  <div key={i} className="text-sm border-l-2 border-red-400 pl-4">
                    <div className="flex items-center gap-2">
                      <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-medium">
                        {acc.severity}
                      </span>
                      <span className="text-slate-500">{acc.date}</span>
                    </div>
                    <p className="mt-1 font-medium text-slate-700">
                      {acc.location}
                    </p>
                    <p className="mt-1 text-slate-600">{acc.summary}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Paid report CTA */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold">
              Unlock the full history
            </h2>
            <p className="mt-4 text-slate-600">
              Get the complete picture before you buy.
            </p>
          </div>

          <div className="mt-12 grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h3 className="font-semibold text-lg">What&apos;s included</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                <li>✓ Full ownership chain</li>
                <li>✓ Liens &amp; encumbrances</li>
                <li>✓ Airworthiness directives</li>
                <li>✓ Detailed accident records</li>
                <li>✓ Market value estimate</li>
                <li>✓ Downloadable PDF report</li>
              </ul>
            </div>

            <div className="bg-sky-600 text-white rounded-2xl p-6 flex flex-col">
              <h3 className="font-semibold text-lg">Full History Report</h3>
              <p className="mt-4 text-4xl font-bold">$149</p>
              <p className="mt-1 text-sky-100 text-sm">One-time payment</p>
              <div className="mt-auto pt-6">
                <button
                  disabled
                  className="w-full bg-white text-sky-600 py-3 rounded-xl font-semibold opacity-60 cursor-not-allowed"
                >
                  Coming soon
                </button>
                <p className="mt-3 text-xs text-sky-100 text-center">
                  Payment integration coming soon.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-8 text-xs text-slate-500 flex flex-col md:flex-row justify-between gap-4">
          <p>© {new Date().getFullYear()} NNumberCheck.com</p>
          <p className="max-w-xl">
            Not affiliated with the FAA. For historical reference only.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <p className="text-slate-500">Loading...</p>
        </div>
      }
    >
      <LookupResult />
    </Suspense>
  );
}
