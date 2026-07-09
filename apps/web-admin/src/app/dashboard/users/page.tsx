'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function UsersPage() {
  const [data, setData] = useState<any>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = search ? `&search=${encodeURIComponent(search)}` : '';
    api(`/users?page=1&limit=50${q}`).then(setData).catch(() => setData({ items: [], total: 0 }));
  }, [search]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Users</h1>
      <input className="input mt-4 max-w-md" placeholder="Search by name, phone, email…" value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
            <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Joined</th></tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {(data?.items ?? []).map((u: any) => (
              <tr key={u.id} className="hover:bg-ink-50">
                <td className="px-4 py-3 font-semibold text-ink-900">{u.firstName} {u.lastName}</td>
                <td className="px-4 py-3 text-ink-600">{u.phone}</td>
                <td className="px-4 py-3 text-ink-600">{u.email ?? '—'}</td>
                <td className="px-4 py-3"><span className="badge bg-brand-100 text-brand-700">{u.role}</span></td>
                <td className="px-4 py-3"><span className={`badge ${u.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-ink-100 text-ink-600'}`}>{u.status}</span></td>
                <td className="px-4 py-3 text-ink-500">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
