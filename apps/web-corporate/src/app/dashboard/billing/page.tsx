'use client';
export default function BillingPage() {
  const invoices = [
    { id: 'INV-2026-07', period: 'July 2026', amount: 'Br 15,000', status: 'paid' },
    { id: 'INV-2026-06', period: 'June 2026', amount: 'Br 15,000', status: 'paid' },
    { id: 'INV-2026-05', period: 'May 2026', amount: 'Br 14,500', status: 'paid' },
  ];
  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Billing & invoices</h1>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-5"><div className="text-xs uppercase text-ink-500">Current plan</div><div className="mt-2 text-xl font-bold text-ink-900">Corporate Fleet</div></div>
        <div className="card p-5"><div className="text-xs uppercase text-ink-500">Monthly cost</div><div className="mt-2 text-xl font-bold text-ink-900">Br 15,000</div></div>
        <div className="card p-5"><div className="text-xs uppercase text-ink-500">Next invoice</div><div className="mt-2 text-xl font-bold text-ink-900">Aug 1, 2026</div></div>
      </div>
      <div className="card mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
            <tr><th className="px-4 py-3">Invoice</th><th className="px-4 py-3">Period</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th></tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {invoices.map((i) => (
              <tr key={i.id}><td className="px-4 py-3 font-mono">{i.id}</td><td className="px-4 py-3 text-ink-600">{i.period}</td><td className="px-4 py-3 font-semibold">{i.amount}</td><td className="px-4 py-3"><span className="badge bg-emerald-100 text-emerald-700">{i.status}</span></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
