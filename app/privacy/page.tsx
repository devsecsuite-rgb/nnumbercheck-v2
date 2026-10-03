import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — NNumberCheck',
  description: 'How NNumberCheck collects, uses, and protects your personal information.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-sky-600">NNumberCheck</Link>
          <Link href="/" className="text-sm font-medium text-sky-600 hover:underline">← Back to home</Link>
        </div>
      </header>
      <article className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: October 3, 2026</p>
        <p className="mt-6 text-slate-700">This Privacy Policy describes how NNumberCheck.com (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) collects, uses, and shares information when you use our website and services.</p>
        <h2 className="mt-10 text-2xl font-bold">1. Information we collect</h2>
        <ul className="mt-4 space-y-2 text-slate-700 list-disc pl-6">
          <li><strong>Search queries</strong>: N-numbers you look up, to generate results.</li>
          <li><strong>Account information</strong>: email address, if you create an account or purchase a report.</li>
          <li><strong>Payment information</strong>: processed securely by our payment provider (Stripe). We never see or store your full card details.</li>
          <li><strong>Usage data</strong>: pages visited, browser type, IP address, and referral source.</li>
        </ul>
        <h2 className="mt-10 text-2xl font-bold">2. How we use information</h2>
        <ul className="mt-4 space-y-2 text-slate-700 list-disc pl-6">
          <li>To deliver the aircraft history reports you request.</li>
          <li>To process payments and send receipts.</li>
          <li>To improve our service, fix bugs, and understand usage patterns.</li>
        </ul>
        <h2 className="mt-10 text-2xl font-bold">3. Sharing of information</h2>
        <p className="mt-4 text-slate-700">We do not sell your personal information. We share data only with service providers that help us operate:</p>
        <ul className="mt-4 space-y-2 text-slate-700 list-disc pl-6">
          <li><strong>Cloudflare</strong> — hosting and infrastructure</li>
          <li><strong>Stripe</strong> — payment processing (when you make a purchase)</li>
        </ul>
        <h2 className="mt-10 text-2xl font-bold">4. Data retention</h2>
        <p className="mt-4 text-slate-700">Search queries are retained for up to 12 months for analytics. Account and purchase records are retained as long as needed to provide the service and comply with legal obligations.</p>
        <h2 className="mt-10 text-2xl font-bold">5. Your rights</h2>
        <p className="mt-4 text-slate-700">You may request access to, correction of, or deletion of your personal data by emailing <a href="mailto:support@nnumbercheck.com" className="text-sky-600 hover:underline">support@nnumbercheck.com</a>. We will respond within 30 days.</p>
        <h2 className="mt-10 text-2xl font-bold">6. Cookies</h2>
        <p className="mt-4 text-slate-700">We use minimal cookies for authentication and security. We do not use third-party advertising cookies.</p>
        <h2 className="mt-10 text-2xl font-bold">7. Changes to this policy</h2>
        <p className="mt-4 text-slate-700">We may update this policy from time to time. The &ldquo;Last updated&rdquo; date reflects the most recent revision.</p>
        <h2 className="mt-10 text-2xl font-bold">8. Contact</h2>
        <p className="mt-4 text-slate-700">For privacy questions: <a href="mailto:support@nnumbercheck.com" className="text-sky-600 hover:underline">support@nnumbercheck.com</a></p>
      </article>
    </div>
  );
}
