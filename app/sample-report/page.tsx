import Link from 'next/link';
import type { Metadata } from 'next';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Sample Aircraft History Report — NNumberCheck',
  description:
    'See what a full NNumberCheck aircraft history report looks like. Includes registration details, accident history, Airworthiness Directives, ownership information, and downloadable PDF.',
  alternates: {
    canonical: 'https://nnumbercheck.com/sample-report',
  },
};

const SAMPLE = {
  n_number: 'N123AB',
  year: 2005,
  make: 'Cessna',
  model: '172S Skyhawk',
  serial_number: '172S98765',
  owner_name: 'Sunrise Flight Academy LLC',
  owner_city: 'Scottsdale',
  owner_state: 'AZ',
  registration_status: 'Valid',
  airworthiness_date: '2005-08-15',
  accidents: [
    {
      id: 1,
      event_date: '2018-06-12',
      location: 'Denver, CO',
      severity: 'Minor',
      summary:
        'Hard landing resulting in propeller strike. No injuries reported. Aircraft repaired and returned to service per FAA Form 337.',
    },
  ],
  directives: [
    {
      ad_number: '2011-10988',
      title:
        'Airworthiness Directives; Cessna Aircraft Company Models 150, 152, 172, 182, 206, 207, 210 Series Airplanes',
      effective_date: '2011-05-13',
      applicability: 'applies',
      abstract:
        'This AD requires repetitive inspections and replacement of parts of the seat rail and seat rail holes; seat pin engagement; seat rollers, washers, and axle bolts or bushings. Failure could lead to the pilot/copilot losing control of the airplane.',
    },
    {
      ad_number: '2009-10-09',
      title: 'Airworthiness Directives; Cessna Aircraft Company 172 Series Airplanes',
      effective_date: '2009-06-22',
      applicability: 'applies',
      abstract:
        'This AD requires either installing a placard prohibiting spins and other acrobatic maneuvers in the airplane or replacing the rudder stop, rudder stop bumper, and attachment hardware with a new rudder stop modification kit.',
    },
    {
      ad_number: '2015-01916',
      title: 'Airworthiness Directives; Lycoming Engines',
      effective_date: '2015-10-15',
      applicability: 'verify',
      abstract:
        'This AD requires inspection of the oil filter for metal contamination and replacement of the oil pump impeller if necessary. Applies to specific Lycoming engine serial numbers. Verify applicability against this aircraft\'s engine logbook.',
    },
    {
      ad_number: '2017-02255',
      title: 'Airworthiness Directives; Hartzell Propeller Inc.',
      effective_date: '2018-01-08',
      applicability: 'verify',
      abstract:
        'This AD requires a one-time visual inspection of the propeller blade retention system and replacement of any cracked components. Applies to specific Hartzell propeller models and serial number ranges.',
    },
    {
      ad_number: '2013-02179',
      title: 'Airworthiness Directives; Cessna Aircraft Company',
      effective_date: '2013-12-02',
      applicability: 'verify',
      abstract:
        'This AD requires inspection of the fuel system for leaks and replacement of the fuel selector valve. Applies to specific model and serial number ranges.',
    },
  ],
  ownership: [
    { year: 2005, owner: 'Original Owner — First Registration' },
    { year: 2012, owner: 'Sunrise Flight Academy LLC' },
  ],
};

function severityLabel(raw: string): string {
  const s = raw.toLowerCase().trim();
  if (s === 'fatal') return 'Fatal injuries';
  if (s === 'serious') return 'Serious injuries';
  if (s === 'minor') return 'Minor injuries';
  if (s === 'none') return 'No injuries reported';
  return 'Injuries not yet reported';
}

export default function SampleReportPage() {
  return (
    <div className="min-h-screen bg-white">
       {/* Sample banner */}
      <div className="bg-amber-50 border-b border-amber-200">
        <div className="max-w-6xl mx-auto px-6 py-3 text-sm text-amber-800 text-center">
          <strong>Sample Report</strong> — This is a demo showing what a
          full NNumberCheck report looks like. It uses fictional data for
          example aircraft N123AB. To get a real report for any US aircraft,
          search an N-number on the{' '}
          <Link href="/" className="underline font-medium">
            home page
          </Link>
          .
        </div>
      </div>

      {/* Report header */}
      <section className="bg-gradient-to-b from-emerald-50 to-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="inline-block bg-emerald-100 text-emerald-800 text-xs font-medium px-3 py-1 rounded-full mb-4">
            ✓ Sample — Full History Report
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-mono text-slate-900">
            {SAMPLE.n_number}
          </h1>
          <p className="mt-3 text-xl text-slate-700">
            {SAMPLE.year} {SAMPLE.make} {SAMPLE.model}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Serial: {SAMPLE.serial_number}
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        {/* Data freshness */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-500">
          <span className="font-medium text-slate-600">Data freshness:</span>
          <span>
            FAA registry: <strong className="text-slate-700">Oct 7, 2026</strong>
          </span>
          <span>
            NTSB accidents: <strong className="text-slate-700">Oct 7, 2026</strong>
          </span>
          <span>
            Airworthiness Directives:{' '}
            <strong className="text-slate-700">Oct 7, 2026</strong>
          </span>
        </div>

        {/* Registration */}
        <div className="border border-slate-200 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-slate-900">
            Registration Details
          </h2>
          <dl className="mt-6 grid sm:grid-cols-2 gap-4 text-sm">
            <Detail label="N-Number" value={SAMPLE.n_number} mono />
            <Detail label="Serial Number" value={SAMPLE.serial_number} mono />
            <Detail label="Manufacturer" value={SAMPLE.make} />
            <Detail label="Model" value={SAMPLE.model} />
            <Detail label="Year" value={SAMPLE.year} />
            <Detail label="Registration Status" value={SAMPLE.registration_status} />
            <Detail label="Airworthiness Date" value={SAMPLE.airworthiness_date} />
            <Detail label="Owner" value={SAMPLE.owner_name} />
            <Detail label="Owner City" value={SAMPLE.owner_city} />
            <Detail label="Owner State" value={SAMPLE.owner_state} />
          </dl>
        </div>

        {/* Accident history */}
        <div className="border border-slate-200 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-slate-900">
            Complete Accident History
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            NTSB records from 1982 to present. {SAMPLE.accidents.length} record
            {SAMPLE.accidents.length === 1 ? '' : 's'} found.
          </p>

          <div className="mt-6 space-y-6">
            {SAMPLE.accidents.map((acc) => (
              <div
                key={acc.id}
                className="border-l-4 border-red-400 pl-6 py-2"
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-semibold">
                    {severityLabel(acc.severity)}
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
          <p className="mt-4 text-xs text-slate-400 italic">
            Severity reflects injuries to people involved, not damage to the
            aircraft.
          </p>
        </div>

        {/* Airworthiness Directives */}
        <div className="border border-slate-200 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-slate-900">
            Applicable Airworthiness Directives
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Matched against this aircraft&apos;s serial number where regulatory
            data is available.
          </p>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs">
            <span className="text-red-700">
              <strong>2</strong> applies to this aircraft
            </span>
            <span className="text-amber-700">
              <strong>3</strong> require manual verification
            </span>
          </div>

          <div className="mt-6 space-y-5">
            {SAMPLE.directives.map((ad) => {
              const badge =
                ad.applicability === 'applies'
                  ? { text: 'Applies to this aircraft', cls: 'bg-red-100 text-red-700' }
                  : { text: 'Verify applicability', cls: 'bg-amber-100 text-amber-800' };
              const borderCls =
                ad.applicability === 'applies'
                  ? 'border-red-400'
                  : 'border-amber-400';
              return (
                <div
                  key={ad.ad_number}
                  className={`border-l-4 ${borderCls} pl-6 py-2`}
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-semibold">
                      AD {ad.ad_number}
                    </span>
                    <span className={`${badge.cls} px-2 py-0.5 rounded text-xs font-semibold`}>
                      {badge.text}
                    </span>
                    <span className="text-slate-500 text-xs">
                      Effective: {ad.effective_date}
                    </span>
                  </div>
                  <p className="mt-2 font-semibold text-slate-800">
                    {ad.title}
                  </p>
                  <p className="mt-1 text-slate-600 text-sm">{ad.abstract}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ownership chain */}
        <div className="border border-slate-200 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-slate-900">
            Ownership Chain
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Historical owner records from the FAA registry.
          </p>

          <div className="mt-6 space-y-3">
            {SAMPLE.ownership.map((o, i) => (
              <div key={i} className="flex items-baseline gap-4 text-sm">
                <span className="font-mono text-slate-500 w-16">{o.year}</span>
                <span className="text-slate-700">{o.owner}</span>
              </div>
            ))}
          </div>
        </div>

        {/* PDF preview */}
        <div className="border border-slate-200 rounded-2xl p-8 bg-slate-50">
          <h2 className="text-2xl font-bold text-slate-900">
            Downloadable PDF Report
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            A branded PDF of this report — with all registration details,
            accident history, AD list, and ownership chain — is included in
            the Full Report.
          </p>
          <div className="mt-6 bg-white border border-slate-200 rounded-xl p-6 text-center">
            <div className="inline-block bg-sky-100 text-sky-700 px-3 py-1 rounded text-xs font-semibold mb-3">
              PDF PREVIEW
            </div>
            <div className="text-slate-700 font-medium">
              NNumberCheck_{SAMPLE.n_number}_History_Report.pdf
            </div>
            <div className="text-xs text-slate-500 mt-2">
              3 pages · Full registration, accidents, ADs, ownership
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-sky-600 text-white rounded-2xl p-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold">
            Get the full report for any aircraft
          </h2>
          <p className="mt-3 text-sky-100 max-w-2xl mx-auto">
            Enter any US N-number to see registration data, accident history,
            all applicable ADs, and a downloadable PDF.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-block bg-white text-sky-600 px-8 py-3 rounded-xl font-semibold hover:bg-sky-50 transition"
            >
              Search an N-Number
            </Link>
            <Link
              href="/ad-check"
              className="inline-block bg-sky-700 text-white px-8 py-3 rounded-xl font-semibold hover:bg-sky-800 transition border border-sky-400"
            >
              Free AD Check
            </Link>
          </div>
        </div>
      </section>

    </div>
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
