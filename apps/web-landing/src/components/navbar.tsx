'use client';

import Link from 'next/link';
import { useState } from 'react';

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-ink-100 bg-white/80 backdrop-blur-lg">
      <nav className="container-px mx-auto flex h-16 max-w-7xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white font-display text-lg font-bold">
            C
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-ink-900">
            CheeTaxi
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link href="#drivers" className="text-sm font-medium text-ink-600 hover:text-brand-600">
            For Drivers
          </Link>
          <Link href="#passengers" className="text-sm font-medium text-ink-600 hover:text-brand-600">
            For Passengers
          </Link>
          <Link href="#plans" className="text-sm font-medium text-ink-600 hover:text-brand-600">
            Pricing
          </Link>
          <Link href="#modes" className="text-sm font-medium text-ink-600 hover:text-brand-600">
            Services
          </Link>
          <Link href="#safety" className="text-sm font-medium text-ink-600 hover:text-brand-600">
            Safety
          </Link>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href={`${process.env.NEXT_PUBLIC_ADMIN_URL ?? 'http://localhost:3001'}/login`}
            className="btn-ghost"
          >
            Sign in
          </Link>
          <Link href="#download" className="btn-primary">
            Get the app
          </Link>
        </div>

        <button
          aria-label="Toggle menu"
          className="rounded-lg p-2 md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </nav>

      {open && (
        <div className="border-t border-ink-100 bg-white md:hidden">
          <div className="container-px mx-auto flex max-w-7xl flex-col gap-3 py-4">
            <Link href="#drivers" onClick={() => setOpen(false)} className="text-sm font-medium text-ink-700">
              For Drivers
            </Link>
            <Link href="#passengers" onClick={() => setOpen(false)} className="text-sm font-medium text-ink-700">
              For Passengers
            </Link>
            <Link href="#plans" onClick={() => setOpen(false)} className="text-sm font-medium text-ink-700">
              Pricing
            </Link>
            <Link href="#modes" onClick={() => setOpen(false)} className="text-sm font-medium text-ink-700">
              Services
            </Link>
            <Link href="#safety" onClick={() => setOpen(false)} className="text-sm font-medium text-ink-700">
              Safety
            </Link>
            <Link href="#download" onClick={() => setOpen(false)} className="btn-primary mt-2">
              Get the app
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
