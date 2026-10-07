import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';

const TEST_LIMIT: number | null = null;

const DATA_DIR = path.join(process.cwd(), 'data');
const PAGES_FILE = path.join(DATA_DIR, 'aircraft-pages.json');
const DATA_FILE = path.join(DATA_DIR, 'aircraft-data.json');

let cachedData: Record<string, any> | null = null;
let cachedList: string[] | null = null;

function loadNNumberList(): string[] {
  if (cachedList) return cachedList;
  const raw = fs.readFileSync(PAGES_FILE, 'utf-8');
  const list = JSON.parse(raw) as string[];
  cachedList = TEST_LIMIT ? list.slice(0, TEST_LIMIT) : list;
  return cachedList;
}

function loadAircraftData(): Record<string, any> {
  if (cachedData) return cachedData;
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  cachedData = JSON.parse(raw);
  return cachedData!;
}

function severityLabel(raw: string | undefined): string {
  if (!raw) return 'Injuries not yet reported';
  const s = raw.toLowerCase().trim();
  if (s === 'fatal') return 'Fatal injuries';
  if (s === 'serious') return 'Serious injuries';
  if (s === 'minor') return 'Minor injuries';
  if (s === 'none') return 'No injuries reported';
  if (s === 'unknown' || s === 'n/a') return 'Injuries not yet reported';
  return raw;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  const list = loadNNumberList();
  return list.map((n) => ({ nnumber: n }));
}

type Props = {
  params: Promise<{ nnumber: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { nnumber } = await params;
  const data = loadAircraftData();
  const entry = data[nnumber];

  if (!entry) return {};

  const ac = entry.aircraft;
  const titleParts = [ac.year, ac.make, ac.model].filter(Boolean).join(' ');
  const title = titleParts ? `${nnumber} — ${titleParts}` : nnumber;

  return {
    title: `${title} Aircraft History & Registration`,
    description: `Complete history for aircraft ${nnumber}: FAA registration details, NTSB accident records, and applicable Airworthiness Directives.`,
    alternates: {
      canonical: `https://nnumbercheck.com/aircraft/${nnumber}`,
    },
    openGraph: {
      title: `${title} — NNumberCheck`,
      description: `FAA registration, NTSB accidents, and Airworthiness Directives for ${nnumber}.`,
      url: `https://nnumbercheck.com/aircraft/${nnumber}`,
      type: 'website',
    },
  };
}

export default async function AircraftPage({ params }: Props) {
  const { nnumber } = await params;
  const data = loadAircraftData();
  const entry = data[nnumber];

  if (!entry) notFound();

  const { aircraft, accidents, directives } = entry;
  const hasAccidents = accidents && accidents.length > 0;
  const hasDirectives = directives && directives.length > 0;

  const aircraftTitle = [aircraft.year, aircraft.make, aircraft.model]
    .filter(Boolean)
    .join(' ');

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
        name: `Aircraft ${nnumber}`,
        item: `https://nnumbercheck.com/aircraft/${nnumber}`,
      },
    ],
  };

  const aircraftJsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: aircraftTitle || nnumber,
    description: `FAA registration and NTSB accident history for aircraft ${nnumber}.`,
    sku: nnumber,
    brand: {
      '@type': 'Brand',
      name: aircraft.make || 'Unknown',
    },
  };

  const related = Object.entries(data)
    .filter(
      ([n, e]) =>
        n !== nnumber &&
        e.aircraft?.make === aircraft.make &&
        e.aircraft?.model === aircraft.model
    )
    .slice(0, 6)
    .map(([n]) => n);

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(aircraftJsonLd).replace(/</g, '\\u003c'),
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
            ← New search
          </Link>
        </div>
      </header>

      <section className="bg-gradient-to-b from-sky-50 to-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex items-baseline gap-4 flex-wrap">
            <h1 className="text-4xl md:text-5xl font-bold font-mono">
              {aircraft.n_number}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                aircraft.registration_status === 'Valid'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {aircraft.registration_status} Registration
            </span>
          </div>
          <p className="mt-4 text-xl text-slate-700">{aircraftTitle}</p>
          {aircraft.owner_name && (
            <p className="mt-1 text-sm text-slate-500">
              {aircraft.serial_number && `Serial: ${aircraft.serial_number} • `}
              Owner: {aircraft.owner_name}
              {aircraft.owner_city &&
                ` — ${aircraft.owner_city}${aircraft.owner_state ? ', ' + aircraft.owner_state : ''}`}
            </p>
          )}

          <p className="mt-6 text-slate-700 text-base max-w-3xl">
            <strong>
              {nnumber} is a {aircraftTitle}
            </strong>
            {aircraft.owner_name &&
              ` registered to ${aircraft.owner_name}${
                aircraft.owner_city
                  ? ` in ${aircraft.owner_city}${aircraft.owner_state ? ', ' + aircraft.owner_state : ''}`
                  : ''
              }`}
            . Its FAA registration status is{' '}
            <strong>{aircraft.registration_status}</strong>.
            {hasAccidents
              ? ` It has ${accidents.length} NTSB accident record${accidents.length === 1 ? '' : 's'} on file.`
              : ' It has no NTSB accident records on file.'}
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12 space-y-10">
        {/* Registration */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Registration Details
          </h2>
          <div className="border border-slate-200 rounded-2xl p-6">
            <dl className="grid sm:grid-cols-2 gap-4 text-sm">
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
        </div>

        {/* Accidents */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Accident History
          </h2>
          <div className="border border-slate-200 rounded-2xl p-6">
            {!hasAccidents ? (
              <p className="text-slate-600 text-sm">
                No NTSB accidents found for this aircraft.
              </p>
            ) : (
              <div className="space-y-4">
                {accidents.map((acc: any) => (
                  <div
                    key={acc.id}
                    className="text-sm border-l-2 border-red-400 pl-4"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-medium">
                        {severityLabel(acc.severity)}
                      </span>
                      <span className="text-slate-500">{acc.event_date}</span>
                    </div>
                    <p className="mt-1 font-medium text-slate-700">
                      {acc.location}
                    </p>
                    <p className="mt-1 text-slate-600">{acc.summary}</p>
                  </div>
                ))}
                <p className="mt-3 text-xs text-slate-400 italic">
                  Severity reflects injuries to people, not damage to the
                  aircraft.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* AD preview */}
        {hasDirectives && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Applicable Airworthiness Directives
            </h2>
            <div className="border border-slate-200 rounded-2xl p-6">
              <div className="flex items-baseline justify-between flex-wrap gap-2 mb-2">
                <span className="text-xs text-slate-500">
                  {directives.length} found
                </span>
              </div>

              <div className="border-l-4 border-amber-400 pl-5 py-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-semibold">
                    AD {directives[0].ad_number}
                  </span>
                  {directives[0].effective_date && (
                    <span className="text-slate-500 text-xs">
                      Effective: {directives[0].effective_date}
                    </span>
                  )}
                </div>
                <p className="mt-2 font-semibold text-slate-800 text-sm">
                  {directives[0].title}
                </p>
                {directives[0].abstract && (
                  <p className="mt-1 text-slate-600 text-sm">
                    {directives[0].abstract}
                  </p>
                )}
              </div>

              {directives.length > 1 && (
                <div className="mt-6 bg-slate-50 border border-dashed border-slate-300 rounded-xl p-5 text-center">
                  <p className="text-sm font-medium text-slate-700">
                    +{directives.length - 1} more Airworthiness Directive
                    {directives.length - 1 === 1 ? '' : 's'} found for this
                    aircraft
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Full list, with effective dates and links to the official
                    Federal Register documents, is included in the paid report.
                  </p>
                  <Link
                    href={`/n?number=${nnumber}`}
                    className="mt-4 inline-block bg-sky-600 text-white px-6 py-2 rounded-lg font-semibold text-sm hover:bg-sky-700 transition"
                  >
                    Get the full report →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Related aircraft */}
        {related.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Other {aircraft.make} {aircraft.model} aircraft
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {related.map((n) => (
                <Link
                  key={n}
                  href={`/aircraft/${n}`}
                  className="border border-slate-200 rounded-xl p-4 hover:border-sky-400 hover:bg-sky-50 transition"
                >
                  <span className="font-mono font-semibold text-slate-900">
                    {n}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
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
