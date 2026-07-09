const MODES = [
  { icon: '🚕', name: 'Taxi', desc: 'Standard metered rides, point-to-point.' },
  { icon: '🚗', name: 'Ride Sharing', desc: 'Carpool with passengers going your way.' },
  { icon: '🏍️', name: 'Motorcycle', desc: 'Beat traffic. Faster, cheaper, agile.' },
  { icon: '🛺', name: 'Three Wheeler', desc: 'Bajaj-friendly fares for short hops.' },
  { icon: '📦', name: 'Parcel', desc: 'Send documents and small packages.' },
  { icon: '🍔', name: 'Food Delivery', desc: 'Order from your favorite restaurants.' },
  { icon: '💊', name: 'Medical', desc: 'Pharmacy and urgent medical deliveries.' },
  { icon: '🚚', name: 'Truck', desc: 'Move furniture, appliances, equipment.' },
  { icon: '✈️', name: 'Airport', desc: 'Flat-rate rides to and from Bole.' },
  { icon: '🏢', name: 'Corporate', desc: 'Centralized billing for your team.' },
  { icon: '🏫', name: 'School', desc: 'Verified drivers, route tracking for parents.' },
  { icon: '🛣️', name: 'Intercity', desc: 'Pre-booked rides between Ethiopian cities.' },
];

export function TransportModes() {
  return (
    <section id="modes" className="py-20 md:py-28">
      <div className="container-px mx-auto max-w-7xl">
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-brand-600">
            One platform, every mode
          </span>
          <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-ink-900 md:text-5xl">
            However you move, CheeTaxi moves you.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-600">
            From your morning commute to intercity travel — from a coffee delivery to moving
            house — CheeTaxi handles it all in a single app.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {MODES.map((m) => (
            <div
              key={m.name}
              className="group rounded-2xl border border-ink-100 bg-white p-6 transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg"
            >
              <div className="text-4xl">{m.icon}</div>
              <div className="mt-4 font-display text-lg font-bold text-ink-900">{m.name}</div>
              <div className="mt-1 text-sm text-ink-500">{m.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
