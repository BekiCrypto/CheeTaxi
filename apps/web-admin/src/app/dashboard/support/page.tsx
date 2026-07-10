'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function SupportPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api('/support/tickets?page=1&limit=50').then(setData).catch(() => setData({ items: [], total: 0 }));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Support tickets</h1>
      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
            <tr><th className="px-4 py-3">Subject</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Priority</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Reporter</th><th className="px-4 py-3">Created</th></tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {(data?.items ?? []).map((t: any) => (
              <tr key={t.id} className="hover:bg-ink-50">
                <td className="px-4 py-3 font-semibold text-ink-900">{t.subject}</td>
                <td className="px-4 py-3 text-ink-600">{t.category}</td>
                <td className="px-4 py-3"><span className={`badge ${t.priority === 'URGENT' || t.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-ink-100 text-ink-600'}`}>{t.priority}</span></td>
                <td className="px-4 py-3"><span className="badge bg-amber-100 text-amber-700">{t.status}</span></td>
                <td className="px-4 py-3 text-ink-600">{t.reporter ? `${t.reporter.firstName} ${t.reporter.lastName}` : '—'}</td>
                <td className="px-4 py-3 text-ink-500">{new Date(t.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
