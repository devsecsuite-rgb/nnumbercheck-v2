import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const PAGES_FILE = path.join(DATA_DIR, 'aircraft-pages.json');
const DATA_FILE = path.join(DATA_DIR, 'aircraft-data.json');
const ENRICHMENT_FILE = path.join(DATA_DIR, 'aircraft-enrichment.json');

let cachedData: Record<string, any> | null = null;
let cachedList: string[] | null = null;
let cachedEnrichment: Record<string, { accidents?: number; sdrs?: number }> | null = null;

// ============================================================
// QUALITY GATE — MUST MATCH sitemap.ts AND reduce Cloudflare file count
// Gate: 5+ accidents OR 10+ SDRs OR in seeded family
// ============================================================

const ACC_MIN = 5;
const SDR_MIN = 10;

const SEEDED_FAMILIES = [
  { make: 'cessna', model: '152' },
  { make: 'cessna', model: '172' },
  { make: 'cessna', model: '182' },
  { make: 'piper', model: 'pa-28' },
  { make: 'cirrus', model: 'sr22' },
  { make: 'beech', model: '36' },
  { make: 'beechcraft', model: '36' },
  { make: 'raytheon', model: '36' },
  { make: 'textron', model: '36' },
  { make: 'hawker', model: '36' },
];

function isSeededFamily(make: string, model: string): boolean {
  if (!make || !model) return false;
  const m = make.toLowerCase();
  const mo = model.toLowerCase();
  return SEEDED_FAMILIES.some(
    (f) => m.includes(f.make) && mo.includes(f.model)
  );
}

function loadAircraftData(): Record<string, any> {
  if (cachedData) return cachedData;
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  cachedData = JSON.parse(raw);
  return cachedData!;
}

function loadEnrichment(): Record<string, { accidents?: number; sdrs?: number }> {
  if (cachedEnrichment) return cachedEnrichment;
  try {
    const raw = fs.readFileSync(ENRICHMENT_FILE, 'utf-8');
    cachedEnrichment = JSON.parse(raw);
  } catch {
    cachedEnrichment = {};
  }
  return cachedEnrichment!;
}

// IMPORTANT: this returns only the aircraft that pass the quality gate.
// This is what keeps the build under Cloudflare's 20,000 file limit.
function loadNNumberList(): string[] {
  if (cachedList) return cachedList;
  const raw = fs.readFileSync(PAGES_FILE, 'utf-8');
  const allAircraft = JSON.parse(raw) as string[];

  const data = loadAircraftData();
  const enrichment = loadEnrichment();

  cachedList = allAircraft.filter((n) => {
    const entry = data[n];
    if (!entry) return false;

    const ac = entry.aircraft || {};
    const make = ac.make || '';
    const model = ac.model || '';

    // Seeded families always pass
    if (isSeededFamily(make, model)) return true;

    // Otherwise check enrichment
    const enr = enrichment[n];
    if (!enr) return false;

    if ((enr.accidents || 0) >= ACC_MIN) return true;
    if ((enr.sdrs || 0) >= SDR_MIN) return true;

    return false;
  });

  console.log(`[aircraft pages] ${allAircraft.length} total → ${cachedList.length} after quality gate`);
  return cachedList;
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

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[/\\]/g, '-')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function shouldIndex(nNumber: string, entry: any): boolean {
  const ac = entry?.aircraft || {};
  const make = ac.make || '';
  const model = ac.model || '';

  if (isSeededFamily(make, model)) return true;

  const enrichment = loadEnrichment();
  const enr = enrichment[nNumber];
  if (!enr) return false;

  if ((enr.accidents || 0) >= ACC_MIN) return true;
  if ((enr.sdrs || 0) >= SDR_MIN) return true;

  return false;
}

export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams() {
  const list = loadNNumberList();
  return list.map((n) => ({ nnumber: n }));
}

type Props = {
  params: Promise<{ nnumber: string }>;
};

// ============================================================
// PHASE 1 & SEO FIX: High-CTR Metadata targeting exact search intent (Under 60/160 chars)
// ============================================================
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { nnumber } = await params;
  const data = loadAircraftData();
  const entry = data[nnumber];

  if (!entry) return {};

  const ac = entry.aircraft;
  const yearMakeModel = [ac.year, ac.make, ac.model].filter(Boolean).join(' ');
  
  // SHORTENED for strict SEO limits (Aim: Title ≤60, Desc ≤160)
  const metaTitle = `${nnumber} Aircraft History & AD Lookup | NNumberCheck`;
  const metaDescription = `Check FAA registry, NTSB accident history, and serial-matched Airworthiness Directives for ${nnumber} (${yearMakeModel}). Free lookup.`;

  const indexable = shouldIndex(nnumber, entry);

  return {
    title: { absolute: metaTitle },
    description: metaDescription,
    alternates: {
      canonical: `https://nnumbercheck.com/aircraft/${nnumber}`,
    },
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: true },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: `https://nnumbercheck.com/aircraft/${nnumber}`,
      type: 'website',
      images: [
        {
          url: 'https://nnumbercheck.com/og-image.png',
          width: 1200,
          height: 630,
          alt: `${nnumber} Aircraft History`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: ['https://nnumbercheck.com/og-image.png'],
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

  const enrichment = loadEnrichment();
  const enr = enrichment[nnumber] || {};
  const sdrCount = enr.sdrs || 0;
  const seeded = isSeededFamily(aircraft.make || '', aircraft.model || '');

  const aircraftTitle = [aircraft.year, aircraft.make, aircraft.model]
    .filter(Boolean)
    .join(' ');

  const ownerLocation = [aircraft.owner_city, aircraft.owner_state]
    .filter(Boolean)
    .join(', ');

  const introParts: string[] = [];
  introParts.push(
    `${nnumber} is a ${aircraftTitle || 'US-registered aircraft'}${
      aircraft.owner_name ? ` registered to ${aircraft.owner_name}` : ''
    }${ownerLocation ? ` in ${ownerLocation}` : ''}.`
  );
  introParts.push(
    `Its FAA registration status is ${aircraft.registration_status || 'unknown'}.`
  );
  if (hasAccidents) {
    introParts.push(
      `This aircraft has ${accidents.length} NTSB accident record${
        accidents.length === 1 ? '' : 's'
      } on file${
        accidents[0].event_date ? `, the most recent in ${accidents[0].event_date.slice(0, 4)}` : ''
      }.`
    );
  } else {
    introParts.push('It has no NTSB accident records on file.');
  }
  if (hasDirectives) {
    introParts.push(
      `${directives.length} Airworthiness Directive${
        directives.length === 1 ? '' : 's'
      } match this make and model.`
    );
  }
  if (sdrCount > 0) {
    introParts.push(
      `${sdrCount} Service Difficulty Report${
        sdrCount === 1 ? '' : 's'
      } filed for this model on record.`
    );
  }
  if (seeded) {
    introParts.push(
      'This aircraft is in one of the families with verified serial-level AD matching on NNumberCheck.'
    );
  }
  
  // ============================================================
  // GEO FIX: Boost word count and "statistics" count for AI auditors
  // ============================================================
  introParts.push(
    `This specific airframe has ${hasAccidents ? accidents.length : '0'} recorded NTSB events and ${hasDirectives ? directives.length : '0'} applicable Airworthiness Directives in our database of 87,978 accident records and 13,069 ADs.`
  );

  const answerParagraph = introParts.join(' ');

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://nnumbercheck.com' },
      { '@type': 'ListItem', position: 2, name: 'Aircraft', item: 'https://nnumbercheck.com/aircraft' },
      { '@type': 'ListItem', position: 3, name: `${nnumber} — ${aircraftTitle}`, item: `https://nnumbercheck.com/aircraft/${nnumber}` },
    ],
  };

  const vehicleJsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Vehicle',
    '@id': `https://nnumbercheck.com/aircraft/${nnumber}#vehicle`,
    name: aircraftTitle || nnumber,
    vehicleIdentificationNumber: nnumber,
    brand: { '@type': 'Brand', name: aircraft.make || 'Unknown' },
    model: aircraft.model || undefined,
    productionDate: aircraft.year ? `${aircraft.year}` : undefined,
    vehicleRegistration: {
      '@type': 'VehicleRegistration',
      identifier: nnumber,
      registrationStatus: aircraft.registration_status || undefined,
    },
  };

  const faqItems = [
    { question: `What is aircraft ${nnumber}?`, answer: answerParagraph },
    ...(hasAccidents
      ? [{
          question: `Has ${nnumber} been in an accident?`,
          answer: `Yes. ${nnumber} has ${accidents.length} NTSB accident record${accidents.length === 1 ? '' : 's'} on file. The most recent was on ${accidents[0].event_date} in ${accidents[0].location}.`,
        }]
      : [{
          question: `Has ${nnumber} been in an accident?`,
          answer: `No. There are no NTSB accident records for ${nnumber} in the database covering 1982 to present.`,
        }]),
    ...(hasDirectives
      ? [{
          question: `What Airworthiness Directives apply to ${nnumber}?`,
          answer: `${directives.length} potentially applicable Airworthiness Directive${directives.length === 1 ? '' : 's'} found for this aircraft.`,
        }]
      : []),
  ];

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };

  const related = Object.entries(data)
    .filter(([n, e]) => n !== nnumber && e.aircraft?.make === aircraft.make && e.aircraft?.model === aircraft.model)
    .slice(0, 6)
    .map(([n]) => n);

  const makeSlug = slugify(aircraft.make || '');
  const modelSlug = slugify(aircraft.model || '');

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(vehicleJsonLd).replace(/</g, '\\u003c') }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, '\\u003c') }} />

       <nav className="max-w-6xl mx-auto px-6 py-3 text-xs text-slate-500">
        <Link href="/" className="hover:text-sky-600">Home</Link>
        <span className="mx-2">›</span>
        <Link href="/aircraft" className="hover:text-sky-600">Aircraft</Link>
        <span className="mx-2">›</span>
        <span className="font-mono">{nnumber}</span>
      </nav>

      <section className="bg-gradient-to-b from-sky-50 to-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex items-baseline gap-4 flex-wrap">
            <h1 className="text-4xl md:text-5xl font-bold font-mono">{aircraft.n_number}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${aircraft.registration_status === 'Valid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {aircraft.registration_status} Registration
            </span>
          </div>
          <p className="mt-4 text-xl text-slate-700">{aircraftTitle}</p>
          <p className="mt-6 text-lg text-slate-700 max-w-3xl leading-relaxed">{answerParagraph}</p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12 space-y-12">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Registration Details</h2>
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

        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Accident History</h2>
          <div className="border border-slate-200 rounded-2xl p-6">
            {!hasAccidents ? (
              <>
                <p className="text-slate-600 text-sm">No NTSB accidents found for this aircraft.</p>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                  {nnumber} has no recorded NTSB accidents or incidents in the database covering 1982 to present.
                </p>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  {accidents.map((acc: any) => (
                    <div key={acc.id} className="text-sm border-l-2 border-red-400 pl-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-medium">{severityLabel(acc.severity)}</span>
                        <span className="text-slate-500">{acc.event_date}</span>
                      </div>
                      <p className="mt-1 font-medium text-slate-700">{acc.location}</p>
                      <p className="mt-1 text-slate-600">{acc.summary}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {hasDirectives && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Applicable Airworthiness Directives</h2>
            <div className="border border-slate-200 rounded-2xl p-6">
              <span className="text-xs text-slate-500">{directives.length} found</span>
              <div className="mt-3 border-l-4 border-amber-400 pl-5 py-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-semibold">AD {directives[0].ad_number}</span>
                  {directives[0].effective_date && <span className="text-slate-500 text-xs">Effective: {directives[0].effective_date}</span>}
                </div>
                <p className="mt-2 font-semibold text-slate-800 text-sm">{directives[0].title}</p>
                {directives[0].abstract && <p className="mt-1 text-slate-600 text-sm">{directives[0].abstract}</p>}
              </div>
              <div className="mt-5 pt-5 border-t border-slate-100">
                <Link href={`/ad-check/result?n=${nnumber}`} className="inline-flex items-center gap-2 text-sm font-medium text-sky-600 hover:underline">
                  <span className="bg-sky-100 text-sky-700 px-2 py-0.5 rounded text-xs font-semibold">FREE</span>
                  Check exact serial-number applicability for all {directives.length} ADs →
                </Link>
              </div>
            </div>
          </div>
        )}

        {sdrCount > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Service Difficulty Reports</h2>
            <div className="border border-slate-200 rounded-2xl p-6">
              <p className="text-slate-600 text-sm leading-relaxed">
                {sdrCount} Service Difficulty Report{sdrCount === 1 ? '' : 's'} on file for the {aircraft.make} {aircraft.model} model. SDRs are mechanic-filed reports of real failures and defects submitted to the FAA.
              </p>
            </div>
          </div>
        )}

        {related.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Other {aircraft.make} {aircraft.model} aircraft</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {related.map((n) => (
                <Link key={n} href={`/aircraft/${n}`} className="border border-slate-200 rounded-xl p-4 hover:border-sky-400 hover:bg-sky-50 transition">
                  <span className="font-mono font-semibold text-slate-900">{n}</span>
                </Link>
              ))}
            </div>
            <p className="mt-4 text-sm text-slate-600">
              <Link href={`/aircraft/make/${makeSlug}/model/${modelSlug}`} className="text-sky-600 hover:underline font-medium">
                View all {aircraft.make} {aircraft.model} aircraft →
              </Link>
            </p>
          </div>
        )}

        {/* PHASE 1 UPGRADE: Risk-Mitigation Conversion Block */}
        <div className="bg-slate-900 text-white rounded-2xl p-8 text-center border-2 border-amber-500">
          <h2 className="text-2xl font-bold text-amber-400">⚠️ Don't Buy Blind. Hidden ADs Can Cost You $10,000+</h2>
          <p className="mt-4 text-slate-300 max-w-2xl mx-auto">
            You’ve seen the basic registration and accident preview. But a single unresolved Airworthiness Directive (AD) on this aircraft’s specific serial number could ground it or require expensive, unexpected repairs.
          </p>
          
          <div className="mt-6 grid sm:grid-cols-3 gap-4 text-left max-w-3xl mx-auto text-sm text-slate-300">
            <div className="flex items-start gap-2">
              <span className="text-green-400 text-lg">✅</span>
              <span>Every FAA AD matched <strong>exactly</strong> to this serial number.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-400 text-lg">✅</span>
              <span>Complete, unredacted NTSB accident records (1982–Present).</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-400 text-lg">✅</span>
              <span>Full ownership history & downloadable PDF for your broker/lender.</span>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href={`/n?number=${nnumber}`} className="inline-block bg-amber-500 text-slate-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-amber-400 transition shadow-lg">
              Get Full History Report for $149
            </Link>
            <Link href="/sample-report" className="text-sm text-slate-400 hover:text-white underline">
              See a sample report first
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-500">One-time payment. Instant PDF delivery. 100% Secure.</p>
          
          {/* Dealer Plan Teaser */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-sm text-slate-400">
              Are you an aircraft broker or dealer?{' '}
              <Link href="/dealer-plan" className="text-sky-400 hover:text-sky-300 font-semibold underline">
                Get Unlimited Lookups, Bulk Search, and API Access for $199/mo →
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: any; mono?: boolean }) {
  return (
    <div className="flex justify-between border-b border-slate-100 pb-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`font-medium ${mono ? 'font-mono text-xs' : ''}`}>{value || '—'}</dd>
    </div>
  );
}
