import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { getAllPosts, getPostBySlug } from '@/lib/blog';
import type { Metadata } from 'next';

export const dynamic = 'force-static';
export const dynamicParams = false;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: `${post.title} | NNumberCheck`,
    description: post.description,
    alternates: { canonical: `https://nnumbercheck.com/blog/${slug}` },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  return (
    <div className="min-h-screen bg-white">
      <nav className="max-w-3xl mx-auto px-6 py-6 text-xs text-slate-500">
        <Link href="/" className="hover:text-sky-600">Home</Link>
        <span className="mx-2">›</span>
        <Link href="/blog" className="hover:text-sky-600">Blog</Link>
        <span className="mx-2">›</span>
        <span>{post.title}</span>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">{post.title}</h1>
        <p className="text-slate-500 text-sm mb-8">Published on {post.date}</p>
        
        <div className="prose prose-slate prose-sky max-w-none text-slate-700 leading-relaxed space-y-6">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>
        
        <div className="mt-12 p-8 bg-sky-50 rounded-2xl border border-sky-100 text-center">
          <h3 className="text-xl font-bold text-slate-900 mb-2">Check an aircraft before you buy</h3>
          <p className="text-slate-600 mb-6">Get the complete FAA registration, NTSB accident history, and AD compliance for any N-number.</p>
          <Link href="/" className="inline-block bg-sky-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-sky-700 transition">
            Look up an N-number
          </Link>
        </div>
      </article>
    </div>
  );
}
