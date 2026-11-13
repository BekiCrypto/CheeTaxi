import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Phone,
  MapPin,
  RefreshCw,
  Search,
  Check,
  X,
} from 'lucide-react';
import { SosIncident } from '@shared/types';
import { sounds } from '../../utils/audio';

export const AdminSosTab: React.FC = () => {
  const [incidents, setIncidents] = useState<SosIncident[]>([]);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadIncidents = async () => {
    try {
      const res = await fetch('/api/safety/incidents');
      const data = await res.json();
      if (data.incidents) setIncidents(data.incidents);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadIncidents();
    const interval = setInterval(loadIncidents, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleResolve = async (id: string) => {
    try {
      const res = await fetch(`/api/safety/incidents/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: resolutionNotes || 'Incident handled by safety supervisor. Parties confirmed safe.',
        }),
      });
      const data = await res.json();
      if (data.success) {
        sounds.playPaymentSuccess();
        setSelectedIncidentId(null);
        setResolutionNotes('');
        setStatusMessage(`Incident #${id.slice(-6)} resolved and archived in police audit log.`);
        await loadIncidents();
        setTimeout(() => setStatusMessage(null), 4000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to resolve incident');
    }
  };

  const openIncidents = incidents.filter((i) => i.status !== 'RESOLVED');

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 overflow-y-auto h-full text-xs">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 text-white p-6 rounded-2xl shadow-sm border border-rose-900/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-rose-500 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                Safety & Police Escalation (991)
              </span>
              <span className="text-white/80 text-xs">FDRE Emergency Operations</span>
            </div>
            <h2 className="text-xl font-black">24/7 Rapid SOS Emergency Response Console</h2>
            <p className="text-white/80 text-xs mt-1 max-w-2xl leading-relaxed">
              Every passenger and driver has an instantaneous SOS trigger. Incidents route directly to the Chebelew Safety Center with automated escalation to the Ethiopian Federal Police (991).
            </p>
          </div>

          <div className="flex items-center gap-6 bg-rose-500/10 p-4 rounded-xl border border-rose-500/20">
            <div>
              <span className="text-[10px] text-white/70 block uppercase font-bold">Active Incidents</span>
              <span className="text-2xl font-black text-rose-400">{openIncidents.length}</span>
            </div>
            <div className="border-l border-white/20 pl-6">
              <span className="text-[10px] text-white/70 block uppercase font-bold">Police Dispatch Hotline</span>
              <span className="text-2xl font-black text-amber-300">991</span>
            </div>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Incidents List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-black text-sm text-slate-900">Incident Feed ({incidents.length})</h3>
            <p className="text-slate-500 text-[11px]">
              Live GPS telemetry, panic button logs, and call center interventions.
            </p>
          </div>
          <button
            onClick={loadIncidents}
            className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {incidents.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
            No safety incidents logged. All vehicles and passengers operating normally.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {incidents.map((inc) => (
              <div key={inc.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">INCIDENT #{inc.id}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        inc.status === 'RESOLVED'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-rose-100 text-rose-800 animate-pulse'
                      }`}
                    >
                      {inc.status}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-500">
                      Reporter: {inc.reporterRole} ({inc.reporterName})
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {inc.reporterPhone}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      {inc.currentLat.toFixed(4)}, {inc.currentLng.toFixed(4)}
                    </span>
                    {inc.rideId && <span className="text-brand-600 font-mono">Ride: {inc.rideId}</span>}
                  </div>

                  <div className="text-[11px] text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <strong>Report:</strong> {inc.safetyNotes || 'SOS Panic Button triggered.'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="tel:991"
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold flex items-center gap-1 transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call 991</span>
                  </a>

                  {inc.status !== 'RESOLVED' && (
                    <button
                      onClick={() => setSelectedIncidentId(inc.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Incident Resolution Modal */}
      {selectedIncidentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-black text-sm text-slate-900">
              Resolve Incident #{selectedIncidentId.slice(-6)}
            </h3>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Police & Supervisor Resolution Notes
              </label>
              <textarea
                rows={3}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="e.g. Driver assisted at Bole Medhanialem by Federal Police patrol. Both passenger and driver are safe."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setSelectedIncidentId(null)}
                className="px-3.5 py-1.5 border border-slate-200 rounded-xl font-bold text-slate-600 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleResolve(selectedIncidentId)}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
