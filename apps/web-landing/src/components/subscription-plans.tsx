import Link from 'next/link';

const PLANS = [
  {
    name: 'Daily',
    price: 100,
    period: '1 day',
    features: ['Unlimited rides', 'Instant activation', 'Cancel anytime', 'Wallet or cash payment'],
    cta: 'Get started',
    popular: false,
  },
  {
    name: 'Weekly',
    price: 500,
    period: '7 days',
    features: ['Unlimited rides', 'Save 28% vs. daily', 'Priority support', 'Heat map access'],
    cta: 'Get started',
    popular: false,
  },
  {
    name: 'Monthly',
    price: 1800,
    period: '30 days',
    features: ['Unlimited rides', 'Save 40% vs. daily', 'Priority dispatch', 'Withdrawals in 1 hour', 'Income analytics dashboard'],
    cta: 'Get started',
    popular: true,
  },
  {
    name: 'Quarterly',
    price: 5000,
    period: '90 days',
    features: ['Unlimited rides', 'Save 44% vs. daily', 'All Monthly perks', 'Dedicated driver success manager'],
    cta: 'Get started',
    popular: false,
  },
  {
    name: 'Yearly',
    price: 18000,
    period: '365 days',
    features: ['Unlimited rides', 'Save 50% vs. daily', 'All Quarterly perks', 'Annual bonus eligibility', 'Free vehicle inspection'],
    cta: 'Get started',
    popular: false,
  },
  {
    name: 'Fleet / Enterprise',
    price: null,
    period: 'custom',
    features: ['Multiple drivers', 'Centralized billing', 'Driver behavior analytics', 'API access', 'Dedicated account manager'],
    cta: 'Contact sales',
    popular: false,
  },
];

export function SubscriptionPlans() {
  return (
    <section id="plans" className="bg-ink-50 py-20 md:py-28">
      <div className="container-px mx-auto max-w-7xl">
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-brand-600">
            Driver subscriptions
          </span>
          <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-ink-900 md:text-5xl">
            Pick the plan that fits your hustle.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-600">
            Every plan unlocks unlimited rides. No commission, no hidden fees, no per-trip deduction.
            Cancel anytime.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-3xl border p-7 transition ${
                plan.popular
                  ? 'border-brand-400 bg-white shadow-xl shadow-brand-500/10 lg:-translate-y-3'
                  : 'border-ink-200 bg-white hover:border-brand-200 hover:shadow-md'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-4 py-1 text-xs font-bold uppercase tracking-wide text-white">
                  Most popular
                </span>
              )}
              <div className="font-display text-xl font-bold text-ink-900">{plan.name}</div>
              <div className="mt-3">
                {plan.price === null ? (
                  <div className="font-display text-3xl font-extrabold text-ink-700">Custom</div>
                ) : (
                  <>
                    <span className="font-display text-4xl font-extrabold text-ink-900">
                      Br {plan.price.toLocaleString()}
                    </span>
                    <span className="text-sm text-ink-500"> / {plan.period}</span>
                  </>
                )}
              </div>

              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-ink-700">
                    <svg className="mt-0.5 flex-none text-brand-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="#download"
                className={`mt-7 ${plan.popular ? 'btn-primary' : 'btn-ghost'} justify-center`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
