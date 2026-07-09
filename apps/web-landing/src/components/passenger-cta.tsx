import Link from 'next/link';

export function PassengerCTA() {
  return (
    <section id="passengers" className="py-20 md:py-28">
      <div className="container-px mx-auto max-w-7xl">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <span className="text-sm font-semibold uppercase tracking-wider text-brand-600">
              For Passengers
            </span>
            <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-ink-900 md:text-5xl">
              Free forever. No subscriptions.
              <br />
              <span className="text-brand-500">No platform charges.</span>
            </h2>
            <p className="mt-6 text-lg text-ink-600">
              CheeTaxi passengers never pay a cent in platform fees. Request a ride in seconds,
              track your driver live, share your trip with loved ones, and pay the way that works
              for you — cash, card, wallet, or corporate account.
            </p>

            <ul className="mt-8 space-y-4">
              {[
                'Multi-stop trips and scheduled rides',
                'Live tracking with trip-sharing link',
                'Family profiles and saved places',
                'Favorite drivers — request them again',
                'SOS button instantly alerts our safety team',
                'Rate drivers, file lost-item claims in one tap',
              ].map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <span className="mt-1 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand-100 text-brand-700">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span className="text-ink-700">{f}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="#download" className="btn-primary">
                Download for iOS
              </Link>
              <Link href="#download" className="btn-secondary">
                Download for Android
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="card bg-gradient-to-br from-brand-50 to-amber-50">
              <div className="text-3xl">🚕</div>
              <div className="mt-4 font-display text-2xl font-bold text-ink-900">
                Sample fare — Addis Ababa
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-ink-500">Bole Airport → Meskel Square</span><span className="font-semibold text-ink-900">Br 230</span></div>
                <div className="flex justify-between"><span className="text-ink-500">Megenagna → Merkato</span><span className="font-semibold text-ink-900">Br 145</span></div>
                <div className="flex justify-between"><span className="text-ink-500">4 km × 12 min ride</span><span className="font-semibold text-ink-900">Br 95</span></div>
                <div className="mt-4 flex justify-between border-t border-ink-200 pt-3">
                  <span className="text-ink-500">Platform fee</span>
                  <span className="font-bold text-brand-600">Br 0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
