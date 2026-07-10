'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getTokens, clearTokens, api } from '@/lib/api';

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: '📊' },
  { href: '/dashboard/drivers', label: 'Drivers', icon: '🚗' },
  { href: '/dashboard/vehicles', label: 'Vehicles', icon: '🚙' },
  { href: '/dashboard/billing', label: 'Billing', icon: '💳' },
  { href: '/dashboard/reports', label: 'Reports', icon: '📈' },
  { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getTokens()) { router.replace('/login'); return; }
    api('/auth/me').then(setUser).catch(() => router.replace('/login')).finally(() => setLoading(false));
  }, [router]);

  if (loading || !user) return <div className="flex h-screen items-center justify-center text-ink-400">Loading…</div>;

  return (
    <div className="flex h-screen bg-ink-50">
      <aside className="hidden w-64 flex-col border-r border-ink-200 bg-white md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-ink-100 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white font-bold">C</div>
          <div>
            <div className="font-bold text-ink-900 leading-tight">CheeTaxi</div>
            <div className="text-[10px] uppercase tracking-wider text-brand-600">Corporate</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${active ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50'}`}>
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-ink-100 p-3">
          <div className="mb-2 px-3 text-xs text-ink-500 truncate">{user.phone}</div>
          <button onClick={() => { clearTokens(); router.replace('/login'); }} className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-ink-600 hover:bg-red-50 hover:text-red-700">Sign out</button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
    </div>
  );
}
