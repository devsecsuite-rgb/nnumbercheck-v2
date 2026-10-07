import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';

let cachedData: Record<string, any> | null = null;

function loadData() {
  if (cachedData) return cachedData;
  const dataFile = path.join(process.cwd(), 'data', 'aircraft-data.json');
  const raw = fs.readFileSync(dataFile, 'utf-8');
  cachedData = JSON.parse(raw);
  return cachedData!;
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

function unslugify(s: string) {
  return s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

type Props = {
  params: Promise<{ make: string; model: string }>;
};

export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams() {
  const data = loadData();
  const entries = Object.values(data) as any[];

  const counts = new Map<string, { make: string; model: string; count: number }>();
  for (const entry of entries) {
    const make = entry.aircraft?.make;
    const model = entry.aircraft?.model;
    if (!make || !model) continue;
    const key = `${make}|${model}`;
    const existing = counts.get(key);
    if (existing) existing.count += 1;
    else counts.set(key, { make, model, count: 1 });
  }

  return [...counts.values()]
    .filter((p) => p.count >= 5)
    .sort((a, b) => b.count - a.count)
    .slice(0, 150)
    .map(({ make, model }) => ({
      make: slugify(make),
      model: slugify(model),
    }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { make, model } = await params;
  const displayMake = unslugify(make);
  const displayModel = unslugify(model);

  const baseTitle = `${displayMake} ${displayModel} Aircraft`;
  let metaTitle = `${baseTitle} — History & Records`;
  if (metaTitle.length > 58) metaTitle = `${baseTitle} — History`;
  if (metaTitle.length > 58) metaTitle = baseTitle;

  return {
    title: { absolute: metaTitle },
    description: `Browse all ${displayMake} ${displayModel} aircraft in our database with FAA registration, NTSB accident history, and applicable Airworthiness Directives.`,
    alternates: {
      canonical: `https://nnumbercheck.com/aircraft/make/${make}/model/${model}`,
    },
    openGraph: {
      title: metaTitle,
      description: `FAA registration and NTSB history for ${displayMake} ${displayModel} aircraft.`,
      url: `https://nnumbercheck.com/aircraft/make/${make}/model/${model}`,
      type: 'website',
      images: [
        {
          url: 'https://nnumbercheck.com/og-image.png',
          width: 1200,
          height: 630,
          alt: `${displayMake} ${displayModel} aircraft`,
        },
      ],
    },
  };
}

export default async function MakeModelPage({ params }: Props) {
  const { make, model } = await params;
  const data = loadData();

  const matching = Object.entries(data)
    .filter(([_, entry]: [string, any]) => {
      const acMake = slugify(entry.aircraft?.make || '');
      const acModel = slugify(entry.aircraft?.model || '');
      return acMake === make && acModel === model;
    })
    .map(([n, entry]: [string, any]) => ({
      n_number: n,
      year: entry.aircraft?.year,
      accidentCount: (entry.accidents || []).length,
      adCount: (entry.directives || []).length,
    }))
    .sort((a, b) => b.accidentCount - a.accidentCount);

  if (matching.length === 0) notFound();

  const displayMake = unslugify(make);
  const displayModel = unslugify(model);
  const total = matching.length;
  const withAccidents = matching.filter((a) => a.accidentCount > 0).length;
  const totalAccidents = matching.reduce((sum, a) => sum + a.accidentCount, 0);
  const years = matching.map((a) => a.year).filter(Boolean);
  const oldestYear = years.length ? Math.min(...years) : null;
  const newestYear = years.length ? Math.max(...years) : null;

  // Collect unique ADs across all aircraft of this make/model
  const adMap = new Map<string, any>();
  for (const [_, entry] of Object.entries(data)) {
    if (slugify((entry as any).aircraft?.make || '') !== make) continue;
    if (slugify((entry as any).aircraft?.model || '') !== model) continue;
    for (const ad of (entry as any).directives || []) {
      if (!adMap.has(ad.ad_number)) adMap.set(ad.ad_number, ad);
    }
  }
  const topADs = [...adMap.values()].slice(0, 5);

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://nnumbercheck.com' },
      { '@type': 'ListItem', position: 2, name: 'Aircraft', item: 'https://nnumbercheck.com/aircraft' },
      { '@type': 'ListItem', position: 3, name: `${displayMake} ${displayModel}`, item: `https://nnumbercheck.com/aircraft/make/${make}/model/${model}` },
    ],
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `How many ${displayMake} ${displayModel} aircraft are in the database?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `There are ${total} ${displayMake} ${displayModel} aircraft listed in the NNumberCheck database. ${withAccidents} of them have at least one NTSB accident record on file.`,
        },
      },
      {
        '@type': 'Question',
        name: `How many ${displayMake} ${displayModel} aircraft have been in accidents?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${withAccidents} of the ${total} ${displayMake} ${displayModel} aircraft in the database have at least one NTSB accident record. In total, these aircraft have accumulated ${totalAccidents} accident record${totalAccidents === 1 ? '' : 's'}.`,
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, '\\u003c') }}
      />

      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-sky-600">
            NNumberCheck
          </Link>
          <Link href="/aircraft" className="text-sm font-medium text-sky-600 hover:underline">
            ← All aircraft
          </Link>
        </div>
      </header>

      <nav className="max-w-6xl mx-auto px-6 py-3 text-xs text-slate-500">
        <Link href="/" className="hover:text-sky-600">Home</Link>
        <span className="mx-2">›</span>
        <Link href="/aircraft" className="hover:text-sky-600">Aircraft</Link>
        <span className="mx-2">›</span>
        <span>{displayMake} {displayModel}</span>
      </nav>

      <section className="bg-gradient-to-b from-sky-50 to-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
            {displayMake} {displayModel} Aircraft
          </h1>
          <p className="mt-4 text-lg text-slate-700 max-w-3xl">
            <strong>{total} aircraft</strong> in our database. Browse each
            N-number below for FAA registration, accident history, and
            applicable Airworthiness Directives.
          </p>

          <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-xs text-slate-500">Total in database</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{total}</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-xs text-slate-500">With accident records</div>
              <div className="text-2xl font-bold text-red-600 mt-1">{withAccidents}</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-xs text-slate-500">Total accidents</div>
              <div className="text-2xl font-bold text-red-600 mt-1">{totalAccidents}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">
          All {displayMake} {displayModel} aircraft
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {matching.map((ac) => (
            <Link
              key={ac.n_number}
              href={`/aircraft/${ac.n_number}`}
              className="border border-slate-200 rounded-xl p-4 hover:border-sky-400 hover:bg-sky-50 transition"
            >
              <div className="font-mono font-semibold text-slate-900">
                {ac.n_number}
              </div>
              {ac.year && (
                <div className="text-xs text-slate-500 mt-1">{ac.year}</div>
              )}
              <div className="text-xs text-red-600 mt-1">
                {ac.accidentCount} accident{ac.accidentCount === 1 ? '' : 's'}
              </div>
            </Link>
          ))}
        </div>

        {/* About content block */}
        <div className="mt-12 border border-slate-200 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            About {displayMake} {displayModel} aircraft
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            The {displayMake} {displayModel} is a popular aircraft type in the
            US general aviation fleet. This page lists {total} currently
            registered {displayMake} {displayModel} aircraft that appear in the
            NNumberCheck database. Each aircraft is linked to its individual
            N-number page with FAA registration details, NTSB accident history,
            and applicable Airworthiness Directives.
          </p>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            Of the {total} aircraft listed, {withAccidents} have at least one
            NTSB accident record on file, and the group has accumulated a total
            of {totalAccidents} accident record{totalAccidents === 1 ? '' : 's'}.
            Buyers researching a {displayMake} {displayModel} should review the
            specific N-number of any aircraft they are considering, verify all
            Airworthiness Directives have been complied with, and check the
            aircraft&apos;s logbooks for maintenance history.
          </p>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            Data on this page is sourced from the FAA Releasable Aircraft
            Database, NTSB Aviation Accident Reports, and the Federal Register.
            All data is publicly available from US government sources.
          </p>
        </div>

        {/* Why buyers check — content block that always renders */}
        <div className="mt-8 border border-slate-200 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Why buyers check {displayMake} {displayModel} history
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Before purchasing a {displayMake} {displayModel}, buyers should
            verify the aircraft&apos;s complete history. The FAA registration
            shows the current owner and registration status. NTSB records show
            any accidents or incidents since 1982. Airworthiness Directives
            show the FAA-mandated safety fixes that must be complied with for
            the aircraft to remain legally airworthy. Together, these three
            sources give a complete picture of an aircraft&apos;s regulatory
            and safety history.
          </p>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            {oldestYear && newestYear
              ? `The ${displayMake} ${displayModel} aircraft in our database range from ${oldestYear} to ${newestYear} model years.`
              : `This page lists every ${displayMake} ${displayModel} in our database with their individual registration and safety records.`}{' '}
            Each linked N-number page provides free access to registration
            details and accident history. Paid reports add ownership chain
            information, all applicable Airworthiness Directive documents, and
            a downloadable PDF.
          </p>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            Sellers should also be aware that a clean history report makes an
            aircraft more attractive to buyers. Aircraft with no accidents and
            no outstanding ADs typically command higher prices in the used
            market. Buyers should always obtain a professional pre-buy
            inspection and title search before completing any aircraft
            transaction.
          </p>
        </div>

        {/* Common ADs section (only if ADs exist) */}
        {topADs.length > 0 && (
          <div className="mt-8 border border-slate-200 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Common Airworthiness Directives for {displayMake} {displayModel}
            </h2>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              The following Airworthiness Directives have been issued by the
              FAA for the {displayMake} {displayModel}. AD applicability
              depends on the specific serial number and configuration of each
              aircraft. Buyers should verify applicability in the
              aircraft&apos;s logbooks and confirm the current AD status with
              the FAA before purchase.
            </p>
            <ul className="space-y-3 text-sm">
              {topADs.map((ad: any, i: number) => (
                <li key={i} className="border-l-2 border-amber-400 pl-4">
                  <div className="font-mono text-xs text-amber-700">
                    AD {ad.ad_number}
                  </div>
                  <div className="mt-1 text-slate-700">{ad.title}</div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Data sources block — always renders, ~80 words */}
        <div className="mt-8 border border-slate-200 rounded-2xl p-8 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Data sources and refresh schedule
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Aircraft registration data on this page is sourced from the FAA
            Releasable Aircraft Database, which is refreshed weekly. NTSB
            accident records are sourced from the National Transportation
            Safety Board&apos;s public accident database covering 1982 to
            present. Airworthiness Directives are sourced from the Federal
            Register. All data is public-domain and available from US
            government sources. NNumberCheck is not affiliated with the FAA,
            NTSB, or any government agency. Data is provided for historical
            reference only and should not be used as the sole basis for any
            aircraft purchase, financing, insurance, or safety decision.
          </p>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-8 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} NNumberCheck.com</p>
        </div>
      </footer>
    </div>
  );
}
