import Link from 'next/link';
import type { Metadata } from 'next';
import { getAllPosts } from '@/lib/blog';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Blog — Aircraft Buying & AD Guides',
  description: 'Guides on aircraft buying, Airworthiness Directives, and FAA history research.',
  alternates: { canonical: 'https://nnumbercheck.com/blog' },
};

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-slate-900">Blog</h1>
        <p className="mt-4 text-slate-600">
          Guides on aircraft buying, Airworthiness Directives, and FAA history research.
        </p>

        <div className="mt-12 space-y-6">
          {posts.length === 0 ? (
            <p className="text-slate-500">No articles generated yet. Run the Python script to generate content!</p>
          ) : (
            posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="block border border-slate-200 rounded-2xl p-6 hover:border-sky-400 transition"
              >
                <h2 className="text-xl font-semibold text-slate-900">
                  {post.title}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {post.description}
                </p>
                <p className="mt-4 text-xs text-slate-400">{post.date}</p>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
