import { useTranslations } from 'next-intl';

export function StatsBar() {
  const t = useTranslations();
  const STATS = [
    { value: '0%', label: t('stats.commissionFree') },
    { value: '0', label: t('stats.passengerFee') },
    { value: '9', label: t('stats.languages') },
    { value: '54+', label: t('stats.countries') },
  ];

  return (
    <section className="border-y border-ink-100 bg-ink-900 text-white">
      <div className="container-px mx-auto max-w-7xl py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-4xl font-extrabold text-brand-400 md:text-5xl">
                {s.value}
              </div>
              <div className="mt-2 text-sm text-ink-300">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
