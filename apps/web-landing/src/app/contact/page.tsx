import { Metadata } from 'next';
export const metadata: Metadata = { title: 'Contact Us', description: 'Get in touch with CheeTaxi.' };

const CONTACTS = [
  { label: 'General inquiries', email: 'hello@cheetaxi.africa' },
  { label: 'Support', email: 'support@cheetaxi.africa' },
  { label: 'Driver onboarding', email: 'drivers@cheetaxi.africa' },
  { label: 'Corporate / Fleet sales', email: 'sales@cheetaxi.africa' },
  { label: 'Press & media', email: 'press@cheetaxi.africa' },
  { label: 'Privacy & legal', email: 'privacy@cheetaxi.africa' },
  { label: 'Security (PGP)', email: 'security@cheetaxi.africa' },
  { label: 'Developer relations', email: 'developers@cheetaxi.africa' },
];

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-4xl font-extrabold text-ink-900">Contact us</h1>
      <p className="mt-2 text-ink-600">We typically respond within 1 business day.</p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {CONTACTS.map((c) => (
          <div key={c.label} className="rounded-2xl border border-ink-100 p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-ink-500">{c.label}</div>
            <a href={`mailto:${c.email}`} className="mt-1 block font-semibold text-brand-600 hover:underline">{c.email}</a>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-2xl bg-ink-50 p-6">
        <h2 className="font-display text-xl font-bold text-ink-900">Office</h2>
        <p className="mt-2 text-ink-600">CheeTaxi Technologies<br />Bole, Addis Ababa<br />Ethiopia</p>
      </div>

      <div className="mt-6 rounded-2xl bg-ink-900 p-6 text-white">
        <h2 className="font-display text-xl font-bold">Emergency</h2>
        <p className="mt-2 text-ink-300">If you are in immediate danger during a trip, use the SOS button in the app. Our safety team responds 24/7 within 60 seconds.</p>
        <p className="mt-2 text-ink-300">For non-app emergencies: <a href="tel:+251900000000" className="text-brand-400 underline">+251 900 000 000</a></p>
      </div>
    </main>
  );
}
