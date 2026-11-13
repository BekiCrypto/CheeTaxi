import React, { useState, useEffect } from 'react';
import {
  Radio,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Zap,
  Activity,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { sounds } from '../../utils/audio';

export const AdminProviderTab: React.FC = () => {
  const [providers, setProviders] = useState<any[]>([]);
  const [testResult, setTestResult] = useState<any[] | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadProviderStatus = async () => {
    try {
      const res = await fetch('/api/providers/status');
      const data = await res.json();
      if (data.providers) setProviders(data.providers);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadProviderStatus();
  }, []);

  const handleResetBreakers = async () => {
    try {
      const res = await fetch('/api/providers/reset-breaker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        sounds.playPaymentSuccess();
        setStatusMessage('All external provider circuit breakers reset to CLOSED (Healthy).');
        await loadProviderStatus();
        setTimeout(() => setStatusMessage(null), 4000);
      }
    } catch (err: any) {
      alert(err.message || 'Error resetting breakers');
    }
  };

  const handleRunSearchTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    sounds.playBeep(520, 'sine', 0.2);

    try {
      const res = await fetch('/api/providers/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup: { lat: 8.995, lng: 38.788, address: 'Bole Medhanialem' },
          destination: { lat: 9.0105, lng: 38.7615, address: 'Meskel Square' },
          vehicleCategory: 'sedan',
        }),
      });
      const data = await res.json();
      if (data.offers) {
        setTestResult(data.offers);
        await loadProviderStatus();
        sounds.playPaymentSuccess();
      }
    } catch (err: any) {
      alert(err.message || 'Error running provider search test');
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusBadge = (state: string) => {
    switch (state) {
      case 'CLOSED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
            CLOSED (Healthy)
          </span>
        );
      case 'HALF_OPEN':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-300">
            HALF_OPEN (Probing)
          </span>
        );
      case 'OPEN':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-300">
            OPEN (Tripped / Outage)
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800">
            DIRECT (Core Network)
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 overflow-y-auto h-full text-xs">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-indigo-500 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Founder Mandate Section 4
              </span>
              <span className="text-white/80 text-xs font-medium">Aggregator & Circuit Breaker Engine</span>
            </div>
            <h2 className="text-xl font-black">Multi-Provider Supply Orchestration</h2>
            <p className="text-white/80 text-xs mt-1 max-w-2xl leading-relaxed">
              Chebelew aggregates external operators (RIDE, Feres, ZayRide, Yango) through resilient circuit breakers. When an external partner fails, the breaker trips to prevent passenger delay, routing demand seamlessly to Chebelew's independent driver network.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleResetBreakers}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold border border-slate-700 transition"
            >
              Reset Circuit Breakers
            </button>
            <button
              onClick={handleRunSearchTest}
              disabled={isTesting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Radio className="w-4 h-4" />
              <span>{isTesting ? 'Probing Adapters...' : 'Test Multi-Provider Search'}</span>
            </button>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Provider Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Core Fleet */}
        <div className="bg-white rounded-2xl border-2 border-brand-500 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="font-black text-sm text-slate-900">Chebelew Core Fleet</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
              CHANNEL B (CORE)
            </span>
          </div>
          <p className="text-slate-500 text-[11px]">
            Independent driver network operating under 0% per-trip commission subscription model. 100% resilient; zero external API dependencies.
          </p>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between font-mono text-[11px]">
            <span className="text-slate-400">Availability:</span>
            <span className="font-bold text-emerald-700">100% Guaranteed</span>
          </div>
        </div>

        {/* External Providers */}
        {providers.map((p) => (
          <div key={p.provider} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-slate-900">{p.providerName}</h3>
              {getStatusBadge(p.circuitBreakerState)}
            </div>
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-mono text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">Failures</span>
                <span className="font-bold text-slate-800">{p.failureCount} / 3</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Avg Latency</span>
                <span className="font-bold text-slate-800">{p.avgLatencyMs || 120} ms</span>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 pt-1">
              Threshold: 3 consecutive timeouts trip circuit breaker OPEN for 30s.
            </div>
          </div>
        ))}
      </div>

      {/* Live Search Test Results */}
      {testResult && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-black text-sm text-slate-900">Multi-Provider Live Normalized Offers</h3>
              <p className="text-slate-500 text-[11px]">
                Simultaneous search across Bole Medhanialem to Meskel Square (Addis Ababa).
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600 font-mono">
              {testResult.length} Offers Normalized
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {testResult.map((offer, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border ${
                  offer.providerId === 'chebelew'
                    ? 'border-brand-500 bg-brand-50/40 ring-1 ring-brand-500/20'
                    : 'border-slate-200 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-xs text-slate-900">{offer.providerName}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-500">{offer.vehicleCategory}</span>
                </div>
                <div className="text-xl font-black text-slate-900 mb-1">
                  {offer.estimatedFare} {offer.currency}
                </div>
                <div className="text-[11px] text-slate-500 space-y-0.5">
                  <div>ETA: {offer.estimatedPickupMinutes} mins • Duration: {offer.estimatedDurationMinutes} mins</div>
                  <div>Cancellation: {offer.cancellationTerms}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
