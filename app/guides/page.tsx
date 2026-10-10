import Link from 'next/link';
import type { Metadata } from 'next';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Aircraft Buying Guides — Pre-Buy Checklists & AD Guides',
  description:
    'Model-specific pre-buy guides for common aircraft. Covers Airworthiness Directives, accident patterns, cost of ownership, and inspection checklists.',
  alternates: {
    canonical: 'https://nnumbercheck.com/guides',
  },
};

const GUIDES = [
  {
    slug: 'cessna-172',
    title: 'Cessna 172 Pre-Buy Guide',
    description:
      'The most-produced aircraft in history. Common ADs, accident patterns, cost of ownership, and pre-buy checklist.',
  },
  {
    slug: 'piper-pa-28',
    title: 'Piper PA-28 Pre-Buy Guide',
    description:
      'Cherokee, Warrior, Archer, and Arrow family. Common ADs, wing spar issues, serial number ranges, and pre-buy checklist.',
  },
];

export default function GuidesIndexPage() {
  return (
    <div className="min-h-screen bg-white">
      

      <section className="bg-gradient-to-b from-sky-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
            Aircraft Buying Guides
          </h1>
          <p className="mt-6 text-lg text-slate-600">
            Model-specific pre-buy guides covering Airworthiness Directives,
            accident patterns, cost of ownership, and inspection checklists.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-4">
          {GUIDES.map((guide) => (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="block border border-slate-200 rounded-2xl p-6 hover:border-sky-400 hover:bg-sky-50 transition"
            >
              <h2 className="text-xl font-bold text-slate-900">
                {guide.title}
              </h2>
              <p className="mt-2 text-sm text-slate-600">{guide.description}</p>
              <span className="mt-4 inline-block text-sm font-medium text-sky-600">
                Read guide →
              </span>
            </Link>
          ))}
        </div>

                <p className="mt-10 text-sm text-slate-500 text-center">
          More guides coming soon: Cessna 182, Beech Bonanza, Cirrus SR22.
        </p>
      </section>
    </div>
  );
}
