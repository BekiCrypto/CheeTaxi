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
  Settings,
  Power,
  Play,
  AlertTriangle,
  ChevronDown,
  Check,
  X,
  Eye,
  EyeOff,
  Trash2,
  Cpu,
  Sliders,
  Send,
  ExternalLink,
} from 'lucide-react';
import { sounds } from '../../utils/audio';
import {
  AggregatorProviderId,
  CircuitBreakerState,
  ProviderAdapterConfig,
  ProviderRoutingLog,
  VehicleCategory,
} from '@shared/types';

interface SimulatedOffer {
  providerId: AggregatorProviderId;
  providerName: string;
  category: VehicleCategory;
  estimatedFare: number;
  currency: string;
  estimatedArrivalMins: number;
  journeyDurationMins: number;
  vehicleDetails: string;
  reliabilityScore: number;
  isAvailable: boolean;
  circuitStatus: CircuitBreakerState;
}

const PRESET_ROUTES = [
  {
    name: 'Bole Medhanialem ➔ Meskel Square',
    pickup: { lat: 8.995, lng: 38.788, address: 'Bole Medhanialem' },
    destination: { lat: 9.0105, lng: 38.7615, address: 'Meskel Square' },
  },
  {
    name: 'Bole Airport (ADD) ➔ Sheraton Addis',
    pickup: { lat: 8.9778, lng: 38.7993, address: 'Addis Ababa Bole Int Airport (ADD)' },
    destination: { lat: 9.0195, lng: 38.7645, address: 'Sheraton Addis Hotel' },
  },
  {
    name: 'Mexico Square ➔ Piazza (Arada)',
    pickup: { lat: 9.0108, lng: 38.7445, address: 'Mexico Square' },
    destination: { lat: 9.0345, lng: 38.7525, address: 'Piazza (Arada Old Post Office)' },
  },
  {
    name: 'Kazanchis (UNECA) ➔ Bole Atlas',
    pickup: { lat: 9.0185, lng: 38.7705, address: 'Kazanchis (UNECA Complex)' },
    destination: { lat: 9.0025, lng: 38.783, address: 'Bole Atlas' },
  },
];

export const AdminProviderTab: React.FC = () => {
  const [providers, setProviders] = useState<ProviderAdapterConfig[]>([]);
  const [routingLogs, setRoutingLogs] = useState<ProviderRoutingLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Quote Simulation State
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<VehicleCategory>('sedan');
  const [simulatedOffers, setSimulatedOffers] = useState<SimulatedOffer[] | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Config Modal State
  const [editingProvider, setEditingProvider] = useState<ProviderAdapterConfig | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  // Per-provider testing states
  const [pingStatus, setPingStatus] = useState<Record<string, { loading?: boolean; result?: string; success?: boolean }>>({});
  const [mockDispatchResult, setMockDispatchResult] = useState<any | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [provRes, logRes] = await Promise.all([
        fetch('/api/providers/config'),
        fetch('/api/providers/logs?limit=30'),
      ]);

      const provData = await provRes.json();
      if (provData.providers) {
        setProviders(provData.providers);
      }

      const logData = await logRes.json();
      if (logData.logs) {
        setRoutingLogs(logData.logs);
      }
    } catch (err) {
      console.error('Failed to load provider data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // auto-refresh every 10s
    return () => clearInterval(interval);
  }, []);

  // Reset all circuit breakers
  const handleResetAllBreakers = async () => {
    try {
      const res = await fetch('/api/providers/reset-breaker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        sounds.playPaymentSuccess();
        setStatusMessage('All provider circuit breakers reset to CLOSED (Healthy).');
        await loadData();
        setTimeout(() => setStatusMessage(null), 4000);
      }
    } catch (err: any) {
      alert(err.message || 'Error resetting breakers');
    }
  };

  // Toggle single breaker or set state
  const handleSetCircuitState = async (providerId: AggregatorProviderId, state: CircuitBreakerState) => {
    try {
      const res = await fetch('/api/providers/circuit/set-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, state }),
      });
      const data = await res.json();
      if (data.success) {
        sounds.playBeep(480, 'sine', 0.15);
        setStatusMessage(`Provider ${providerId} circuit set to ${state}.`);
        await loadData();
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Error setting circuit state');
    }
  };

  // Toggle provider enabled
  const handleToggleEnabled = async (provider: ProviderAdapterConfig) => {
    try {
      const nextState = !provider.isEnabled;
      const res = await fetch(`/api/providers/config/${provider.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: nextState }),
      });
      const data = await res.json();
      if (data.success) {
        sounds.playBeep(560, 'triangle', 0.1);
        setStatusMessage(`${provider.name} is now ${nextState ? 'ENABLED' : 'DISABLED'}.`);
        await loadData();
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Error updating provider');
    }
  };

  // Test Ping / Handshake
  const handleTestPing = async (providerId: AggregatorProviderId) => {
    setPingStatus((prev) => ({ ...prev, [providerId]: { loading: true } }));
    sounds.playBeep(520, 'sine', 0.15);

    try {
      const res = await fetch(`/api/providers/test-ping/${providerId}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        sounds.playPaymentSuccess();
        setPingStatus((prev) => ({
          ...prev,
          [providerId]: {
            loading: false,
            success: true,
            result: `${data.latencyMs}ms • HTTP ${data.httpStatus} OK`,
          },
        }));
        await loadData();
      } else {
        throw new Error(data.error || 'Ping failed');
      }
    } catch (err: any) {
      sounds.playBeep(300, 'sawtooth', 0.25);
      setPingStatus((prev) => ({
        ...prev,
        [providerId]: {
          loading: false,
          success: false,
          result: err.message || 'Ping failed',
        },
      }));
    }

    setTimeout(() => {
      setPingStatus((prev) => {
        const next = { ...prev };
        delete next[providerId];
        return next;
      });
    }, 6000);
  };

  // Mock Dispatch Simulation
  const handleLiveDispatchTest = async (providerId: AggregatorProviderId) => {
    sounds.playBeep(600, 'sine', 0.2);
    setMockDispatchResult(null);

    const route = PRESET_ROUTES[selectedRouteIdx];
    try {
      const res = await fetch(`/api/providers/dispatch/${providerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupAddress: route.pickup.address,
          destinationAddress: route.destination.address,
          vehicleCategory: selectedCategory,
          passengerName: 'Abebe Bikila (Live Dispatch Probe)',
          fareEtb: 350.0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        sounds.playPaymentSuccess();
        setMockDispatchResult(data);
        await loadData();
      } else {
        alert(data.error || 'Live dispatch test failed');
      }
    } catch (err: any) {
      alert(err.message || 'Error testing partner dispatch');
    }
  };

  // Run Multi-Provider Quote Search Simulation
  const handleRunSearchTest = async () => {
    setIsSimulating(true);
    setSimulatedOffers(null);
    sounds.playBeep(520, 'sine', 0.2);

    const route = PRESET_ROUTES[selectedRouteIdx];

    try {
      const res = await fetch('/api/providers/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup: route.pickup,
          destination: route.destination,
          category: selectedCategory,
        }),
      });
      const data = await res.json();
      if (data.offers) {
        setSimulatedOffers(data.offers);
        await loadData();
        sounds.playPaymentSuccess();
      }
    } catch (err: any) {
      alert(err.message || 'Error running provider quote simulation');
    } finally {
      setIsSimulating(false);
    }
  };

  // Save Provider Config changes
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProvider) return;

    try {
      const res = await fetch(`/api/providers/config/${editingProvider.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProvider),
      });
      const data = await res.json();
      if (data.success) {
        sounds.playPaymentSuccess();
        setStatusMessage(`Configuration saved for ${editingProvider.name}.`);
        setEditingProvider(null);
        await loadData();
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Error updating configuration');
    }
  };

  // Clear Logs
  const handleClearLogs = async () => {
    if (!confirm('Clear all provider routing traffic logs?')) return;
    try {
      await fetch('/api/providers/logs', { method: 'DELETE' });
      setRoutingLogs([]);
      sounds.playBeep(400, 'triangle', 0.1);
    } catch (err: any) {
      alert(err.message || 'Error clearing logs');
    }
  };

  const getStatusBadge = (state: CircuitBreakerState) => {
    switch (state) {
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            CLOSED (Healthy)
          </span>
        );
      case 'HALF_OPEN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
            HALF-OPEN (Probing)
          </span>
        );
      case 'OPEN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            OPEN (Tripped Outage)
          </span>
        );
      default:
        return null;
    }
  };

  const getLogBadge = (action: string) => {
    switch (action) {
      case 'DISPATCHED':
        return <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-indigo-100 text-indigo-800">DISPATCHED</span>;
      case 'CIRCUIT_TRIPPED':
        return <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-rose-100 text-rose-800">CIRCUIT TRIPPED</span>;
      case 'HANDSHAKE_OK':
        return <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-emerald-100 text-emerald-800">HANDSHAKE OK</span>;
      case 'TIMEOUT':
        return <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-amber-100 text-amber-800">TIMEOUT</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-slate-100 text-slate-700">OFFER QUOTED</span>;
    }
  };

  const activeProvidersCount = providers.filter((p) => p.isEnabled).length;
  const trippedCount = providers.filter((p) => p.circuitState === 'OPEN').length;
  const avgLatency = Math.round(
    providers.reduce((acc, p) => acc + (p.latencyMs || 100), 0) / (providers.length || 1)
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 overflow-y-auto h-full text-xs">
      {/* Top Banner & Orchestrator Metrics */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="bg-brand-500 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Founder Mandate Section 4
              </span>
              <span className="text-white/80 text-xs font-semibold">Multi-Provider Aggregation & Circuit Breakers</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">External Fleet Orchestration Console</h2>
            <p className="text-white/70 text-xs max-w-2xl leading-relaxed">
              Chebelew aggregates authorized municipal taxi fleets, licensed meter taxi networks, and regional cooperatives through low-latency circuit breakers. In the event of partner latency spikes or API outages, traffic automatically fails over to Chebelew’s 0% commission direct driver fleet.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleResetAllBreakers}
              className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl font-bold border border-slate-700 transition flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset All Breakers</span>
            </button>
            <button
              onClick={loadData}
              disabled={isLoading}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Activity className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Sync Adapter Fleet</span>
            </button>
          </div>
        </div>

        {/* Real-Time Stats Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="text-slate-400 text-[10px] uppercase font-bold">Integrated Fleets</div>
            <div className="text-lg font-black text-white mt-0.5">
              {activeProvidersCount} <span className="text-xs font-medium text-slate-400">/ {providers.length} Active</span>
            </div>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="text-slate-400 text-[10px] uppercase font-bold">Core Fleet Resilience</div>
            <div className="text-lg font-black text-emerald-400 mt-0.5">
              100% <span className="text-xs font-medium text-emerald-300/80">Zero-Dep Direct</span>
            </div>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="text-slate-400 text-[10px] uppercase font-bold">Tripped Outages</div>
            <div className={`text-lg font-black mt-0.5 ${trippedCount > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
              {trippedCount} <span className="text-xs font-medium text-slate-400">Failover Active</span>
            </div>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="text-slate-400 text-[10px] uppercase font-bold">Network Avg Latency</div>
            <div className="text-lg font-black text-indigo-300 mt-0.5">
              {avgLatency} <span className="text-xs font-medium text-indigo-200/70">ms</span>
            </div>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3.5 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Grid of Provider Adapters */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h3 className="font-black text-sm text-slate-900">Configured Mobility Providers & Circuit Breakers</h3>
          </div>
          <span className="text-slate-400 text-[11px] font-mono">
            {providers.length} registered adapters
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map((p) => {
            const isCore = p.id === 'chebelew';
            const ping = pingStatus[p.id];

            return (
              <div
                key={p.id}
                className={`bg-white rounded-2xl border transition shadow-xs flex flex-col justify-between ${
                  !p.isEnabled
                    ? 'border-slate-200 opacity-60 bg-slate-50'
                    : isCore
                    ? 'border-brand-500 ring-2 ring-brand-500/10'
                    : p.circuitState === 'OPEN'
                    ? 'border-rose-400 ring-2 ring-rose-500/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="p-5 space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${isCore ? 'bg-brand-500 animate-pulse' : p.circuitState === 'CLOSED' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <h4 className="font-black text-sm text-slate-900">{p.name}</h4>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md font-mono text-[9px] font-bold bg-slate-100 text-slate-600">
                          ID: {p.id}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                          p.integrationReadinessStatus === 'live_api'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {p.integrationReadinessStatus.toUpperCase().replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <button
                        onClick={() => handleToggleEnabled(p)}
                        title={p.isEnabled ? 'Disable Provider' : 'Enable Provider'}
                        className={`p-1.5 rounded-lg border transition ${
                          p.isEnabled
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Circuit State Pill */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Circuit State:</span>
                    {getStatusBadge(p.circuitState)}
                  </div>

                  {/* Metrics Table */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <div className="p-2 rounded-lg bg-slate-50/80 border border-slate-100">
                      <span className="text-slate-400 block text-[9px]">Failures / Threshold</span>
                      <span className={`font-bold ${p.failureCount >= (p.errorThreshold || 3) ? 'text-rose-600' : 'text-slate-800'}`}>
                        {p.failureCount} / {p.errorThreshold || 3}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50/80 border border-slate-100">
                      <span className="text-slate-400 block text-[9px]">Live Latency</span>
                      <span className="font-bold text-slate-800">{p.latencyMs || 120} ms</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50/80 border border-slate-100">
                      <span className="text-slate-400 block text-[9px]">Tariff Multiplier</span>
                      <span className="font-bold text-indigo-700">{p.tariffMultiplier || 1.0}x</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50/80 border border-slate-100">
                      <span className="text-slate-400 block text-[9px]">Markup Rate</span>
                      <span className="font-bold text-slate-800">
                        {p.markupPercent && p.markupPercent > 0 ? `+${p.markupPercent}%` : `${p.markupPercent || 0}%`}
                      </span>
                    </div>
                  </div>

                  {/* Endpoint Preview */}
                  <div className="p-2 rounded-lg bg-slate-100/70 text-[9px] font-mono text-slate-600 truncate border border-slate-200/60">
                    <span className="text-slate-400 mr-1">Endpoint:</span>
                    {p.apiUrl}
                  </div>

                  {/* Ping status feedback */}
                  {ping && (
                    <div
                      className={`p-2 rounded-lg font-mono text-[10px] font-bold flex items-center justify-between ${
                        ping.loading
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : ping.success
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      <span>{ping.loading ? 'Pinging adapter...' : ping.result}</span>
                      {ping.loading && <RefreshCw className="w-3 h-3 animate-spin" />}
                    </div>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex items-center justify-between gap-1 flex-wrap">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleTestPing(p.id)}
                      disabled={ping?.loading}
                      title="Test live handshake ping"
                      className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[10px] flex items-center gap-1 transition disabled:opacity-50"
                    >
                      <Zap className="w-3 h-3 text-amber-500" />
                      <span>Ping</span>
                    </button>
                    {!isCore && (
                      <button
                        onClick={() => handleLiveDispatchTest(p.id)}
                        title="Execute live partner order dispatch test"
                        className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[10px] flex items-center gap-1 transition"
                      >
                        <Send className="w-3 h-3 text-indigo-500" />
                        <span>Dispatch</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {!isCore && (
                      <>
                        {p.circuitState === 'CLOSED' ? (
                          <button
                            onClick={() => handleSetCircuitState(p.id, 'OPEN')}
                            title="Trip circuit breaker OPEN for failover testing"
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[10px] transition"
                          >
                            Trip
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSetCircuitState(p.id, 'CLOSED')}
                            title="Reset breaker to CLOSED"
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-[10px] transition"
                          >
                            Reset
                          </button>
                        )}
                      </>
                    )}
                    <button
                      onClick={() => {
                        setEditingProvider(p);
                        setShowApiKey(false);
                      }}
                      title="Edit Adapter Settings"
                      className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold transition"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mock Dispatch Result Alert */}
      {mockDispatchResult && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              <h4 className="font-black text-sm text-indigo-950">
                Live Dispatch Confirmed by {mockDispatchResult.providerName}
              </h4>
            </div>
            <button onClick={() => setMockDispatchResult(null)} className="text-indigo-600 hover:text-indigo-900">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-[11px] bg-white p-3 rounded-xl border border-indigo-100">
            <div>
              <span className="text-slate-400 block text-[9px]">Partner Booking Ref</span>
              <span className="font-bold text-slate-900">{mockDispatchResult.partnerOrderId}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px]">Assigned Driver</span>
              <span className="font-bold text-slate-900">{mockDispatchResult.assignedDriver}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px]">Estimated Pickup</span>
              <span className="font-bold text-indigo-700">{mockDispatchResult.etaMinutes} mins</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px]">Metered Fare</span>
              <span className="font-bold text-emerald-700">{mockDispatchResult.fareEtb} ETB</span>
            </div>
          </div>
        </div>
      )}

      {/* Live Quote & Multi-Provider Comparison Simulator */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-indigo-600" />
              <h3 className="font-black text-sm text-slate-900">Addis Ababa Multi-Fleet Quote & Failover Simulator</h3>
            </div>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Simulate normalized quotes across partner adapters. Observe live fare differences and failover handling.
            </p>
          </div>

          <button
            onClick={handleRunSearchTest}
            disabled={isSimulating}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xs transition flex items-center gap-2 disabled:opacity-50 self-start md:self-auto"
          >
            <Play className={`w-3.5 h-3.5 text-brand-400 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Querying Partner Fleets...' : 'Compare Live Across Fleets'}</span>
          </button>
        </div>

        {/* Route & Category Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 space-y-1">
            <label className="font-bold text-slate-700 text-[10px] uppercase">Addis Ababa Test Corridor:</label>
            <select
              value={selectedRouteIdx}
              onChange={(e) => setSelectedRouteIdx(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 text-xs focus:ring-2 focus:ring-brand-500"
            >
              {PRESET_ROUTES.map((r, idx) => (
                <option key={idx} value={idx}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 text-[10px] uppercase">Vehicle Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as VehicleCategory)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 text-xs focus:ring-2 focus:ring-brand-500"
            >
              <option value="sedan">Sedan (Economy Meter)</option>
              <option value="minivan">Minivan (7-Seater Group)</option>
              <option value="comfort">Comfort (VIP Executive)</option>
            </select>
          </div>
        </div>

        {/* Simulated Results Cards */}
        {simulatedOffers && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-mono">
              <span>{simulatedOffers.length} provider offers returned:</span>
              <span className="text-emerald-700 font-bold">Chebelew Core = Lowest Fare (0% Commission)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {simulatedOffers.map((offer, idx) => {
                const isChebelew = offer.providerId === 'chebelew';
                const isTripped = offer.circuitStatus === 'OPEN' || !offer.isAvailable;

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border flex flex-col justify-between transition ${
                      isChebelew
                        ? 'border-brand-500 bg-brand-50/40 ring-1 ring-brand-500/20'
                        : isTripped
                        ? 'border-rose-200 bg-rose-50/30'
                        : 'border-slate-200 bg-slate-50/60'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs text-slate-900">{offer.providerName}</span>
                        {isChebelew ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-brand-500 text-white">
                            AUTHORITATIVE
                          </span>
                        ) : isTripped ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-100 text-rose-800">
                            FAILOVER ACTIVE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-200 text-slate-700">
                            AGGREGATED
                          </span>
                        )}
                      </div>

                      {isTripped ? (
                        <div className="py-2">
                          <div className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Outage / Tripped</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">
                            Traffic routed to Chebelew Direct Fleet under fail-safe rules.
                          </p>
                        </div>
                      ) : (
                        <div>
                          <div className="text-xl font-black text-slate-900">
                            {offer.estimatedFare} <span className="text-xs font-bold text-slate-500">{offer.currency}</span>
                          </div>
                          <p className="text-[10px] text-slate-600 mt-0.5">{offer.vehicleDetails}</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-400">ETA / Reliability:</span>
                      <span className="font-bold text-slate-700">
                        {isTripped ? 'Unavailable' : `${offer.estimatedArrivalMins}m • ${offer.reliabilityScore}% score`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Aggregator Routing & Dispatch Audit Logs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-600" />
            <div>
              <h3 className="font-black text-sm text-slate-900">Live Aggregator Traffic & Routing Audit Log</h3>
              <p className="text-slate-500 text-[11px]">
                Persistent event log of multi-fleet quote requests, health pings, failover trips, and dispatches.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearLogs}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition"
              title="Clear traffic logs"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={loadData}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              title="Refresh logs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {routingLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-medium">
            No aggregator traffic events recorded yet. Run a quote test or health ping to generate live telemetry.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-[10px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9px] tracking-wider">
                  <th className="py-2 px-3">Timestamp</th>
                  <th className="py-2 px-3">Event Action</th>
                  <th className="py-2 px-3">Provider</th>
                  <th className="py-2 px-3">Route Corridor</th>
                  <th className="py-2 px-3">Latency</th>
                  <th className="py-2 px-3">HTTP</th>
                  <th className="py-2 px-3">Circuit</th>
                  <th className="py-2 px-3">Telemetry Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {routingLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">{getLogBadge(log.actionStatus)}</td>
                    <td className="py-2 px-3 font-bold text-slate-800 whitespace-nowrap">{log.providerName}</td>
                    <td className="py-2 px-3 text-slate-600 truncate max-w-[200px]" title={`${log.pickupAddress} ➔ ${log.destinationAddress}`}>
                      {log.pickupAddress} ➔ {log.destinationAddress}
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-700 whitespace-nowrap">{log.latencyMs}ms</td>
                    <td className="py-2 px-3 font-bold whitespace-nowrap">
                      <span className={log.httpStatus === 200 ? 'text-emerald-700' : 'text-rose-600'}>
                        {log.httpStatus}
                      </span>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                        log.circuitState === 'CLOSED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : log.circuitState === 'OPEN'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {log.circuitState}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-500 truncate max-w-[240px]" title={log.details}>
                      {log.details || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Provider Modal */}
      {editingProvider && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div>
                <span className="text-brand-400 font-mono text-[10px] font-bold uppercase tracking-wider">
                  Adapter Configuration
                </span>
                <h3 className="text-base font-black">{editingProvider.name}</h3>
              </div>
              <button
                onClick={() => setEditingProvider(null)}
                className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 text-[10px] uppercase">API Endpoint URL</label>
                <input
                  type="text"
                  value={editingProvider.apiUrl}
                  onChange={(e) => setEditingProvider({ ...editingProvider, apiUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 text-xs focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 text-[10px] uppercase">API Key / Token</label>
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-[10px]"
                    >
                      {showApiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showApiKey ? 'Hide' : 'Reveal'}</span>
                    </button>
                  </div>
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={editingProvider.apiKey || ''}
                    onChange={(e) => setEditingProvider({ ...editingProvider, apiKey: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 text-xs focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-[10px] uppercase">Webhook Secret</label>
                  <input
                    type="password"
                    value={editingProvider.webhookSecret || ''}
                    onChange={(e) => setEditingProvider({ ...editingProvider, webhookSecret: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 text-xs focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-[10px] uppercase">Dispatch Integration Mode</label>
                  <select
                    value={editingProvider.dispatchMode || 'polling'}
                    onChange={(e) =>
                      setEditingProvider({
                        ...editingProvider,
                        dispatchMode: e.target.value as 'polling' | 'webhook_push' | 'bidirectional',
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 text-xs"
                  >
                    <option value="polling">REST API Polling</option>
                    <option value="webhook_push">Webhook Event Push</option>
                    <option value="bidirectional">Bidirectional Socket</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-[10px] uppercase">Integration Status</label>
                  <select
                    value={editingProvider.integrationReadinessStatus}
                    onChange={(e) =>
                      setEditingProvider({
                        ...editingProvider,
                        integrationReadinessStatus: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 text-xs"
                  >
                    <option value="live_api">Live Production API</option>
                    <option value="production_ready">Production Ready Adapter</option>
                    <option value="onboarding_readiness">Onboarding Readiness Mode</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-[10px] uppercase">Tariff Multiplier</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProvider.tariffMultiplier || 1.0}
                    onChange={(e) =>
                      setEditingProvider({ ...editingProvider, tariffMultiplier: parseFloat(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-[10px] uppercase">Markup %</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editingProvider.markupPercent || 0}
                    onChange={(e) =>
                      setEditingProvider({ ...editingProvider, markupPercent: parseFloat(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-[10px] uppercase">Timeout (ms)</label>
                  <input
                    type="number"
                    step="500"
                    value={editingProvider.timeoutMs || 3000}
                    onChange={(e) =>
                      setEditingProvider({ ...editingProvider, timeoutMs: parseInt(e.target.value, 10) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-[10px] uppercase">Error Threshold</label>
                  <input
                    type="number"
                    step="1"
                    value={editingProvider.errorThreshold || 3}
                    onChange={(e) =>
                      setEditingProvider({ ...editingProvider, errorThreshold: parseInt(e.target.value, 10) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-[11px] text-indigo-900 leading-relaxed">
                <strong>Founder Mandate Notice:</strong> Changing tariff multipliers or markups only alters quotes for external partner fleets. Chebelew’s independent driver network remains 100% earnings retention and 0% per-trip commission.
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProvider(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md transition"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
