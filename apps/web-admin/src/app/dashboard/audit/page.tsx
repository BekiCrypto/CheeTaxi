'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function AuditPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api('/audit?page=1&limit=100').then(setData).catch(() => setData({ items: [], total: 0 }));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Audit log</h1>
      <p className="mt-1 text-sm text-ink-500">Immutable record of every privileged action.</p>
      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
            <tr><th className="px-4 py-3">When</th><th className="px-4 py-3">Actor</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Resource</th><th className="px-4 py-3">IP</th></tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {(data?.items ?? []).map((l: any) => (
              <tr key={l.id} className="hover:bg-ink-50">
                <td className="px-4 py-3 text-ink-500">{new Date(l.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 font-semibold text-ink-900">{l.actor ? `${l.actor.firstName} ${l.actor.lastName}` : 'system'}</td>
                <td className="px-4 py-3"><span className="badge bg-ink-100 text-ink-700">{l.action}</span></td>
                <td className="px-4 py-3 text-ink-600">{l.resource}{l.resourceId ? `:${l.resourceId.slice(0, 8)}` : ''}</td>
                <td className="px-4 py-3 text-ink-500 font-mono text-xs">{l.ipAddress ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
