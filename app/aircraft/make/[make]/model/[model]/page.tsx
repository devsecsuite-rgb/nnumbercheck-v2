import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';

const TEST_LIMIT: number | null = 3000;

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
    .replace(/[/\\]/g, '-')      // replace slashes
    .replace(/[^a-z0-9\s-]/g, '') // remove other special chars
    .replace(/\s+/g, '-')         // spaces → hyphens
    .replace(/-+/g, '-')          // collapse multiple hyphens
    .replace(/^-|-$/g, '');       // trim leading/trailing hyphens
}

type Props = {
  params: Promise<{ make: string; model: string }>;
};

export const dynamicParams = false;

export async function generateStaticParams() {
  const data = loadData();
  const entries = Object.values(data) as any[];

  // Count aircraft per make/model
  const counts = new Map<string, { make: string; model: string; count: number }>();
  for (const entry of entries) {
    const make = entry.aircraft?.make;
    const model = entry.aircraft?.model;
    if (!make || !model) continue;
    const key = `${make}|${model}`;
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, { make, model, count: 1 });
    }
  }

  // Only build hub pages for make/models with at least 5 aircraft
  // Cap at 150 hub pages total to stay under file limits
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
  const title = `${make.replace(/-/g, ' ')} ${model.replace(/-/g, ' ')} Aircraft — History & Registration`;
  return {
    title,
    description: `Browse all ${make.replace(/-/g, ' ')} ${model.replace(/-/g, ' ')} aircraft in our database with FAA registration, NTSB accident history, and applicable Airworthiness Directives.`,
    alternates: {
      canonical: `https://nnumbercheck.com/aircraft/make/${make}/model/${model}`,
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
    }))
    .sort((a, b) => b.accidentCount - a.accidentCount);

  if (matching.length === 0) notFound();

  const displayMake = make.replace(/-/g, ' ');
  const displayModel = model.replace(/-/g, ' ');

  return (
    <div className="min-h-screen bg-white">
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

      <section className="bg-gradient-to-b from-sky-50 to-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 capitalize">
            {displayMake} {displayModel} Aircraft
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-3xl">
            {matching.length} aircraft in our database. Browse each N-number
            below for FAA registration, accident history, and applicable
            Airworthiness Directives.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12">
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
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-8 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} NNumberCheck.com</p>
        </div>
      </footer>
    </div>
  );
}
