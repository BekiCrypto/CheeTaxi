const FAQS = [
  {
    q: 'Is CheeTaxi really free for passengers?',
    a: 'Yes. Passengers never pay a subscription or platform fee. You only pay the trip fare — cash, card, wallet, or corporate account. The only revenue we collect is from driver subscriptions.',
  },
  {
    q: 'How much do drivers keep from each trip?',
    a: '100%. There is no commission, no per-trip deduction, and no hidden fee. Drivers pay one flat subscription (daily, weekly, monthly, quarterly, or yearly) and keep every birr they earn.',
  },
  {
    q: 'What if a driver cannot afford the subscription today?',
    a: 'Drivers can start with the daily pass for as low as Br 100. We also offer a grace period — if a subscription lapses mid-trip, the driver is not stranded. They can pay from earnings once they renew.',
  },
  {
    q: 'Which cities is CheeTaxi available in?',
    a: 'We launch first in Addis Ababa, Ethiopia and expand to all major African capitals. The platform is architecturally ready for all 54 African countries — expansion requires only regulatory and operational setup, not engineering work.',
  },
  {
    q: 'How do you verify drivers?',
    a: 'Every driver completes phone verification, KYC document submission, license verification, background check, and vehicle inspection before they can accept their first trip. Drivers re-verify annually.',
  },
  {
    q: 'What payment methods are supported?',
    a: 'Cash, in-app wallet, card (via Stripe for international, Chapa and Telebirr for Ethiopia), corporate accounts, and subscription credits. Wallet top-ups support all major mobile money providers.',
  },
  {
    q: 'Is there a 24/7 support line?',
    a: 'Yes. In-app chat, phone, and SOS are all available 24/7. Our safety operations center responds to SOS alerts within 60 seconds on average.',
  },
  {
    q: 'Do you support fleet and corporate accounts?',
    a: 'Yes. We have dedicated Corporate, Enterprise, and Government fleet plans with centralized billing, driver behavior analytics, and API access. Contact our sales team for custom pricing.',
  },
];

export function FAQ() {
  return (
    <section className="py-20 md:py-28">
      <div className="container-px mx-auto max-w-3xl">
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-brand-600">
            Frequently asked
          </span>
          <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-ink-900 md:text-5xl">
            Questions, answered.
          </h2>
        </div>

        <div className="mt-12 space-y-4">
          {FAQS.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-ink-100 bg-white p-6 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between font-display text-lg font-semibold text-ink-900">
                {f.q}
                <svg
                  className="flex-none text-ink-400 transition group-open:rotate-180"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </summary>
              <p className="mt-4 text-ink-600">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
