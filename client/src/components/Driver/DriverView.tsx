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
} from 'lucide-react';
import { AddisMap } from '../Map/AddisMap';
import { Driver, Ride, VehicleCategory } from '@shared/types';
import { translations, Language } from '../../i18n/translations';
import { sounds } from '../../utils/audio';
import { DriverSubscriptionTab } from './DriverSubscriptionTab';
import { DriverDeliveryTab } from './DriverDeliveryTab';
import { DriverKYCVerification } from './DriverKYCVerification';
import { DriverOnboardingModal } from '../Onboarding/DriverOnboardingModal';

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
  const [countdown, setCountdown] = useState<number>(30);
  const [activeTab, setActiveTab] = useState<'trip' | 'subscription' | 'deliveries' | 'earnings' | 'kyc'>('trip');
  const [sosActive, setSosActive] = useState(false);
  const [sosMessage, setSosMessage] = useState<string | null>(null);
  const [showDriverOnboardingModal, setShowDriverOnboardingModal] = useState(false);

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

  // Socket room and listeners
  useEffect(() => {
    if (!socket || !driver) return;

    socket.emit('join:driver', driver.id);

    const onIncomingRide = (ride: Ride) => {
      setIncomingRide(ride);
      setCountdown(30);
      sounds.playIncomingRideAlert();
    };

    const onRideCancelled = () => {
      setIncomingRide(null);
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

    socket.on('driver:incoming_ride', onIncomingRide);
    socket.on('driver:ride_cancelled', onRideCancelled);
    socket.on('ride:status_changed', onStatusChanged);

    return () => {
      socket.off('driver:incoming_ride', onIncomingRide);
      socket.off('driver:ride_cancelled', onRideCancelled);
      socket.off('ride:status_changed', onStatusChanged);
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
    const newStatus = !driver.isOnline;

    try {
      const res = await fetch(`/api/drivers/${driver.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOnline: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setDriver({ ...driver, isOnline: newStatus });
        sounds.playBeep(newStatus ? 800 : 400, 'sine', 0.15);
      } else {
        alert(data.error || 'Cannot go online without an active driver subscription.');
        setActiveTab('subscription');
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  // Accept incoming ride
  const handleAcceptRide = () => {
    if (!incomingRide || !driver || !socket) return;

    socket.emit('ride:accept', {
      rideId: incomingRide.id,
      driverId: driver.id,
    });

    setActiveRide(incomingRide);
    setIncomingRide(null);
    sounds.playRideAccepted();
  };

  // Decline incoming ride
  const handleDeclineRide = () => {
    setIncomingRide(null);
  };

  // Transition: Arrived at pickup
  const handleArrived = () => {
    if (!activeRide || !socket) return;
    socket.emit('ride:arrived', { rideId: activeRide.id });
  };

  // Transition: Start trip
  const handleStartTrip = () => {
    if (!activeRide || !socket) return;
    socket.emit('ride:start', { rideId: activeRide.id });
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
      {/* Left Driver Control Panel */}
      <div className="w-full lg:w-[420px] xl:w-[460px] bg-white border-r border-slate-200 flex flex-col h-full shadow-lg z-20 overflow-y-auto">
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
            onClick={() => setActiveTab('earnings')}
            className={`px-3 py-3 text-center border-b-2 whitespace-nowrap transition ${
              activeTab === 'earnings'
                ? 'border-brand-500 text-brand-600 bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Wallet
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
                    <span>VAT 15%: -{activeRide.fare.vatAmount.toFixed(2)} ETB</span>
                    <span>Comm 15%: -{activeRide.fare.platformCommission.toFixed(2)} ETB</span>
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

        {/* Tab 2: Wallet & Telebirr Payout */}
        {activeTab === 'earnings' && (
          <div className="p-5 space-y-5 flex-1">
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

            <div className="text-xs text-slate-500 space-y-1">
              <span className="font-bold text-slate-700 block">Payout Rules:</span>
              <p>• Payouts processed 24/7 directly to Ethio Telecom Telebirr</p>
              <p>• Minimum withdrawal: 100 ETB</p>
              <p>• VAT & Platform commissions are settled automatically at ride completion</p>
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
        <AddisMap
          pickup={activeRide?.pickup}
          destination={activeRide?.destination}
          activeDriverLocation={[driver.currentLat, driver.currentLng]}
          activeDriverHeading={driver.heading}
          activeDriverPlate={driver.vehiclePlate}
          routeCoordinates={activeRide?.routeCoordinates}
        />
      </div>

      {/* Incoming Ride Alert Modal (30s countdown) */}
      {incomingRide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4 border-2 border-brand-500">
            <div className="flex items-center justify-between text-xs text-slate-500 border-b pb-2">
              <span className="font-bold text-brand-600">NEW RIDE DISPATCH</span>
              <span className="font-mono font-bold text-rose-600">Expires in: {countdown}s</span>
            </div>

            {/* Countdown progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-brand-500 h-full transition-all duration-1000"
                style={{ width: `${(countdown / 30) * 100}%` }}
              />
            </div>

            {/* Fare and Distance */}
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
              <span className="text-[10px] text-emerald-700 block">Estimated Net Earnings</span>
              <div className="text-2xl font-black text-emerald-800">
                {incomingRide.fare.driverNetPayout.toFixed(2)} ETB
              </div>
              <span className="text-[11px] text-emerald-600">
                {incomingRide.distanceKm} km (~{incomingRide.durationMinutes} mins)
              </span>
            </div>

            {/* Locations */}
            <div className="text-left text-xs space-y-2 bg-slate-50 p-3 rounded-xl">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 mt-0.5" />
                <span className="text-slate-700 font-medium truncate">
                  {incomingRide.pickup.address}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Navigation className="w-3.5 h-3.5 text-rose-600 mt-0.5" />
                <span className="text-slate-700 font-medium truncate">
                  {incomingRide.destination.address}
                </span>
              </div>
            </div>

            {/* Accept / Decline buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleDeclineRide}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs transition"
              >
                {t.declineRide}
              </button>
              <button
                onClick={handleAcceptRide}
                className="bg-brand-500 hover:bg-brand-600 text-white font-black py-3 rounded-xl text-xs shadow-lg shadow-brand-500/30 transition animate-pulse"
              >
                {t.acceptRide}
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
