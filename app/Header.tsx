import Link from 'next/link';

export default function Header() {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <Link href="/" className="text-2xl font-bold text-sky-600 shrink-0">
          NNumberCheck
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link href="/ad-check" className="hover:text-sky-600 transition">
            AD Check
          </Link>
          <Link href="/guides" className="hover:text-sky-600 transition">
            Guides
          </Link>
          <Link href="/blog" className="hover:text-sky-600 transition">
            Blog
          </Link>
          <Link href="/sample-report" className="hover:text-sky-600 transition">
            Sample Report
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="hidden sm:inline-block bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-sky-700 transition"
          >
            Look up N-number
          </Link>
          <Link
            href="/ad-check"
            className="sm:hidden text-sm font-medium text-sky-600 hover:underline"
          >
            AD Check
          </Link>
        </div>
      </div>
    </header>
  );
}
