import { Metadata } from 'next';
export const metadata: Metadata = { title: 'Fleet Portal', description: 'Manage your fleet on CheeTaxi — corporate, government, and partner fleets.' };

export default function FleetPage() {
  return (
    <main>
      <section className="bg-gradient-to-b from-brand-50 to-white py-20">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h1 className="font-display text-5xl font-extrabold text-ink-900">CheeTaxi Fleet Portal</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-600">Manage your fleet — corporate, government, or partner — with one unified dashboard.</p>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: '🚗', title: 'Add & manage drivers', desc: 'Onboard drivers to your fleet, assign vehicles, set schedules.' },
              { icon: '💳', title: 'Fleet subscriptions', desc: 'One subscription covers up to 50 drivers. No per-driver commission.' },
              { icon: '📈', title: 'Performance analytics', desc: 'Track trips, earnings, ratings, and utilization per driver and vehicle.' },
              { icon: '🗺️', title: 'Live fleet tracking', desc: 'See all your vehicles on one map in real time.' },
              { icon: '🔧', title: 'Maintenance scheduling', desc: 'Track vehicle service intervals and inspections.' },
              { icon: '🔐', title: 'Role-based access', desc: 'Fleet managers, regional managers, drivers — each with the right access.' },
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

      <section className="bg-ink-900 py-20 text-white text-center">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="font-display text-3xl font-extrabold">Built for fleets of every size</h2>
          <p className="mt-4 text-ink-300">Corporate fleets. Government transport. Partner taxi companies. We support them all.</p>
          <a href="mailto:fleets@cheetaxi.africa" className="mt-6 inline-block rounded-full bg-brand-500 px-8 py-4 font-semibold">Contact fleet team</a>
        </div>
      </section>
    </main>
  );
}
