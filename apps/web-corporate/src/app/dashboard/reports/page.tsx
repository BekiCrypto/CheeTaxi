'use client';
export default function ReportsPage() {
  const reports = [
    { name: 'Trip summary', desc: 'Trips per driver, per day, per vehicle', freq: 'Daily' },
    { name: 'Revenue breakdown', desc: 'Revenue by driver, vehicle, and time period', freq: 'Weekly' },
    { name: 'Driver performance', desc: 'Acceptance rate, completion rate, ratings', freq: 'Weekly' },
    { name: 'Utilization', desc: 'Hours active vs hours online per driver', freq: 'Monthly' },
    { name: 'Cost analysis', desc: 'Fuel, maintenance, and earnings per km', freq: 'Monthly' },
  ];
  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Reports</h1>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {reports.map((r) => (
          <div key={r.name} className="card p-5">
            <div className="flex items-center justify-between">
              <div className="font-display font-bold text-ink-900">{r.name}</div>
              <span className="badge bg-brand-100 text-brand-700">{r.freq}</span>
            </div>
            <p className="mt-2 text-sm text-ink-500">{r.desc}</p>
            <button className="btn-primary mt-4 text-xs">Generate report</button>
          </div>
        ))}
      </div>
    </div>
  );
}
