'use client';

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Settings</h1>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-bold text-ink-900">Pricing tiers</h2>
          <p className="mt-1 text-sm text-ink-500">Adjust fares per city and vehicle type.</p>
          <button className="btn-primary mt-4">Manage pricing</button>
        </div>
        <div className="card p-6">
          <h2 className="font-bold text-ink-900">Feature flags</h2>
          <p className="mt-1 text-sm text-ink-500">Toggle modules on or off per country.</p>
          <button className="btn-primary mt-4">Manage flags</button>
        </div>
        <div className="card p-6">
          <h2 className="font-bold text-ink-900">Admin roles</h2>
          <p className="mt-1 text-sm text-ink-500">Grant RBAC permissions to team members.</p>
          <button className="btn-primary mt-4">Manage team</button>
        </div>
        <div className="card p-6">
          <h2 className="font-bold text-ink-900">API keys &amp; integrations</h2>
          <p className="mt-1 text-sm text-ink-500">Manage payment providers, maps, SMS, push.</p>
          <button className="btn-primary mt-4">Manage integrations</button>
        </div>
      </div>
    </div>
  );
}
