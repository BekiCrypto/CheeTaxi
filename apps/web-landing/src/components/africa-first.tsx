const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'am', name: 'Amharic', native: 'አማርኛ' },
  { code: 'om', name: 'Oromo', native: 'Afaan Oromoo' },
  { code: 'ti', name: 'Tigrinya', native: 'ትግርኛ' },
  { code: 'so', name: 'Somali', native: 'Soomaali' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'sw', name: 'Swahili', native: 'Kiswahili' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
];

const COUNTRIES = [
  '🇪🇹 Ethiopia', '🇰🇪 Kenya', '🇳🇬 Nigeria', '🇬🇭 Ghana',
  '🇿🇦 South Africa', '🇪🇬 Egypt', '🇲🇦 Morocco', '🇷🇼 Rwanda',
  '🇹🇿 Tanzania', '🇺🇬 Uganda', '🇸🇳 Senegal', '🇨🇮 Ivory Coast',
];

export function AfricaFirst() {
  return (
    <section className="py-20 md:py-28">
      <div className="container-px mx-auto max-w-7xl">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <span className="text-sm font-semibold uppercase tracking-wider text-brand-600">
              Africa-first
            </span>
            <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-ink-900 md:text-5xl">
              Built for the continent,
              <br />
              <span className="text-brand-500">in every language.</span>
            </h2>
            <p className="mt-6 text-lg text-ink-600">
              CheeTaxi launches in Ethiopia and scales across all 54 African countries — without
              architectural redesign. Every currency, every timezone, every tax rule, every
              regulation, supported from day one.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-3">
              {LANGUAGES.map((l) => (
                <div key={l.code} className="rounded-lg border border-ink-100 bg-white p-3 text-center">
                  <div className="font-display text-sm font-semibold text-ink-900">{l.native}</div>
                  <div className="text-xs text-ink-500">{l.name}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="card bg-gradient-to-br from-emerald-50 to-brand-50">
              <div className="font-display text-lg font-bold text-ink-900">
                Rolling out across Africa
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {COUNTRIES.map((c) => (
                  <div key={c} className="rounded-lg bg-white/70 px-3 py-2 text-sm text-ink-700">
                    {c}
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg bg-brand-500/10 px-4 py-3 text-sm text-brand-700">
                <strong>+42 more countries</strong> ready to launch on the same architecture.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
