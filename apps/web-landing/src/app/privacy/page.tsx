import { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How CheeTaxi collects, uses, and protects your personal data.',
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-4xl font-extrabold text-ink-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-ink-500">Last updated: 2026-07-10</p>

      <div className="mt-8 max-w-none space-y-6 text-ink-700">
        <section>
          <h2 className="font-display text-2xl font-bold text-ink-900">1. Introduction</h2>
          <p className="mt-2">
            CheeTaxi Technologies (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) operates the CheeTaxi mobility platform
            (the &quot;Service&quot;). This Privacy Policy explains how we collect, use, disclose, and
            safeguard your information when you use our mobile applications, websites, and APIs.
          </p>
          <p className="mt-2">
            We are committed to protecting your privacy and complying with the EU General Data
            Protection Regulation (GDPR), the Ethiopian Data Protection Proclamation, and other
            applicable data protection laws.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-ink-900">2. Information We Collect</h2>
          <h3 className="mt-4 font-semibold text-ink-800">2.1 Information you provide</h3>
          <ul className="ml-6 list-disc mt-2">
            <li>Phone number (required for authentication)</li>
            <li>Email address (optional)</li>
            <li>First and last name</li>
            <li>Profile photo (optional)</li>
            <li>Saved places (home, work, etc.)</li>
            <li>Payment method details (processed by Stripe, Chapa, or Telebirr — we never store card numbers)</li>
            <li>For drivers: license number, vehicle registration, insurance details, background check consent</li>
          </ul>

          <h3 className="mt-4 font-semibold text-ink-800">2.2 Information collected automatically</h3>
          <ul className="ml-6 list-disc mt-2">
            <li>Device location (during trip requests and active trips)</li>
            <li>Device identifiers (model, OS version, app version)</li>
            <li>IP address and approximate location</li>
            <li>Usage data (trips requested, features used, app crashes)</li>
            <li>For drivers: real-time location while online (every 5 seconds)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-ink-900">3. How We Use Your Information</h2>
          <ul className="ml-6 list-disc mt-2">
            <li>To provide the Service — authentication, trip matching, payments, support</li>
            <li>To improve the Service — analytics, fraud detection, performance optimization</li>
            <li>To communicate with you — trip updates, marketing (opt-out available)</li>
            <li>To comply with legal obligations — tax reporting, regulator requests, law enforcement</li>
            <li>To ensure safety — SOS alerts, trip sharing, audit logs</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-ink-900">4. Legal Basis for Processing (GDPR)</h2>
          <ul className="ml-6 list-disc mt-2">
            <li><strong>Contract</strong> — to provide the Service you requested</li>
            <li><strong>Legal obligation</strong> — tax reporting, regulator compliance</li>
            <li><strong>Vital interests</strong> — SOS alerts, safety investigations</li>
            <li><strong>Legitimate interests</strong> — fraud detection, service improvement</li>
            <li><strong>Consent</strong> — marketing communications, optional features</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-ink-900">5. Data Sharing</h2>
          <p className="mt-2">We share your information only with:</p>
          <ul className="ml-6 list-disc mt-2">
            <li><strong>Service providers</strong> — Stripe (payments), Twilio (SMS), Firebase (push), AWS (hosting), Google Maps (location)</li>
            <li><strong>Drivers / passengers</strong> — minimal info needed for trip matching (first name, rating, vehicle plate during active trip)</li>
            <li><strong>Law enforcement</strong> — when compelled by valid legal process</li>
            <li><strong>Regulators</strong> — when required by transport or tax authorities</li>
            <li><strong>Corporate clients</strong> — if you use a corporate account, your employer sees trip dates and costs (not locations)</li>
          </ul>
          <p className="mt-2">We never sell your data to third parties.</p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-ink-900">6. Data Retention</h2>
          <ul className="ml-6 list-disc mt-2">
            <li>Trip records: 7 years (tax compliance)</li>
            <li>Payment records: 7 years (tax compliance)</li>
            <li>Audit logs: 7 years (security compliance)</li>
            <li>Account data: 30 days after deletion request (then permanently erased)</li>
            <li>Driver documents: until driver leaves + 90 days</li>
            <li>CCTV / dashcam footage: 30 days</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-ink-900">7. Your Rights (GDPR)</h2>
          <ul className="ml-6 list-disc mt-2">
            <li><strong>Access</strong> — request a copy of your data (via app settings or email)</li>
            <li><strong>Portability</strong> — receive your data in JSON format</li>
            <li><strong>Rectification</strong> — correct inaccurate data</li>
            <li><strong>Erasure</strong> — request deletion (&quot;right to be forgotten&quot;)</li>
            <li><strong>Objection</strong> — opt out of marketing</li>
            <li><strong>Restriction</strong> — limit processing during disputes</li>
            <li><strong>Complaint</strong> — lodge a complaint with your local data protection authority</li>
          </ul>
          <p className="mt-2">To exercise any right, email <a href="mailto:privacy@cheetaxi.africa" className="text-brand-600 underline">privacy@cheetaxi.africa</a>. We respond within 30 days.</p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-ink-900">8. Security</h2>
          <p className="mt-2">
            We use industry-standard security measures: TLS 1.3 encryption in transit, AES-256
            encryption at rest, bcrypt password hashing, JWT-based authentication, role-based
            access control, audit logging, and regular security reviews.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-ink-900">9. International Transfers</h2>
          <p className="mt-2">
            Your data may be processed in countries other than your own (e.g. AWS data centers in
            Germany, USA). We ensure appropriate safeguards are in place, including Standard
            Contractual Clauses with all sub-processors.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-ink-900">10. Children&apos;s Privacy</h2>
          <p className="mt-2">
            The Service is not directed to children under 18. We do not knowingly collect personal
            information from children. If you believe we have collected data from a child, please
            contact us immediately.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-ink-900">11. Changes to This Policy</h2>
          <p className="mt-2">
            We may update this Privacy Policy from time to time. We will notify you of material
            changes via the app or email at least 30 days before they take effect.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-ink-900">12. Contact</h2>
          <p className="mt-2">
            CheeTaxi Technologies<br />
            Email: <a href="mailto:privacy@cheetaxi.africa" className="text-brand-600 underline">privacy@cheetaxi.africa</a><br />
            Data Protection Officer: <a href="mailto:dpo@cheetaxi.africa" className="text-brand-600 underline">dpo@cheetaxi.africa</a>
          </p>
        </section>
      </div>
    </main>
  );
}
