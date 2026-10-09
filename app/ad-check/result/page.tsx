'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';

function ResultContent() {
  const searchParams = useSearchParams();
  const rawNumber = searchParams.get('n') || '';
  const nNumber = rawNumber.toUpperCase().startsWith('N')
    ? rawNumber.toUpperCase()
    : 'N' + rawNumber.toUpperCase();

  const [data, setData] = useState<any>(null);
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
        const res = await fetch(`/api/ad-check?n=${nNumber}`);
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

  if (!rawNumber) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <h1 className="text-3xl font-bold">No N-Number provided</h1>
          <Link
            href="/ad-check"
            className="mt-8 inline-block bg-sky-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-sky-700 transition"
          >
            Try again
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <p className="text-slate-500">Checking ADs for {nNumber}...</p>
        </div>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <h1 className="text-3xl font-bold font-mono">{nNumber}</h1>
          <p className="mt-4 text-slate-600">
            We couldn&apos;t find this aircraft in our database.
          </p>
          <Link
            href="/ad-check"
            className="mt-8 inline-block bg-sky-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-sky-700 transition"
          >
            Try another N-number
          </Link>
        </div>
      </div>
    );
  }

  const { aircraft, directives, summary } = data;

  const badgeFor = (applicability: string) => {
    if (applicability === 'applies')
      return {
        text: 'Applies to this aircraft',
        cls: 'bg-red-100 text-red-700',
        border: 'border-red-400',
      };
    if (applicability === 'not_applies')
      return {
        text: 'Does not apply',
        cls: 'bg-slate-100 text-slate-500',
        border: 'border-slate-300',
      };
    return {
      text: 'Verify applicability',
      cls: 'bg-amber-100 text-amber-800',
      border: 'border-amber-400',
    };
  };

    return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: `What Airworthiness Directives apply to ${aircraft.n_number}?`,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: `${aircraft.n_number} (${aircraft.year || ''} ${aircraft.make || ''} ${aircraft.model || ''}) has ${summary.applies} Airworthiness Directive${summary.applies === 1 ? '' : 's'} that apply based on serial number, and ${summary.verify} that require manual verification. A total of ${summary.total} potentially applicable ADs were found.`,
                },
              },
              {
                '@type': 'Question',
                name: `Does ${aircraft.n_number} have any applicable ADs?`,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text:
                    summary.applies > 0
                      ? `Yes. ${summary.applies} Airworthiness Directive${summary.applies === 1 ? '' : 's'} apply to ${aircraft.n_number} based on its serial number. Buyers should verify compliance in the aircraft's logbook.`
                      : `No Airworthiness Directives were confirmed to apply to ${aircraft.n_number} based on serial number. ${summary.verify} AD${summary.verify === 1 ? '' : 's'} require manual verification.`,
                },
              },
            ],
          }).replace(/</g, '\\u003c'),
        }}
      />
      <Header />

      <section className="bg-gradient-to-b from-sky-50 to-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <h1 className="text-3xl md:text-4xl font-bold font-mono">
            {aircraft.n_number}
          </h1>
          <p className="mt-2 text-lg text-slate-700">
            {aircraft.year ? `${aircraft.year} ` : ''}
            {aircraft.make} {aircraft.model}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Serial: {aircraft.serial_number || 'Not available'}
          </p>

          <div className="mt-6 flex flex-wrap gap-4">
            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
              {summary.applies} applies
            </span>
            <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
              {summary.verify} to verify
            </span>
            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm font-medium">
              {summary.total} total
            </span>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-12 space-y-6">
        {directives.length === 0 ? (
          <div className="border border-slate-200 rounded-2xl p-8 text-center">
            <p className="text-slate-600">
              No matching Airworthiness Directives found for this aircraft
              type.
            </p>
          </div>
        ) : (
          directives.map((ad: any) => {
            const badge = badgeFor(ad.applicability);
            return (
              <div
                key={ad.ad_number}
                className={`border-l-4 ${badge.border} border border-slate-200 rounded-xl p-6`}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-semibold">
                    AD {ad.ad_number}
                  </span>
                  <span
                    className={`${badge.cls} px-2 py-0.5 rounded text-xs font-semibold`}
                  >
                    {badge.text}
                  </span>
                  {ad.effective_date && (
                    <span className="text-slate-500 text-xs">
                      Effective: {ad.effective_date}
                    </span>
                  )}
                </div>

                <h3 className="mt-3 font-semibold text-slate-800">
                  {ad.title}
                </h3>

                {ad.serial_start && ad.serial_end && (
                  <p className="mt-2 text-xs text-slate-500">
                    Serial range: {ad.serial_start} – {ad.serial_end}
                    {ad.serial_exceptions &&
                      ` (except ${ad.serial_exceptions})`}
                  </p>
                )}

                {ad.abstract && (
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    {ad.abstract.slice(0, 300)}
                    {ad.abstract.length > 300 ? '...' : ''}
                  </p>
                )}

                {ad.document_url && (
                  <a
                    href={ad.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-xs font-medium text-sky-600 hover:underline"
                  >
                    View official document on FederalRegister.gov →
                  </a>
                )}
              </div>
            );
          })
        )}

        <div className="bg-sky-600 text-white rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold">
            Get the complete report for {aircraft.n_number}
          </h2>
          <p className="mt-2 text-sky-100">
            Full AD list, detailed accident history, ownership chain, and a
            downloadable PDF.
          </p>
          <Link
            href={`/n?number=${aircraft.n_number}`}
            className="mt-6 inline-block bg-white text-sky-600 px-8 py-3 rounded-xl font-semibold hover:bg-sky-50 transition"
          >
            View Full Report →
          </Link>
        </div>
      </section>

    </div>
  );
}

function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-sky-600">
          NNumberCheck
        </Link>
        <Link
          href="/ad-check"
          className="text-sm font-medium text-sky-600 hover:underline"
        >
          ← New AD check
        </Link>
      </div>
    </header>
  );
}

export default function AdCheckResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <p className="text-slate-500">Loading...</p>
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}
