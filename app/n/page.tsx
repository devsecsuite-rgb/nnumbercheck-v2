'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';

type Accident = {
  id: number;
  n_number: string;
  event_date: string;
  location: string;
  severity: string;
  summary: string;
};

type Aircraft = {
  n_number: string;
  serial_number: string | null;
  make: string;
  model: string;
  year: number | null;
  owner_name: string | null;
  owner_city: string | null;
  owner_state: string | null;
  registration_status: string;
  airworthiness_date: string | null;
  accidents: Accident[];
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

  const [data, setData] = useState<Aircraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!rawNumber) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function fetchData() {
      try {
        const res = await fetch(`/api/aircraft/${nNumber}`);
        if (!res.ok) {
          if (!cancelled) setNotFound(true);
          return;
        }
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [nNumber, rawNumber]);

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

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <p className="text-slate-500">Looking up {nNumber}...</p>
        </div>
      </div>
    );
  }

  // Not found
  if (notFound || !data) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <h1 className="text-3xl font-bold font-mono">{nNumber}</h1>
          <p className="mt-4 text-slate-600">
            We don&apos;t have data for this aircraft in our database.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            This can happen if the N-number was never registered in the US, or
            if it has been fully removed from FAA and NTSB records.
          </p>
          <Link
            href="/"
            className="mt-8 inline-block bg-sky-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-sky-700 transition"
          >
            Try another N-number
          </Link>
          <p className="mt-6 text-sm text-slate-500">
            Popular lookups:{' '}
            <Link
              href="/n?number=N69009"
              className="font-mono font-semibold text-sky-600 hover:underline"
            >
              N69009
            </Link>
            {' · '}
            <Link
              href="/n?number=N172SP"
              className="font-mono font-semibold text-sky-600 hover:underline"
            >
              N172SP
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // Success — full result
  const hasAccidents = data.accidents && data.accidents.length > 0;

  // GEO/AEO structured data — BreadcrumbList only.
  // Product schema intentionally omitted: digital reports are not eligible
  // for Google merchant listings, which requires shipping + return policy.
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://nnumbercheck.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: `Aircraft ${data.n_number}`,
        item: `https://nnumbercheck.com/n?number=${data.n_number}`,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <Header />

      {/* Aircraft header */}
      <section className="bg-gradient-to-b from-sky-50 to-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex items-baseline gap-4 flex-wrap">
            <h1 className="text-4xl md:text-5xl font-bold font-mono">
              {data.n_number}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                data.registration_status === 'Valid'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {data.registration_status} Registration
            </span>
          </div>
          <p className="mt-4 text-xl text-slate-700">
            {data.year ? `${data.year} ` : ''}
            {data.make} {data.model}
          </p>
          {data.owner_name && (
            <p className="mt-1 text-sm text-slate-500">
              {data.serial_number && `Serial: ${data.serial_number} • `}
              Owner: {data.owner_name}
              {data.owner_city &&
                ` — ${data.owner_city}${data.owner_state ? ', ' + data.owner_state : ''}`}
            </p>
          )}

          {/* GEO/AEO: Answer-first extractable summary */}
          <p className="mt-6 text-slate-700 text-base max-w-3xl">
            <strong>
              {data.n_number} is a{' '}
              {data.year ? `${data.year} ` : ''}
              {data.make} {data.model}
            </strong>
            {data.owner_name &&
              ` registered to ${data.owner_name}${
                data.owner_city
                  ? ` in ${data.owner_city}${data.owner_state ? ', ' + data.owner_state : ''}`
                  : ''
              }`}
            . Its FAA registration status is{' '}
            <strong>{data.registration_status}</strong>.
            {data.accidents.length > 0
              ? ` It has ${data.accidents.length} NTSB accident record${data.accidents.length === 1 ? '' : 's'} on file.`
              : ' It has no NTSB accident records on file.'}
          </p>
        </div>
      </section>

      {/* Free summary */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold">Free Summary</h2>
        <p className="mt-2 text-slate-600">
          Live FAA registry data with NTSB accident records.
        </p>

        <div className="mt-8 grid md:grid-cols-2 gap-6">
          {/* Registration */}
          <div className="border border-slate-200 rounded-2xl p-6">
            <h3 className="font-semibold text-lg">Registration</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Status</dt>
                <dd className="font-medium">{data.registration_status}</dd>
              </div>
              {data.airworthiness_date && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Airworthiness Date</dt>
                  <dd className="font-medium">{data.airworthiness_date}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-slate-500">Manufacturer</dt>
                <dd className="font-medium">{data.make || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Model</dt>
                <dd className="font-medium">{data.model || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Year</dt>
                <dd className="font-medium">{data.year || '—'}</dd>
              </div>
              {data.serial_number && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Serial Number</dt>
                  <dd className="font-medium font-mono text-xs">
                    {data.serial_number}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Accidents */}
          <div className="border border-slate-200 rounded-2xl p-6">
            <h3 className="font-semibold text-lg">Accident History</h3>
            {!hasAccidents ? (
              <p className="mt-4 text-slate-600 text-sm">
                No accidents found in NTSB records for this aircraft.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {data.accidents.map((acc) => (
                  <div
                    key={acc.id}
                    className="text-sm border-l-2 border-red-400 pl-4"
                  >
                    <div className="flex items-center gap-2">
                      <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-medium">
                        {acc.severity}
                      </span>
                      <span className="text-slate-500">{acc.event_date}</span>
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
                <li>✓ Complete accident records</li>
                <li>✓ FAA registration &amp; airworthiness</li>
                <li>✓ Ownership information</li>
                <li>✓ Airframe &amp; engine data</li>
                <li>✓ Deregistration status</li>
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
            Not affiliated with the FAA or NTSB. For historical reference only.
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
                ← New search
              </Link>
            </div>
          </header>
          <main className="max-w-4xl mx-auto px-6 py-20">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
              Aircraft N-Number Lookup
            </h1>
            <p className="mt-4 text-slate-600 max-w-2xl">
              NNumberCheck provides free FAA registration data and 44 years of
              NTSB accident history for any US-registered aircraft. Search by
              N-number to see registration status, manufacturer, model,
              registered owner, and complete accident records from 1982 to
              present.
            </p>
            <p className="mt-6 text-slate-500">Loading aircraft data...</p>
          </main>
        </div>
      }
    >
      <LookupResult />
    </Suspense>
  );
}
