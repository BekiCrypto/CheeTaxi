import Link from 'next/link';

const PLANS = [
  { name: 'Daily', price: 'Br 100', period: '1 day', popular: false },
  { name: 'Weekly', price: 'Br 500', period: '7 days', popular: false },
  { name: 'Monthly', price: 'Br 1,800', period: '30 days', popular: true },
  { name: 'Quarterly', price: 'Br 5,000', period: '90 days', popular: false },
  { name: 'Yearly', price: 'Br 18,000', period: '365 days', popular: false },
];

export function DriverCTA() {
  return (
    <section id="drivers" className="bg-ink-900 py-20 text-white md:py-28">
      <div className="container-px mx-auto max-w-7xl">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <span className="text-sm font-semibold uppercase tracking-wider text-brand-400">
              For Drivers
            </span>
            <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight md:text-5xl">
              Keep 100% of every fare.
              <br />
              <span className="text-brand-400">Just one subscription.</span>
            </h2>
            <p className="mt-6 text-lg text-ink-300">
              No more losing 20-25% of every trip to the platform. Pay one flat subscription,
              drive unlimited rides, and keep every birr you earn. Withdraw to your bank or mobile
              money anytime — no waiting periods.
            </p>

            <ul className="mt-8 space-y-4">
              {[
                'Instant wallet top-ups and withdrawals',
                'Heat maps show you where demand is hottest',
                'Income analytics — daily, weekly, monthly',
                'Bonuses for high ratings and acceptance rate',
                'Subscription grace period — never get stranded',
                'Free driver training and onboarding support',
              ].map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <span className="mt-1 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand-500 text-white">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span className="text-ink-200">{f}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10">
              <Link href="#plans" className="btn-primary">
                See subscription plans
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-5 transition hover:scale-[1.02] ${
                  plan.popular
                    ? 'border-brand-400 bg-brand-500/10 shadow-lg shadow-brand-500/20'
                    : 'border-ink-700 bg-ink-800'
                }`}
              >
                {plan.popular && (
                  <span className="inline-block rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Most popular
                  </span>
                )}
                <div className="font-display text-xl font-bold">{plan.name}</div>
                <div className="mt-2 font-display text-3xl font-extrabold text-brand-400">
                  {plan.price}
                </div>
                <div className="mt-1 text-xs text-ink-400">{plan.period} · unlimited rides</div>
              </div>
            ))}
            <div className="rounded-2xl border border-dashed border-ink-700 bg-ink-800/50 p-5 text-center">
              <div className="font-display text-sm font-semibold text-ink-300">
                Corporate / Fleet / Enterprise
              </div>
              <div className="mt-1 text-xs text-ink-400">Contact sales for custom pricing</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
