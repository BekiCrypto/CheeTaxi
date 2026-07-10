import { Metadata } from 'next';
export const metadata: Metadata = { title: 'System Status', description: 'Real-time status of CheeTaxi services.' };

const SERVICES = [
  { name: 'API', status: 'operational', description: 'REST API at api.cheetaxi.africa' },
  { name: 'Passenger App', status: 'operational', description: 'iOS + Android' },
  { name: 'Driver App', status: 'operational', description: 'iOS + Android' },
  { name: 'Admin Dashboard', status: 'operational', description: 'admin.cheetaxi.africa' },
  { name: 'Dispatcher Console', status: 'operational', description: 'dispatch.cheetaxi.africa' },
  { name: 'Payments — Stripe', status: 'operational', description: 'International cards' },
  { name: 'Payments — Chapa', status: 'operational', description: 'Ethiopia' },
  { name: 'Payments — Telebirr', status: 'operational', description: 'Ethiopia Telecom' },
  { name: 'Push Notifications', status: 'operational', description: 'Firebase Cloud Messaging' },
  { name: 'SMS — OTP', status: 'operational', description: 'Twilio / Africa\'s Talking' },
  { name: 'Maps — Google', status: 'operational', description: 'Primary map provider' },
  { name: 'Maps — OSM Nominatim', status: 'operational', description: 'Geocoding fallback' },
];

const INCIDENTS = [
  { date: '2026-07-10', title: 'No incidents in the last 90 days', severity: 'none', description: 'All systems have been operational.' },
];

export default function StatusPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="flex items-center gap-3">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
        </span>
        <h1 className="font-display text-3xl font-extrabold text-ink-900">All Systems Operational</h1>
      </div>
      <p className="mt-2 text-ink-500">Last updated: just now · Auto-refreshes every 60 seconds</p>

      <div className="mt-8 space-y-3">
        {SERVICES.map((s) => (
          <div key={s.name} className="flex items-center justify-between rounded-xl border border-ink-100 px-5 py-4">
            <div>
              <div className="font-semibold text-ink-900">{s.name}</div>
              <div className="text-xs text-ink-500">{s.description}</div>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Operational
            </span>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <h2 className="font-display text-2xl font-bold text-ink-900">Incident history (90 days)</h2>
        <div className="mt-4 space-y-3">
          {INCIDENTS.map((i) => (
            <div key={i.date} className="rounded-xl border border-ink-100 p-5">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-ink-900">{i.title}</div>
                <div className="text-xs text-ink-500">{i.date}</div>
              </div>
              <p className="mt-2 text-sm text-ink-600">{i.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 rounded-2xl bg-ink-50 p-6 text-center text-sm text-ink-500">
        Subscribe to status updates at <a href="mailto:status@cheetaxi.africa" className="text-brand-600 underline">status@cheetaxi.africa</a>
      </div>
    </main>
  );
}
