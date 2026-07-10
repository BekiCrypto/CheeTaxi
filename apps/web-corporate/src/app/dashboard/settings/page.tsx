'use client';
export default function CorporateSettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Settings</h1>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-bold text-ink-900">Company profile</h2>
          <p className="mt-1 text-sm text-ink-500">Update your company name, contact, and billing address.</p>
          <button className="btn-primary mt-4">Edit profile</button>
        </div>
        <div className="card p-6">
          <h2 className="font-bold text-ink-900">API access</h2>
          <p className="mt-1 text-sm text-ink-500">Generate API keys for integration with your HR and expense systems.</p>
          <button className="btn-primary mt-4">Manage API keys</button>
        </div>
        <div className="card p-6">
          <h2 className="font-bold text-ink-900">Spending limits</h2>
          <p className="mt-1 text-sm text-ink-500">Set monthly trip limits per employee or department.</p>
          <button className="btn-primary mt-4">Configure limits</button>
        </div>
        <div className="card p-6">
          <h2 className="font-bold text-ink-900">Notifications</h2>
          <p className="mt-1 text-sm text-ink-500">Email summaries when trips are booked, invoices are ready, or limits are reached.</p>
          <button className="btn-primary mt-4">Manage notifications</button>
        </div>
      </div>
    </div>
  );
}
