import { Metadata } from 'next';
export const metadata: Metadata = { title: 'Drive with CheeTaxi', description: 'Keep 100% of every fare. Pay one subscription, drive unlimited rides.' };

const STEPS = [
  { n: 1, title: 'Download the driver app', desc: 'Available on Android and iOS. Free to install.' },
  { n: 2, title: 'Sign up with your phone', desc: 'Verify with OTP. Takes 30 seconds.' },
  { n: 3, title: 'Complete onboarding', desc: 'Upload license, vehicle docs, insurance. Pass background check.' },
  { n: 4, title: 'Pick a subscription', desc: 'Daily, weekly, monthly — start with what works for you.' },
  { n: 5, title: 'Go online & start earning', desc: 'Accept trips, navigate, complete, get paid instantly.' },
];

const FAQS = [
  { q: 'How much can I earn?', a: 'Drivers in Addis Ababa earn an average of Br 4,500-7,000 per week after subscription. Top drivers earn Br 12,000+.' },
  { q: 'When do I get paid?', a: 'Instantly. Every fare goes into your CheeTaxi wallet. Withdraw to bank or mobile money within 1 hour.' },
  { q: 'What if I can\'t afford the subscription?', a: 'Start with the Daily pass for Br 100. Or apply for our driver starter program — first week free.' },
  { q: 'What are the vehicle requirements?', a: '4-door car, model year 2010 or newer, valid insurance, current registration, passed inspection.' },
  { q: 'What documents do I need?', a: 'Driver\'s license, vehicle registration, insurance certificate, national ID, and a recent photo.' },
  { q: 'How long does approval take?', a: '24-48 hours after you submit all documents. We\'ll notify you by SMS and push notification.' },
];

export default function DriversPage() {
  return (
    <main>
      <section className="bg-gradient-to-b from-brand-50 to-white py-20">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h1 className="font-display text-5xl font-extrabold text-ink-900 md:text-6xl">
            Drive with CheeTaxi.
            <br />
            <span className="text-brand-500">Keep 100% of every fare.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-600">
            No commission. No per-trip deductions. Just one flat subscription and unlimited earnings.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <a href="#download" className="rounded-full bg-brand-500 px-8 py-4 font-semibold text-white">Download the driver app</a>
            <a href="#how" className="rounded-full border border-ink-200 bg-white px-8 py-4 font-semibold">How it works</a>
          </div>
        </div>
      </section>

      <section id="how" className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="font-display text-3xl font-extrabold text-ink-900 text-center">Getting started is simple</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-5">
            {STEPS.map((s) => (
              <div key={s.n} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 font-display text-xl font-bold text-white">{s.n}</div>
                <div className="mt-4 font-display font-bold text-ink-900">{s.title}</div>
                <div className="mt-1 text-sm text-ink-500">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink-900 py-20 text-white">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="font-display text-3xl font-extrabold text-center">Frequently asked</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {FAQS.map((f) => (
              <div key={f.q} className="rounded-2xl border border-ink-700 bg-ink-800 p-6">
                <div className="font-display font-bold">{f.q}</div>
                <p className="mt-2 text-sm text-ink-300">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="download" className="py-20 text-center">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="font-display text-3xl font-extrabold text-ink-900">Ready to start earning?</h2>
          <p className="mt-3 text-ink-600">Download the CheeTaxi Driver app and start your onboarding today.</p>
          <div className="mt-6 flex justify-center gap-3">
            <a href="#" className="rounded-full bg-ink-900 px-6 py-3 font-semibold text-white">Download for iOS</a>
            <a href="#" className="rounded-full bg-ink-900 px-6 py-3 font-semibold text-white">Download for Android</a>
          </div>
        </div>
      </section>
    </main>
  );
}
