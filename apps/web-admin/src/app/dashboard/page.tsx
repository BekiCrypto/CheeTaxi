'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Lightweight: fetch counts in parallel
    Promise.allSettled([
      api('/users?limit=1'),
      api('/trips/me/passenger?limit=1').catch(() => null),
    ]).finally(() => setLoading(false));
    // For demo — real impl aggregates from /admin/stats endpoint
    setStats({
      activeDrivers: 1284,
      pendingDrivers: 47,
      tripsToday: 8421,
      revenueToday: 1_245_000,
      activeSosAlerts: 0,
      openTickets: 23,
      activeSubscriptions: 1106,
      totalUsers: 87_512,
    });
  }, []);

  if (loading || !stats) return <div className="text-ink-400">Loading…</div>;

  const cards = [
    { label: 'Active drivers', value: stats.activeDrivers.toLocaleString(), delta: '+12%', color: 'bg-emerald-50 text-emerald-700' },
    { label: 'Pending driver approvals', value: stats.pendingDrivers, delta: 'needs action', color: 'bg-amber-50 text-amber-700' },
    { label: 'Trips today', value: stats.tripsToday.toLocaleString(), delta: '+8%', color: 'bg-brand-50 text-brand-700' },
    { label: 'Revenue today (Br)', value: stats.revenueToday.toLocaleString(), delta: '+15%', color: 'bg-blue-50 text-blue-700' },
    { label: 'Active SOS alerts', value: stats.activeSosAlerts, delta: 'all clear', color: 'bg-emerald-50 text-emerald-700' },
    { label: 'Open support tickets', value: stats.openTickets, delta: '5 urgent', color: 'bg-red-50 text-red-700' },
    { label: 'Active subscriptions', value: stats.activeSubscriptions.toLocaleString(), delta: '+3%', color: 'bg-emerald-50 text-emerald-700' },
    { label: 'Total registered users', value: stats.totalUsers.toLocaleString(), delta: '+1.2k this week', color: 'bg-ink-100 text-ink-700' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Platform overview</h1>
      <p className="mt-1 text-sm text-ink-500">Real-time snapshot of CheeTaxi operations.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-ink-500">{c.label}</div>
            <div className="mt-2 text-3xl font-bold text-ink-900">{c.value}</div>
            <div className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${c.color}`}>
              {c.delta}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-bold text-ink-900">Recent trips</h2>
          <div className="mt-4 space-y-2 text-sm text-ink-600">
            {[
              { id: 'TR-8421', route: 'Bole → Piazza', fare: 'Br 145', status: 'completed' },
              { id: 'TR-8420', route: 'Merkato → CMC', fare: 'Br 230', status: 'completed' },
              { id: 'TR-8419', route: 'Airport → Sarbet', fare: 'Br 380', status: 'in_progress' },
              { id: 'TR-8418', route: 'Megenagna → 22', fare: 'Br 95', status: 'completed' },
            ].map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border border-ink-100 px-3 py-2">
                <div>
                  <div className="font-semibold text-ink-800">{t.id}</div>
                  <div className="text-xs text-ink-500">{t.route}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-ink-800">{t.fare}</div>
                  <div className={`text-xs ${t.status === 'completed' ? 'text-emerald-600' : 'text-brand-600'}`}>{t.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-bold text-ink-900">Driver onboarding queue</h2>
          <div className="mt-4 space-y-2 text-sm text-ink-600">
            {[
              { name: 'Abebe Tesfaye', stage: 'Background check', time: '2h ago' },
              { name: 'Sara Mohammed', stage: 'Vehicle inspection', time: '4h ago' },
              { name: 'Yonas Girma', stage: 'License verification', time: '6h ago' },
            ].map((d) => (
              <div key={d.name} className="flex items-center justify-between rounded-lg border border-ink-100 px-3 py-2">
                <div>
                  <div className="font-semibold text-ink-800">{d.name}</div>
                  <div className="text-xs text-ink-500">{d.stage}</div>
                </div>
                <div className="text-xs text-ink-400">{d.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
