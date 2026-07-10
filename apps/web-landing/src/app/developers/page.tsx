import { Metadata } from 'next';
export const metadata: Metadata = { title: 'Developer Portal', description: 'Build with the CheeTaxi API.' };

export default function DevelopersPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <div className="text-center">
        <h1 className="font-display text-4xl font-extrabold text-ink-900">CheeTaxi Developers</h1>
        <p className="mt-3 text-lg text-ink-600">Build mobility into your application with our REST API and webhooks.</p>
        <div className="mt-6 flex justify-center gap-3">
          <a href="/docs" className="rounded-full bg-brand-500 px-6 py-3 font-semibold text-white">View API docs</a>
          <a href="mailto:developers@cheetaxi.africa" className="rounded-full border border-ink-200 px-6 py-3 font-semibold">Request API key</a>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-ink-100 p-6">
          <div className="text-3xl">📜</div>
          <h2 className="mt-3 font-display text-xl font-bold text-ink-900">REST API</h2>
          <p className="mt-1 text-sm text-ink-600">100+ endpoints covering trips, payments, wallets, fleets, and more. JSON in, JSON out. Bearer JWT auth.</p>
        </div>
        <div className="rounded-2xl border border-ink-100 p-6">
          <div className="text-3xl">⚡</div>
          <h2 className="mt-3 font-display text-xl font-bold text-ink-900">Webhooks</h2>
          <p className="mt-1 text-sm text-ink-600">Subscribe to trip lifecycle events, payment status changes, and driver status updates. HMAC-signed payloads.</p>
        </div>
        <div className="rounded-2xl border border-ink-100 p-6">
          <div className="text-3xl">🔌</div>
          <h2 className="mt-3 font-display text-xl font-bold text-ink-900">SDKs</h2>
          <p className="mt-1 text-sm text-ink-600">Official SDKs: JavaScript, Python, Dart, Swift, Kotlin. Community SDKs welcome.</p>
        </div>
      </div>

      <div className="mt-16">
        <h2 className="font-display text-2xl font-bold text-ink-900">Quick start</h2>
        <pre className="mt-4 rounded-xl bg-ink-900 p-6 text-sm text-emerald-300 overflow-x-auto"><code>{`curl -X POST https://api.cheetaxi.africa/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"identifier":"+251911223344","password":"your-password"}'

# Response:
# { "accessToken": "eyJhbG...", "refreshToken": "abc...", "user": {...} }

# Then use the token:
curl https://api.cheetaxi.africa/trips/me/passenger \\
  -H "Authorization: Bearer eyJhbG..."`}</code></pre>
      </div>

      <div className="mt-12 rounded-2xl bg-ink-50 p-6">
        <h2 className="font-display text-xl font-bold text-ink-900">Rate limits</h2>
        <p className="mt-2 text-sm text-ink-600">600 requests/minute per API key. 30 requests/second burst. Need higher limits? Contact us for an enterprise plan.</p>
      </div>

      <div className="mt-8 text-center text-sm text-ink-500">
        Full OpenAPI spec at <a href="https://api.cheetaxi.africa/docs-json" className="text-brand-600 underline">api.cheetaxi.africa/docs-json</a>
      </div>
    </main>
  );
}
