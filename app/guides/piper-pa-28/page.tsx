import Link from 'next/link';
import type { Metadata } from 'next';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: "Piper PA-28 Buyer's Guide — Common ADs, Serial Numbers & Pre-Buy Checklist",
  description:
    'Complete guide to buying a Piper PA-28 Cherokee, Warrior, or Archer. Covers common Airworthiness Directives, serial number ranges, pre-buy inspection checklist, and known problem areas.',
  alternates: {
    canonical: 'https://nnumbercheck.com/guides/piper-pa-28',
  },
};

const guideJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: "Piper PA-28 Buyer's Guide",
  description:
    'Complete guide to buying a Piper PA-28. Covers common ADs, serial number ranges, and pre-buy inspection checklist.',
  author: { '@type': 'Organization', name: 'NNumberCheck' },
  publisher: {
    '@type': 'Organization',
    name: 'NNumberCheck',
    logo: { '@type': 'ImageObject', url: 'https://nnumbercheck.com/og-image.png' },
  },
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': 'https://nnumbercheck.com/guides/piper-pa-28',
  },
};

export default function Pa28Guide() {
  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(guideJsonLd).replace(/</g, '\\u003c'),
        }}
      />

      <article className="max-w-3xl mx-auto px-6 py-12">
        <nav className="text-sm text-slate-500 mb-8">
          <Link href="/" className="hover:text-sky-600">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/guides" className="hover:text-sky-600">Guides</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-700">Piper PA-28</span>
        </nav>

        <header>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
            Piper PA-28 Buyer&apos;s Guide
          </h1>
          <p className="mt-4 text-lg text-slate-600 leading-relaxed">
            The PA-28 Cherokee family has been in continuous production since
            1961 — over 32,000 built across dozens of variants. It&apos;s the
            most common trainer in the world and one of the most popular
            personal aircraft. Here&apos;s what to check before you buy one.
          </p>
        </header>

        <div className="mt-10 space-y-8 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">
              The variants that matter
            </h2>
            <p>
              Not all PA-28s are the same aircraft. The model designation tells
              you which wing, engine, and gear configuration you&apos;re looking
              at. For buying purposes, the family breaks into five groups:
            </p>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm border border-slate-200 rounded-lg">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-900">Family</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-900">Models</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-900">Years</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-900">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-4 py-3 font-medium">Cherokee</td>
                    <td className="px-4 py-3">PA-28-140, -150, -160, -180</td>
                    <td className="px-4 py-3">1961–1977</td>
                    <td className="px-4 py-3">Hershey-bar wing, basic, cheap</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Warrior</td>
                    <td className="px-4 py-3">PA-28-151, -161</td>
                    <td className="px-4 py-3">1974–1994</td>
                    <td className="px-4 py-3">Tapered wing, best trainer</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Archer</td>
                    <td className="px-4 py-3">PA-28-181</td>
                    <td className="px-4 py-3">1974–present</td>
                    <td className="px-4 py-3">180 hp, most desirable</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Arrow</td>
                    <td className="px-4 py-3">PA-28R-180, -200, -201, -201T</td>
                    <td className="px-4 py-3">1967–present</td>
                    <td className="px-4 py-3">Retractable gear, complex endorsement</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Dakota</td>
                    <td className="px-4 py-3">PA-28-236</td>
                    <td className="px-4 py-3">1979–1994</td>
                    <td className="px-4 py-3">235 hp, 4 adults, useful load</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-6">
              For a first aircraft or training use, the <strong>PA-28-161 Warrior</strong> or{' '}
              <strong>PA-28-181 Archer</strong> is the sweet spot. For cross-country,
              the <strong>PA-28R-201 Arrow</strong> adds retractable gear and constant-speed
              prop. The <strong>PA-28-236 Dakota</strong> is the most capable but also the
              heaviest and thirstiest.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">
              Market pricing (2025)
            </h2>
            <p>
              Rough numbers for well-equipped, mid-time aircraft with no damage
              history:
            </p>
            <ul className="mt-3 space-y-2 list-disc list-inside text-slate-700">
              <li><strong>PA-28-140 Cherokee:</strong> $45,000–$75,000</li>
              <li><strong>PA-28-151/161 Warrior:</strong> $65,000–$110,000</li>
              <li><strong>PA-28-181 Archer:</strong> $95,000–$175,000</li>
              <li><strong>PA-28R-201 Arrow:</strong> $110,000–$190,000</li>
              <li><strong>PA-28-236 Dakota:</strong> $150,000–$250,000</li>
            </ul>
            <p className="mt-4">
              Avionics drive most of the spread. A Garmin GTN 650 + ADS-B Out
              can add $30,000+ to the value of an otherwise identical airframe.
              Damage history can subtract 15–30%.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">
              The ADs you need to check
            </h2>
            <p>
              The PA-28 fleet has one of the most active AD histories of any
              training aircraft, mostly around the wing spar. These are the
              ones that matter most in a pre-buy:
            </p>

            <div className="mt-6 space-y-4">
              <div className="border-l-4 border-red-400 bg-red-50 rounded-r-lg p-4">
                <div className="font-semibold text-slate-900">
                  AD 2016-07580 — Right wing rib crack
                </div>
                <p className="mt-1 text-sm text-slate-700">
                  Applies to PA-28-161, PA-28-181, and PA-28R-201 with specific
                  serial ranges. Requires inspecting the right wing rib at wing
                  station 140.09 for cracks. This superseded AD 2015-20-13 and
                  expanded the applicability.
                </p>
              </div>

              <div className="border-l-4 border-red-400 bg-red-50 rounded-r-lg p-4">
                <div className="font-semibold text-slate-900">
                  AD 2021-00044 — Main wing spar bolt holes
                </div>
                <p className="mt-1 text-sm text-slate-700">
                  Requires calculating factored service hours for the main wing
                  spar, then inspecting the lower main wing spar bolt holes for
                  cracks once thresholds are reached. Wing separation caused by
                  fatigue cracking prompted this AD. High-utilization trainers
                  are most affected.
                </p>
              </div>

              <div className="border-l-4 border-red-400 bg-red-50 rounded-r-lg p-4">
                <div className="font-semibold text-slate-900">
                  AD 2020-25690 — Main wing spar corrosion
                </div>
                <p className="mt-1 text-sm text-slate-700">
                  Applies to several PA-28 sub-variants. Requires inspecting the
                  left and right main wing spars for corrosion in an area not
                  easily accessible. Corrosion found on aircraft that have spent
                  time in coastal or humid environments.
                </p>
              </div>

              <div className="border-l-4 border-red-400 bg-red-50 rounded-r-lg p-4">
                <div className="font-semibold text-slate-900">
                  AD 2018-01059 / 2018-06336 — Fuel tank selector
                </div>
                <p className="mt-1 text-sm text-slate-700">
                  Covers a wide range of PA-28 models. Requires inspecting the
                  fuel tank selector cover to verify left and right placards are
                  properly positioned. 2018-06336 superseded 2018-01059 to allow
                  a pilot-conducted preflight check.
                </p>
              </div>
            </div>

            <p className="mt-6">
              These are just the highest-impact ADs. A typical PA-28 has 20+
              ADs on file, some applying to all serials, others to narrow
              ranges. Running serial-number-level matching is the only way to
              know which ones actually apply to the aircraft you&apos;re
              looking at.
            </p>

            <div className="mt-6 bg-sky-50 border border-sky-200 rounded-xl p-5">
              <p className="text-sm font-medium text-slate-900">
                Check the exact ADs for any PA-28 in seconds
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Enter the N-number and we match the aircraft&apos;s serial
                against every applicable AD. Free, no signup.
              </p>
              <Link
                href="/ad-check"
                className="mt-3 inline-block bg-sky-600 text-white px-5 py-2 rounded-lg font-semibold text-sm hover:bg-sky-700 transition"
              >
                Run free AD check →
              </Link>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">
              Pre-buy inspection checklist
            </h2>
            <p>
              A PA-28 pre-buy is not the same as an annual. Tell the shop
              explicitly that it&apos;s a pre-buy and you want a written
              report. Expect to pay $1,500–$3,000 depending on scope.
            </p>

            <h3 className="font-semibold text-lg text-slate-900 mt-6 mb-2">Airframe</h3>
            <ul className="space-y-2 list-disc list-inside text-slate-700">
              <li>Wing spar inspection (especially bolt holes at the root)</li>
              <li>Wing rib at WS 140.09 (per AD 2016-07580)</li>
              <li>Main gear attachment points for cracks</li>
              <li>Belly skin for corrosion and prior damage repairs</li>
              <li>Empennage attachment bolts and torque</li>
              <li>Control surface hinge wear and free play</li>
            </ul>

            <h3 className="font-semibold text-lg text-slate-900 mt-6 mb-2">Engine</h3>
            <ul className="space-y-2 list-disc list-inside text-slate-700">
              <li>Compression check (all cylinders above 60/80)</li>
              <li>Oil analysis if recent samples are available</li>
              <li>Borescope inspection of cylinders</li>
              <li>Magneto timing and condition</li>
              <li>Carburetor / fuel servo condition</li>
              <li>Exhaust system for cracks (especially muffler)</li>
              <li>Engine mount for cracks</li>
            </ul>

            <h3 className="font-semibold text-lg text-slate-900 mt-6 mb-2">Propeller</h3>
            <ul className="space-y-2 list-disc list-inside text-slate-700">
              <li>Blade condition and nicks</li>
              <li>Hub corrosion and grease leaks</li>
              <li>Logbook — last overhaul date</li>
              <li>AD compliance (some Hartzell models have ADs)</li>
            </ul>

            <h3 className="font-semibold text-lg text-slate-900 mt-6 mb-2">Systems & avionics</h3>
            <ul className="space-y-2 list-disc list-inside text-slate-700">
              <li>Fuel selector operation (both tanks, all positions)</li>
              <li>Pitot/static system and transponder cert</li>
              <li>ADS-B Out compliance (check 14 CFR 91.225)</li>
              <li>Alternator output and voltage regulator</li>
              <li>Vacuum system if applicable</li>
              <li>Autopilot operation if equipped</li>
            </ul>

            <h3 className="font-semibold text-lg text-slate-900 mt-6 mb-2">Logbooks & records</h3>
            <ul className="space-y-2 list-disc list-inside text-slate-700">
              <li>Complete logs with no unexplained gaps</li>
              <li>Airworthiness Directives compliance summary</li>
              <li>Last annual and any 100-hour inspections</li>
              <li>ADs signed off in the log or a separate compliance sheet</li>
              <li>Damage history (4910-1 form if applicable)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">
              Known problem areas
            </h2>

            <h3 className="font-semibold text-lg text-slate-900 mt-6 mb-2">
              Wing spar corrosion and cracks
            </h3>
            <p>
              The single biggest PA-28 issue. Aircraft based in Florida, the
              Gulf Coast, or any coastal environment are at highest risk.
              Corrosion in the spar carry-through structure is difficult to
              inspect and expensive to repair. The wing spar ADs exist for a
              reason — multiple wing failures have prompted them over the
              years.
            </p>

            <h3 className="font-semibold text-lg text-slate-900 mt-6 mb-2">
              Fuel tank selector
            </h3>
            <p>
              Placard location on the fuel tank selector cover has been the
              subject of two ADs. Verify both placards are visible and
              correctly positioned. A mismatch is a red flag for a shop
              that doesn&apos;t pay attention to details.
            </p>

            <h3 className="font-semibold text-lg text-slate-900 mt-6 mb-2">
              Rudder and stabilator trim
            </h3>
            <p>
              Trim system binding or excessive free play often indicates
              worn jackscrew or cable tension issues. Some models have had
              stabilator control cable failures. Check the trim in flight
              if possible.
            </p>

            <h3 className="font-semibold text-lg text-slate-900 mt-6 mb-2">
              Landing gear (Arrows)
            </h3>
            <p>
              Retractable gear adds complexity. The gear motor, down-locks,
              and microswitches are all failure points. Also check the
              gear-up landing history — many Arrows have had one, and the
              repair quality matters.
            </p>

            <h3 className="font-semibold text-lg text-slate-900 mt-6 mb-2">
              Engine (Lycoming O-320 / O-360)
            </h3>
            <p>
              The Lycoming 4-cylinder engines are reliable but sensitive to
              oil changes and camshaft corrosion if not flown regularly.
              Low-time engines on aircraft that sat for years can be worse
              than high-time engines that flew weekly. Check the logbook for
              gaps in flying and oil change intervals.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">
              Red flags to walk away from
            </h2>
            <ul className="space-y-3 list-disc list-inside text-slate-700">
              <li>
                <strong>Logbook gaps.</strong> Any gap longer than 12 months,
                especially in early years, means you can&apos;t prove AD
                compliance.
              </li>
              <li>
                <strong>Missing AD compliance records.</strong> A well-maintained
                PA-28 should have a compliance sheet. If it doesn&apos;t,
                you&apos;re buying unknown risk.
              </li>
              <li>
                <strong>Wing spar repairs without documentation.</strong> Any
                spar repair should be documented with 337 or STC paperwork. No
                paperwork = no deal.
              </li>
              <li>
                <strong>Fresh paint or interior.</strong> Can cover up corrosion,
                cracks, or sloppy repairs. Especially suspicious on a
                high-time airframe.
              </li>
              <li>
                <strong>&ldquo;Flies great, just needs annual.&rdquo;</strong>{' '}
                A PA-28 that hasn&apos;t been annualed in 2+ years likely has
                a stack of deferred maintenance.
              </li>
              <li>
                <strong>Suspiciously low price.</strong> In the PA-28 market,
                the cheapest option is usually cheap for a reason. The
                difference between a $65,000 Warrior and a $45,000 Warrior is
                almost always damage history or deferred maintenance.
              </li>
            </ul>
          </section>

          <section className="mt-12 border-t border-slate-200 pt-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              The bottom line
            </h2>
            <p>
              The PA-28 is one of the best value-for-money aircraft in
              general aviation. It&apos;s forgiving, cheap to maintain, and
              well-supported by parts and shops. But the fleet is old, and
              the AD history is real — most of it is about wing spars, and
              most of those ADs apply to specific serial ranges.
            </p>
            <p className="mt-4">
              Before you put down a deposit, do three things:
            </p>
            <ol className="mt-3 space-y-2 list-decimal list-inside text-slate-700">
              <li>
                Run a serial-number AD check (free at{' '}
                <Link href="/ad-check" className="text-sky-600 hover:underline font-medium">
                  nnumbercheck.com/ad-check
                </Link>
                )
              </li>
              <li>Get a proper pre-buy from a shop that knows PA-28s</li>
              <li>Verify every AD in the list is signed off in the logbooks</li>
            </ol>
            <p className="mt-4 font-semibold text-slate-900">
              Do those three things and you&apos;ll avoid the worst
              PA-28 mistakes.
            </p>

            <div className="mt-10 bg-sky-600 text-white rounded-2xl p-6">
              <h3 className="text-lg font-bold">
                Check any PA-28&apos;s ADs in seconds
              </h3>
              <p className="mt-2 text-sm text-sky-100">
                Free serial-number-level AD matching. Also shows NTSB
                accident history and FAA registration.
              </p>
              <Link
                href="/ad-check"
                className="mt-4 inline-block bg-white text-sky-600 px-6 py-3 rounded-xl font-semibold hover:bg-sky-50 transition"
              >
                Run free AD check →
              </Link>
            </div>
          </section>
        </div>
      </article>
    </div>
  );
}
