import { Metadata } from 'next';
export const metadata: Metadata = { title: 'Corporate Transport', description: 'Centralized billing, employee trips, and fleet management for your business.' };

export default function CorporatePage() {
  return (
    <main>
      <section className="bg-gradient-to-b from-brand-50 to-white py-20">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h1 className="font-display text-5xl font-extrabold text-ink-900">CheeTaxi for Business</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-600">Centralized billing, employee trips, executive transport, and detailed analytics — all in one dashboard.</p>
          <div className="mt-8 flex justify-center gap-3">
            <a href="mailto:sales@cheetaxi.africa" className="rounded-full bg-brand-500 px-8 py-4 font-semibold text-white">Contact sales</a>
            <a href="#features" className="rounded-full border border-ink-200 bg-white px-8 py-4 font-semibold">See features</a>
          </div>
        </div>
      </section>

      <section id="features" className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: '🏢', title: 'Centralized billing', desc: 'One monthly invoice for all employee trips. No more expense reports.' },
              { icon: '👥', title: 'Employee management', desc: 'Add employees, set spending limits, restrict to specific routes or times.' },
              { icon: '📊', title: 'Detailed analytics', desc: 'Track spend by department, employee, route, or time period.' },
              { icon: '🛡️', title: 'Verified drivers', desc: 'Every driver is KYC-verified, background-checked, and rated.' },
              { icon: '⚡', title: 'Priority dispatch', desc: 'Corporate trips get priority in the dispatch queue.' },
              { icon: '🔗', title: 'API access', desc: 'Integrate with your HR, expense, or travel management systems.' },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-ink-100 p-6">
                <div className="text-3xl">{f.icon}</div>
                <div className="mt-3 font-display font-bold text-ink-900">{f.title}</div>
                <div className="mt-1 text-sm text-ink-500">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink-900 py-20 text-white">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-3xl font-extrabold">Custom plans for every scale</h2>
          <p className="mt-4 text-ink-300">From 5 employees to 5,000 — we have a plan that fits. Contact our sales team for a custom quote.</p>
          <a href="mailto:sales@cheetaxi.africa" className="mt-6 inline-block rounded-full bg-brand-500 px-8 py-4 font-semibold">Talk to sales</a>
        </div>
      </section>
    </main>
  );
}
