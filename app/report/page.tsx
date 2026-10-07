'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';

function ReportContent() {
  const searchParams = useSearchParams();
  const nNumber = searchParams.get('n') || '';
  const txnId = searchParams.get('_ptxn') || '';

  const [loading, setLoading] = useState(true);
  const [purchase, setPurchase] = useState<any>(null);
  const [aircraft, setAircraft] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    if (!aircraft || !purchase) return;
    setDownloadingPdf(true);
    try {
      const { generatePdfReport } = await import('@/lib/generatePdfReport');
      await generatePdfReport(aircraft, purchase);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  useEffect(() => {
    if (!nNumber || !txnId) {
      setError('Missing purchase information.');
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      const maxAttempts = 6;
      const delayMs = 2500;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (cancelled) return;

        try {
          const res = await fetch(`/api/report?n=${nNumber}&txn=${txnId}`);
          const json = await res.json();

          if (res.ok) {
            if (!cancelled) {
              setPurchase(json.purchase);
              setAircraft(json.aircraft);
              setLoading(false);
            }
            return;
          }

          if (res.status === 404 && attempt < maxAttempts) {
            await new Promise((r) => setTimeout(r, delayMs));
            continue;
          }

          if (!cancelled) {
            setError(json.error || 'Unable to load report.');
            setLoading(false);
          }
          return;
        } catch {
          if (attempt < maxAttempts) {
            await new Promise((r) => setTimeout(r, delayMs));
            continue;
          }
          if (!cancelled) {
            setError('Network error. Please try again.');
            setLoading(false);
          }
          return;
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [nNumber, txnId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <ReportHeader />
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <p className="text-slate-500">Verifying your purchase...</p>
          <p className="mt-2 text-xs text-slate-400">
            This can take a few seconds while we confirm your payment.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <ReportHeader />
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <h1 className="text-2xl font-bold text-red-600">
            Unable to load report
          </h1>
          <p className="mt-4 text-slate-600">{error}</p>
          <Link
            href={`/n?number=${nNumber || ''}`}
            className="mt-8 inline-block bg-sky-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-sky-700 transition"
          >
            Back to aircraft page
          </Link>
        </div>
      </div>
    );
  }

  if (!aircraft) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <ReportHeader />

      <section className="bg-gradient-to-b from-emerald-50 to-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="inline-block bg-emerald-100 text-emerald-800 text-xs font-medium px-3 py-1 rounded-full mb-4">
            ✓ Payment Confirmed — Report Unlocked
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-mono text-slate-900">
            {aircraft.n_number}
          </h1>
          <p className="mt-3 text-xl text-slate-700">
            {aircraft.year ? `${aircraft.year} ` : ''}
            {aircraft.make} {aircraft.model}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Transaction ID: <span className="font-mono">{txnId}</span>
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-12 space-y-8">

        {/* Registration */}
        <div className="border border-slate-200 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-slate-900">
            Registration Details
          </h2>
          <dl className="mt-6 grid sm:grid-cols-2 gap-4 text-sm">
            <Detail label="N-Number" value={aircraft.n_number} mono />
            <Detail label="Serial Number" value={aircraft.serial_number} mono />
            <Detail label="Manufacturer" value={aircraft.make} />
            <Detail label="Model" value={aircraft.model} />
            <Detail label="Year" value={aircraft.year} />
            <Detail label="Registration Status" value={aircraft.registration_status} />
            <Detail label="Airworthiness Date" value={aircraft.airworthiness_date} />
            <Detail label="Owner" value={aircraft.owner_name} />
            <Detail label="Owner City" value={aircraft.owner_city} />
            <Detail label="Owner State" value={aircraft.owner_state} />
          </dl>
        </div>

        {/* Accident history */}
        <div className="border border-slate-200 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-slate-900">
            Complete Accident History
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            NTSB records from 1982 to present. {aircraft.accidents.length} record
            {aircraft.accidents.length === 1 ? '' : 's'} found.
          </p>

          {aircraft.accidents.length === 0 ? (
            <p className="mt-6 text-slate-600">
              No NTSB accidents found for this aircraft.
            </p>
          ) : (
            <div className="mt-6 space-y-6">
              {aircraft.accidents.map((acc: any) => (
                <div
                  key={acc.id}
                  className="border-l-4 border-red-400 pl-6 py-2"
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-semibold uppercase">
                      {acc.severity}
                    </span>
                    <span className="text-slate-700 font-medium">
                      {acc.event_date}
                    </span>
                  </div>
                  <p className="mt-2 font-semibold text-slate-800">
                    {acc.location}
                  </p>
                  <p className="mt-1 text-slate-600">{acc.summary}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Airworthiness Directives */}
        <div className="border border-slate-200 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-slate-900">
            Applicable Airworthiness Directives (ADs)
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            FAA-mandated safety directives potentially applicable to this
            aircraft based on manufacturer and model. Always verify applicability
            using the official AD text before making any decision.
          </p>

          {!aircraft.directives || aircraft.directives.length === 0 ? (
            <p className="mt-6 text-slate-600">
              No matching ADs found for this aircraft&apos;s make and model.
            </p>
          ) : (
            <div className="mt-6 space-y-5">
              {aircraft.directives.map((ad: any) => (
                <div
                  key={ad.ad_number}
                  className="border-l-4 border-amber-400 pl-6 py-2"
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-semibold">
                      AD {ad.ad_number}
                    </span>
                    {ad.effective_date && (
                      <span className="text-slate-500 text-xs">
                        Effective: {ad.effective_date}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 font-semibold text-slate-800">
                    {ad.title}
                  </p>
                  {ad.abstract && (
                    <p className="mt-1 text-slate-600 text-sm">
                      {ad.abstract}
                    </p>
                  )}
                  {ad.document_url && (
                    <a
                      href={ad.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-xs font-medium text-sky-600 hover:underline"
                    >
                      View official document on FederalRegister.gov →
                    </a>
                  )}
                </div>
              ))}
              {aircraft.directives.length === 20 && (
                <p className="text-xs text-slate-500 italic">
                  Showing the 20 most recent ADs. Additional older directives
                  may also apply.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Title & Liens Notice */}
        <div className="border border-slate-200 rounded-2xl p-8 bg-slate-50">
          <h2 className="text-2xl font-bold text-slate-900">
            Title &amp; Lien Verification
          </h2>
          <p className="mt-3 text-slate-700 text-sm">
            This report does not include a formal title search. The FAA
            Document Index — which records liens, security agreements, and
            bills of sale — is only accessible one aircraft at a time and is
            not available as bulk data. Historical lien records require a
            formal search by a licensed title company.
          </p>
          <p className="mt-4 text-slate-700 text-sm font-medium">
            Before purchasing any aircraft, we recommend ordering a title
            search from:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>
              •{' '}
              <a
                href="https://www.aerospacereports.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-600 hover:underline font-medium"
              >
                Aero-Space Reports
              </a>{' '}
              — traditional title search (~$85–$190)
            </li>
            <li>
              •{' '}
              <a
                href="https://www.aictitle.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-600 hover:underline font-medium"
              >
                AIC Title Service
              </a>{' '}
              — full title + escrow service
            </li>
          </ul>
          <p className="mt-4 text-xs text-slate-500 italic">
            NNumberCheck aggregates publicly available FAA and NTSB data. For
            aircraft transactions, always obtain a formal title search and
            title insurance.
          </p>
        </div>

        {/* Purchase receipt */}
        <div className="border border-slate-200 rounded-2xl p-8 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-900">Receipt</h2>
          <dl className="mt-4 grid sm:grid-cols-2 gap-4 text-sm">
            <Detail label="Transaction ID" value={purchase?.paddle_transaction_id} mono />
            <Detail label="Purchased On" value={purchase?.created_at} />
            <Detail
              label="Amount Paid"
              value={
                purchase?.amount_cents
                  ? `$${(purchase.amount_cents / 100).toFixed(2)} ${purchase.currency}`
                  : '—'
              }
            />
            <Detail label="Status" value={purchase?.status} />
          </dl>
        </div>

        {/* Download PDF */}
        <div className="text-center">
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="inline-block bg-sky-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-sky-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {downloadingPdf ? 'Generating PDF...' : 'Download PDF Report'}
          </button>
          <p className="mt-3 text-xs text-slate-500">
            A branded PDF with all report data, saved to your device.
          </p>
        </div>
      </section>

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

function ReportHeader() {
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

function Detail({
  label,
  value,
  mono,
}: {
  label: string;
  value: any;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between border-b border-slate-100 pb-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`font-medium ${mono ? 'font-mono text-xs' : ''}`}>
        {value || '—'}
      </dd>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <p className="text-slate-500">Loading...</p>
        </div>
      }
    >
      <ReportContent />
    </Suspense>
  );
}
