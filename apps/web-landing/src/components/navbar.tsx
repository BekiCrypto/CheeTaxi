'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from './language-switcher';

export function Navbar() {
  const [open, setOpen] = useState(false);
  const t = useTranslations();

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

        <div className="hidden items-center gap-6 lg:flex">
          <Link href="/drivers" className="text-sm font-medium text-ink-600 hover:text-brand-600">{t('nav.drive')}</Link>
          <Link href="/corporate" className="text-sm font-medium text-ink-600 hover:text-brand-600">{t('nav.business')}</Link>
          <Link href="/fleet" className="text-sm font-medium text-ink-600 hover:text-brand-600">{t('nav.fleet')}</Link>
          <Link href="/developers" className="text-sm font-medium text-ink-600 hover:text-brand-600">{t('nav.developers')}</Link>
          <Link href="/help" className="text-sm font-medium text-ink-600 hover:text-brand-600">{t('nav.help')}</Link>
          <Link href="/status" className="text-sm font-medium text-ink-600 hover:text-brand-600">{t('nav.status')}</Link>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher />
          <Link
            href={`${process.env.NEXT_PUBLIC_ADMIN_URL ?? 'http://localhost:3001'}/login`}
            className="btn-ghost"
          >
            {t('nav.signIn')}
          </Link>
          <Link href="/drivers#download" className="btn-primary">
            {t('nav.getApp')}
          </Link>
        </div>

        <button
          aria-label="Toggle menu"
          className="rounded-lg p-2 lg:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </nav>

      {open && (
        <div className="border-t border-ink-100 bg-white lg:hidden">
          <div className="container-px mx-auto flex max-w-7xl flex-col gap-3 py-4">
            <Link href="/drivers" onClick={() => setOpen(false)} className="text-sm font-medium text-ink-700">{t('nav.drive')}</Link>
            <Link href="/corporate" onClick={() => setOpen(false)} className="text-sm font-medium text-ink-700">{t('nav.business')}</Link>
            <Link href="/fleet" onClick={() => setOpen(false)} className="text-sm font-medium text-ink-700">{t('nav.fleet')}</Link>
            <Link href="/developers" onClick={() => setOpen(false)} className="text-sm font-medium text-ink-700">{t('nav.developers')}</Link>
            <Link href="/help" onClick={() => setOpen(false)} className="text-sm font-medium text-ink-700">{t('nav.help')}</Link>
            <Link href="/status" onClick={() => setOpen(false)} className="text-sm font-medium text-ink-700">{t('nav.status')}</Link>
            <Link href="/blog" onClick={() => setOpen(false)} className="text-sm font-medium text-ink-700">Blog</Link>
            <Link href="/contact" onClick={() => setOpen(false)} className="text-sm font-medium text-ink-700">Contact</Link>
            <div className="mt-2"><LanguageSwitcher /></div>
            <Link href="/drivers#download" onClick={() => setOpen(false)} className="btn-primary mt-2">{t('nav.getApp')}</Link>
          </div>
        </div>
      )}
    </header>
  );
}
