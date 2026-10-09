// app/blog/page.tsx
import Link from 'next/link';
import type { Metadata } from 'next';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Blog — Aircraft Buying & AD Guides',
  description: 'Guides on aircraft buying, Airworthiness Directives, and FAA history research.',
  alternates: { canonical: 'https://nnumbercheck.com/blog' },
};

export default function BlogIndex() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-slate-900">Blog</h1>
        <p className="mt-4 text-slate-600">
          Guides on aircraft buying, Airworthiness Directives, and FAA history research.
        </p>

        <div className="mt-12 space-y-6">
          <Link
            href="/blog/how-to-check-aircraft-ad-history"
            className="block border border-slate-200 rounded-2xl p-6 hover:border-sky-400 transition"
          >
            <h2 className="text-xl font-semibold text-slate-900">
              How to Check an Aircraft&apos;s AD History Before Buying
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Airworthiness Directives are legally enforceable and can cost thousands if unaddressed. Here&apos;s how to check them properly.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
