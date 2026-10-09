import Link from 'next/link';
import type { Metadata } from 'next';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: "How to Check an Aircraft's AD History Before Buying (Complete Guide)",
  description:
    'Airworthiness Directives are legally enforceable and can cost thousands if unaddressed. Learn how to check AD applicability by serial number before you buy any aircraft.',
  alternates: {
    canonical: 'https://nnumbercheck.com/blog/how-to-check-aircraft-ad-history',
  },
};

export default function BlogPost() {
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: "How to Check an Aircraft's AD History Before Buying",
    description:
      'Airworthiness Directives are legally enforceable and can cost thousands if unaddressed. Learn how to check AD applicability by serial number before you buy any aircraft.',
    author: {
      '@type': 'Organization',
      name: 'NNumberCheck',
    },
    publisher: {
      '@type': 'Organization',
      name: 'NNumberCheck',
      logo: {
        '@type': 'ImageObject',
        url: 'https://nnumbercheck.com/logo.png',
      },
    },
    datePublished: '2025-01-01',
    dateModified: '2025-01-01',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': 'https://nnumbercheck.com/blog/how-to-check-aircraft-ad-history',
    },
  };

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleJsonLd).replace(/</g, '\\u003c'),
        }}
      />

      <article className="max-w-3xl mx-auto px-6 py-12">
        <nav className="text-sm text-slate-500 mb-8">
          <Link href="/" className="hover:text-sky-600">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/blog" className="hover:text-sky-600">
            Blog
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-700">AD history</span>
        </nav>

        <header>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
            How to Check an Aircraft&apos;s AD History Before Buying
          </h1>
          <p className="mt-4 text-lg text-slate-600 leading-relaxed">
            Airworthiness Directives are legally enforceable, and unaddressed
            ones can cost you thousands. Here&apos;s how to check them properly
            before you put down a deposit.
          </p>
          <p className="mt-4 text-sm text-slate-500">
            Updated January 2025 · 8 min read
          </p>
        </header>

        <div className="mt-10 space-y-8 text-slate-700 leading-relaxed">
          <section>
            <p>
              Every US-registered aircraft is subject to a set of FAA rules
              called Airworthiness Directives (ADs). These are legally
              enforceable — they must be complied with for the aircraft to
              remain legally airworthy. If you buy an aircraft with an
              unaddressed AD, you inherit the problem, and the fix can run from
              a few hundred dollars to tens of thousands.
            </p>
            <p className="mt-4">
              This guide explains what ADs are, why serial-number-level matching
              matters, how to check them manually, and how to do it faster.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">
              What is an Airworthiness Directive?
            </h2>
            <p>
              An AD is a regulation issued by the FAA when an unsafe condition
              is found in a type of aircraft, engine, propeller, or appliance.
              ADs require specific actions — inspections, repairs, part
              replacements, or operating limitations — and they&apos;re
              mandatory for the affected aircraft.
            </p>
            <p className="mt-4">
              ADs are published in the Federal Register and codified in 14 CFR
              Part 39. They apply based on the specific aircraft&apos;s make,
              model, and often serial number.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">
              &ldquo;Applies to model&rdquo; vs. &ldquo;applies to serial
              number&rdquo;
            </h2>
            <p>
              This is where most buyers get tripped up.
            </p>
            <p className="mt-4">
              The FAA&apos;s Dynamic Regulatory System (DRS) lets you search ADs
              by make and model. But the results are just a list of ADs that
              <em> mention</em> your aircraft — not necessarily the ones that
              apply to it.
            </p>
            <p className="mt-4">
              An AD might apply to:
            </p>
            <ul className="mt-3 space-y-2 list-disc list-inside text-slate-700">
              <li>All aircraft of a model</li>
              <li>Certain serial numbers within a model</li>
              <li>
                Certain serial numbers only if a specific STC is installed
              </li>
              <li>
                Certain serial numbers only if a specific engine or propeller is
                installed
              </li>
            </ul>
            <p className="mt-4">
              If you buy based on the DRS list alone, you might miss ADs that
              apply to your specific serial, waste money complying with ADs
              that don&apos;t apply, or buy an aircraft with an unaddressed AD
              and end up on the hook for it.
            </p>
            <p className="mt-4">
              Serial-number-level matching is the only way to know what
              actually applies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">
              How to check ADs manually
            </h2>
            <p>
              The FAA&apos;s DRS is free but painful to use:
            </p>
            <ol className="mt-3 space-y-2 list-decimal list-inside text-slate-700">
              <li>
                Go to{' '}
                <a
                  href="https://drs.faa.gov"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-600 hover:underline"
                >
                  drs.faa.gov
                </a>
              </li>
              <li>Search by make and model</li>
              <li>Click through to each AD</li>
              <li>Read the &ldquo;Applicability&rdquo; section</li>
              <li>
                Cross-reference the serial range against your specific aircraft
              </li>
              <li>Repeat for every AD in the list</li>
            </ol>
            <p className="mt-4">
              For a typical Cessna 172, you&apos;ll look at 20+ ADs. For a
              Bonanza or Cirrus, more. It&apos;s a 30–60 minute manual exercise
              that requires careful reading and often a phone call to the
              manufacturer to confirm.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">
              How to check ADs faster
            </h2>
            <p>
              We built{' '}
              <Link
                href="/ad-check"
                className="text-sky-600 hover:underline font-medium"
              >
                nnumbercheck.com/ad-check
              </Link>{' '}
              to automate this. You enter an N-number, and the tool:
            </p>
            <ol className="mt-3 space-y-2 list-decimal list-inside text-slate-700">
              <li>Looks up the aircraft in the FAA registry</li>
              <li>Pulls the serial number</li>
              <li>Matches it against a database of AD serial ranges</li>
              <li>
                Shows three buckets: <strong>Applies</strong>,{' '}
                <strong>Does not apply</strong>, and <strong>Verify</strong>
              </li>
            </ol>
            <p className="mt-4">
              We currently have serial-level data for Cessna 152/172/182, Piper
              PA-28, Cirrus SR22, and Beech G36. We&apos;re adding models
              monthly.
            </p>
            <p className="mt-4">
              The tool is free and no-signup required.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">
              What to do with an AD list
            </h2>
            <p>
              Once you have your AD list, three questions to answer for each
              one:
            </p>
            <ol className="mt-3 space-y-3 list-decimal list-inside text-slate-700">
              <li>
                <strong>Is it complied with?</strong> Check the aircraft&apos;s
                logbooks for a sign-off. If it&apos;s not there, assume
                it&apos;s not done.
              </li>
              <li>
                <strong>Is it still active?</strong> Some ADs are superseded by
                later ADs. Check the effective date and look for superseding
                directives.
              </li>
              <li>
                <strong>Does it have a terminating action?</strong> Some ADs
                end when a specific modification is made. If the aircraft has
                the terminating action, the repetitive inspections
                aren&apos;t required.
              </li>
            </ol>
            <p className="mt-4">
              For the aircraft you&apos;re considering, ask the seller for:
            </p>
            <ul className="mt-3 space-y-2 list-disc list-inside text-slate-700">
              <li>
                The logbooks (all of them, or a clear explanation if some are
                missing)
              </li>
              <li>
                Any AD compliance summaries the owner or shop has prepared
              </li>
              <li>A recent annual inspection report</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">
              Red flags
            </h2>
            <ul className="space-y-3 list-disc list-inside text-slate-700">
              <li>
                <strong>No AD compliance log or summary.</strong> A
                well-maintained aircraft usually has one. Missing it isn&apos;t
                fatal but means you&apos;ll need to reconstruct it.
              </li>
              <li>
                <strong>Logbook gaps.</strong> Even a few months unaccounted
                for can hide AD compliance issues.
              </li>
              <li>
                <strong>Recent paint or refurb.</strong> Can cover up other
                issues, and some ADs specifically trigger after paint (e.g.,
                ruddervator balance on V-tail Bonanzas).
              </li>
              <li>
                <strong>&ldquo;Complied but no documentation.&rdquo;</strong>{' '}
                If the compliance isn&apos;t signed off in the logbook,
                it&apos;s as good as not done.
              </li>
              <li>
                <strong>Unfamiliar STCs.</strong> Some ADs apply only if a
                specific STC is installed. If the aircraft has an STC
                you&apos;re not familiar with, look up its AD interaction.
              </li>
            </ul>
          </section>

          <section className="mt-12 border-t border-slate-200 pt-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              The bottom line
            </h2>
            <p>
              Checking ADs is one of the highest-value pre-purchase steps you
              can take. It&apos;s tedious, but the alternative — buying an
              aircraft with a $10,000+ unaddressed AD — is much worse.
            </p>
            <p className="mt-4">
              Use the FAA&apos;s DRS if you want to do it manually. Use{' '}
              <Link
                href="/ad-check"
                className="text-sky-600 hover:underline font-medium"
              >
                nnumbercheck.com/ad-check
              </Link>{' '}
              if you want to skip the manual work.
            </p>
            <p className="mt-4 font-semibold text-slate-900">
              Either way: check the ADs before you put down a deposit.
            </p>

            <div className="mt-10 bg-sky-50 border border-sky-200 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-slate-900">
                Try the free AD check
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Enter any N-number to see exactly which Airworthiness
                Directives apply to that specific aircraft. No signup required.
              </p>
              <Link
                href="/ad-check"
                className="mt-4 inline-block bg-sky-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-sky-700 transition"
              >
                Check an aircraft →
              </Link>
            </div>
          </section>
        </div>
      </article>
    </div>
  );
}
