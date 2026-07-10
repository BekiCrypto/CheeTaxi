'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recentTrips, setRecentTrips] = useState<any[]>([]);
  const [pendingDrivers, setPendingDrivers] = useState<any[]>([]);

  useEffect(() => {
    Promise.allSettled([
      api('/stats/platform'),
      api('/trips/me/passenger?page=1&limit=5').catch(() => ({ items: [] as any[] })),
      api('/drivers/pending?page=1&limit=5').catch(() => ({ items: [] as any[] })),
    ])
      .then(([statsRes, tripsRes, driversRes]) => {
        if (statsRes.status === 'fulfilled') setStats(statsRes.value);
        if (tripsRes.status === 'fulfilled') setRecentTrips((tripsRes.value as any)?.items ?? []);
        if (driversRes.status === 'fulfilled') setPendingDrivers((driversRes.value as any)?.items ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) return <div className="text-ink-400">Loading…</div>;

  const t = stats.today;
  const d = stats.deltas;

  const cards = [
    { label: 'Active drivers now', value: t.activeDrivers.toLocaleString(), delta: 'online', color: 'bg-emerald-50 text-emerald-700' },
    { label: 'Pending driver approvals', value: t.pendingDrivers, delta: t.pendingDrivers > 0 ? 'needs action' : 'all clear', color: 'bg-amber-50 text-amber-700' },
    { label: 'Trips today', value: t.trips.toLocaleString(), delta: `${d.tripsWeekOverWeek > 0 ? '+' : ''}${d.tripsWeekOverWeek}% wow`, color: 'bg-brand-50 text-brand-700' },
    { label: 'Revenue today (Br)', value: t.revenue.toLocaleString(), delta: `${d.revenueWeekOverWeek > 0 ? '+' : ''}${d.revenueWeekOverWeek}% wow`, color: 'bg-blue-50 text-blue-700' },
    { label: 'Active SOS alerts', value: t.activeSosAlerts, delta: t.activeSosAlerts === 0 ? 'all clear' : 'URGENT', color: t.activeSosAlerts === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700' },
    { label: 'Open support tickets', value: t.openSupportTickets, delta: t.openSupportTickets > 5 ? 'backlog' : 'manageable', color: 'bg-amber-50 text-amber-700' },
    { label: 'Active subscriptions', value: stats.totals.activeSubscriptions.toLocaleString(), delta: 'paying drivers', color: 'bg-emerald-50 text-emerald-700' },
    { label: 'Total registered users', value: stats.totals.users.toLocaleString(), delta: `${stats.totals.drivers} drivers`, color: 'bg-ink-100 text-ink-700' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Platform overview</h1>
      <p className="mt-1 text-sm text-ink-500">
        Real-time snapshot of CheeTaxi operations · updated {new Date(stats.timestamp).toLocaleTimeString()}
      </p>

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
          <h2 className="font-bold text-ink-900">Recent activity</h2>
          {recentTrips.length === 0 ? (
            <p className="mt-4 text-sm text-ink-400">No recent trips to display.</p>
          ) : (
            <div className="mt-4 space-y-2 text-sm text-ink-600">
              {recentTrips.map((trip) => (
                <div key={trip.id} className="flex items-center justify-between rounded-lg border border-ink-100 px-3 py-2">
                  <div>
                    <div className="font-mono text-xs font-semibold text-ink-800">{trip.publicId ?? trip.id}</div>
                    <div className="text-xs text-ink-500">{trip.pickupAddress} → {trip.dropoffAddress}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-ink-800">{trip.currency} {trip.totalFare}</div>
                    <div className={`text-xs ${trip.status === 'COMPLETED' ? 'text-emerald-600' : 'text-brand-600'}`}>{trip.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6">
          <h2 className="font-bold text-ink-900">Driver onboarding queue</h2>
          {pendingDrivers.length === 0 ? (
            <p className="mt-4 text-sm text-emerald-600">✓ No drivers pending approval.</p>
          ) : (
            <div className="mt-4 space-y-2 text-sm text-ink-600">
              {pendingDrivers.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-lg border border-ink-100 px-3 py-2">
                  <div>
                    <div className="font-semibold text-ink-800">{d.user ? `${d.user.firstName} ${d.user.lastName}` : 'Unknown'}</div>
                    <div className="text-xs text-ink-500">{d.kycStatus}</div>
                  </div>
                  <div className="text-xs text-ink-400">{new Date(d.createdAt).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
