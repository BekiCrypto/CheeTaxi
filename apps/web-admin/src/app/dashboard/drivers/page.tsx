'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function DriversPage() {
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState<'pending' | 'active'>('pending');

  useEffect(() => {
    if (tab === 'pending') {
      api('/drivers/pending?page=1&limit=50').then(setData).catch(() => setData({ items: [], total: 0 }));
    } else {
      api('/users?role=DRIVER&page=1&limit=50').then(setData).catch(() => setData({ items: [], total: 0 }));
    }
  }, [tab]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Drivers</h1>

      <div className="mt-4 flex gap-2 border-b border-ink-200">
        <button onClick={() => setTab('pending')} className={`px-4 py-2 text-sm font-semibold ${tab === 'pending' ? 'border-b-2 border-brand-500 text-brand-700' : 'text-ink-500'}`}>
          Pending approval
        </button>
        <button onClick={() => setTab('active')} className={`px-4 py-2 text-sm font-semibold ${tab === 'active' ? 'border-b-2 border-brand-500 text-brand-700' : 'text-ink-500'}`}>
          All drivers
        </button>
      </div>

      <div className="card mt-4 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Trips</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {(data?.items ?? []).map((d: any) => (
              <tr key={d.id} className="hover:bg-ink-50">
                <td className="px-4 py-3 font-semibold text-ink-900">
                  {d.user ? `${d.user.firstName} ${d.user.lastName}` : `${d.firstName} ${d.lastName}`}
                </td>
                <td className="px-4 py-3 text-ink-600">{d.user?.phone ?? d.phone}</td>
                <td className="px-4 py-3">
                  <span className="badge bg-amber-100 text-amber-700">{d.kycStatus ?? d.status}</span>
                </td>
                <td className="px-4 py-3 text-ink-600">{d.ratingAverage ?? '—'}</td>
                <td className="px-4 py-3 text-ink-600">{d.completedTrips ?? d.totalTrips ?? '—'}</td>
                <td className="px-4 py-3">
                  {tab === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => api(`/drivers/${d.id}/approve`, { method: 'PATCH' }).then(() => location.reload())} className="rounded bg-emerald-500 px-2 py-1 text-xs font-semibold text-white">Approve</button>
                      <button onClick={() => api(`/drivers/${d.id}/reject`, { method: 'PATCH', body: JSON.stringify({ reason: 'manual' }) }).then(() => location.reload())} className="rounded bg-red-500 px-2 py-1 text-xs font-semibold text-white">Reject</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {!data?.items?.length && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-400">No drivers in this view</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
