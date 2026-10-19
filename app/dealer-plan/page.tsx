import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Aircraft Dealer & Broker Plan | NNumberCheck',
  description: 'Unlimited N-number lookups, bulk search, API access, and white-label PDF reports for aircraft brokers and dealers.',
};

export default function DealerPlanPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <nav className="text-xs text-slate-500 mb-8">
          <Link href="/" className="hover:text-sky-600">Home</Link>
          <span className="mx-2">›</span>
          <span>Dealer & Broker Plan</span>
        </nav>

        <h1 className="text-4xl font-bold text-slate-900 mb-6">Aircraft Dealer & Broker Plan</h1>
        
        <p className="text-lg text-slate-700 mb-8 leading-relaxed">
          Streamline your aircraft acquisitions and sales with unlimited, instant access to FAA registry data, NTSB accident history, and serial-matched Airworthiness Directives.
        </p>

        {/* Pricing & Features Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">What's Included ($199/month)</h2>
          <ul className="space-y-4 text-slate-700">
            <li className="flex items-start gap-3">
              <span className="text-green-600 text-xl font-bold">✓</span>
              <span><strong>Unlimited N-Number Lookups:</strong> No per-report fees. Check as many aircraft as you need.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 text-xl font-bold">✓</span>
              <span><strong>Bulk Search & Export:</strong> Upload a list of tail numbers and get a consolidated report.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 text-xl font-bold">✓</span>
              <span><strong>White-Label PDF Reports:</strong> Download clean, professional reports to share with your clients and lenders.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 text-xl font-bold">✓</span>
              <span><strong>API Access:</strong> Integrate NNumberCheck data directly into your own website or CRM.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 text-xl font-bold">✓</span>
              <span><strong>Priority Support:</strong> Direct line to our team for urgent lookup requests.</span>
            </li>
          </ul>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <p className="text-slate-600 mb-6 text-lg">Ready to upgrade your workflow? Contact us to get your account activated.</p>
          <a 
            href="mailto:support@nnumbercheck.com?subject=Dealer Plan Inquiry" 
            className="inline-block bg-sky-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-sky-700 transition shadow-lg"
          >
            Email Us to Activate Dealer Plan
          </a>
          <p className="mt-4 text-sm text-slate-500">
            Or reply directly to: <a href="mailto:support@nnumbercheck.com" className="text-sky-600 hover:underline font-medium">support@nnumbercheck.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
