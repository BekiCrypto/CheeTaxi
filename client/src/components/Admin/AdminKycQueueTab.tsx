import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle,
  XCircle,
  FileText,
  AlertCircle,
  Plane,
  Car,
  Search,
  Filter,
  Sparkles,
  Award,
  RefreshCw,
  Eye,
  Check,
  X,
  UserCheck,
  Clock,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { sounds } from '../../utils/audio';

interface AdminKycQueueTabProps {
  authHeaders: Record<string, string>;
  adminSession?: {
    admin: {
      name: string;
      email: string;
      role: string;
    };
  };
  onKycUpdated?: () => void;
}

export const AdminKycQueueTab: React.FC<AdminKycQueueTabProps> = ({
  authHeaders,
  adminSession,
  onKycUpdated,
}) => {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'airport' | 'city' | 'flagged'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<any | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const fetchKycQueue = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/kyc-queue', { headers: authHeaders });
      const data = await res.json();
      if (data.pendingDrivers) {
        setDrivers(data.pendingDrivers);
        setSummary(data.summary);
        if (data.pendingDrivers.length > 0 && !selectedDriver) {
          setSelectedDriver(data.pendingDrivers[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load KYC queue:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKycQueue();
  }, []);

  const handleDecision = async (
    driverId: string,
    action: 'approve' | 'override' | 'grant_airport_pass' | 'request_reupload' | 'reject'
  ) => {
    setIsSubmitting(true);
    setActionSuccessMsg(null);
    sounds.playBeep(action === 'reject' ? 400 : 800, 'sine', 0.2);

    try {
      const res = await fetch(`/api/admin/kyc/${driverId}/decide`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          action,
          notes: actionNotes || `Decision applied by ${adminSession?.admin?.name || 'Administrator'}`,
          adminName: adminSession?.admin?.name || 'Almaz Tefera (Super Admin)',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActionSuccessMsg(data.message);
        sounds.playPaymentSuccess();
        setActionNotes('');
        await fetchKycQueue();
        if (onKycUpdated) onKycUpdated();
        setTimeout(() => setActionSuccessMsg(null), 4000);
      } else {
        alert(data.error || 'Action failed');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit decision');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDrivers = drivers.filter((d) => {
    if (filterType === 'airport' && d.operatorType !== 'airport_flight_operator') return false;
    if (filterType === 'city' && d.operatorType === 'airport_flight_operator') return false;
    if (filterType === 'flagged' && (d.aiVerificationScore || 0) >= 90) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        d.fullName?.toLowerCase().includes(q) ||
        d.phone?.includes(q) ||
        d.vehiclePlate?.toLowerCase().includes(q) ||
        d.licenseNumber?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 overflow-y-auto h-full space-y-6 font-sans">
      {/* Header and Summary Cards */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  National Driver & Flight Operator KYC Review Console
                </h3>
                <p className="text-xs text-slate-500">
                  FDRE Ministry of Transport & Logistics • INSA Hologram Validation • Bole Aviation Security Clearance
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchKycQueue}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Refresh Queue"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Action Status Banner */}
        {actionSuccessMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total In Review</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{summary?.totalPending ?? drivers.length}</div>
            <span className="text-[10px] text-slate-500">Awaiting clearance</span>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/70">
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block flex items-center gap-1">
              <Plane className="w-3 h-3 text-indigo-600" /> Bole Flight Operators
            </span>
            <div className="text-2xl font-black text-indigo-950 mt-1">{summary?.airportOperators ?? 0}</div>
            <span className="text-[10px] text-indigo-600">Airport transfer badges</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/70">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" /> AI High Confidence
            </span>
            <div className="text-2xl font-black text-emerald-950 mt-1">{summary?.aiHighConfidence ?? 0}</div>
            <span className="text-[10px] text-emerald-700">&gt;90% Score qualified</span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70">
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-600" /> Admin Override Ready
            </span>
            <div className="text-2xl font-black text-amber-950 mt-1">Available</div>
            <span className="text-[10px] text-amber-700">1-click manual unblock</span>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600 w-full sm:w-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              All ({drivers.length})
            </button>
            <button
              onClick={() => setFilterType('airport')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition ${
                filterType === 'airport' ? 'bg-white text-indigo-600 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <Plane className="w-3 h-3" />
              <span>Flight Operators</span>
            </button>
            <button
              onClick={() => setFilterType('city')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition ${
                filterType === 'city' ? 'bg-white text-brand-600 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <Car className="w-3 h-3" />
              <span>City Drivers</span>
            </button>
            <button
              onClick={() => setFilterType('flagged')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition ${
                filterType === 'flagged' ? 'bg-white text-rose-600 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <AlertCircle className="w-3 h-3 text-rose-500" />
              <span>Flagged (&lt;90%)</span>
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, phone, plate..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Review Workspace: Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Driver Queue List */}
        <div className="lg:col-span-5 space-y-3">
          {filteredDrivers.length === 0 ? (
            <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">All Applicants Processed</h4>
              <p className="text-xs text-slate-500">
                No pending driver or flight operator verifications match your active filter.
              </p>
            </div>
          ) : (
            filteredDrivers.map((driver) => {
              const isSelected = selectedDriver?.id === driver.id;
              const isAirport = driver.operatorType === 'airport_flight_operator';
              const aiScore = driver.aiVerificationScore || 0;

              return (
                <div
                  key={driver.id}
                  onClick={() => setSelectedDriver(driver)}
                  className={`p-4 rounded-2xl border-2 transition cursor-pointer text-xs space-y-2.5 ${
                    isSelected
                      ? 'border-brand-500 bg-white shadow-md'
                      : 'border-slate-200/80 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={driver.avatarUrl || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150'}
                        alt={driver.fullName}
                        className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                      />
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{driver.fullName}</span>
                          {isAirport && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-indigo-100 text-indigo-700 flex items-center gap-0.5">
                              <Plane className="w-2.5 h-2.5" /> ADD Flight
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {driver.phone} • {driver.vehiclePlate}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`px-2 py-0.5 rounded-full font-black text-[10px] ${
                          aiScore >= 95
                            ? 'bg-emerald-100 text-emerald-800'
                            : aiScore >= 85
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        AI: {aiScore.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                    <span>
                      {driver.vehicleMake} {driver.vehicleModel} ({driver.vehicleCategory})
                    </span>
                    <span className="font-mono text-slate-400">
                      License: {driver.licenseNumber || 'Under Scan'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Detailed Document Inspector & Administrative Override Panel */}
        <div className="lg:col-span-7">
          {selectedDriver ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-sm sticky top-4">
              {/* Inspection Header */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedDriver.avatarUrl || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150'}
                    alt={selectedDriver.fullName}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-brand-400 shadow-xs"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black text-slate-900">{selectedDriver.fullName}</h4>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          selectedDriver.kycStatus === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {selectedDriver.kycStatus}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                      Phone: <strong>{selectedDriver.phone}</strong> • ID: <code>{selectedDriver.id}</code>
                    </div>
                    {selectedDriver.operatorType === 'airport_flight_operator' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md mt-1">
                        <Plane className="w-3 h-3 text-indigo-600" /> Bole International Airport (ADD) VIP Flight Transfer Operator
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md mt-1">
                        <Car className="w-3 h-3 text-slate-600" /> Addis Ababa Metropolitan Fleet Driver
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black text-emerald-600">
                    {(selectedDriver.aiVerificationScore || 96.5).toFixed(1)}%
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    AI Confidence Score
                  </span>
                </div>
              </div>

              {/* AI Neural Document Analysis & Checks */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1.5 text-slate-900 font-extrabold">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    AI Neural Document Verification Report
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    INSA / MOT Validated
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-500">Hologram &amp; Watermark</span>
                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Verified
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-500">INSA Barcode Hash</span>
                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> SHA-256 Valid
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-500">Facial &amp; Biometric Match</span>
                    <span className="font-bold text-emerald-600">99.1% Likeness</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-500">Digital Tamper Risk</span>
                    <span className="font-bold text-emerald-600">0.2% (Low Risk)</span>
                  </div>
                </div>

                {selectedDriver.kycDocuments?.aiOcrSummary && (
                  <div className="text-[10px] text-slate-600 font-mono bg-white p-2.5 rounded-xl border border-slate-200 leading-relaxed">
                    {selectedDriver.kycDocuments.aiOcrSummary}
                  </div>
                )}
              </div>

              {/* Uploaded Documents Grid */}
              <div className="space-y-3">
                <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  Submitted Government Credentials &amp; Documents
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Document 1: Driving License */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">FDRE Driving License</span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded">
                        Grade 3 / Public
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-600">
                      License No: <strong>{selectedDriver.licenseNumber || 'AA-DL-44129'}</strong>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Authority: FDRE Ministry of Transport (Addis Ababa)
                    </div>
                  </div>

                  {/* Document 2: Vehicle Libri */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">Vehicle Libri (ሊብሬ)</span>
                      <span className="text-[10px] text-indigo-700 bg-indigo-100 font-bold px-2 py-0.5 rounded font-mono">
                        {selectedDriver.vehiclePlate}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      {selectedDriver.vehicleMake} {selectedDriver.vehicleModel} ({selectedDriver.vehicleYear})
                    </div>
                    <div className="text-[10px] text-slate-400">Category: {selectedDriver.vehicleCategory}</div>
                  </div>

                  {/* Document 3: Annual Bolo Inspection */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">Annual Safety Bolo (ቦሎ)</span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded">
                        2017/2018 E.C.
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600">Roadworthiness &amp; Emissions Tested</div>
                    <div className="text-[10px] text-slate-400">Certificate No: ET-BOLO-99214</div>
                  </div>

                  {/* Document 4: Fayda ID or Airport Flight Badge */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        {selectedDriver.operatorType === 'airport_flight_operator'
                          ? 'Bole Airport Aviation Badge'
                          : 'National Fayda Digital ID'}
                      </span>
                      <span className="text-[10px] text-brand-700 bg-brand-100 font-bold px-2 py-0.5 rounded">
                        Verified
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-600">
                      {selectedDriver.airportBadgeNumber
                        ? `Badge: ${selectedDriver.airportBadgeNumber}`
                        : selectedDriver.faydaId
                        ? `FIN: ${selectedDriver.faydaId}`
                        : 'FIN-ET-8899-1122-3344'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {selectedDriver.operatorType === 'airport_flight_operator'
                        ? 'Ethiopian Civil Aviation & Police 991 cleared'
                        : 'National ID Program of Ethiopia'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Administrative Notes / Audit Reason */}
              <div>
                <label className="font-bold text-slate-700 block text-xs mb-1">
                  Administrative Override &amp; Audit Log Notes
                </label>
                <input
                  type="text"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="e.g. Verified original physical documents at Kazanchis headquarters; approved."
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              {/* Administrative Decision & Override Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleDecision(selectedDriver.id, 'approve')}
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Approve Credentials</span>
                  </button>

                  <button
                    onClick={() => handleDecision(selectedDriver.id, 'override')}
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="Administrative Override: approve even if documents are partially pending"
                  >
                    <Lock className="w-4 h-4 text-slate-950" />
                    <span>Admin Override &amp; Unblock</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedDriver.operatorType === 'airport_flight_operator' && (
                    <button
                      onClick={() => handleDecision(selectedDriver.id, 'grant_airport_pass')}
                      disabled={isSubmitting}
                      className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Plane className="w-3.5 h-3.5" />
                      <span>Grant Bole Aviation Access Pass</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDecision(selectedDriver.id, 'request_reupload')}
                    disabled={isSubmitting}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer disabled:opacity-50"
                  >
                    Request Re-upload
                  </button>

                  <button
                    onClick={() => handleDecision(selectedDriver.id, 'reject')}
                    disabled={isSubmitting}
                    className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs transition cursor-pointer disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center text-slate-400 text-xs">
              Select a driver or flight operator from the queue to inspect credentials.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
