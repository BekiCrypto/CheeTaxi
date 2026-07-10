import Link from 'next/link';
import { useTranslations } from 'next-intl';

export function Hero() {
  const t = useTranslations();

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-brand-200/40 blur-3xl animate-pulse-slow" />
        <div className="absolute top-40 -left-24 h-72 w-72 rounded-full bg-amber-100/50 blur-3xl animate-pulse-slow" />
      </div>

      <div className="container-px mx-auto relative max-w-7xl py-20 md:py-32">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="animate-fade-in-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
              </span>
              {t('hero.badge')}
            </span>

            <h1 className="mt-6 font-display text-5xl font-extrabold leading-tight tracking-tight text-ink-900 md:text-6xl lg:text-7xl">
              {t('hero.title').split(',')[0]},
              <br />
              <span className="text-brand-500">{t('hero.title').split(',')[1] ?? 'reimagined.'}</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg text-ink-600">
              {t('hero.subtitle')}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="#download" className="btn-primary">
                {t('hero.download')}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </Link>
              <Link href="#drivers" className="btn-ghost">
                {t('hero.driveWith')}
              </Link>
            </div>

            <div className="mt-10 flex items-center gap-6 text-sm text-ink-500">
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 13l4 4L19 7" />
                </svg>
                {t('hero.noCommission')}
              </div>
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 13l4 4L19 7" />
                </svg>
                {t('hero.safety247')}
              </div>
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 13l4 4L19 7" />
                </svg>
                {t('hero.languages')}
              </div>
            </div>
          </div>

          {/* Phone mockup */}
          <div className="relative hidden md:block">
            <div className="relative mx-auto aspect-[9/19] w-72 animate-fade-in rounded-[2.5rem] border-8 border-ink-900 bg-ink-900 shadow-2xl">
              <div className="absolute left-1/2 top-2 h-6 w-32 -translate-x-1/2 rounded-full bg-ink-900" />
              <div className="flex h-full flex-col overflow-hidden rounded-[2rem] bg-white">
                {/* Map */}
                <div className="relative flex-1 bg-gradient-to-br from-emerald-50 to-brand-50">
                  <svg className="absolute inset-0 h-full w-full" viewBox="0 0 200 350" preserveAspectRatio="none">
                    <path d="M 20 50 Q 60 80 80 140 T 160 280" stroke="#94a3b8" strokeWidth="2" fill="none" strokeDasharray="4 4" />
                    <path d="M 0 200 L 200 230" stroke="#cbd5e1" strokeWidth="3" />
                    <circle cx="80" cy="140" r="6" fill="#F08C00" />
                    <circle cx="160" cy="280" r="6" fill="#0E1012" />
                  </svg>
                  <div className="absolute left-4 right-4 top-4 rounded-xl bg-white p-3 shadow-md">
                    <div className="text-xs text-ink-500">Arriving in</div>
                    <div className="font-display text-2xl font-bold text-ink-900">3 min</div>
                  </div>
                </div>
                {/* Driver card */}
                <div className="bg-white p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-bold">
                      AT
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-ink-900">Abebe T.</div>
                      <div className="text-xs text-ink-500">★ 4.95 · Toyota Corolla</div>
                    </div>
                    <div className="rounded-lg bg-ink-100 px-2 py-1 text-xs font-bold text-ink-800">
                      AA 12345
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button className="flex-1 rounded-lg bg-brand-500 py-2 text-xs font-semibold text-white">
                      Call
                    </button>
                    <button className="flex-1 rounded-lg bg-ink-100 py-2 text-xs font-semibold text-ink-800">
                      Message
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
