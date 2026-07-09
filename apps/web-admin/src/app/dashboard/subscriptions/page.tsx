'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function SubscriptionsPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api('/subscriptions?page=1&limit=50').then(setData).catch(() => setData({ items: [], total: 0 }));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Subscriptions</h1>
      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
            <tr><th className="px-4 py-3">Plan</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Started</th><th className="px-4 py-3">Expires</th><th className="px-4 py-3">Amount</th></tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {(data?.items ?? []).map((s: any) => (
              <tr key={s.id} className="hover:bg-ink-50">
                <td className="px-4 py-3 font-semibold text-ink-900">{s.plan?.name ?? s.planId}</td>
                <td className="px-4 py-3 text-ink-600">{s.user ? `${s.user.firstName} ${s.user.lastName}` : '—'}</td>
                <td className="px-4 py-3"><span className={`badge ${s.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-ink-100 text-ink-600'}`}>{s.status}</span></td>
                <td className="px-4 py-3 text-ink-500">{s.startsAt ? new Date(s.startsAt).toLocaleDateString() : '—'}</td>
                <td className="px-4 py-3 text-ink-500">{s.endsAt ? new Date(s.endsAt).toLocaleDateString() : '—'}</td>
                <td className="px-4 py-3 font-semibold text-ink-900">{s.currency} {Number(s.amountPaid).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
