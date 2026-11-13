import React, { useState, useEffect } from 'react';
import {
  Code,
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Shield,
  Zap,
  RefreshCw,
  Terminal,
} from 'lucide-react';
import { sounds } from '../../utils/audio';

interface ApiKeyItem {
  id: string;
  name: string;
  key_prefix: string;
  environment: 'test' | 'live';
  rate_limit_per_min: number;
  is_active: number;
  created_at: string;
  last_used_at?: string;
}

export const AdminDeveloperTab: React.FC = () => {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('Partner Dispatch Integration');
  const [newKeyEnv, setNewKeyEnv] = useState<'test' | 'live'>('test');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/developer/keys');
      const data = await res.json();
      if (data.keys) {
        setKeys(data.keys);
      }
    } catch (err) {
      console.error('Failed to load developer keys:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/developer/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName, environment: newKeyEnv }),
      });
      const data = await res.json();
      if (data.success && data.key) {
        setGeneratedKey(data.key.apiKey);
        sounds.playPaymentSuccess();
        fetchKeys();
      }
    } catch (err) {
      alert('Failed to generate key');
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      const res = await fetch(`/api/developer/keys/${id}/toggle`, { method: 'PATCH' });
      const data = await res.json();
      if (data.success) {
        setKeys((prev) =>
          prev.map((k) => (k.id === id ? { ...k, is_active: data.isActive ? 1 : 0 } : k))
        );
      }
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently revoke this API key?')) return;
    try {
      const res = await fetch(`/api/developer/keys/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setKeys((prev) => prev.filter((k) => k.id !== id));
      }
    } catch (err) {
      console.error('Revoke error:', err);
    }
  };

  const sampleSnippet = `curl -X POST https://chebelew.trustlotto.app/api/rides/estimate \\
  -H "Authorization: Bearer ${keys[0]?.key_prefix || 'chb_test'}_secret" \\
  -H "Content-Type: application/json" \\
  -d '{"pickup":{"lat":8.995,"lng":38.788},"destination":{"lat":9.010,"lng":38.761}}'`;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Developer Platform & API Keys</h2>
              <p className="text-xs text-slate-500">
                Manage B2B integration credentials, OpenAPI documentation, and automated webhooks.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/developer/openapi.json"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition border border-slate-200"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>OpenAPI v3 Docs</span>
          </a>

          <button
            onClick={() => {
              setGeneratedKey(null);
              setShowCreateModal(true);
            }}
            className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create New API Key</span>
          </button>
        </div>
      </div>

      {/* API Keys Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            Registered API Credentials ({keys.length})
          </span>
          <button
            onClick={fetchKeys}
            className="p-1 hover:bg-slate-100 text-slate-500 rounded-md transition"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {keys.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No developer API keys registered yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Key Name</th>
                  <th className="px-4 py-3">Prefix / ID</th>
                  <th className="px-4 py-3">Environment</th>
                  <th className="px-4 py-3">Rate Limit</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {keys.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3 font-semibold text-slate-900">{k.name}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                      {k.key_prefix}_••••••••
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          k.environment === 'live'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {k.environment}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{k.rate_limit_per_min} req/min</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          k.is_active === 1
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {k.is_active === 1 ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-[11px]">
                      {new Date(k.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => handleToggleActive(k.id)}
                        className="text-slate-500 hover:text-slate-800 transition p-1"
                        title={k.is_active === 1 ? 'Disable key' : 'Activate key'}
                      >
                        {k.is_active === 1 ? (
                          <ToggleRight className="w-4 h-4 text-emerald-600 inline" />
                        ) : (
                          <ToggleLeft className="w-4 h-4 text-slate-400 inline" />
                        )}
                      </button>
                      <button
                        onClick={() => handleRevoke(k.id)}
                        className="text-rose-500 hover:text-rose-700 transition p-1"
                        title="Revoke key"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Integration Code Snippet */}
      <div className="bg-slate-900 rounded-2xl p-5 text-slate-200 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Quickstart Request Example
            </span>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(sampleSnippet);
              setCopiedSnippet(true);
              setTimeout(() => setCopiedSnippet(false), 2000);
            }}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition bg-slate-800 px-2 py-1 rounded"
          >
            {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSnippet ? 'Copied' : 'Copy cURL'}</span>
          </button>
        </div>
        <pre className="text-[11px] font-mono overflow-x-auto text-slate-300 p-3 bg-black/40 rounded-xl leading-relaxed">
          {sampleSnippet}
        </pre>
      </div>

      {/* Create Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-slate-900 text-sm">Create Integration API Key</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {!generatedKey ? (
              <form onSubmit={handleCreateKey} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Key Description / Name</label>
                  <input
                    type="text"
                    required
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-brand-500 outline-hidden"
                    placeholder="e.g. Telebirr SuperApp MiniApp Dispatch"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Environment</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewKeyEnv('test')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition text-center ${
                        newKeyEnv === 'test'
                          ? 'border-amber-500 bg-amber-50 text-amber-800'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      🧪 Sandbox (test)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewKeyEnv('live')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition text-center ${
                        newKeyEnv === 'live'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      🚀 Production (live)
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-black bg-brand-600 hover:bg-brand-700 text-white rounded-xl transition shadow-sm"
                  >
                    Generate Secret Key
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-2">
                  <p className="font-bold">Key Generated Successfully!</p>
                  <p className="text-[11px] text-emerald-700">
                    Copy this secret key now. For security reasons, it cannot be displayed again.
                  </p>
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-emerald-300 font-mono text-[11px] break-all">
                    <span>{generatedKey}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedKey);
                        setCopiedKey(true);
                        setTimeout(() => setCopiedKey(false), 2000);
                      }}
                      className="ml-2 text-slate-600 hover:text-slate-900 p-1"
                      title="Copy key"
                    >
                      {copiedKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-full py-2 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-black transition"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};