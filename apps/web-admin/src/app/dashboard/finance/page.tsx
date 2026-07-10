'use client';

export default function FinancePage() {
  const kpis = [
    { label: 'Revenue today (Br)', value: '1,245,000', delta: '+15%' },
    { label: 'Subscription revenue (Br)', value: '198,500', delta: '+8%' },
    { label: 'Pending withdrawals (Br)', value: '342,000', delta: '12 requests' },
    { label: 'Refunds this week (Br)', value: '4,200', delta: '7 cases' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Finance</h1>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="card p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-ink-500">{k.label}</div>
            <div className="mt-2 text-2xl font-bold text-ink-900">{k.value}</div>
            <div className="mt-1 text-xs text-emerald-600">{k.delta}</div>
          </div>
        ))}
      </div>

      <div className="card mt-6 p-6">
        <h2 className="font-bold text-ink-900">Recent transactions</h2>
        <p className="mt-1 text-sm text-ink-500">Detailed transaction ledger + reconciliation lives here.</p>
      </div>
    </div>
  );
}
