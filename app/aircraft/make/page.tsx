import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import makeHubsData from '@/data/make-hubs.json';

const makeHubs = makeHubsData as Record<string, any>;

export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams() {
  return Object.keys(makeHubs).map((make) => ({ make }));
}

type Props = {
  params: Promise<{ make: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { make } = await params;
  const hub = makeHubs[make];
  if (!hub) return {};

  const title = `${hub.make} Aircraft: Complete Guide, AD List & Models (2026)`;
  const description = `${hub.total_aircraft.toLocaleString()} ${hub.make} aircraft registered with the FAA. Browse models, accident history, Airworthiness Directives, and buy guides for ${hub.make} owners.`;

  return {
    title,
    description,
    alternates: { canonical: `https://nnumbercheck.com/aircraft/make/${make}` },
    openGraph: {
      title,
      description,
      url: `https://nnumbercheck.com/aircraft/make/${make}`,
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function MakeHubPage({ params }: Props) {
  const { make } = await params;
  const hub = makeHubs[make];
  if (!hub) notFound();

  const answerParagraph = `${hub.total_aircraft.toLocaleString()} ${hub.make} aircraft are currently registered with the FAA. The database tracks ${hub.total_accidents.toLocaleString()} NTSB accident records affecting ${hub.make} aircraft, ${hub.total_ads} Airworthiness Directives that match ${hub.make} makes and models, and ${hub.total_sdrs.toLocaleString()} Service Difficulty Reports filed by mechanics.`;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://nnumbercheck.com' },
      { '@type': 'ListItem', position: 2, name: 'Aircraft', item: 'https://nnumbercheck.com/aircraft' },
      { '@type': 'ListItem', position: 3, name: hub.make, item: `https://nnumbercheck.com/aircraft/make/${make}` },
    ],
  };

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') }}
      />

      <nav className="max-w-6xl mx-auto px-6 py-3 text-xs text-slate-500">
        <Link href="/" className="hover:text-sky-600">Home</Link>
        <span className="mx-2">›</span>
        <Link href="/aircraft" className="hover:text-sky-600">Aircraft</Link>
        <span className="mx-2">›</span>
        <span>{hub.make}</span>
      </nav>

      <section className="bg-gradient-to-b from-sky-50 to-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
            {hub.make} Aircraft Guide
          </h1>
          <p className="mt-6 text-lg text-slate-700 max-w-3xl leading-relaxed">
            {answerParagraph}
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12 space-y-12">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="border border-slate-200 rounded-xl p-5 text-center">
            <div className="text-2xl font-bold text-sky-600">{hub.total_aircraft.toLocaleString()}</div>
            <div className="text-xs text-slate-500 mt-1">Registered aircraft</div>
          </div>
          <div className="border border-slate-200 rounded-xl p-5 text-center">
            <div className="text-2xl font-bold text-red-600">{hub.total_accidents.toLocaleString()}</div>
            <div className="text-xs text-slate-500 mt-1">NTSB accident records</div>
          </div>
          <div className="border border-slate-200 rounded-xl p-5 text-center">
            <div className="text-2xl font-bold text-amber-600">{hub.total_ads}</div>
            <div className="text-xs text-slate-500 mt-1">Airworthiness Directives</div>
          </div>
          <div className="border border-slate-200 rounded-xl p-5 text-center">
            <div className="text-2xl font-bold text-slate-600">{hub.total_sdrs.toLocaleString()}</div>
            <div className="text-xs text-slate-500 mt-1">Service Difficulty Reports</div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">{hub.make} Models</h2>
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Model</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-700">Aircraft</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-700">Browse</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hub.models.map((m: any) => (
                  <tr key={m.slug} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-slate-900">{m.model}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{m.count.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/aircraft/make/${make}/model/${m.slug}`}
                        className="text-sky-600 hover:underline text-xs font-medium"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {hub.sample_aircraft && hub.sample_aircraft.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Sample {hub.make} Aircraft</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {hub.sample_aircraft.map((ac: any) => (
                <Link
                  key={ac.n_number}
                  href={`/aircraft/${ac.n_number}`}
                  className="border border-slate-200 rounded-xl p-4 hover:border-sky-400 hover:bg-sky-50 transition"
                >
                  <div className="font-mono font-semibold text-slate-900">{ac.n_number}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {ac.year} {ac.model}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="bg-sky-600 text-white rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold">Check any {hub.make} aircraft by N-number</h2>
          <p className="mt-2 text-sky-100">
            Free FAA registry lookup, full NTSB accident history, and serial-level AD applicability check.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="inline-block bg-white text-sky-600 px-8 py-3 rounded-xl font-semibold hover:bg-sky-50 transition">
              Search an N-number →
            </Link>
            <Link href="/ad-check" className="inline-block border-2 border-white text-white px-8 py-3 rounded-xl font-semibold hover:bg-white/10 transition">
              Free AD check
            </Link>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Related guides</h2>
          <ul className="space-y-2 text-sm">
            <li><Link href="/aircraft" className="text-sky-600 hover:underline">Browse all aircraft →</Link></li>
            <li><Link href="/guides/cessna-172" className="text-sky-600 hover:underline">Cessna 172 buyer&apos;s guide →</Link></li>
            <li><Link href="/guides/piper-pa-28" className="text-sky-600 hover:underline">Piper PA-28 buyer&apos;s guide →</Link></li>
            <li><Link href="/ad-check" className="text-sky-600 hover:underline">Free AD applicability check →</Link></li>
          </ul>
        </div>
      </section>
    </div>
  );
}
