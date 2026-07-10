import { Metadata } from 'next';
export const metadata: Metadata = { title: 'Cookie Policy', description: 'How CheeTaxi uses cookies.' };

export default function CookiesPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-4xl font-extrabold text-ink-900">Cookie Policy</h1>
      <p className="mt-2 text-sm text-ink-500">Last updated: 2026-07-10</p>
      <div className="mt-8 space-y-4 text-ink-700">
        <p>CheeTaxi uses cookies and similar technologies to operate, secure, and improve our Service. This policy explains what we use and why.</p>
        <section>
          <h2 className="font-display text-xl font-bold text-ink-900">Essential cookies</h2>
          <p className="mt-1">Required for the Service to function — authentication, session management, security. Cannot be disabled.</p>
        </section>
        <section>
          <h2 className="font-display text-xl font-bold text-ink-900">Analytics cookies</h2>
          <p className="mt-1">Help us understand how the Service is used — page views, feature usage, crash reports. Opt out in settings.</p>
        </section>
        <section>
          <h2 className="font-display text-xl font-bold text-ink-900">Marketing cookies</h2>
          <p className="mt-1">Used to measure the effectiveness of advertising campaigns. Opt out in settings or via your browser&apos;s Do Not Track signal.</p>
        </section>
        <section>
          <h2 className="font-display text-xl font-bold text-ink-900">Managing cookies</h2>
          <p className="mt-1">Most browsers let you control cookies in Settings. Disabling essential cookies will prevent the Service from working.</p>
        </section>
        <section>
          <h2 className="font-display text-xl font-bold text-ink-900">Contact</h2>
          <p className="mt-1">Email: <a href="mailto:privacy@cheetaxi.africa" className="text-brand-600 underline">privacy@cheetaxi.africa</a></p>
        </section>
      </div>
    </main>
  );
}
