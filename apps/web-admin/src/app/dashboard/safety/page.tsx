'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function SafetyPage() {
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    api('/sos/active').then(setAlerts).catch(() => setAlerts([]));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Safety &amp; SOS</h1>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-5"><div className="text-xs uppercase text-ink-500">Active alerts</div><div className="mt-2 text-3xl font-bold text-red-600">{alerts.length}</div></div>
        <div className="card p-5"><div className="text-xs uppercase text-ink-500">Avg response time</div><div className="mt-2 text-3xl font-bold text-ink-900">47s</div></div>
        <div className="card p-5"><div className="text-xs uppercase text-ink-500">Resolved this week</div><div className="mt-2 text-3xl font-bold text-ink-900">12</div></div>
      </div>

      <div className="card mt-6 p-6">
        <h2 className="font-bold text-ink-900">Active SOS alerts</h2>
        {alerts.length === 0 ? (
          <p className="mt-4 text-sm text-emerald-600">✓ No active SOS alerts. All clear.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {alerts.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <div>
                  <div className="font-semibold text-red-900">{a.user?.firstName} {a.user?.lastName}</div>
                  <div className="text-xs text-red-700">📍 {a.latitude}, {a.longitude} · {a.reason ?? 'No reason given'}</div>
                </div>
                <div className="text-xs text-red-600">{new Date(a.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
