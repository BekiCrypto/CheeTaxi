import { Metadata } from 'next';
export const metadata: Metadata = { title: 'Terms of Service', description: 'The terms governing your use of CheeTaxi.' };

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-4xl font-extrabold text-ink-900">Terms of Service</h1>
      <p className="mt-2 text-sm text-ink-500">Last updated: 2026-07-10</p>

      <div className="mt-8 space-y-6 text-ink-700">
        <section>
          <h2 className="font-display text-2xl font-bold text-ink-900">1. Acceptance of Terms</h2>
          <p className="mt-2">By using CheeTaxi, you agree to these Terms of Service. If you do not agree, do not use the Service.</p>
        </section>
        <section>
          <h2 className="font-display text-2xl font-bold text-ink-900">2. Eligibility</h2>
          <p className="mt-2">You must be at least 18 years old to use the Service. Drivers must hold a valid driver&apos;s license and meet all regulatory requirements in their country.</p>
        </section>
        <section>
          <h2 className="font-display text-2xl font-bold text-ink-900">3. Passenger Terms</h2>
          <ul className="ml-6 list-disc mt-2">
            <li>Passengers ride free of platform charges. You pay only the trip fare.</li>
            <li>You agree to provide accurate pickup and dropoff locations.</li>
            <li>You agree to be ready at the pickup location within 5 minutes of driver arrival.</li>
            <li>You may be charged a cancellation fee for late cancellations.</li>
            <li>You agree to treat drivers with respect. Abusive behavior results in account termination.</li>
          </ul>
        </section>
        <section>
          <h2 className="font-display text-2xl font-bold text-ink-900">4. Driver Terms</h2>
          <ul className="ml-6 list-disc mt-2">
            <li>Drivers pay a subscription (daily, weekly, monthly, etc.) to use the platform.</li>
            <li>Drivers keep 100% of every fare — no commission deducted.</li>
            <li>Drivers must complete KYC, license verification, and background check before accepting trips.</li>
            <li>Drivers must maintain valid insurance and vehicle registration.</li>
            <li>Drivers must maintain a rating of 4.5 or above. Lower ratings may result in suspension.</li>
            <li>Drivers must not refuse trips based on discrimination.</li>
          </ul>
        </section>
        <section>
          <h2 className="font-display text-2xl font-bold text-ink-900">5. Payments</h2>
          <p className="mt-2">Passengers pay via cash, wallet, card, or corporate account. Drivers receive earnings in their CheeTaxi wallet and may withdraw to bank or mobile money. Withdrawal processing time: up to 1 hour during business hours.</p>
        </section>
        <section>
          <h2 className="font-display text-2xl font-bold text-ink-900">6. Cancellations and Refunds</h2>
          <p className="mt-2">Passengers may cancel free of charge before the driver arrives. Late cancellations may incur a fee. Refunds for service issues are processed within 48 hours.</p>
        </section>
        <section>
          <h2 className="font-display text-2xl font-bold text-ink-900">7. Safety</h2>
          <p className="mt-2">Use the in-app SOS button in emergencies. Our safety team responds within 60 seconds. CheeTaxi cooperates with law enforcement on safety investigations.</p>
        </section>
        <section>
          <h2 className="font-display text-2xl font-bold text-ink-900">8. Prohibited Conduct</h2>
          <ul className="ml-6 list-disc mt-2">
            <li>Using the Service for illegal activities</li>
            <li>Sharing your account with others</li>
            <li>Spamming, harassment, or abusive behavior</li>
            <li>Fraudulent payments or chargeback abuse</li>
            <li>GPS spoofing or falsifying trip data</li>
            <li>Recruiting drivers or passengers away from the platform</li>
          </ul>
        </section>
        <section>
          <h2 className="font-display text-2xl font-bold text-ink-900">9. Intellectual Property</h2>
          <p className="mt-2">CheeTaxi and its logos, brand assets, and software are the property of CheeTaxi Technologies. You may not use them without written permission.</p>
        </section>
        <section>
          <h2 className="font-display text-2xl font-bold text-ink-900">10. Limitation of Liability</h2>
          <p className="mt-2">CheeTaxi is a technology platform, not a transportation carrier. We are not liable for the acts or omissions of drivers or passengers. Our liability is limited to the greater of (a) the trip fare or (b) USD 100.</p>
        </section>
        <section>
          <h2 className="font-display text-2xl font-bold text-ink-900">11. Governing Law</h2>
          <p className="mt-2">These Terms are governed by the laws of the Federal Democratic Republic of Ethiopia. Disputes are resolved in the courts of Addis Ababa.</p>
        </section>
        <section>
          <h2 className="font-display text-2xl font-bold text-ink-900">12. Contact</h2>
          <p className="mt-2">Email: <a href="mailto:legal@cheetaxi.africa" className="text-brand-600 underline">legal@cheetaxi.africa</a></p>
        </section>
      </div>
    </main>
  );
}
