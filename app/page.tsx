export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-sky-600">NNumberCheck</span>
            <span className="text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full font-medium">
              Beta
            </span>
          </a>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#how-it-works" className="hover:text-sky-600">How it works</a>
            <a href="#pricing" className="hover:text-sky-600">Pricing</a>
            <a href="#dealers" className="hover:text-sky-600">For Dealers</a>
            <a
              href="#lookup"
              className="bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition"
            >
              Free Lookup
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-sky-50 to-white">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
            Check any aircraft&apos;s history in seconds
          </h1>
          <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
            Instant N-number lookup with accident history, ownership records,
            airworthiness directives, and more. Know what you&apos;re buying
            before you commit.
          </p>

          {/* Search Box */}
          <form
            id="lookup"
            action="/n"
            method="get"
            className="mt-10 max-w-xl mx-auto flex flex-col sm:flex-row gap-3"
          >
            <input
              type="text"
              name="number"
              placeholder="Enter N-Number (e.g., N12345)"
              className="flex-1 px-5 py-4 rounded-xl border-2 border-slate-300 focus:border-sky-500 focus:outline-none text-lg"
              required
              pattern="[Nn]?[0-9]{1,5}[A-Za-z]{0,2}"
              title="Enter a valid N-number, e.g. N12345"
            />
            <button
              type="submit"
              className="bg-sky-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-sky-700 transition"
            >
              Search
            </button>
          </form>
          <p className="mt-3 text-sm text-slate-500">
            Free basic lookup. No signup required.
          </p>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-y border-slate-200 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-wrap justify-center items-center gap-x-10 gap-y-3 text-sm text-slate-500">
          <span>✓ FAA Registry data</span>
          <span>✓ NTSB accident records</span>
          <span>✓ Airworthiness directives</span>
          <span>✓ Instant delivery</span>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center">
          How it works
        </h2>
        <p className="mt-4 text-center text-slate-600 max-w-2xl mx-auto">
          Three steps from curiosity to confidence.
        </p>

        <div className="mt-14 grid md:grid-cols-3 gap-8">
          {[
            {
              step: "1",
              title: "Enter the N-Number",
              desc: "Type any US-registered aircraft's tail number into the search box.",
            },
            {
              step: "2",
              title: "Review the free summary",
              desc: "See registration details, make, model, year, and accident count instantly.",
            },
            {
              step: "3",
              title: "Unlock the full report",
              desc: "Get the complete history — ownership chain, liens, ADs, and market value — for $149.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-lg transition"
            >
              <div className="w-10 h-10 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold">
                {item.step}
              </div>
              <h3 className="mt-5 text-xl font-semibold">{item.title}</h3>
              <p className="mt-2 text-slate-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What's included */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center">
            What&apos;s in the full report
          </h2>
          <p className="mt-4 text-center text-slate-600 max-w-2xl mx-auto">
            Everything you need to make an informed decision before you buy.
          </p>

          <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Accident & Incident History",
                desc: "Complete NTSB records linked to the aircraft's N-number.",
              },
              {
                title: "Ownership Chain",
                desc: "Full list of prior owners with locations and dates.",
              },
              {
                title: "Airworthiness Directives",
                desc: "Outstanding ADs and compliance history.",
              },
              {
                title: "Liens & Encumbrances",
                desc: "Any recorded financial interests against the aircraft.",
              },
              {
                title: "Registration Status",
                desc: "Current FAA registration, expiration, and airworthiness.",
              },
              {
                title: "Market Value Estimate",
                desc: "Comparable-sales-based valuation range.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-white border border-slate-200 rounded-xl p-6"
              >
                <h3 className="font-semibold text-lg">{f.title}</h3>
                <p className="mt-2 text-slate-600 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center">
          Simple, transparent pricing
        </h2>
        <p className="mt-4 text-center text-slate-600 max-w-2xl mx-auto">
          Pay only for what you need. No subscriptions required.
        </p>

        <div className="mt-14 grid md:grid-cols-3 gap-6">
          {/* Free */}
          <div className="border border-slate-200 rounded-2xl p-8">
            <h3 className="text-xl font-semibold">Free Lookup</h3>
            <p className="mt-3 text-4xl font-bold">$0</p>
            <p className="mt-1 text-sm text-slate-500">Always free</p>
            <ul className="mt-6 space-y-3 text-slate-600 text-sm">
              <li>✓ Registration status</li>
              <li>✓ Make, model, year</li>
              <li>✓ Owner city & state</li>
              <li>✓ Accident count summary</li>
            </ul>
            <a
              href="#lookup"
              className="mt-8 block text-center border border-sky-600 text-sky-600 py-3 rounded-xl font-semibold hover:bg-sky-50 transition"
            >
              Start Free Search
            </a>
          </div>

          {/* Full Report */}
          <div className="border-2 border-sky-600 rounded-2xl p-8 relative bg-sky-50/50">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sky-600 text-white text-xs px-3 py-1 rounded-full font-medium">
              Most Popular
            </span>
            <h3 className="text-xl font-semibold">Full History Report</h3>
            <p className="mt-3 text-4xl font-bold">$149</p>
            <p className="mt-1 text-sm text-slate-500">One-time payment</p>
            <ul className="mt-6 space-y-3 text-slate-700 text-sm">
              <li>✓ Everything in Free</li>
              <li>✓ Accident & incident details</li>
              <li>✓ Ownership chain</li>
              <li>✓ Liens & encumbrances</li>
              <li>✓ Airworthiness directives</li>
              <li>✓ Market value estimate</li>
            </ul>
            <a
              href="#lookup"
              className="mt-8 block text-center bg-sky-600 text-white py-3 rounded-xl font-semibold hover:bg-sky-700 transition"
            >
              Get Full Report
            </a>
          </div>

          {/* Dealer */}
          <div id="dealers" className="border border-slate-200 rounded-2xl p-8">
            <h3 className="text-xl font-semibold">Dealer Plan</h3>
            <p className="mt-3 text-4xl font-bold">
              $199<span className="text-lg font-normal text-slate-500">/mo</span>
            </p>
            <p className="mt-1 text-sm text-slate-500">For brokers & dealers</p>
            <ul className="mt-6 space-y-3 text-slate-600 text-sm">
              <li>✓ Unlimited lookups</li>
              <li>✓ Bulk N-number search</li>
              <li>✓ API access</li>
              <li>✓ Priority support</li>
              <li>✓ White-label PDF reports</li>
            </ul>
            <a
              href="mailto:support@nnumbercheck.com?subject=Dealer%20Plan%20Inquiry"
              className="mt-8 block text-center border border-slate-900 text-slate-900 py-3 rounded-xl font-semibold hover:bg-slate-100 transition"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-sky-600 text-white">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold">
            Know the aircraft before you buy
          </h2>
          <p className="mt-4 text-sky-100 text-lg">
            Skip the guesswork. Get the full picture in seconds.
          </p>
          <a
            href="#lookup"
            className="mt-8 inline-block bg-white text-sky-600 px-8 py-4 rounded-xl font-semibold hover:bg-sky-50 transition"
          >
            Search an N-Number
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50">
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
                <li><a href="#how-it-works" className="hover:text-sky-600">How it works</a></li>
                <li><a href="#pricing" className="hover:text-sky-600">Pricing</a></li>
                <li><a href="#lookup" className="hover:text-sky-600">Free lookup</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-slate-900">Company</h4>
              <ul className="mt-3 space-y-2 text-sm text-slate-500">
                <li><a href="/about" className="hover:text-sky-600">About</a></li>
                <li><a href="mailto:support@nnumbercheck.com" className="hover:text-sky-600">Contact</a></li>
                <li><a href="#dealers" className="hover:text-sky-600">For Dealers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-slate-900">Legal</h4>
              <ul className="mt-3 space-y-2 text-sm text-slate-500">
                <li><a href="/privacy" className="hover:text-sky-600">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-sky-600">Terms of Service</a></li>
                <li><a href="/disclaimer" className="hover:text-sky-600">Disclaimer</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-slate-200 text-xs text-slate-500 flex flex-col md:flex-row justify-between gap-4">
            <p>© {new Date().getFullYear()} NNumberCheck.com. All rights reserved.</p>
            <p className="max-w-xl">
              Not affiliated with the FAA. For historical reference only. Verify
              all information with official records before making any purchase
              or safety decision.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
