import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — NNumberCheck',
  description: 'Terms and conditions for using NNumberCheck.com.',
alternates: {
    canonical: 'https://nnumbercheck.com/terms',
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-sky-600">NNumberCheck</Link>
          <Link href="/" className="text-sm font-medium text-sky-600 hover:underline">← Back to home</Link>
        </div>
      </header>
      <article className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold">Terms of Service</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: October 3, 2026</p>
        <p className="mt-6 text-slate-700">By accessing or using NNumberCheck.com (the &ldquo;Service&rdquo;), you agree to these Terms of Service.</p>
        <h2 className="mt-10 text-2xl font-bold">1. Use of the Service</h2>
        <p className="mt-4 text-slate-700">You agree to use the Service only for lawful purposes. You may not:</p>
        <ul className="mt-4 space-y-2 text-slate-700 list-disc pl-6">
          <li>Scrape, copy, or resell our data without written permission.</li>
          <li>Attempt to disrupt or overload the Service.</li>
          <li>Use the Service to harass, stalk, or harm any individual.</li>
          <li>Circumvent payment or access controls.</li>
        </ul>
        <h2 className="mt-10 text-2xl font-bold">2. Data accuracy</h2>
        <p className="mt-4 text-slate-700">NNumberCheck aggregates public data from the FAA and NTSB. While we strive for accuracy, we do not guarantee that data is complete, current, or error-free. You are responsible for verifying critical information with official sources before making any purchase, safety, or legal decision.</p>
        <h2 className="mt-10 text-2xl font-bold">3. Paid reports</h2>
        <p className="mt-4 text-slate-700">Paid reports are provided &ldquo;as is&rdquo; for informational purposes. Due to the digital nature of the reports, all sales are final and non-refundable once the report has been delivered. If a report fails to generate due to a technical error on our side, we will issue a full refund.</p>
        <h2 className="mt-10 text-2xl font-bold">4. No warranty</h2>
        <p className="mt-4 text-slate-700">The Service is provided &ldquo;as is&rdquo; without warranties of any kind, express or implied.</p>
        <h2 className="mt-10 text-2xl font-bold">5. Limitation of liability</h2>
        <p className="mt-4 text-slate-700">To the maximum extent permitted by law, NNumberCheck shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service, including but not limited to losses related to aircraft purchases, financing, or insurance decisions.</p>
        <h2 className="mt-10 text-2xl font-bold">6. Indemnification</h2>
        <p className="mt-4 text-slate-700">You agree to indemnify and hold NNumberCheck harmless from any claims arising out of your use of the Service or violation of these Terms.</p>
        <h2 className="mt-10 text-2xl font-bold">7. Changes</h2>
        <p className="mt-4 text-slate-700">We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance of the new Terms.</p>
        <h2 className="mt-10 text-2xl font-bold">8. Governing law</h2>
        <p className="mt-4 text-slate-700">These Terms are governed by the laws of the United States and the state in which the operator of NNumberCheck.com resides.</p>
        <h2 className="mt-10 text-2xl font-bold">9. Contact</h2>
        <p className="mt-4 text-slate-700">Questions about these Terms: <a href="mailto:support@nnumbercheck.com" className="text-sky-600 hover:underline">support@nnumbercheck.com</a></p>
      </article>
    </div>
  );
}
