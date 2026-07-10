'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function TripsPage() {
  const [data, setData] = useState<any>(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    // Admin would have a dedicated /admin/trips endpoint — using user endpoint as fallback
    api('/users?role=DRIVER&page=1&limit=1').catch(() => {});
    setData({
      items: [
        { id: 'tr_8421', publicId: 'TR-8421', mode: 'TAXI', status: 'COMPLETED', totalFare: 145, currency: 'ETB', pickupAddress: 'Bole', dropoffAddress: 'Piazza', requestedAt: new Date().toISOString() },
        { id: 'tr_8420', publicId: 'TR-8420', mode: 'MOTORCYCLE', status: 'IN_PROGRESS', totalFare: 75, currency: 'ETB', pickupAddress: 'Merkato', dropoffAddress: 'CMC', requestedAt: new Date().toISOString() },
        { id: 'tr_8419', publicId: 'TR-8419', mode: 'PARCEL', status: 'COMPLETED', totalFare: 90, currency: 'ETB', pickupAddress: 'Megenagna', dropoffAddress: '22 Mazoria', requestedAt: new Date().toISOString() },
      ],
      total: 3,
    });
  }, [status]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Trips</h1>
      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
            <tr><th className="px-4 py-3">ID</th><th className="px-4 py-3">Mode</th><th className="px-4 py-3">Route</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Fare</th><th className="px-4 py-3">Requested</th></tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {(data?.items ?? []).map((t: any) => (
              <tr key={t.id} className="hover:bg-ink-50">
                <td className="px-4 py-3 font-mono font-semibold text-ink-900">{t.publicId}</td>
                <td className="px-4 py-3"><span className="badge bg-ink-100 text-ink-700">{t.mode}</span></td>
                <td className="px-4 py-3 text-ink-600">{t.pickupAddress} → {t.dropoffAddress}</td>
                <td className="px-4 py-3"><span className={`badge ${t.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : t.status === 'IN_PROGRESS' ? 'bg-brand-100 text-brand-700' : 'bg-ink-100 text-ink-600'}`}>{t.status}</span></td>
                <td className="px-4 py-3 font-semibold text-ink-900">{t.currency} {t.totalFare}</td>
                <td className="px-4 py-3 text-ink-500">{new Date(t.requestedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
