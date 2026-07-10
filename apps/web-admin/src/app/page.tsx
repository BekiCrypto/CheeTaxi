'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getTokens } from '@/lib/api';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace(getTokens() ? '/dashboard' : '/login');
  }, [router]);
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-pulse text-ink-400">Loading…</div>
    </div>
  );
}
