import React, { useState, useEffect, useRef } from 'react';
import {
  Power,
  Navigation,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp,
  MapPin,
  Car,
  Shield,
  Smartphone,
  Phone,
  AlertCircle,
  Play,
  Pause,
  Award,
  WifiOff,
  RefreshCw,
  Zap,
  Package,
  AlertTriangle,
  UserPlus,
  ShieldAlert,
  Flame,
  Fuel,
  Wrench,
  ShieldCheck,
  Calculator,
  Target,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import { AddisMap } from '../Map/AddisMap';
import { DemandHeatmapZone, Driver, DriverNetProfitability, DriverOperatingExpenses, Ride, VehicleCategory } from '@shared/types';
import { MultiProviderRideOffer, rankAndRecommendOffers } from '@shared/tripOptimizer';
import { translations, Language } from '../../i18n/translations';
import { sounds } from '../../utils/audio';
import { DriverSubscriptionTab } from './DriverSubscriptionTab';
import { DriverDeliveryTab } from './DriverDeliveryTab';
import { DriverKYCVerification } from './DriverKYCVerification';
import { DriverOnboardingModal } from '../Onboarding/DriverOnboardingModal';
import { DriverPaymentRailsTab } from './DriverPaymentRailsTab';

interface DriverViewProps {
  currentDriverId: string;
  language: Language;
  socket: any;
  onRideActive?: (ride: Ride | null) => void;
}

export const DriverView: React.FC<DriverViewProps> = ({
  currentDriverId,
  language,
  socket,
  onRideActive,
}) => {
  const t = translations[language];

  const [driver, setDriver] = useState<Driver | null>(null);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [incomingRide, setIncomingRide] = useState<Ride | null>(null);
  const [multiOffers, setMultiOffers] = useState<MultiProviderRideOffer[]>([]);
  const [selectedOfferIdx, setSelectedOfferIdx] = useState<number>(0);
  const [countdown, setCountdown] = useState<number>(30);
  const [activeTab, setActiveTab] = useState<'trip' | 'subscription' | 'deliveries' | 'earnings' | 'kyc' | 'heatmap' | 'payout_rails'>('trip');
  const [sosActive, setSosActive] = useState(false);
  const [sosMessage, setSosMessage] = useState<string | null>(null);
  const [showDriverOnboardingModal, setShowDriverOnboardingModal] = useState(false);

  // Demand Heatmap Intelligence (Workstream 8)
  const [heatmapZones, setHeatmapZones] = useState<DemandHeatmapZone[]>([]);
  const [forecastPeriod, setForecastPeriod] = useState<'next_15_mins' | 'next_30_mins' | 'next_60_mins'>('next_30_mins');

  // Driver Profitability & Net Earnings (Workstream 9)
  const [profitability, setProfitability] = useState<DriverNetProfitability | null>(null);
  const [expenses, setExpenses] = useState<DriverOperatingExpenses | null>(null);
  const [showEditExpenses, setShowEditExpenses] = useState(false);
  const [editFuelCost, setEditFuelCost] = useState('4.2');
  const [editMaintenance, setEditMaintenance] = useState('80.0');

  const fetchHeatmap = () => {
    fetch(`/api/drivers/heatmap?forecast=${forecastPeriod}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.zones) setHeatmapZones(data.zones);
      })
      .catch(console.error);
  };

  const fetchProfitability = () => {
    if (!driver) return;
    fetch(`/api/drivers/${driver.id}/profitability`)
      .then((res) => res.json())
      .then((data) => {
        if (data.profitability) setProfitability(data.profitability);
      })
      .catch(console.error);

    fetch(`/api/drivers/${driver.id}/expenses`)
      .then((res) => res.json())
      .then((data) => {
        if (data.expenses) {
          setExpenses(data.expenses);
          setEditFuelCost(String(data.expenses.fuelCostPerKm));
          setEditMaintenance(String(data.expenses.dailyMaintenanceEtb));
        }
      })
      .catch(console.error);
  };

  const handleSaveExpenses = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driver) return;
    try {
      const res = await fetch(`/api/drivers/${driver.id}/expenses`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fuelCostPerKm: parseFloat(editFuelCost) || 4.2,
          dailyMaintenanceEtb: parseFloat(editMaintenance) || 80.0,
        }),
      });
      if (res.ok) {
        setShowEditExpenses(false);
        fetchProfitability();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerDriverSos = async () => {
    if (!driver) return;
    if (!window.confirm('Trigger Police 991 & Chebelew Emergency Response?')) return;
    sounds.playBeep(900, 'sawtooth', 0.5);
    try {
      const res = await fetch('/api/safety/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rideId: activeRide?.id,
          reporterUserId: driver.userId,
          reporterName: driver.fullName,
          reporterPhone: driver.phone,
          reporterRole: 'driver',
          currentLat: driver.currentLat,
          currentLng: driver.currentLng,
          notes: 'Driver SOS Panic Button triggered from in-cab dashboard.',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSosActive(true);
        setSosMessage('SOS Dispatched! Police 991 & Chebelew Operations alerted.');
        setTimeout(() => setSosMessage(null), 8000);
      }
    } catch (e: any) {
      alert('Failed to send SOS: ' + e.message);
    }
  };
  const [isSimulatingMove, setIsSimulatingMove] = useState(false);
  const simIntervalRef = useRef<any>(null);

  // Payout state
  const [payoutAmount, setPayoutAmount] = useState<string>('500');
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState<string | null>(null);

  // Offline Fallback Queue
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const handleSyncOfflineData = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setOfflineQueueCount(0);
      setIsSyncing(false);
      sounds.playPaymentSuccess();
    }, 1200);
  };

  // Fetch driver data
  const fetchDriverProfile = () => {
    fetch(`/api/drivers/${currentDriverId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.driver) setDriver(data.driver);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchDriverProfile();
  }, [currentDriverId]);

  useEffect(() => {
    if (activeTab === 'heatmap') {
      fetchHeatmap();
    } else if (activeTab === 'earnings') {
      fetchProfitability();
    }
  }, [activeTab, forecastPeriod, driver?.id]);

  // Socket room and listeners
  useEffect(() => {
    if (!socket || !driver) return;

    socket.emit('join:driver', driver.id);

    const onIncomingRide = (ride: Ride) => {
      // In-flight active trip guard
      if (activeRide || driver.isBusy) return;
      const scored = rankAndRecommendOffers([ride], { lat: driver.currentLat, lng: driver.currentLng });
      setMultiOffers(scored);
      setSelectedOfferIdx(0);
      setIncomingRide(ride);
      setCountdown(30);
      sounds.playIncomingRideAlert();
    };

    const onMultiOffers = (data: { offers: Ride[] }) => {
      // In-flight active trip guard
      if (activeRide || driver.isBusy) return;
      if (data?.offers && data.offers.length > 0) {
        const scored = rankAndRecommendOffers(data.offers, { lat: driver.currentLat, lng: driver.currentLng });
        setMultiOffers(scored);
        setSelectedOfferIdx(0);
        setIncomingRide(scored[0]);
        setCountdown(30);
        sounds.playIncomingRideAlert();
      }
    };

    const onRideCancelled = () => {
      setIncomingRide(null);
      setMultiOffers([]);
      setActiveRide(null);
      setIsSimulatingMove(false);
      clearInterval(simIntervalRef.current);
      fetchDriverProfile();
    };

    const onStatusChanged = (updatedRide: Ride) => {
      setActiveRide(updatedRide);
      if (onRideActive) onRideActive(updatedRide);

      if (updatedRide.status === 'COMPLETED' || updatedRide.status === 'CANCELLED') {
        setIsSimulatingMove(false);
        clearInterval(simIntervalRef.current);
        fetchDriverProfile();
      }
    };

    const onKycUpdated = (payload: any) => {
      fetchDriverProfile();
      sounds.playPaymentSuccess();
    };

    socket.on('driver:incoming_ride', onIncomingRide);
    socket.on('driver:multi_offers', onMultiOffers);
    socket.on('driver:ride_cancelled', onRideCancelled);
    socket.on('ride:status_changed', onStatusChanged);
    socket.on('driver:kyc_updated', onKycUpdated);

    return () => {
      socket.off('driver:incoming_ride', onIncomingRide);
      socket.off('driver:multi_offers', onMultiOffers);
      socket.off('driver:ride_cancelled', onRideCancelled);
      socket.off('ride:status_changed', onStatusChanged);
      socket.off('driver:kyc_updated', onKycUpdated);
    };
  }, [socket, driver?.id]);

  // Countdown timer for incoming ride
  useEffect(() => {
    if (!incomingRide) return;
    if (countdown <= 0) {
      setIncomingRide(null);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((c) => c - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [incomingRide, countdown]);

  // Toggle online status
  const handleToggleOnline = async () => {
    if (!driver) return;

    // Protection Guardrail: Unverified drivers cannot switch online
    if (!driver.isOnline && driver.kycStatus !== 'approved') {
      sounds.playBeep(400, 'sawtooth', 0.2);
      setShowDriverOnboardingModal(true);
      return;
    }

    const newStatus = !driver.isOnline;

    try {
      const res = await fetch(`/api/drivers/${driver.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOnline: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDriver({ ...driver, isOnline: newStatus });
        sounds.playBeep(newStatus ? 800 : 400, 'sine', 0.15);
      } else {
        alert(data.error || 'Cannot go online. Compliance verification required.');
        if (data.code === 'KYC_NOT_APPROVED') {
          setShowDriverOnboardingModal(true);
        } else {
          setActiveTab('subscription');
        }
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  // Accept incoming ride
  const handleAcceptRide = (specificRide?: Ride) => {
    const targetRide = specificRide || multiOffers[selectedOfferIdx] || incomingRide;
    if (!targetRide || !driver || !socket) return;

    socket.emit('ride:accept', {
      rideId: targetRide.id,
      driverId: driver.id,
    });

    setActiveRide(targetRide);
    setIncomingRide(null);
    setMultiOffers([]);
    sounds.playRideAccepted();
  };

  // Decline incoming ride
  const handleDeclineRide = () => {
    setIncomingRide(null);
    setMultiOffers([]);
  };

  // Simulate Multi-Provider Offers
  const handleSimulateMultiOffers = async () => {
    if (!driver) return;
    if (activeRide || driver.isBusy) {
      alert('In-Flight Protection Active: Cannot receive incoming requests while on an active trip!');
      return;
    }
    try {
      const res = await fetch(`/api/drivers/${driver.id}/simulate-multi-offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.offers && data.offers.length > 0) {
          const scored = rankAndRecommendOffers(data.offers, { lat: driver.currentLat, lng: driver.currentLng });
          setMultiOffers(scored);
          setSelectedOfferIdx(0);
          setIncomingRide(scored[0]);
          setCountdown(30);
          sounds.playIncomingRideAlert();
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Transition: Arrived at pickup
  const handleArrived = () => {
    if (!activeRide || !socket) return;
    socket.emit('ride:arrived', { rideId: activeRide.id });
    sounds.playDriverArrived();
  };

  // Transition: Start trip
  const handleStartTrip = () => {
    if (!activeRide || !socket) return;
    socket.emit('ride:start', { rideId: activeRide.id });
    sounds.playTripStarted();
  };

  // Transition: Complete trip
  const handleCompleteTrip = () => {
    if (!activeRide || !socket) return;
    setIsSimulatingMove(false);
    clearInterval(simIntervalRef.current);

    socket.emit('ride:complete', { rideId: activeRide.id });
    sounds.playPaymentSuccess();
  };

  // Simulation: Move vehicle along route coordinates
  const toggleMoveSimulation = () => {
    if (isSimulatingMove) {
      setIsSimulatingMove(false);
      clearInterval(simIntervalRef.current);
      return;
    }

    if (!activeRide?.routeCoordinates || activeRide.routeCoordinates.length === 0) {
      return;
    }

    setIsSimulatingMove(true);
    let stepIndex = 0;
    const coords = activeRide.routeCoordinates;

    simIntervalRef.current = setInterval(() => {
      if (stepIndex >= coords.length) {
        setIsSimulatingMove(false);
        clearInterval(simIntervalRef.current);
        return;
      }

      const [lat, lng] = coords[stepIndex];
      const nextCoord = coords[Math.min(stepIndex + 1, coords.length - 1)];
      const heading = Math.round(
        (Math.atan2(nextCoord[1] - lng, nextCoord[0] - lat) * 180) / Math.PI
      );

      // Emit driver location update
      socket.emit('driver:location_update', {
        driverId: driver!.id,
        lat,
        lng,
        heading,
      });

      setDriver((prev) => (prev ? { ...prev, currentLat: lat, currentLng: lng, heading } : prev));
      stepIndex++;
    }, 1200);
  };

  // Driver Payout request
  const handleRequestPayout = async () => {
    if (!driver || !payoutAmount) return;
    try {
      const res = await fetch(`/api/drivers/${driver.id}/payout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountEtb: parseFloat(payoutAmount) }),
      });
      const data = await res.json();
      if (data.success) {
        setPayoutSuccessMsg(data.message);
        fetchDriverProfile();
        sounds.playPaymentSuccess();
        setTimeout(() => setPayoutSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      alert(err.message || 'Payout failed');
    }
  };

  if (!driver) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-slate-500">
        Loading Driver Profile...
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-68px)] w-full overflow-hidden bg-slate-50">
      {/* Left Driver Control Panel with Desktop Frosted Glass */}
      <div className="w-full lg:w-[420px] xl:w-[460px] frosted-glass border-r border-white/60 flex flex-col h-full shadow-2xl z-20 overflow-y-auto">
        {/* Driver Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-900 text-white space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={driver.avatarUrl}
                alt={driver.fullName}
                className="w-11 h-11 rounded-full object-cover border-2 border-brand-400"
              />
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                  {driver.fullName}
                  <span className="text-[10px] text-brand-300 font-mono">
                    ({driver.vehiclePlate})
                  </span>
                </h3>
                <div className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                  <span>★ {driver.rating}</span>
                  <span>• {driver.totalRides} trips</span>
                  <span className="text-emerald-400 font-semibold">• KYC {driver.kycStatus}</span>
                </div>
              </div>
            </div>

            {/* Online / Offline Switch */}
            <button
              onClick={handleToggleOnline}
              className={`px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 transition shadow ${
                driver.isOnline
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{driver.isOnline ? t.online : t.offline}</span>
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 text-center">
            <div>
              <span className="text-[10px] text-slate-400 block">{t.todayEarnings}</span>
              <span className="text-sm font-bold text-emerald-400">
                {driver.walletBalanceEtb.toFixed(0)} <span className="text-[9px]">ETB</span>
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">{t.totalTrips}</span>
              <span className="text-sm font-bold text-white">{driver.totalRides}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Rating</span>
              <span className="text-sm font-bold text-amber-400">★ {driver.rating}</span>
            </div>
          </div>

          {/* Subscription Status & Driver SOS */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-medium text-slate-300">0%:</span>
                <button
                  onClick={() => setActiveTab('subscription')}
                  className={`px-2 py-0.5 rounded-full font-black text-[10px] uppercase transition ${
                    driver.subscriptionStatus === 'active'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {driver.subscriptionStatus === 'active' ? 'Active' : 'Subscribe'}
                </button>
              </div>

              <button
                onClick={() => setShowDriverOnboardingModal(true)}
                className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 border border-brand-500/30 transition flex items-center gap-1 cursor-pointer"
                title="Full 5-Step Driver Registration & AI KYC"
              >
                <UserPlus className="w-3 h-3 text-brand-400" />
                <span>Onboarding Flow</span>
              </button>

              <button
                onClick={handleSimulateMultiOffers}
                className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 transition flex items-center gap-1 cursor-pointer"
                title="Simulate Simultaneous Multi-Provider Requests (Chebelew, Yango, RIDE)"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Multi-Offers AI</span>
              </button>
            </div>

            <button
              onClick={handleTriggerDriverSos}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 shadow-sm transition"
              title="Trigger Emergency SOS (Police 991)"
            >
              <AlertTriangle className="w-3 h-3" />
              <span>SOS (991)</span>
            </button>
          </div>
        </div>

        {/* Ethiopian Compliance & Onboarding Guardrail Banner */}
        {driver.kycStatus !== 'approved' && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 p-3 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <span className="font-bold text-amber-900 block">KYC Verification Required</span>
                <span className="text-[10px] text-amber-700">
                  {driver.kycStatus === 'pending'
                    ? 'Compliance check in progress. Await Admin approval or complete Self-Assisted AI verification.'
                    : 'Account not approved. Complete Ethiopian compliance onboarding to go online.'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowDriverOnboardingModal(true)}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-[10px] font-black shrink-0 transition cursor-pointer"
            >
              Verify Now
            </button>
          </div>
        )}

        {sosMessage && (
          <div className="bg-rose-50 border-b border-rose-200 text-rose-800 p-2 text-xs font-bold text-center">
            {sosMessage}
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 overflow-x-auto">
          <button
            onClick={() => setActiveTab('trip')}
            className={`px-3 py-3 text-center border-b-2 whitespace-nowrap transition ${
              activeTab === 'trip'
                ? 'border-brand-500 text-brand-600 bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Rides
          </button>
          <button
            onClick={() => setActiveTab('deliveries')}
            className={`px-3 py-3 text-center border-b-2 whitespace-nowrap transition flex items-center gap-1 ${
              activeTab === 'deliveries'
                ? 'border-brand-500 text-brand-600 bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Package className="w-3 h-3" />
            <span>Deliveries</span>
          </button>
          <button
            onClick={() => setActiveTab('subscription')}
            className={`px-3 py-3 text-center border-b-2 whitespace-nowrap transition flex items-center gap-1 ${
              activeTab === 'subscription'
                ? 'border-brand-500 text-brand-600 bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Zap className="w-3 h-3 text-amber-500" />
            <span>Subscription</span>
          </button>
          <button
            onClick={() => setActiveTab('heatmap')}
            className={`px-3 py-3 text-center border-b-2 whitespace-nowrap transition flex items-center gap-1 ${
              activeTab === 'heatmap'
                ? 'border-brand-500 text-brand-600 bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Flame className="w-3 h-3 text-rose-500" />
            <span>Heatmap</span>
          </button>
          <button
            onClick={() => setActiveTab('earnings')}
            className={`px-3 py-3 text-center border-b-2 whitespace-nowrap transition ${
              activeTab === 'earnings'
                ? 'border-brand-500 text-brand-600 bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Profit & Wallet
          </button>
          <button
            onClick={() => setActiveTab('kyc')}
            className={`px-3 py-3 text-center border-b-2 whitespace-nowrap transition ${
              activeTab === 'kyc'
                ? 'border-brand-500 text-brand-600 bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            KYC
          </button>
          <button
            onClick={() => setActiveTab('payout_rails')}
            className={`px-3 py-3 text-center border-b-2 whitespace-nowrap transition flex items-center gap-1 ${
              activeTab === 'payout_rails'
                ? 'border-brand-500 text-brand-600 bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-3 h-3 text-emerald-600" />
            <span>Payout Rails & Credit</span>
          </button>
        </div>

        {/* Tab 1: Active Trip & Navigation */}
        {activeTab === 'trip' && (
          <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
            {activeRide ? (
              <div className="space-y-4">
                {/* Trip Banner */}
                <div className="bg-slate-900 text-white p-4 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-brand-300 font-mono">TRIP #{activeRide.id}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-brand-500 text-white">
                      {activeRide.status}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white pt-1">
                    Passenger: {activeRide.riderName} ({activeRide.riderPhone})
                  </div>
                </div>

                {/* Pickup and Destination card */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">PICKUP</span>
                      <span className="font-semibold text-slate-800">{activeRide.pickup.address}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 pt-2 border-t border-slate-200">
                    <Navigation className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">DESTINATION</span>
                      <span className="font-semibold text-slate-800">
                        {activeRide.destination.address}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Financial Payout Card for Driver */}
                <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 text-xs space-y-1.5">
                  <div className="flex justify-between font-bold text-emerald-900">
                    <span>Driver Net Payout (Your Earnings):</span>
                    <span className="text-sm">{activeRide.fare.driverNetPayout.toFixed(2)} ETB</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 flex justify-between pt-1 border-t border-emerald-200/60 font-mono">
                    <span>Gross: {activeRide.fare.totalFare.toFixed(2)} ETB</span>
                    <span>VAT (570/2025): -{activeRide.fare.vatAmount.toFixed(2)} ETB</span>
                    <span className="font-bold text-emerald-800">Chebelew Fee: 0.00 ETB (0% Comm)</span>
                  </div>
                  <div className="text-[10px] text-slate-500 pt-0.5">
                    Payment Method:{' '}
                    <strong className="text-slate-800 uppercase">{activeRide.paymentMethod}</strong> (
                    {activeRide.paymentStatus})
                  </div>
                </div>

                {/* GPS Movement Simulator */}
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-900 flex items-center gap-1.5">
                      <Car className="w-4 h-4 text-amber-600" />
                      GPS Route Simulator
                    </span>
                    <button
                      onClick={toggleMoveSimulation}
                      className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                        isSimulatingMove
                          ? 'bg-amber-600 text-white'
                          : 'bg-white border border-amber-300 text-amber-800 hover:bg-amber-100'
                      }`}
                    >
                      {isSimulatingMove ? (
                        <>
                          <Pause className="w-3.5 h-3.5" /> Pause GPS
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" /> Start Moving GPS
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-amber-700 leading-tight">
                    Animates vehicle along Addis Ababa streets, updating passenger & dispatcher maps live!
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Car className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-sm text-slate-700">
                  {driver.isOnline ? 'Waiting for Nearby Ride Requests...' : 'You are currently Offline'}
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  {driver.isOnline
                    ? 'Chebelew algorithm matches rides within 5km radius in Addis Ababa.'
                    : 'Toggle the switch above to Online to start receiving passenger bookings.'}
                </p>
              </div>
            )}

            {/* Ride State Transition Action Buttons */}
            {activeRide && (
              <div className="space-y-2 pt-4 border-t border-slate-100">
                {activeRide.status === 'ASSIGNED' && (
                  <button
                    onClick={handleArrived}
                    className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow transition"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{t.arrivedPickup}</span>
                  </button>
                )}

                {activeRide.status === 'ARRIVED' && (
                  <button
                    onClick={handleStartTrip}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow transition"
                  >
                    <Play className="w-4 h-4" />
                    <span>{t.startTrip}</span>
                  </button>
                )}

                {activeRide.status === 'IN_PROGRESS' && (
                  <button
                    onClick={handleCompleteTrip}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow transition"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>{t.completeTrip}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab: Deliveries */}
        {activeTab === 'deliveries' && (
          <div className="flex-1 overflow-y-auto">
            <DriverDeliveryTab driver={driver} language={language} />
          </div>
        )}

        {/* Tab: 0% Driver Subscription */}
        {activeTab === 'subscription' && (
          <div className="flex-1 overflow-y-auto">
            <DriverSubscriptionTab
              driver={driver}
              language={language}
              onRefreshDriver={fetchDriverProfile}
            />
          </div>
        )}

        {/* Tab: Demand Heatmap & Intelligence (Workstream 8) */}
        {activeTab === 'heatmap' && (
          <div className="p-5 space-y-4 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-rose-500" />
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  Addis Ababa Demand Hotspots
                </h4>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Live Predictive</span>
            </div>

            {/* Forecast Window Toggle */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-bold text-center">
              {(['next_15_mins', 'next_30_mins', 'next_60_mins'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setForecastPeriod(period)}
                  className={`py-1.5 rounded-lg transition ${
                    forecastPeriod === period
                      ? 'bg-white text-rose-600 shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {period === 'next_15_mins' ? 'Next 15m' : period === 'next_30_mins' ? 'Next 30m' : 'Next 60m'}
                </button>
              ))}
            </div>

            {/* Hotspot Zone Cards */}
            <div className="space-y-2.5">
              {heatmapZones.map((zone) => {
                const isHighSurge = zone.demandIntensity >= 2.2;
                return (
                  <div
                    key={zone.zoneId}
                    className={`p-3.5 rounded-xl border transition ${
                      isHighSurge
                        ? 'bg-rose-50/40 border-rose-200 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                          <span>{zone.zoneName}</span>
                          {isHighSurge && (
                            <span className="bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase">
                              Surge
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {zone.zoneNameAm}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-black text-rose-600 block">
                          {zone.demandIntensity.toFixed(1)}x
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium">Demand Index</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-2.5 pt-2 border-t border-slate-100 text-center text-[10px]">
                      <div className="bg-white/80 p-1.5 rounded-lg border border-slate-100">
                        <span className="text-slate-400 block">Est. Earnings</span>
                        <span className="font-black text-emerald-700 font-mono">
                          {zone.potentialHourlyEarningsEtb} <span className="text-[8px]">ETB/h</span>
                        </span>
                      </div>
                      <div className="bg-white/80 p-1.5 rounded-lg border border-slate-100">
                        <span className="text-slate-400 block">Avg. Wait</span>
                        <span className="font-bold text-slate-700 font-mono">{zone.estimatedWaitMinutes}m</span>
                      </div>
                      <div className="bg-white/80 p-1.5 rounded-lg border border-slate-100">
                        <span className="text-slate-400 block">Supply</span>
                        <span className="font-bold text-slate-700 font-mono">{zone.driverSupplyCount} cabs</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Profitability & Telebirr Wallet */}
        {activeTab === 'earnings' && (
          <div className="p-5 space-y-4 flex-1 overflow-y-auto">
            {/* Real-Time Net Profitability Intelligence Card (Section 3.3 & Workstream 9) */}
            {profitability && (
              <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md space-y-3 border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-200">
                      Driver Net Profitability
                    </span>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-500/30">
                    0% PLATFORM FEE
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block">Net Operating Earnings</span>
                    <span className="text-lg font-black text-emerald-400">
                      {profitability.netOperatingEarningsEtb.toFixed(0)}{' '}
                      <span className="text-[10px] font-bold">ETB</span>
                    </span>
                  </div>
                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block">Hourly Net Take-Home</span>
                    <span className="text-lg font-black text-brand-300">
                      {profitability.hourlyEarningsEtb.toFixed(0)}{' '}
                      <span className="text-[10px] font-bold">ETB/h</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-[11px] pt-1 border-t border-slate-800/80 font-mono text-slate-300">
                  <div className="flex justify-between">
                    <span>Gross Trip Fares ({profitability.totalTripsToday} trips, {profitability.totalDistanceKmToday} km)</span>
                    <span className="text-white font-bold">+{profitability.grossEarningsTodayEtb.toFixed(2)} ETB</span>
                  </div>
                  <div className="flex justify-between text-rose-300">
                    <span>Estimated Fuel Expense (@ {expenses?.fuelCostPerKm || 4.2} ETB/km)</span>
                    <span>-{profitability.estimatedFuelCostEtb.toFixed(2)} ETB</span>
                  </div>
                  <div className="flex justify-between text-rose-300">
                    <span>Daily Maintenance & Oil Reserve</span>
                    <span>-{profitability.allocatedMaintenanceEtb.toFixed(2)} ETB</span>
                  </div>
                  <div className="flex justify-between text-rose-300">
                    <span>Daily Insurance & Vehicle Overhead</span>
                    <span>-{profitability.allocatedInsuranceEtb.toFixed(2)} ETB</span>
                  </div>
                  <div className="flex justify-between text-amber-300">
                    <span>Chebelew Subscription (Daily Fraction)</span>
                    <span>-{profitability.subscriptionCostTodayEtb.toFixed(2)} ETB</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-800 text-emerald-300 font-bold">
                    <span>Break-Even Threshold Today</span>
                    <span>{profitability.subscriptionBreakEvenTrips} trips required</span>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => setShowEditExpenses(!showEditExpenses)}
                    className="text-[10px] text-brand-300 hover:text-brand-200 flex items-center gap-1 font-sans font-bold"
                  >
                    <Wrench className="w-3 h-3" />
                    <span>{showEditExpenses ? 'Hide Expense Settings' : 'Adjust Expense Settings'}</span>
                  </button>
                </div>

                {showEditExpenses && (
                  <form onSubmit={handleSaveExpenses} className="bg-slate-800 p-3 rounded-xl border border-slate-700 space-y-2 text-xs font-sans">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block">Fuel Cost (ETB/km)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={editFuelCost}
                          onChange={(e) => setEditFuelCost(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-600 rounded p-1 text-white text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block">Daily Maint. (ETB)</label>
                        <input
                          type="number"
                          step="1"
                          value={editMaintenance}
                          onChange={(e) => setEditMaintenance(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-600 rounded p-1 text-white text-xs font-mono"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-1.5 rounded text-[11px] transition"
                    >
                      Save Operating Expenses
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Telebirr Balance & Withdrawal */}
            <div className="bg-gradient-to-r from-[#004c82] to-[#0070ba] text-white p-5 rounded-2xl shadow-md text-center">
              <span className="text-xs text-blue-100 block">Available Telebirr Balance</span>
              <div className="text-3xl font-extrabold text-white mt-1">
                {driver.walletBalanceEtb.toFixed(2)} <span className="text-sm font-semibold">ETB</span>
              </div>
              <span className="text-[11px] text-blue-200 mt-1 block">
                Linked Telebirr Phone: <strong>{driver.phone}</strong>
              </span>
            </div>

            {payoutSuccessMsg && (
              <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{payoutSuccessMsg}</span>
              </div>
            )}

            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800">{t.withdrawTelebirr}</h4>
              <p className="text-[11px] text-slate-500">
                Instant withdrawal to your personal Telebirr mobile money wallet with 0% fee.
              </p>

              <div className="flex gap-2">
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="Amount ETB"
                  className="flex-1 border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0070ba]"
                />
                <button
                  onClick={handleRequestPayout}
                  className="bg-[#0070ba] hover:bg-[#004c82] text-white font-bold py-2 px-4 rounded-lg text-xs transition"
                >
                  Withdraw
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Driver KYC & Compliance */}
        {activeTab === 'kyc' && (
          <div className="flex-1 overflow-y-auto">
            <DriverKYCVerification
              driver={driver}
              language={language}
              onKycUpdated={fetchDriverProfile}
            />
          </div>
        )}

        {/* Tab 4: Direct Payout Rails & Platform Credit */}
        {activeTab === 'payout_rails' && driver && (
          <div className="flex-1 overflow-y-auto bg-slate-50">
            <DriverPaymentRailsTab driverId={driver.id} />
          </div>
        )}

        {/* Offline Fallback & Sync Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
          <div className="flex items-center gap-1.5">
            <WifiOff className="w-3.5 h-3.5 text-slate-500" />
            <span>
              Offline Queue:{' '}
              <strong className={offlineQueueCount > 0 ? 'text-amber-600' : 'text-slate-700'}>
                {offlineQueueCount} logs
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setOfflineQueueCount((c) => c + 1)}
              className="text-slate-400 hover:text-slate-600 text-[10px]"
              title="Simulate offline drop"
            >
              +Simulate Drop
            </button>
            {offlineQueueCount > 0 && (
              <button
                onClick={handleSyncOfflineData}
                disabled={isSyncing}
                className="bg-brand-500 hover:bg-brand-600 text-white font-bold px-2 py-0.5 rounded text-[10px] flex items-center gap-1 transition"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right Map Canvas */}
      <div className="flex-1 h-full relative">
        {/* Uber-style Turn-by-Turn Navigation HUD Overlay */}
        {activeRide && (
          <div className="absolute top-4 left-4 right-4 z-30 max-w-lg mx-auto bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center justify-between gap-3 animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center font-bold">
                <Navigation className="w-5 h-5 text-brand-400 rotate-45" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>
                    {activeRide.status === 'ASSIGNED' && 'Navigate to Pickup'}
                    {activeRide.status === 'ARRIVED' && 'At Pickup Location (Wait for Rider)'}
                    {activeRide.status === 'IN_PROGRESS' && 'Navigating to Destination'}
                    {activeRide.status === 'COMPLETED' && 'Trip Completed'}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="text-[11px] text-slate-300 truncate max-w-[260px]">
                  {activeRide.status === 'ASSIGNED' || activeRide.status === 'ARRIVED'
                    ? activeRide.pickup.address
                    : activeRide.destination.address}
                </div>
              </div>
            </div>

            <div className="text-right pl-3 border-l border-slate-800">
              <span className="text-[10px] text-slate-400 block font-mono">EST. ETA</span>
              <span className="text-sm font-black text-emerald-400 font-mono">
                {activeRide.durationMinutes || 8} min
              </span>
            </div>
          </div>
        )}

        <AddisMap
          pickup={activeRide?.pickup || incomingRide?.pickup}
          destination={activeRide?.destination || incomingRide?.destination}
          activeDriverLocation={[driver.currentLat, driver.currentLng]}
          activeDriverHeading={driver.heading}
          activeDriverPlate={driver.vehiclePlate}
          routeCoordinates={activeRide?.routeCoordinates || incomingRide?.routeCoordinates || []}
        />
      </div>

      {/* Incoming Ride Alert / Multi-Provider AI Comparison Modal */}
      {(incomingRide || multiOffers.length > 0) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 text-center space-y-4 border-2 border-brand-500">
            {/* Top Linear Countdown */}
            <div className="flex items-center justify-between text-xs text-slate-500 border-b pb-2">
              <span className="font-bold text-brand-600 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                {multiOffers.length > 1 ? `MULTI-PROVIDER DISPATCH (${multiOffers.length} OFFERS)` : 'NEW RIDE DISPATCH'}
              </span>
              <span className="font-mono font-bold text-rose-600">Expires in: {countdown}s</span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-brand-500 h-full transition-all duration-1000"
                style={{ width: `${(countdown / 30) * 100}%` }}
              />
            </div>

            {/* Multi-Offer Provider Tabs (When 2+ offers present) */}
            {multiOffers.length > 1 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {multiOffers.map((offer, idx) => {
                  const isSelected = selectedOfferIdx === idx;
                  const isAiTop = offer.valueMetrics.isAiRecommended;
                  return (
                    <button
                      key={offer.id}
                      onClick={() => {
                        setSelectedOfferIdx(idx);
                        setIncomingRide(offer);
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold shrink-0 transition flex items-center gap-1 ${
                        isSelected
                          ? 'bg-brand-500 text-white border-brand-600 shadow font-black'
                          : isAiTop
                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {isAiTop && <span className="text-[10px]">★</span>}
                      <span>{offer.providerId.toUpperCase()}</span>
                      <span className="font-mono">{offer.fare?.totalFare} ETB</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* AI Recommendation Banner */}
            {multiOffers[selectedOfferIdx]?.valueMetrics.isAiRecommended && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-2.5 text-left text-xs space-y-0.5">
                <div className="flex justify-between items-center font-black text-amber-900">
                  <span>{multiOffers[selectedOfferIdx].valueMetrics.recommendationTag}</span>
                  <span className="text-emerald-700 font-mono font-bold">
                    {multiOffers[selectedOfferIdx].valueMetrics.effectiveHourlyRateEtb} ETB/hr
                  </span>
                </div>
                <p className="text-[10px] text-amber-800">
                  {multiOffers[selectedOfferIdx].valueMetrics.recommendationReason}
                </p>
              </div>
            )}

            {/* Fare & Metrics */}
            <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-100 grid grid-cols-2 gap-2 text-center">
              <div>
                <span className="text-[10px] text-emerald-700 block uppercase font-bold">Net Payout</span>
                <div className="text-2xl font-black text-emerald-900 font-mono">
                  {(multiOffers[selectedOfferIdx] || incomingRide)?.fare.driverNetPayout.toFixed(0)} <span className="text-xs">ETB</span>
                </div>
                <span className="text-[9px] text-emerald-600 block">
                  {(multiOffers[selectedOfferIdx] || incomingRide)?.providerId === 'chebelew' ? '0% Platform Fee' : '100% In-Pocket'}
                </span>
              </div>
              <div className="border-l border-emerald-200 pl-2">
                <span className="text-[10px] text-emerald-700 block uppercase font-bold">Trip Metrics</span>
                <div className="text-sm font-bold text-slate-800 mt-1 font-mono">
                  {(multiOffers[selectedOfferIdx] || incomingRide)?.distanceKm} km
                </div>
                <span className="text-[10px] text-slate-500 block font-mono">
                  ~{(multiOffers[selectedOfferIdx] || incomingRide)?.durationMinutes} mins
                </span>
              </div>
            </div>

            {/* Locations */}
            <div className="text-left text-xs space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <div className="truncate">
                  <span className="text-[9px] text-slate-400 block font-bold">PICKUP</span>
                  <span className="text-slate-800 font-medium">
                    {(multiOffers[selectedOfferIdx] || incomingRide)?.pickup.address}
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2 pt-1 border-t border-slate-200">
                <Navigation className="w-3.5 h-3.5 text-rose-600 mt-0.5 shrink-0" />
                <div className="truncate">
                  <span className="text-[9px] text-slate-400 block font-bold">DESTINATION</span>
                  <span className="text-slate-800 font-medium">
                    {(multiOffers[selectedOfferIdx] || incomingRide)?.destination.address}
                  </span>
                </div>
              </div>
            </div>

            {/* Accept / Decline buttons (Driver Decision Agency) */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                onClick={handleDeclineRide}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs transition col-span-1"
              >
                {t.declineRide}
              </button>
              <button
                onClick={() => handleAcceptRide(multiOffers[selectedOfferIdx] || incomingRide!)}
                className="bg-brand-500 hover:bg-brand-600 text-white font-black py-3 rounded-xl text-xs shadow-lg shadow-brand-500/30 transition col-span-2 flex items-center justify-center gap-1.5"
              >
                <span>
                  {multiOffers[selectedOfferIdx]?.valueMetrics.isAiRecommended
                    ? 'Accept AI Recommended'
                    : t.acceptRide}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Driver Onboarding Wizard Modal */}
      <DriverOnboardingModal
        isOpen={showDriverOnboardingModal}
        onClose={() => setShowDriverOnboardingModal(false)}
        onComplete={() => {
          setShowDriverOnboardingModal(false);
          fetchDriverProfile();
        }}
        language={language}
      />
    </div>
  );
};
