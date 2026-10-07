import Link from 'next/link';
import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Aircraft Database — FAA Registration, Accidents & ADs',
  description:
    'Browse aircraft by N-number. Registration details, NTSB accident history, and applicable Airworthiness Directives for thousands of US aircraft.',
  alternates: {
    canonical: 'https://nnumbercheck.com/aircraft',
  },
};

type Aircraft = {
  n_number: string;
  make: string;
  model: string;
  year: number | null;
  accidentCount: number;
};

function loadAircraft(): Aircraft[] {
  const dataFile = path.join(process.cwd(), 'data', 'aircraft-data.json');
  const raw = fs.readFileSync(dataFile, 'utf-8');
  const data = JSON.parse(raw) as Record<string, any>;

  return Object.entries(data)
    .map(([n, entry]: [string, any]) => ({
      n_number: n,
      make: entry.aircraft?.make || '',
      model: entry.aircraft?.model || '',
      year: entry.aircraft?.year || null,
      accidentCount: (entry.accidents || []).length,
    }))
    .sort((a, b) => b.accidentCount - a.accidentCount);
}

export default function AircraftIndexPage() {
  const aircraft = loadAircraft();
  const total = aircraft.length;

  // Group by make for the hub structure
  const byMake = new Map<string, number>();
  for (const ac of aircraft) {
    if (!ac.make) continue;
    byMake.set(ac.make, (byMake.get(ac.make) || 0) + 1);
  }
  const makes = [...byMake.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30);

  // Featured: top 60 most-accident aircraft
  const featured = aircraft.slice(0, 60);

  return (
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

      <section className="bg-gradient-to-b from-sky-50 to-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
            Aircraft Database
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-3xl">
            Browse {total.toLocaleString()} US-registered aircraft with NTSB
            accident history and applicable FAA Airworthiness Directives. Data
            is sourced from the FAA, NTSB, and Federal Register.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12 space-y-12">
        {/* Browse by make */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Browse by Manufacturer
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {makes.map(([make, count]) => (
              <Link
                key={make}
                href={`/aircraft/make/${make.toLowerCase().replace(/\s+/g, '-')}`}
                className="border border-slate-200 rounded-xl p-4 hover:border-sky-400 hover:bg-sky-50 transition"
              >
                <div className="font-semibold text-slate-900 truncate">
                  {make}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {count} aircraft
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Featured aircraft */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Most-accident aircraft in our database
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {featured.map((ac) => (
              <Link
                key={ac.n_number}
                href={`/aircraft/${ac.n_number}`}
                className="border border-slate-200 rounded-xl p-4 hover:border-sky-400 hover:bg-sky-50 transition"
              >
                <div className="font-mono font-semibold text-slate-900">
                  {ac.n_number}
                </div>
                <div className="text-xs text-slate-500 mt-1 truncate">
                  {ac.year} {ac.make} {ac.model}
                </div>
                <div className="text-xs text-red-600 mt-1">
                  {ac.accidentCount} accident{ac.accidentCount === 1 ? '' : 's'}
                </div>
              </Link>
            ))}
          </div>
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
