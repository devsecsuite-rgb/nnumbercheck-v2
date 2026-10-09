import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 mt-16">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="text-xl font-bold text-sky-600">NNumberCheck</div>
            <p className="mt-3 text-sm text-slate-500">
              Aircraft history reports for smarter buying decisions.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-slate-900">Product</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li>
                <Link href="/ad-check" className="hover:text-sky-600">
                  Free AD Check
                </Link>
              </li>
              <li>
                <Link href="/sample-report" className="hover:text-sky-600">
                  Sample Report
                </Link>
              </li>
              <li>
                <Link href="/aircraft" className="hover:text-sky-600">
                  Browse Aircraft
                </Link>
              </li>
              <li>
                <Link
                  href="/compare/aero-space-reports"
                  className="hover:text-sky-600"
                >
                  Compare vs Aero-Space
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-slate-900">Company</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li>
                <Link href="/about" className="hover:text-sky-600">
                  About
                </Link>
              </li>
              <li>
                <a
                  href="mailto:support@nnumbercheck.com"
                  className="hover:text-sky-600"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-slate-900">Legal</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li>
                <Link href="/privacy" className="hover:text-sky-600">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-sky-600">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/refund" className="hover:text-sky-600">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="hover:text-sky-600">
                  Disclaimer
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-slate-200 text-xs text-slate-500 flex flex-col md:flex-row justify-between gap-4">
          <p>© {new Date().getFullYear()} NNumberCheck.com. All rights reserved.</p>
          <p className="max-w-xl">
            Not affiliated with the FAA or NTSB. For historical reference only.
            Verify all information with official records before making any
            purchase or safety decision.
          </p>
        </div>
      </div>
    </footer>
  );
}
