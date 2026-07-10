'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function FleetDriversPage() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/drivers/pending?page=1&limit=50').then((d: any) => setDrivers(d?.items ?? [])).catch(() => setDrivers([])).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink-900">Fleet drivers</h1>
        <button className="btn-primary">Add driver</button>
      </div>
      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
            <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Rating</th><th className="px-4 py-3">Trips</th></tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {drivers.map((d) => (
              <tr key={d.id} className="hover:bg-ink-50">
                <td className="px-4 py-3 font-semibold text-ink-900">{d.user ? `${d.user.firstName} ${d.user.lastName}` : '—'}</td>
                <td className="px-4 py-3 text-ink-600">{d.user?.phone ?? '—'}</td>
                <td className="px-4 py-3"><span className="badge bg-amber-100 text-amber-700">{d.kycStatus ?? '—'}</span></td>
                <td className="px-4 py-3 text-ink-600">{d.ratingAverage ?? '—'}</td>
                <td className="px-4 py-3 text-ink-600">{d.completedTrips ?? '—'}</td>
              </tr>
            ))}
            {!loading && drivers.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-400">No drivers in fleet yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
