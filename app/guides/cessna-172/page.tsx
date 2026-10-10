import Link from 'next/link';
import type { Metadata } from 'next';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Cessna 172 Pre-Buy Guide — Common ADs, Accident History & Checklist',
  description:
    'Complete pre-buy guide for the Cessna 172. Covers the most common Airworthiness Directives, accident patterns from 44 years of NTSB data, cost of ownership, and a step-by-step inspection checklist.',
  alternates: {
    canonical: 'https://nnumbercheck.com/guides/cessna-172',
  },
  openGraph: {
    title: 'Cessna 172 Pre-Buy Guide — ADs, Accidents & Checklist',
    description:
      'Everything to check before buying a Cessna 172 — ADs, accident history, and pre-buy checklist.',
    url: 'https://nnumbercheck.com/guides/cessna-172',
    type: 'article',
  },
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What are the most common Airworthiness Directives on a Cessna 172?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The most commonly applicable ADs on a Cessna 172 include AD 2011-10988 (seat rail inspection), AD 2009-10-09 and AD 2009-11-06 (rudder stop modification), AD 78-08-07 (fuel tank vent), AD 93-10-07 (fuel selector), and various Lycoming engine ADs depending on the specific engine model. Applicability depends on the aircraft serial number and year of manufacture.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is the Cessna 172 a safe aircraft to buy?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The Cessna 172 has an excellent safety record for a light single-engine aircraft. Its predictable handling and forgiving flight characteristics have made it the most-produced aircraft in history. However, individual aircraft can vary widely. Buyers should always verify the specific aircraft\'s accident history, AD compliance, and logbook records before purchase.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much does it cost to maintain a Cessna 172?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A typical Cessna 172 costs $8,000–$15,000 per year in fixed and operating costs for a private owner flying 100 hours per year. This includes hangar, insurance, annual inspection, fuel, and a reserve for engine overhaul. Actual costs vary widely by location, usage, and the specific aircraft.',
      },
    },
  ],
};

export default function Cessna172GuidePage() {
  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd).replace(/</g, '\\u003c'),
        }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-b from-sky-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="text-xs uppercase tracking-wide text-sky-600 font-semibold">
            Aircraft Buying Guide
          </div>
          <h1 className="mt-3 text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
            Cessna 172 Pre-Buy Guide
          </h1>
          <p className="mt-6 text-lg text-slate-700 leading-relaxed">
            <strong>
              The Cessna 172 is the most-produced aircraft in history
            </strong>{' '}
            with over 44,000 built since 1956. Its predictable handling and
            parts availability make it the default choice for flight schools,
            private owners, and first-time buyers. But with 60+ years of
            production across many variants, no two 172s are alike. This guide
            covers the specific ADs, accident patterns, and inspection points
            that matter most when evaluating a used 172.
          </p>
        </div>
      </section>

      <article className="max-w-3xl mx-auto px-6 py-12">
        {/* Table of contents */}
        <nav className="border border-slate-200 rounded-2xl p-6 bg-slate-50">
          <h2 className="font-semibold text-slate-900 mb-3">What&apos;s in this guide</h2>
          <ul className="space-y-1 text-sm text-sky-600">
            <li><a href="#variants" className="hover:underline">1. Understanding Cessna 172 variants</a></li>
            <li><a href="#ads" className="hover:underline">2. The most common Airworthiness Directives</a></li>
            <li><a href="#accidents" className="hover:underline">3. Accident patterns and what to watch for</a></li>
            <li><a href="#costs" className="hover:underline">4. Cost of ownership</a></li>
            <li><a href="#checklist" className="hover:underline">5. Pre-buy inspection checklist</a></li>
            <li><a href="#specific" className="hover:underline">6. How to check a specific 172</a></li>
          </ul>
        </nav>

        {/* Section 1 */}
        <section id="variants" className="mt-12">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
            1. Understanding Cessna 172 variants
          </h2>
          <p className="mt-4 text-slate-700 leading-relaxed">
            The 172 has been produced in several major generations, each with
            distinct characteristics and maintenance considerations. The
            airframe evolved significantly over the decades, so knowing which
            variant you&apos;re looking at affects everything from parts
            availability to resale value.
          </p>

          <div className="mt-6 overflow-hidden border border-slate-200 rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-900">Era</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-900">Variants</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-900">What to Know</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-4 py-3 text-slate-700">1956–1960</td>
                  <td className="px-4 py-3 text-slate-700">172, 172A–172B</td>
                  <td className="px-4 py-3 text-slate-600">Continental O-300 engine. Straight tail. Manual flaps. Lowest prices but older systems.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-slate-700">1961–1967</td>
                  <td className="px-4 py-3 text-slate-700">172C–172H</td>
                  <td className="px-4 py-3 text-slate-600">Improved avionics, still Continental-powered. Some have the controversial rudder stop ADs.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-slate-700">1968–1976</td>
                  <td className="px-4 py-3 text-slate-700">172I–172M</td>
                  <td className="px-4 py-3 text-slate-600">Lycoming O-320 introduced. The 172M (1973–76) is a popular sweet spot.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-slate-700">1977–1985</td>
                  <td className="px-4 py-3 text-slate-700">172N, 172P</td>
                  <td className="px-4 py-3 text-slate-600">Higher gross weight, more fuel. Very popular for training.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-slate-700">1996–present</td>
                  <td className="px-4 py-3 text-slate-700">172R, 172S</td>
                  <td className="px-4 py-3 text-slate-600">Fuel-injected Lycoming IO-360. Modern avionics. Highest prices.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-slate-700 leading-relaxed">
            <strong>Recommendation for first-time buyers:</strong> The 172M or
            172N (1973–1980) is the most common starting point. These have the
            Lycoming engine, decent parts availability, and reasonable prices
            ($45,000–$90,000 depending on avionics and time remaining). The
            172R/S models (1996+) are newer but sell for $150,000+.
          </p>
        </section>

        {/* Section 2 */}
        <section id="ads" className="mt-12">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
            2. The most common Airworthiness Directives
          </h2>
          <p className="mt-4 text-slate-700 leading-relaxed">
            Airworthiness Directives (ADs) are FAA-mandated safety fixes that
            must be complied with for the aircraft to remain legally airworthy.
            The 172 has accumulated dozens of ADs over its 60+ year history.
            Below are the ones that come up most often in pre-buy inspections.
          </p>

          <div className="mt-6 space-y-4">
            <div className="border-l-4 border-red-400 pl-5 py-2">
              <div className="font-mono text-sm text-red-700 font-semibold">
                AD 2011-10988
              </div>
              <h3 className="mt-1 font-semibold text-slate-800">
                Seat rail and seat pin inspection
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Requires repetitive inspections of the seat rails, seat pin
                engagement, seat rollers, and lock pin springs. This AD
                supersedes an earlier one and adds inspection steps. Failure to
                comply can cause the pilot seat to slide backward during flight,
                making rudder pedals unreachable.
              </p>
              <p className="mt-2 text-xs text-slate-500">
                <strong>Applies to:</strong> Most 172 models built 1963–1986.
                Check the logbook for compliance entries — this is one of the
                most frequently missed ADs.
              </p>
            </div>

            <div className="border-l-4 border-red-400 pl-5 py-2">
              <div className="font-mono text-sm text-red-700 font-semibold">
                AD 2009-10-09 and AD 2009-11-06
              </div>
              <h3 className="mt-1 font-semibold text-slate-800">
                Rudder stop modification
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Requires either installing a placard prohibiting spins, or
                replacing the rudder stop and attachment hardware with a
                modification kit (P/N SK152-25). Issued after two accidents
                where rudders were found in the over-travel position. Compliance
                is usually shown as either a placard in the cockpit or a
                logbook entry documenting the rudder stop replacement.
              </p>
            </div>

            <div className="border-l-4 border-amber-400 pl-5 py-2">
              <div className="font-mono text-sm text-amber-700 font-semibold">
                AD 78-08-07
              </div>
              <h3 className="mt-1 font-semibold text-slate-800">
                Fuel tank vent line inspection
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Requires inspection of the fuel tank vent lines for correct
                routing and security. Affected aircraft may have vent lines that
                can clog or kink, preventing proper fuel flow. Older 172s
                (pre-1980) are more likely to still be affected.
              </p>
            </div>

            <div className="border-l-4 border-amber-400 pl-5 py-2">
              <div className="font-mono text-sm text-amber-700 font-semibold">
                Engine ADs
              </div>
              <h3 className="mt-1 font-semibold text-slate-800">
                Lycoming and Continental engine directives
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Depending on the specific engine model, your 172 may be subject
                to Lycoming ADs (for O-320 and IO-360 powered aircraft) or
                Continental ADs (for O-300 powered aircraft). These include oil
                pump impeller inspections, crankshaft inspections, and
                magneto overhauls. Always verify the engine AD status against
                the engine logbook.
              </p>
            </div>
          </div>

          <div className="mt-8 bg-sky-50 border border-sky-200 rounded-xl p-5">
            <p className="text-sm text-slate-700">
              <strong>Check the exact ADs for a specific aircraft:</strong>{' '}
              <Link href="/ad-check" className="text-sky-600 hover:underline font-medium">
                Use our free AD Applicability Check →
              </Link>{' '}
              Enter any N-number and we match the aircraft&apos;s serial number
              against every applicable AD.
            </p>
          </div>
        </section>

        {/* Section 3 */}
        <section id="accidents" className="mt-12">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
            3. Accident patterns and what to watch for
          </h2>
          <p className="mt-4 text-slate-700 leading-relaxed">
            The Cessna 172 has one of the best safety records in general
            aviation. But like any aircraft, certain accident patterns recur.
            Understanding these helps you evaluate a specific aircraft and
            interpret its NTSB history.
          </p>

          <h3 className="mt-6 text-xl font-semibold text-slate-800">
            The three most common 172 accident types
          </h3>

          <div className="mt-4 space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <h4 className="font-semibold text-slate-900">
                Hard landings and porpoising
              </h4>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                The 172&apos;s tricycle gear is forgiving, but hard landings
                still account for a significant share of incidents. Propeller
                strikes and firewall damage are common consequences. On any
                used 172, check for a nose gear damage history and look for
                firewall wrinkles during inspection.
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <h4 className="font-semibold text-slate-900">
                Fuel mismanagement
              </h4>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Running out of fuel or selecting the wrong tank remains one of
                the leading causes of 172 accidents. This is a pilot error
                rather than an aircraft defect, but it appears frequently in
                NTSB records. Multiple fuel-related accidents on the same
                aircraft may indicate a recurring maintenance issue with the
                fuel selector.
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <h4 className="font-semibold text-slate-900">
                Loss of control in gusty winds
              </h4>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                The 172 is a light aircraft and is susceptible to crosswind
                loss of control on landing. Aircraft that have been based in
                high-wind regions or used heavily for training may have more
                ground-loop or runway excursion incidents.
              </p>
            </div>
          </div>

          <p className="mt-6 text-slate-700 leading-relaxed">
            <strong>What to look for in the NTSB record:</strong> Any accident
            history matters, but pay closest attention to (1) accidents
            involving structural damage, (2) accidents with serious or fatal
            injuries, and (3) repeat accidents on the same aircraft. Multiple
            accidents on the same airframe should prompt a very careful
            inspection.
          </p>
        </section>

        {/* Section 4 */}
        <section id="costs" className="mt-12">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
            4. Cost of ownership
          </h2>
          <p className="mt-4 text-slate-700 leading-relaxed">
            A realistic cost estimate for owning a Cessna 172 helps you decide
            whether the aircraft is right for you, and it also informs your
            offer price. Below are typical ranges for a private owner flying
            100 hours per year.
          </p>

          <div className="mt-6 overflow-hidden border border-slate-200 rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-900">Category</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-900">Annual Estimate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-4 py-3 text-slate-700">Hangar / tie-down</td>
                  <td className="px-4 py-3 text-slate-700">$1,800–$6,000</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-slate-700">Insurance</td>
                  <td className="px-4 py-3 text-slate-700">$900–$1,500</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-slate-700">Annual inspection</td>
                  <td className="px-4 py-3 text-slate-700">$1,500–$3,000</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-slate-700">Fuel (100 hrs @ ~9 gph)</td>
                  <td className="px-4 py-3 text-slate-700">$4,500–$6,000</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-slate-700">Maintenance &amp; reserves</td>
                  <td className="px-4 py-3 text-slate-700">$2,000–$4,000</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-slate-700">Engine overhaul reserve</td>
                  <td className="px-4 py-3 text-slate-700">$1,500–$2,500</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-sm text-slate-500 italic">
            Total estimated annual cost: $12,200–$23,000 for 100 hours of
            flying. Actual costs depend on hangar rates, insurance rates,
            condition of the aircraft, and your local A&amp;P rates.
          </p>
        </section>

        {/* Section 5 */}
        <section id="checklist" className="mt-12">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
            5. Pre-buy inspection checklist
          </h2>
          <p className="mt-4 text-slate-700 leading-relaxed">
            Use this checklist when evaluating any specific 172. It covers the
            items that most often cause problems and that a casual walkaround
            would miss.
          </p>

          <div className="mt-6 space-y-3">
            <ChecklistItem
              title="AD compliance review"
              desc="Every applicable AD should have a logbook entry documenting compliance. Missing entries are a red flag — the aircraft may not be legally airworthy."
            />
            <ChecklistItem
              title="Logbook continuity"
              desc="Logbooks should be complete with no gaps in months or years. Missing entries can hide damage or poor maintenance."
            />
            <ChecklistItem
              title="Engine time since overhaul"
              desc="Lycoming O-320 and IO-360 engines typically need overhaul at 2,000 hours TBO. An engine at 1,800 SMOH is due soon; factor $25,000–$35,000 into your offer."
            />
            <ChecklistItem
              title="Propeller condition"
              desc="Check for the last prop overhaul date. Fixed-pitch props don't require overhaul, but they should be inspected for nicks, cracks, and corrosion."
            />
            <ChecklistItem
              title="Corrosion inspection"
              desc="Older 172s are prone to corrosion in the wing spar, flap hinges, and fuselage belly. Any corrosion is expensive to remediate."
            />
            <ChecklistItem
              title="Nose gear damage history"
              desc="Look for firewall wrinkles, engine mount cracks, and nose gear strut condition. These often indicate a hard landing in the aircraft's past."
            />
            <ChecklistItem
              title="Fuel tank condition"
              desc="Older 172s with bladder tanks may have leaks or deterioration. Wet-wing 172s (from 1976+) should be checked for sealant cracking."
            />
            <ChecklistItem
              title="Avionics panel"
              desc="Old mechanical gyros and original radios are cheap to buy but expensive to maintain. Panel upgrades are the most common reason 172 prices vary so widely."
            />
            <ChecklistItem
              title="Weight and balance"
              desc="The current equipment list should match the actual installed equipment. Discrepancies mean the W&B is inaccurate."
            />
            <ChecklistItem
              title="Title and registration"
              desc="Verify the FAA registration matches the seller, and check for any liens or encumbrances against the aircraft."
            />
          </div>
        </section>

        {/* Section 6 */}
        <section id="specific" className="mt-12">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
            6. How to check a specific 172
          </h2>
          <p className="mt-4 text-slate-700 leading-relaxed">
            You&apos;ve identified a 172 you&apos;re interested in. Here&apos;s
            how to use NNumberCheck to evaluate it before you make an offer.
          </p>

          <ol className="mt-4 space-y-3 text-slate-700 list-decimal pl-6">
            <li>
              <strong>Look up the N-number</strong> on the{' '}
              <Link href="/" className="text-sky-600 hover:underline">
                homepage search
              </Link>
              . You&apos;ll instantly see registration details, owner history,
              and NTSB accident records for free.
            </li>
            <li>
              <strong>Check AD applicability</strong> using the free{' '}
              <Link href="/ad-check" className="text-sky-600 hover:underline">
                AD Check tool
              </Link>
              . This matches the aircraft&apos;s serial number against every
              applicable AD.
            </li>
            <li>
              <strong>Review the full report</strong> to see the complete
              ownership chain, all ADs with links to the official Federal
              Register documents, and a downloadable PDF you can share with
              your mechanic or lender.
            </li>
            <li>
              <strong>Cross-check the logbooks</strong> against the AD list.
              Every AD marked &ldquo;Applies&rdquo; in the report should have a
              corresponding logbook entry documenting compliance.
            </li>
          </ol>

          <div className="mt-8 bg-sky-600 text-white rounded-2xl p-6 text-center">
            <h3 className="text-xl font-bold">
              Check a 172 before you buy
            </h3>
            <p className="mt-2 text-sky-100 text-sm">
              Enter the N-number to see registration, accident history, and
              applicable ADs. Free, no signup.
            </p>
            <Link
              href="/"
              className="mt-5 inline-block bg-white text-sky-600 px-6 py-3 rounded-xl font-semibold hover:bg-sky-50 transition"
            >
              Search an N-Number
            </Link>
          </div>
        </section>

        {/* Related pages */}
        <section className="mt-16 border-t border-slate-200 pt-8">
          <h2 className="text-xl font-bold text-slate-900">Related resources</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link
                href="/aircraft/make/cessna/model/172h"
                className="text-sky-600 hover:underline"
              >
                Browse all Cessna 172 aircraft in our database →
              </Link>
            </li>
            <li>
              <Link href="/ad-check" className="text-sky-600 hover:underline">
                Free AD Applicability Check →
              </Link>
            </li>
            <li>
              <Link href="/sample-report" className="text-sky-600 hover:underline">
                See what a full history report includes →
              </Link>
            </li>
          </ul>
        </section>
      </article>

      {/* Footer is global from layout */}
    </div>
  );
}

function ChecklistItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-white">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-5 h-5 rounded border-2 border-slate-300 mt-0.5" />
        <div>
          <h4 className="font-semibold text-slate-900 text-sm">{title}</h4>
          <p className="mt-1 text-sm text-slate-600 leading-relaxed">{desc}</p>
        </div>
      </div>
    </div>
  );
}
