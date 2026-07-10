'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'am', label: 'አማርኛ', flag: '🇪🇹' },
  { code: 'om', label: 'Afaan Oromoo', flag: '🇪🇹' },
  { code: 'ti', label: 'ትግርኛ', flag: '🇪🇷' },
  { code: 'so', label: 'Soomaali', flag: '🇸🇴' },
  { code: 'sw', label: 'Kiswahili', flag: '🇰🇪' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
];

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const current = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0]!;

  function switchTo(code: string) {
    setOpen(false);
    if (code === locale) return;
    // next-intl localePrefix: 'as-needed' — /en is hidden, /am and /fr visible
    const newPath = code === 'en' ? `/${pathname}` : `/${code}${pathname}`;
    router.push(newPath);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 hover:border-ink-300"
      >
        <span>{current.flag}</span>
        <span>{current.label}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-40 rounded-lg border border-ink-100 bg-white py-1 shadow-lg">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => switchTo(l.code)}
                className={`flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-ink-50 ${
                  l.code === locale ? 'font-semibold text-brand-700' : 'text-ink-700'
                }`}
              >
                <span>{l.flag}</span>
                <span>{l.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
