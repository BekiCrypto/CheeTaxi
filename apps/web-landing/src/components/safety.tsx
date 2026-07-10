const SAFETY = [
  {
    icon: '🆘',
    title: 'One-tap SOS',
    desc: 'A dedicated SOS button instantly alerts our 24/7 safety operations center with your live location, trip details, and driver info.',
  },
  {
    icon: '📍',
    title: 'Live trip sharing',
    desc: 'Share a link with loved ones so they can follow your trip in real time — no app installation required.',
  },
  {
    icon: '🆔',
    title: 'Verified drivers',
    desc: 'Every driver passes KYC, license verification, background checks, and vehicle inspection before their first trip.',
  },
  {
    icon: '🔒',
    title: 'Encrypted everywhere',
    desc: 'All data is encrypted in transit and at rest. We comply with OWASP Top 10, GDPR, and SOC2 readiness standards.',
  },
  {
    icon: '🛡️',
    title: 'Fraud detection',
    desc: 'Real-time anomaly detection flags suspicious behavior, payment fraud, and account takeovers before they affect you.',
  },
  {
    icon: '📞',
    title: '24/7 human support',
    desc: 'When something goes wrong, you reach a real person — not a chatbot — within 60 seconds, in your language.',
  },
];

export function Safety() {
  return (
    <section id="safety" className="bg-ink-900 py-20 text-white md:py-28">
      <div className="container-px mx-auto max-w-7xl">
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-brand-400">
            Safety, by design
          </span>
          <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight md:text-5xl">
            Your safety is not a feature.
            <br />
            <span className="text-brand-400">It is the foundation.</span>
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {SAFETY.map((s) => (
            <div
              key={s.title}
              className="rounded-2xl border border-ink-700 bg-ink-800 p-6 transition hover:border-brand-400 hover:bg-ink-700"
            >
              <div className="text-3xl">{s.icon}</div>
              <div className="mt-4 font-display text-lg font-bold">{s.title}</div>
              <div className="mt-2 text-sm text-ink-300">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
