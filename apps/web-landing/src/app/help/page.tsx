import { Metadata } from 'next';
export const metadata: Metadata = { title: 'Help Center', description: 'Find answers, contact support, and get help with CheeTaxi.' };

const TOPICS = [
  { icon: '🚕', title: 'Requesting a ride', desc: 'How to book, cancel, schedule, and modify trips' },
  { icon: '💳', title: 'Payments & refunds', desc: 'Cash, wallet, card, corporate accounts, refunds' },
  { icon: '🚗', title: 'Driving with CheeTaxi', desc: 'Onboarding, subscriptions, earnings, withdrawals' },
  { icon: '🆘', title: 'Safety & SOS', desc: 'Emergency features, reporting, trip sharing' },
  { icon: '👤', title: 'Account & profile', desc: 'Verification, settings, deletion, GDPR rights' },
  { icon: '📦', title: 'Delivery services', desc: 'Parcels, food, medical, freight' },
  { icon: '🏢', title: 'Corporate accounts', desc: 'Centralized billing, employee trips, fleet mgmt' },
  { icon: '🌐', title: 'Language & region', desc: 'App language, country, currency settings' },
];

const FAQS = [
  { q: 'Is CheeTaxi really free for passengers?', a: 'Yes. Passengers never pay a subscription or platform fee. You only pay the trip fare.' },
  { q: 'How much do drivers keep?', a: '100%. Drivers pay one flat subscription and keep every birr they earn.' },
  { q: 'What payment methods are supported?', a: 'Cash, in-app wallet, card (Stripe, Chapa, Telebirr), and corporate accounts.' },
  { q: 'How do I trigger SOS?', a: 'Tap the SOS button in the app during a trip. Our safety team responds within 60 seconds.' },
  { q: 'Can I schedule a ride in advance?', a: 'Yes — choose "Scheduled" when requesting and pick your time.' },
  { q: 'How do I become a driver?', a: 'Download the driver app, complete KYC and onboarding. Approval takes 24-48 hours.' },
];

export default function HelpPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <div className="text-center">
        <h1 className="font-display text-4xl font-extrabold text-ink-900">Help Center</h1>
        <p className="mt-2 text-ink-600">Find answers fast. Contact us if you can&apos;t.</p>
        <div className="mt-6 mx-auto max-w-xl">
          <input className="w-full rounded-full border border-ink-200 px-6 py-3 outline-none focus:border-brand-400" placeholder="Search for help..." />
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TOPICS.map((t) => (
          <div key={t.title} className="rounded-2xl border border-ink-100 p-5 hover:border-brand-200 hover:shadow-md transition cursor-pointer">
            <div className="text-3xl">{t.icon}</div>
            <div className="mt-3 font-display font-bold text-ink-900">{t.title}</div>
            <div className="mt-1 text-sm text-ink-500">{t.desc}</div>
          </div>
        ))}
      </div>

      <div className="mt-16">
        <h2 className="font-display text-2xl font-bold text-ink-900">Frequently asked questions</h2>
        <div className="mt-6 space-y-3">
          {FAQS.map((f) => (
            <details key={f.q} className="group rounded-xl border border-ink-100 p-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between font-semibold text-ink-900">
                {f.q}
                <svg className="text-ink-400 transition group-open:rotate-180" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
              </summary>
              <p className="mt-3 text-ink-600">{f.a}</p>
            </details>
          ))}
        </div>
      </div>

      <div className="mt-16 rounded-2xl bg-ink-900 p-8 text-white text-center">
        <h2 className="font-display text-2xl font-bold">Still need help?</h2>
        <p className="mt-2 text-ink-300">Our support team responds within 1 hour, 24/7.</p>
        <div className="mt-4 flex justify-center gap-3">
          <a href="mailto:support@cheetaxi.africa" className="rounded-full bg-brand-500 px-6 py-3 font-semibold">Email support</a>
          <a href="tel:+251900000000" className="rounded-full border border-ink-700 px-6 py-3 font-semibold">Call us</a>
        </div>
      </div>
    </main>
  );
}
