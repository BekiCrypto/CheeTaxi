'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function CorporateDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use the platform stats endpoint — in production, this would be scoped to the fleet
    api('/stats/platform').then(setStats).catch(() => setStats(null)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-ink-400">Loading…</div>;

  const cards = [
    { label: 'Active drivers in fleet', value: stats?.today?.activeDrivers?.toLocaleString() ?? '—', delta: 'online now' },
    { label: 'Trips today', value: stats?.today?.trips?.toLocaleString() ?? '—', delta: `${stats?.deltas?.tripsWeekOverWeek ?? 0}% wow` },
    { label: 'Revenue today (Br)', value: stats?.today?.revenue?.toLocaleString() ?? '—', delta: `${stats?.deltas?.revenueWeekOverWeek ?? 0}% wow` },
    { label: 'Active subscriptions', value: stats?.totals?.activeSubscriptions?.toLocaleString() ?? '—', delta: 'paying drivers' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Fleet overview</h1>
      <p className="mt-1 text-sm text-ink-500">Snapshot of your fleet&apos;s performance.</p>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-ink-500">{c.label}</div>
            <div className="mt-2 text-3xl font-bold text-ink-900">{c.value}</div>
            <div className="mt-2 text-xs text-ink-500">{c.delta}</div>
          </div>
        ))}
      </div>
      <div className="mt-8 card p-6">
        <h2 className="font-bold text-ink-900">Recent fleet activity</h2>
        <p className="mt-2 text-sm text-ink-500">Recent trips and driver status changes appear here.</p>
      </div>
    </div>
  );
}
