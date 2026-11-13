import React, { useState, useEffect } from 'react';
import {
  Activity,
  Users,
  Car,
  FileText,
  PhoneCall,
  ShieldCheck,
  Download,
  CheckCircle,
  XCircle,
  MapPin,
  Navigation,
  DollarSign,
  TrendingUp,
  AlertCircle,
  LifeBuoy,
  Settings,
  MessageSquare,
  Zap,
  Briefcase,
  Radio,
  AlertTriangle,
} from 'lucide-react';
import { AddisMap } from '../Map/AddisMap';
import { Driver, Ride, SystemMetrics, VatReportSummary, VehicleCategory, SupportTicket } from '@shared/types';
import { translations, Language } from '../../i18n/translations';
import { ADDIS_LANDMARKS, AddisLandmark } from '@shared/landmarks';
import { AdminSubscriptionLedgerTab } from './AdminSubscriptionLedgerTab';
import { AdminCorporateTab } from './AdminCorporateTab';
import { AdminProviderTab } from './AdminProviderTab';
import { AdminSosTab } from './AdminSosTab';

interface AdminViewProps {
  language: Language;
  socket: any;
}

export const AdminView: React.FC<AdminViewProps> = ({ language, socket }) => {
  const t = translations[language];

  const [activeTab, setActiveTab] = useState<
    | 'fleet'
    | 'callcenter'
    | 'subscriptions'
    | 'corporate'
    | 'providers'
    | 'sos'
    | 'kyc'
    | 'vat'
    | 'tickets'
    | 'tariffs'
  >('fleet');
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [activeRides, setActiveRides] = useState<Ride[]>([]);
  const [kycQueue, setKycQueue] = useState<any[]>([]);

  // Tickets & Tariffs
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [tariffs, setTariffs] = useState<any>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // VAT Report
  const [vatSummary, setVatSummary] = useState<VatReportSummary | null>(null);
  const [vatItems, setVatItems] = useState<any[]>([]);

  // Manual Dispatch State
  const [callerPhone, setCallerPhone] = useState('+251911998877');
  const [callerName, setCallerName] = useState('Abebe Bikila');
  const [pickupLandmark, setPickupLandmark] = useState(ADDIS_LANDMARKS[1].name); // Meskel Sq
  const [destLandmark, setDestLandmark] = useState(ADDIS_LANDMARKS[0].name); // Bole Airport
  const [selectedCategory, setSelectedCategory] = useState<VehicleCategory>('sedan');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [dispatchSuccessMsg, setDispatchSuccessMsg] = useState<string | null>(null);

  // Fetch metrics & fleet
  const loadDashboardData = () => {
    fetch('/api/admin/metrics')
      .then((res) => res.json())
      .then((data) => {
        if (data.metrics) setMetrics(data.metrics);
      })
      .catch(console.error);

    fetch('/api/admin/live-map')
      .then((res) => res.json())
      .then((data) => {
        if (data.drivers) setDrivers(data.drivers);
        if (data.activeRides) setActiveRides(data.activeRides);
      })
      .catch(console.error);

    fetch('/api/admin/kyc-queue')
      .then((res) => res.json())
      .then((data) => {
        if (data.pendingDrivers) setKycQueue(data.pendingDrivers);
      })
      .catch(console.error);

    fetch('/api/admin/vat-report')
      .then((res) => res.json())
      .then((data) => {
        if (data.summary) setVatSummary(data.summary);
        if (data.items) setVatItems(data.items);
      })
      .catch(console.error);

    fetch('/api/admin/tickets')
      .then((res) => res.json())
      .then((data) => {
        if (data.tickets) setTickets(data.tickets);
      })
      .catch(console.error);

    fetch('/api/admin/tariffs')
      .then((res) => res.json())
      .then((data) => {
        if (data.tariffs) setTariffs(data.tariffs);
      })
      .catch(console.error);
  };

  const handleResolveTicket = async (ticketId: string) => {
    try {
      await fetch(`/api/admin/tickets/${ticketId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: resolutionNotes || 'Resolved by Call Center supervisor.' }),
      });
      setSelectedTicket(null);
      setResolutionNotes('');
      loadDashboardData();
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Socket Admin Room
  useEffect(() => {
    if (!socket) return;
    socket.emit('join:admin');

    const onTripUpdated = () => loadDashboardData();
    const onDriverMoved = (data: { driverId: string; lat: number; lng: number; heading: number }) => {
      setDrivers((prev) =>
        prev.map((d) =>
          d.id === data.driverId
            ? { ...d, currentLat: data.lat, currentLng: data.lng, heading: data.heading }
            : d
        )
      );
    };

    socket.on('admin:new_trip', onTripUpdated);
    socket.on('admin:trip_updated', onTripUpdated);
    socket.on('admin:driver_moved', onDriverMoved);

    return () => {
      socket.off('admin:new_trip', onTripUpdated);
      socket.off('admin:trip_updated', onTripUpdated);
      socket.off('admin:driver_moved', onDriverMoved);
    };
  }, [socket]);

  // Handle Manual Call-Center Dispatch
  const handleManualDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const pLandmark = ADDIS_LANDMARKS.find((l: AddisLandmark) => l.name === pickupLandmark)!;
    const dLandmark = ADDIS_LANDMARKS.find((l: AddisLandmark) => l.name === destLandmark)!;

    try {
      const res = await fetch('/api/admin/manual-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callerPhone,
          callerName,
          pickup: {
            address: pLandmark.name,
            addressAm: pLandmark.nameAm,
            lat: pLandmark.lat,
            lng: pLandmark.lng,
          },
          destination: {
            address: dLandmark.name,
            addressAm: dLandmark.nameAm,
            lat: dLandmark.lat,
            lng: dLandmark.lng,
          },
          vehicleCategory: selectedCategory,
          assignedDriverId: selectedDriverId || undefined,
          operatorNotes: 'Dispatched via Addis Ababa Central Dispatch (9922)',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setDispatchSuccessMsg(`Taxi Dispatched successfully! Trip #${data.ride.id}`);
        loadDashboardData();
        setTimeout(() => setDispatchSuccessMsg(null), 5000);
      }
    } catch (err: any) {
      alert(err.message || 'Dispatch failed');
    }
  };

  // Handle KYC Decision
  const handleKycDecision = async (driverId: string, approved: boolean) => {
    try {
      await fetch(`/api/admin/kyc/${driverId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approved,
          notes: approved ? 'Documents verified against INSA records' : 'Invalid taxi permit',
        }),
      });
      loadDashboardData();
    } catch (err) {
      console.error('Failed KYC decision:', err);
    }
  };

  // Export VAT Report to CSV
  const handleExportVatCsv = () => {
    if (!vatItems || vatItems.length === 0) return;

    const headers = [
      'TripID',
      'Date',
      'Passenger',
      'PaymentMethod',
      'GrossFareETB',
      'VAT15PercentETB',
      'PlatformCommission15PercentETB',
      'DriverNetPayoutETB',
      'TelebirrTxNo',
    ];

    const rows = vatItems.map((item) => [
      item.rideId,
      item.createdAt,
      `"${item.riderName}"`,
      item.paymentMethod,
      item.grossFareEtb,
      item.vat15PercentEtb,
      item.platformCommission15PercentEtb,
      item.driverNetPayoutEtb,
      item.telebirrTxNo,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `chebelew_vat_report_reg570_2025.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-68px)] w-full overflow-hidden bg-slate-100">
      {/* Top Operations KPI Banner */}
      <div className="bg-slate-900 text-white px-6 py-4 border-b border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-base font-extrabold tracking-tight">
                Chebelew Operations & Dispatch Central (አዲስ አበባ)
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Live Fleet Monitoring • Manual Call-In Dispatch • Ministry of Revenues VAT Reg 570/2025
            </p>
          </div>

          {metrics && (
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700">
                <span className="text-slate-400 block text-[10px]">ACTIVE FLEET</span>
                <span className="text-white font-bold text-sm">
                  {metrics.onlineDriversCount} Online / {metrics.activeDriversCount} Total
                </span>
              </div>
              <div className="bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700">
                <span className="text-slate-400 block text-[10px]">TODAY'S GMV</span>
                <span className="text-emerald-400 font-bold text-sm">
                  {metrics.todayGmvEtb.toFixed(2)} ETB
                </span>
              </div>
              <div className="bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700">
                <span className="text-slate-400 block text-[10px]">15% VAT REMITTED</span>
                <span className="text-amber-400 font-bold text-sm">
                  {metrics.todayVatCollectedEtb.toFixed(2)} ETB
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1.5 mt-4 text-xs font-bold overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('fleet')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'fleet' ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>{t.liveFleetMap}</span>
          </button>
          <button
            onClick={() => setActiveTab('callcenter')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'callcenter' ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>9922 Dispatch</span>
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'subscriptions' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>0% Subscriptions</span>
          </button>
          <button
            onClick={() => setActiveTab('corporate')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'corporate' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Corporate & Fleets</span>
          </button>
          <button
            onClick={() => setActiveTab('providers')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'providers' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Aggregators (RIDE/Feres)</span>
          </button>
          <button
            onClick={() => setActiveTab('sos')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'sos' ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-800 text-rose-300 hover:bg-slate-700'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Safety SOS (991)</span>
          </button>
          <button
            onClick={() => setActiveTab('kyc')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'kyc' ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>KYC ({kycQueue.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('vat')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'vat' ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>VAT 570/2025</span>
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'tickets' ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Tickets ({tickets.filter(t => t.status === 'OPEN').length})</span>
          </button>
          <button
            onClick={() => setActiveTab('tariffs')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'tariffs' ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Tariff Rules</span>
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 overflow-hidden relative">
        {/* Tab 1: Live Fleet Map */}
        {activeTab === 'fleet' && (
          <div className="flex h-full w-full">
            <div className="w-80 bg-white border-r border-slate-200 p-4 overflow-y-auto space-y-3 hidden md:block">
              <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                Active Trips ({activeRides.length})
              </h3>

              {activeRides.length === 0 ? (
                <div className="text-xs text-slate-400 py-6 text-center">
                  No trips currently in progress.
                </div>
              ) : (
                activeRides.map((ride) => (
                  <div
                    key={ride.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-slate-800">#{ride.id}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand-100 text-brand-800">
                        {ride.status}
                      </span>
                    </div>
                    <div className="text-slate-600 truncate">
                      <strong>Rider:</strong> {ride.riderName} ({ride.riderPhone})
                    </div>
                    <div className="text-slate-600 truncate">
                      <strong>Driver:</strong> {ride.driver?.fullName || 'Searching...'}
                    </div>
                    <div className="text-emerald-700 font-bold font-mono">
                      {ride.fare.totalFare.toFixed(2)} ETB ({ride.paymentMethod})
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex-1 h-full">
              <AddisMap drivers={drivers} />
            </div>
          </div>
        )}

        {/* Tab 2: Call-Center Manual Phone Dispatch */}
        {activeTab === 'callcenter' && (
          <div className="max-w-2xl mx-auto p-8 overflow-y-auto h-full">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
              <div className="border-b pb-4">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <PhoneCall className="w-5 h-5 text-brand-500" />
                  {t.callCenterBooking}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Dispatch a taxi for callers without internet or using non-smartphone feature phones in Addis Ababa.
                </p>
              </div>

              {dispatchSuccessMsg && (
                <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{dispatchSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleManualDispatch} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">{t.callerPhone}</label>
                    <input
                      type="text"
                      value={callerPhone}
                      onChange={(e) => setCallerPhone(e.target.value)}
                      required
                      className="w-full border border-slate-300 rounded-lg p-2.5 font-mono text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">{t.callerName}</label>
                    <input
                      type="text"
                      value={callerName}
                      onChange={(e) => setCallerName(e.target.value)}
                      required
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">{t.pickup}</label>
                    <select
                      value={pickupLandmark}
                      onChange={(e) => setPickupLandmark(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    >
                      {ADDIS_LANDMARKS.map((l: AddisLandmark) => (
                        <option key={l.id} value={l.name}>
                          {l.name} ({l.nameAm})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">{t.destination}</label>
                    <select
                      value={destLandmark}
                      onChange={(e) => setDestLandmark(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    >
                      {ADDIS_LANDMARKS.map((l: AddisLandmark) => (
                        <option key={l.id} value={l.name}>
                          {l.name} ({l.nameAm})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Vehicle Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value as any)}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    >
                      <option value="sedan">Chebelew Standard (Sedan)</option>
                      <option value="minivan">Chebelew XL (Minivan 7-Seater)</option>
                      <option value="comfort">Executive Comfort VIP</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Direct Driver Assignment (Optional)
                    </label>
                    <select
                      value={selectedDriverId}
                      onChange={(e) => setSelectedDriverId(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    >
                      <option value="">Auto-Match Closest Online Driver</option>
                      {drivers
                        .filter((d) => d.isOnline && !d.isBusy)
                        .map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.fullName} ({d.vehiclePlate} - {d.vehicleCategory})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-xl shadow-md transition text-xs mt-2"
                >
                  {t.dispatchDriver}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 3: Driver KYC Approvals */}
        {activeTab === 'kyc' && (
          <div className="max-w-4xl mx-auto p-8 overflow-y-auto h-full">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
              <div className="border-b pb-3">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  {t.driverKycQueue}
                </h3>
                <p className="text-xs text-slate-500">
                  Compliance review per Addis Ababa Transport Bureau Directive & INSA verification.
                </p>
              </div>

              {kycQueue.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No drivers currently pending KYC review. All active drivers verified.
                </div>
              ) : (
                <div className="space-y-3">
                  {kycQueue.map((driver) => (
                    <div
                      key={driver.id}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-4 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-800 text-sm">{driver.full_name}</div>
                        <div className="text-slate-500 mt-0.5">
                          Phone: <strong>{driver.phone}</strong> | License: <code>{driver.license_number}</code>
                        </div>
                        <div className="text-slate-600 mt-1">
                          Vehicle: {driver.vehicle_make} {driver.vehicle_model} ({driver.vehicle_year}) •
                          Plate: <strong className="font-mono">{driver.vehicle_plate}</strong> ({driver.vehicle_category})
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleKycDecision(driver.id, false)}
                          className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold flex items-center gap-1 transition"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>{t.reject}</span>
                        </button>
                        <button
                          onClick={() => handleKycDecision(driver.id, true)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1 shadow-sm transition"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>{t.approve}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Ethiopian VAT Regulation No. 570/2025 Ledger */}
        {activeTab === 'vat' && (
          <div className="max-w-6xl mx-auto p-8 overflow-y-auto h-full space-y-5">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-amber-500" />
                    {t.vatReportTitle}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {vatSummary?.vatRegulationReference}
                  </p>
                </div>

                <button
                  onClick={handleExportVatCsv}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-2 transition shadow"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Ministry of Revenues CSV</span>
                </button>
              </div>

              {/* VAT Aggregate Metrics */}
              {vatSummary && (
                <div className="grid grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">TOTAL GROSS GMV</span>
                    <span className="text-base font-extrabold text-slate-900">
                      {vatSummary.totalGrossGmvEtb.toFixed(2)} ETB
                    </span>
                  </div>
                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                    <span className="text-amber-800 block text-[10px] font-bold">
                      15% VAT REMITTABLE LIABILITY
                    </span>
                    <span className="text-base font-black text-amber-700">
                      {vatSummary.totalVatRemittableEtb.toFixed(2)} ETB
                    </span>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-xl border border-blue-200">
                    <span className="text-blue-800 block text-[10px]">PLATFORM 15% REVENUE</span>
                    <span className="text-base font-extrabold text-blue-900">
                      {vatSummary.totalPlatformCommissionEtb.toFixed(2)} ETB
                    </span>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                    <span className="text-emerald-800 block text-[10px]">DRIVER NET PAYOUT</span>
                    <span className="text-base font-extrabold text-emerald-900">
                      {vatSummary.totalDriverNetPayoutEtb.toFixed(2)} ETB
                    </span>
                  </div>
                </div>
              )}

              {/* Ledger Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Trip ID</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Passenger</th>
                      <th className="p-3">Payment</th>
                      <th className="p-3 text-right">Gross GMV</th>
                      <th className="p-3 text-right text-amber-700 font-bold">15% VAT</th>
                      <th className="p-3 text-right">Platform Fee</th>
                      <th className="p-3 text-right text-emerald-700 font-bold">Driver Net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {vatItems.map((item) => (
                      <tr key={item.rideId} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-800">{item.rideId}</td>
                        <td className="p-3 text-slate-500 font-sans">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-slate-700 font-sans">{item.riderName}</td>
                        <td className="p-3 font-sans">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100">
                            {item.paymentMethod}
                          </span>
                        </td>
                        <td className="p-3 text-right font-bold text-slate-900">
                          {item.grossFareEtb.toFixed(2)} ETB
                        </td>
                        <td className="p-3 text-right font-bold text-amber-600 bg-amber-50/50">
                          {item.vat15PercentEtb.toFixed(2)} ETB
                        </td>
                        <td className="p-3 text-right text-slate-600">
                          {item.platformCommission15PercentEtb.toFixed(2)} ETB
                        </td>
                        <td className="p-3 text-right font-bold text-emerald-600">
                          {item.driverNetPayoutEtb.toFixed(2)} ETB
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Support Tickets & Dispute Resolution */}
        {activeTab === 'tickets' && (
          <div className="max-w-5xl mx-auto p-8 overflow-y-auto h-full space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
              <div className="border-b pb-3 flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <LifeBuoy className="w-5 h-5 text-brand-500" />
                    Customer Support & Incident Resolution
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Manage lost item reports, fare disputes, and Telebirr payment inquiries.
                  </p>
                </div>
                <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold">
                  {tickets.length} Total Tickets
                </span>
              </div>

              {tickets.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">No support tickets reported.</div>
              ) : (
                <div className="space-y-3">
                  {tickets.map((t) => (
                    <div
                      key={t.id}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 hover:border-brand-300 transition"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-800">#{t.id}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            t.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {t.status}
                          </span>
                          <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium uppercase">
                            {t.category.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-sans">
                          {new Date(t.created_at).toLocaleString()}
                        </span>
                      </div>

                      <div className="font-bold text-slate-800 text-sm">{t.subject}</div>
                      <p className="text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100">
                        "{t.message}"
                      </p>

                      <div className="flex justify-between items-center pt-2 text-[11px] text-slate-500">
                        <div>
                          <strong>User:</strong> {t.user_name} ({t.user_phone}) • Role: {t.user_role}
                          {t.ride_id && <span> • Linked Trip: <code className="bg-slate-100 px-1 py-0.5 rounded">{t.ride_id}</code></span>}
                        </div>

                        {t.status === 'OPEN' ? (
                          <button
                            onClick={() => setSelectedTicket(t)}
                            className="bg-brand-500 hover:bg-brand-600 text-white font-bold px-3 py-1.5 rounded-lg transition"
                          >
                            Resolve Ticket
                          </button>
                        ) : (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Resolved: {t.resolution_notes || 'Closed'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ticket Resolution Modal */}
            {selectedTicket && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
                  <h4 className="font-bold text-sm text-slate-800">
                    Resolve Ticket #{selectedTicket.id}
                  </h4>
                  <p className="text-xs text-slate-500">{selectedTicket.subject}</p>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Resolution Summary / Notes</label>
                    <textarea
                      rows={3}
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="e.g., Driver contacted; item returned; fare difference refunded via Telebirr."
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setSelectedTicket(null)}
                      className="px-3 py-1.5 rounded-lg border text-xs font-semibold text-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleResolveTicket(selectedTicket.id)}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition"
                    >
                      Confirm Resolution
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 6: Tariffs & Regulatory Configuration */}
        {activeTab === 'tariffs' && tariffs && (
          <div className="max-w-4xl mx-auto p-8 overflow-y-auto h-full space-y-5">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
              <div className="border-b pb-3">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-brand-500" />
                  Active Tariff Engine & Regulatory Parameters
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  City of Addis Ababa Transport Bureau rates & FDRE VAT Regulation No. 570/2025.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {Object.entries(tariffs).map(([key, t]: [string, any]) => (
                  <div key={key} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="font-bold text-slate-800 text-sm">{t.displayName}</div>
                    <div className="text-[11px] text-slate-500">{t.description}</div>
                    <div className="pt-2 border-t border-slate-200 space-y-1 font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span>Base Fare:</span>
                        <strong className="text-slate-800">{t.baseFare} ETB</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Per Kilometer:</span>
                        <strong className="text-slate-800">{t.perKm} ETB/km</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Per Minute:</span>
                        <strong className="text-slate-800">{t.perMinute} ETB/min</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Minimum Fare:</span>
                        <strong className="text-slate-800">{t.minFare} ETB</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-xs text-blue-900 space-y-1">
                <div className="font-bold">Taxation & Commercial Policy (Founder Mandate 2.0):</div>
                <p>• <strong>15% VAT:</strong> Automatically added to gross ride fare and remitted to FDRE Ministry of Revenues per Regulation No. 570/2025.</p>
                <p>• <strong>0% Platform Take Rate:</strong> Subscribed independent drivers keep 100% of their trip earnings! No per-trip commission deductions.</p>
                <p>• <strong>1% Telebirr Fee:</strong> Processing fee for Ethio Telecom payment gateway settlements.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 7: Subscriptions Ledger */}
        {activeTab === 'subscriptions' && <AdminSubscriptionLedgerTab />}

        {/* Tab 8: Corporate & Fleets */}
        {activeTab === 'corporate' && <AdminCorporateTab />}

        {/* Tab 9: Aggregator Providers & Circuit Breakers */}
        {activeTab === 'providers' && <AdminProviderTab />}

        {/* Tab 10: Safety & SOS Emergency Console */}
        {activeTab === 'sos' && <AdminSosTab />}
      </div>
    </div>
  );
};
