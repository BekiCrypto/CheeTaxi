import React, { useState, useEffect, useRef } from 'react';
import { 
  Car, DollarSign, Award, Sliders, User, Power, ShieldAlert,
  Phone, Navigation, CheckCircle2, XCircle, MapPin, QrCode, 
  ArrowRight, Clock, AlertTriangle, RefreshCw, Compass, Flame,
  Share2, Check, ExternalLink, ShieldCheck, ChevronRight,
  ChevronDown, ChevronUp, Sparkles, Volume2, Globe, Radio,
  Banknote, Fuel, Wrench, Zap
} from 'lucide-react';
import QRCode from 'qrcode';
import { AddisMap } from '../Map/AddisMap';
import { Language, translations } from '../../i18n/translations';
import { MobileAuthModal } from '../Onboarding/MobileAuthModal';
import { DriverSubscriptionTab } from './DriverSubscriptionTab';
import { DriverPaymentRailsTab } from './DriverPaymentRailsTab';
import { DriverKYCVerification } from './DriverKYCVerification';
import { sounds } from '../../utils/audio';
import { Ride, Driver } from '@shared/types';

interface DriverMobileShellProps {
  currentDriverId: string;
  language: Language;
  onLanguageChange?: (lang: Language) => void;
  socket: any;
}

type DriverTab = 'radar' | 'earnings' | 'subscription' | 'destination' | 'profile';

export const DriverMobileShell: React.FC<DriverMobileShellProps> = ({
  currentDriverId: initialDriverId,
  language,
  onLanguageChange,
  socket,
}) => {
  const [activeTab, setActiveTab] = useState<DriverTab>('radar');
  const [driverId, setDriverId] = useState(initialDriverId);
  const [driverName, setDriverName] = useState('Ahmed Mohammed');
  const [driverPhone, setDriverPhone] = useState('+251912345678');
  const [vehicle, setVehicle] = useState('Toyota Corolla (White) • Code 03 AA 45982');

  const [driver, setDriver] = useState<Driver>({
    id: initialDriverId || 'driver_ahmed_01',
    userId: 'user_ahmed_01',
    fullName: 'Ahmed Mohammed',
    phone: '+251912345678',
    vehicleMake: 'Toyota',
    vehicleModel: 'Corolla',
    vehicleYear: 2018,
    vehiclePlate: 'AA-3-45982',
    vehicleColor: 'White',
    vehicleCategory: 'sedan',
    licenseNumber: 'ET-DL-883492',
    kycStatus: 'approved',
    isOnline: false,
    isBusy: false,
    currentLat: 9.0105,
    currentLng: 38.7615,
    heading: 0,
    rating: 4.92,
    totalRides: 384,
    walletBalanceEtb: 14250,
    subscriptionStatus: 'active',
    countryCode: 'ET',
    cityCode: 'ADDIS_ABABA',
    faydaId: 'ET-FIN-99201948',
  });

  const fetchDriverProfile = async () => {
    try {
      const res = await fetch(`/api/drivers/${driverId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.driver) {
          setDriver(data.driver);
          setDriverName(data.driver.fullName);
          setDriverPhone(data.driver.phone);
          setIsOnline(data.driver.isOnline);
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (driverId) {
      fetchDriverProfile();
    }
  }, [driverId]);

  const [isOnline, setIsOnline] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Active Ride and Incoming Offer States
  const [incomingOffer, setIncomingOffer] = useState<Ride | null>(null);
  const [countdown, setCountdown] = useState(15);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [rideStep, setRideStep] = useState<'NONE' | 'TO_PICKUP' | 'AT_PICKUP' | 'IN_TRANSIT' | 'COMPLETED'>('NONE');
  const [boardingWaitTimer, setBoardingWaitTimer] = useState(180); // 3 minutes wait time

  // Passenger Telebirr QR for Fare Collection
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [cashCollectedConfirmed, setCashCollectedConfirmed] = useState(false);

  // Destination Filter ("On-My-Way")
  const [destinationFilter, setDestinationFilter] = useState('');
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [corridorRadiusKm, setCorridorRadiusKm] = useState(1.5);
  const [showCorridorSheet, setShowCorridorSheet] = useState(false);

  // Driver Profitability & Shift Stats
  const [shiftStats, setShiftStats] = useState({
    grossEarnings: 2850,
    tripsCompleted: 7,
    onlineHours: 5.2,
    fuelExpenses: 700,
    maintenanceEstimate: 200,
    subscriptionFeeDaily: 50,
    netProfit: 1900,
  });
  const [showShiftBreakdown, setShowShiftBreakdown] = useState(false);

  // Current Driver GPS
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number; heading: number }>({
    lat: 9.0105,
    lng: 38.7615,
    heading: 0,
  });

  const countdownIntervalRef = useRef<any>(null);
  const waitTimerIntervalRef = useRef<any>(null);

  // Load cached driver session
  useEffect(() => {
    try {
      const cached = localStorage.getItem('chebelew_active_user');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.role === 'driver') {
          setDriverId(parsed.id);
          setDriverName(parsed.name);
          setDriverPhone(parsed.phone);
        }
      }
    } catch (e) {}
  }, []);

  // Socket listeners for incoming rides and dispatch events
  useEffect(() => {
    if (!socket) return;

    socket.emit('driver:register', { driverId });

    const handleNewRide = (ride: Ride) => {
      if (!isOnline || activeRide) return;

      setIncomingOffer(ride);
      setCountdown(15);
      sounds.playIncomingRideAlert();

      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            setIncomingOffer(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    const handleRideCancelled = (data: { rideId: string }) => {
      if (activeRide && activeRide.id === data.rideId) {
        setActiveRide(null);
        setRideStep('NONE');
        sounds.playBeep(300, 'sawtooth', 0.5);
        alert('Passenger has cancelled the ride.');
      }
      if (incomingOffer && incomingOffer.id === data.rideId) {
        setIncomingOffer(null);
      }
    };

    socket.on('ride:new', handleNewRide);
    socket.on('ride:cancelled', handleRideCancelled);

    return () => {
      socket.off('ride:new', handleNewRide);
      socket.off('ride:cancelled', handleRideCancelled);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [socket, isOnline, activeRide, incomingOffer, driverId]);

  // Periodic GPS Location Beacon
  useEffect(() => {
    if (!isOnline || !socket) return;

    const interval = setInterval(() => {
      setDriverLocation((prev) => {
        const newLat = prev.lat + (Math.random() - 0.5) * 0.0004;
        const newLng = prev.lng + (Math.random() - 0.5) * 0.0004;
        const newHeading = (prev.heading + 15) % 360;

        socket.emit('driver:location_update', {
          driverId,
          lat: newLat,
          lng: newLng,
          heading: newHeading,
        });

        return { lat: newLat, lng: newLng, heading: newHeading };
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isOnline, socket, driverId]);

  // Handle Online/Offline toggle
  const handleToggleOnline = async () => {
    const nextState = !isOnline;
    setIsOnline(nextState);

    try {
      await fetch(`/api/drivers/${driverId}/online`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOnline: nextState }),
      });
      if (nextState) {
        sounds.playBeep(880, 'sine', 0.2);
      } else {
        sounds.playBeep(440, 'sine', 0.2);
      }
    } catch (e) {
      console.error('Failed to update online state:', e);
    }
  };

  // Accept incoming ride offer
  const handleAcceptRide = () => {
    if (!incomingOffer || !socket) return;
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    socket.emit('ride:accept', {
      rideId: incomingOffer.id,
      driverId,
    });

    setActiveRide(incomingOffer);
    setIncomingOffer(null);
    setRideStep('TO_PICKUP');
    sounds.playRideAccepted();
  };

  const handleDeclineRide = () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setIncomingOffer(null);
    sounds.playBeep(350, 'square', 0.15);
  };

  // In-Cab HUD Turn-by-Turn state steps
  const handleArrivedAtPickup = () => {
    setRideStep('AT_PICKUP');
    sounds.playBeep(650, 'sine', 0.2);
    setBoardingWaitTimer(180);

    if (waitTimerIntervalRef.current) clearInterval(waitTimerIntervalRef.current);
    waitTimerIntervalRef.current = setInterval(() => {
      setBoardingWaitTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    if (socket && activeRide) {
      socket.emit('ride:arrived', { rideId: activeRide.id });
    }
  };

  const handleStartTrip = () => {
    if (waitTimerIntervalRef.current) clearInterval(waitTimerIntervalRef.current);
    setRideStep('IN_TRANSIT');
    sounds.playRideAccepted();

    if (socket && activeRide) {
      socket.emit('ride:start', { rideId: activeRide.id });
    }
  };

  const handleCompleteTrip = async () => {
    setRideStep('COMPLETED');
    sounds.playPaymentSuccess();
    setCashCollectedConfirmed(false);

    // Generate Dynamic Telebirr Payment QR for passenger in-cab scan
    try {
      const qrPayload = `chebelew://pay?driver=${driverPhone}&fare=${activeRide?.fare?.totalFare || 380}&ref=${activeRide?.id}`;
      const url = await QRCode.toDataURL(qrPayload, { width: 220, margin: 1 });
      setQrDataUrl(url);
    } catch (e) {}

    if (socket && activeRide) {
      socket.emit('ride:complete', { rideId: activeRide.id });
    }

    setShiftStats((prev) => ({
      ...prev,
      grossEarnings: prev.grossEarnings + (activeRide?.fare?.totalFare || 380),
      tripsCompleted: prev.tripsCompleted + 1,
      netProfit: prev.netProfit + (activeRide?.fare?.totalFare || 380),
    }));
  };

  const handleCloseCompletedSummary = () => {
    setActiveRide(null);
    setRideStep('NONE');
    setQrDataUrl('');
    setCashCollectedConfirmed(false);
  };

  const isAm = language === 'am';

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-100 overflow-hidden select-none font-sans">
      {/* ==============================================================
          TOP IN-CAB CONTROL BAR (YANGO PRO STYLE SLEEK GLASS HUD)
          ============================================================== */}
      <header className="h-16 bg-slate-900/95 backdrop-blur-2xl border-b border-slate-800/80 px-4 flex items-center justify-between z-30 shrink-0 shadow-lg">
        {/* Left: Driver profile & rating */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black flex items-center justify-center text-base shadow-md shadow-amber-500/20">
            {driverName.charAt(0)}
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white truncate max-w-[110px]">{driverName}</span>
              <span className="text-[10px] text-amber-400 font-bold bg-amber-500/15 px-1.5 py-0.2 rounded-md border border-amber-500/30">
                ★ {driver.rating}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[140px]">
              {driver.vehiclePlate || 'Toyota Corolla'}
            </p>
          </div>
        </div>

        {/* Center: Real-Time Shift Earnings pill (tap to see net details) */}
        <button
          onClick={() => setShowShiftBreakdown(!showShiftBreakdown)}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 rounded-full text-[11px] font-mono text-emerald-400 transition active-press"
          title="Click to view Shift Net Profit Breakdown"
        >
          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-bold">{shiftStats.grossEarnings} ETB</span>
          <span className="text-slate-500">•</span>
          <span className="text-amber-400 font-sans text-[10px] font-bold">0% Comm</span>
        </button>

        {/* Right: Controls (Language, Online switch, SOS) */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          {onLanguageChange && (
            <button
              onClick={() => onLanguageChange(language === 'en' ? 'am' : 'en')}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-black border border-slate-700 transition active-press"
              title="Toggle Language / ቋንቋ ቀይር"
            >
              {language === 'en' ? 'አማ' : 'EN'}
            </button>
          )}

          {/* Online / Offline Slide Toggle Button */}
          <button
            onClick={handleToggleOnline}
            className={`px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 transition active-press shadow-md ${
              isOnline
                ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30 beacon-pulse'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{isOnline ? (isAm ? 'በመስመር' : 'ONLINE') : (isAm ? 'ከመስመር ውጭ' : 'OFFLINE')}</span>
          </button>

          {/* Quick SOS Emergency 991 */}
          <a
            href="tel:991"
            className="w-8 h-8 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/40 flex items-center justify-center text-xs font-black transition active-press"
            title="Police SOS (991)"
          >
            <ShieldAlert className="w-4 h-4" />
          </a>
        </div>
      </header>

      {/* Floating Shift Profitability Breakdown Dropdown */}
      {showShiftBreakdown && (
        <div className="absolute top-18 left-4 right-4 max-w-sm mx-auto z-[1200] bg-slate-900/98 backdrop-blur-2xl border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-2.5 text-xs animate-fade-in">
          <div className="flex justify-between items-center pb-1.5 border-b border-slate-800">
            <span className="font-bold text-white flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Shift Profitability / የፈረቃ ትርፍ
            </span>
            <button
              onClick={() => setShowShiftBreakdown(false)}
              className="text-slate-400 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          </div>
          <div className="space-y-1.5 text-slate-300 font-mono">
            <div className="flex justify-between">
              <span>Gross Fares Collected:</span>
              <strong className="text-white">+{shiftStats.grossEarnings} ETB</strong>
            </div>
            <div className="flex justify-between text-rose-400">
              <span>Fuel Estimate:</span>
              <span>-{shiftStats.fuelExpenses} ETB</span>
            </div>
            <div className="flex justify-between text-rose-400">
              <span>Maintenance Reserve:</span>
              <span>-{shiftStats.maintenanceEstimate} ETB</span>
            </div>
            <div className="flex justify-between text-amber-400">
              <span>Daily Subscription:</span>
              <span>-{shiftStats.subscriptionFeeDaily} ETB</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between font-black text-emerald-400 text-sm">
              <span>Net In-Pocket Profit:</span>
              <span>{shiftStats.netProfit} ETB</span>
            </div>
          </div>
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-[10px] text-emerald-300 text-center">
            0% Chebelew Platform Fee — You keep 100% of trip fares!
          </div>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 relative overflow-hidden">
        {/* ==============================================================
            TAB 1: RADAR & IN-CAB TURN-BY-TURN HUD (YANGO PRO STYLE)
            ============================================================== */}
        {activeTab === 'radar' && (
          <div className="h-full w-full relative">
            {/* Full-Screen Map */}
            <div className="absolute inset-0 z-0">
              <AddisMap
                pickup={activeRide?.pickup || incomingOffer?.pickup}
                destination={activeRide?.destination || incomingOffer?.destination}
                routeCoordinates={activeRide?.routeCoordinates || incomingOffer?.routeCoordinates || []}
                activeDriverLocation={[driverLocation.lat, driverLocation.lng]}
                activeDriverHeading={driverLocation.heading}
                activeDriverPlate={driver.vehiclePlate}
                className="h-full w-full"
              />
            </div>

            {/* FLOATING TOP RADAR CONTROLS (UNOBSTRUCTED MAP) */}
            <div className="absolute top-4 left-4 right-4 z-[900] flex justify-between items-center pointer-events-none gap-2">
              {/* GPS Accuracy Pill */}
              <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/80 px-2.5 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 text-[10px] font-mono pointer-events-auto">
                <Compass className="w-3 h-3 text-amber-400" />
                <span className="text-slate-300">Addis:</span>
                <span className="text-emerald-400 font-bold">±3m RTK</span>
              </div>

              {/* Center / Right controls */}
              <div className="flex items-center gap-1.5 pointer-events-auto">
                {/* Corridor Shortcut Pill */}
                <button
                  onClick={() => setShowCorridorSheet(!showCorridorSheet)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 shadow-lg border transition active-press ${
                    isFilterActive
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                      : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                  title="On-My-Way Corridor Filter"
                >
                  <Sliders className="w-3 h-3" />
                  <span className="truncate max-w-[90px]">{isFilterActive && destinationFilter ? destinationFilter : (isAm ? 'አቅጣጫ' : 'Corridor')}</span>
                </button>

                {/* Demand Heatmap Toggle */}
                <button
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 shadow-lg border transition active-press ${
                    showHeatmap
                      ? 'bg-rose-500 text-white border-rose-400 font-black'
                      : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <Flame className="w-3 h-3 text-rose-400" />
                  <span>{showHeatmap ? (isAm ? 'ሆትስፖት በርቷል' : 'Surge ON') : (isAm ? 'ሆትስፖት' : 'Surge')}</span>
                </button>
              </div>
            </div>

            {/* Quick Corridor Selection Sheet Popover */}
            {showCorridorSheet && (
              <div className="absolute top-16 left-4 right-4 max-w-sm mx-auto z-[1100] bg-slate-900/98 backdrop-blur-2xl border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-3 animate-fade-in">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    {isAm ? 'የጉዞ አቅጣጫ ምረጥ (On-My-Way)' : 'Corridor Filter (On-My-Way)'}
                  </span>
                  <button
                    onClick={() => setShowCorridorSheet(false)}
                    className="text-slate-400 hover:text-white text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{isAm ? 'ሁኔታ' : 'Status'}:</span>
                  <button
                    onClick={() => setIsFilterActive(!isFilterActive)}
                    className={`px-3 py-1 rounded-full text-[11px] font-black transition ${
                      isFilterActive ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isFilterActive ? (isAm ? 'በርቷል' : 'ACTIVE') : (isAm ? 'ጠፍቷል' : 'DISABLED')}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['✈️ Bole Airport', '🏢 Kazanchis', '🏛️ Meskel Sq', '☕ Piassa', '🏘️ CMC Michael', '🛣️ Lebu'].map((hub) => (
                    <button
                      key={hub}
                      onClick={() => {
                        setDestinationFilter(hub);
                        setIsFilterActive(true);
                        setShowCorridorSheet(false);
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs border border-slate-700 active-press transition"
                    >
                      {hub}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Demand Surge Hotspots Banner (when toggled) */}
            {showHeatmap && isOnline && !activeRide && (
              <div className="absolute top-16 left-4 right-4 z-[900] bg-slate-900/95 backdrop-blur-xl border border-rose-500/30 rounded-2xl p-3 shadow-2xl space-y-2 animate-slide-up">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-black text-rose-400 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                    {isAm ? 'የአዲስ አበባ ከፍተኛ ፍላጎት ቦታዎች' : 'Addis Ababa Surge Hotspots'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">1.5x - 1.8x Multiplier</span>
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
                  {['✈️ Bole Airport (1.8x)', '🏢 Kazanchis (1.6x)', '🏛️ Meskel Sq (1.5x)', '☕ Piassa (1.4x)'].map((zone) => (
                    <button
                      key={zone}
                      onClick={() => {
                        setDestinationFilter(zone.split(' (')[0]);
                        setIsFilterActive(true);
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 shrink-0 border border-slate-700 active-press transition"
                    >
                      {zone}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ============================================================
                BOTTOM FLOATING DOCK (YANGO PRO CORE UX PARADIGM)
                ============================================================ */}

            {/* STATE A: OFFLINE DOCK */}
            {!isOnline && !activeRide && !incomingOffer && (
              <div className="absolute bottom-4 left-4 right-4 z-[950] max-w-md mx-auto space-y-2.5 animate-slide-up">
                {/* Collapsible Shift Overview Pill */}
                <div className="bg-slate-900/95 backdrop-blur-2xl border border-slate-800 rounded-2xl p-3 shadow-xl">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-500" />
                      <span className="font-bold text-slate-300">
                        {isAm ? 'ከመስመር ውጭ ነዎት' : 'You are currently OFFLINE'}
                      </span>
                    </div>
                    <button
                      onClick={() => setShowShiftBreakdown(!showShiftBreakdown)}
                      className="text-[10px] font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold"
                    >
                      <span>{shiftStats.grossEarnings} ETB Today</span>
                      {showShiftBreakdown ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {isAm
                      ? 'ሥራ ለመጀመር እና 0% ኮሚሽን ጉዞዎችን ለመቀበል ወደ መስመር ይግቡ።'
                      : 'Go online to receive high-demand trip offers in Addis Ababa with 0% platform commission.'}
                  </p>
                </div>

                {/* Big Tactile "GO ONLINE" Button (Uber/Yango Style) */}
                <button
                  onClick={handleToggleOnline}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-black rounded-2xl text-base shadow-2xl shadow-emerald-500/30 flex items-center justify-center gap-2.5 transition active-press"
                >
                  <Power className="w-5 h-5 stroke-[2.5]" />
                  <span>{isAm ? 'ሥራ ጀምር / GO ONLINE' : 'GO ONLINE / ሥራ ጀምር'}</span>
                </button>
              </div>
            )}

            {/* STATE B: ONLINE & SEARCHING RADAR DOCK */}
            {isOnline && !activeRide && !incomingOffer && (
              <div className="absolute bottom-4 left-4 right-4 z-[950] max-w-md mx-auto bg-slate-900/95 backdrop-blur-2xl border border-slate-800 rounded-3xl p-4 shadow-2xl space-y-3 animate-slide-up">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                    </span>
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                        <span>{isAm ? 'በመስመር ላይ • ጉዞ በመፈለግ ላይ' : 'ONLINE • Finding Rides'}</span>
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {isAm ? 'በ5 ኪ.ሜ ራዲየስ ውስጥ በቅርብ ላሉ ተሳፋሪዎች' : 'Auto-matching nearest riders within 5km radius'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleToggleOnline}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-bold border border-slate-700 transition active-press"
                  >
                    {isAm ? 'አቋርጥ' : 'Go Offline'}
                  </button>
                </div>

                {/* Quick Action Badges */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1 text-emerald-400 font-mono font-bold">
                    <span>{shiftStats.grossEarnings} ETB Today</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400 font-sans">{shiftStats.tripsCompleted} trips</span>
                  </div>
                  <span className="px-2 py-0.5 bg-amber-500/15 text-amber-400 font-bold rounded-full text-[10px] border border-amber-500/30">
                    0% Commission Active
                  </span>
                </div>
              </div>
            )}

            {/* STATE C: IN-CAB STEP-BY-STEP HUD (TURN-BY-TURN WORKFLOW) */}
            {activeRide && rideStep !== 'NONE' && (
              <div className="absolute bottom-4 left-4 right-4 z-[1000] max-w-md mx-auto bg-slate-900/98 backdrop-blur-2xl border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 animate-slide-up">
                {/* STEP 1: HEADING TO PICKUP */}
                {rideStep === 'TO_PICKUP' && (
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-black border border-blue-500/30 flex items-center gap-1.5">
                        <Navigation className="w-3.5 h-3.5 animate-pulse" />
                        {isAm ? 'ደረጃ 1: ወደ መነሻ ቦታ' : 'Step 1: En Route to Pickup'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${activeRide.pickup?.lat || 9.0105},${activeRide.pickup?.lng || 38.7615}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow active-press"
                          title="Open Google Maps Navigation"
                        >
                          <Navigation className="w-3.5 h-3.5" /> Maps
                        </a>
                        <a
                          href={`tel:${activeRide.riderPhone}`}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow active-press"
                        >
                          <Phone className="w-3.5 h-3.5" /> Call
                        </a>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white">{activeRide.riderName}</h4>
                      <p className="text-xs text-slate-400 line-clamp-1 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{activeRide.pickup?.address || 'Pickup Point'}</span>
                      </p>
                    </div>

                    <button
                      onClick={handleArrivedAtPickup}
                      className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-2xl text-sm shadow-xl flex items-center justify-center gap-2 transition active-press"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{isAm ? 'መነሻ ቦታ ደርሻለሁ / Arrived' : 'I Have Arrived at Pickup'}</span>
                    </button>
                  </div>
                )}

                {/* STEP 2: AT PICKUP & PASSENGER BOARDING */}
                {rideStep === 'AT_PICKUP' && (
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-black border border-purple-500/30">
                        {isAm ? 'ደረጃ 2: ተሳፋሪ በመሳፈር ላይ' : 'Step 2: Passenger Boarding'}
                      </span>
                      <span className="text-xs text-amber-400 font-mono font-bold animate-pulse">
                        {isAm ? 'የመጠባበቂያ ሰዓት' : 'Wait Timer'}: {Math.floor(boardingWaitTimer / 60)}:{(boardingWaitTimer % 60).toString().padStart(2, '0')}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white">{activeRide.riderName}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {isAm ? 'መድረሻ' : 'Destination'}: <strong className="text-slate-200">{activeRide.destination?.address}</strong>
                      </p>
                    </div>

                    <button
                      onClick={handleStartTrip}
                      className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-sm shadow-xl flex items-center justify-center gap-2 transition active-press"
                    >
                      <Navigation className="w-5 h-5" />
                      <span>{isAm ? 'ጉዞውን ጀምር / Start Trip' : 'Start Trip / ጉዞውን ጀምር'}</span>
                    </button>
                  </div>
                )}

                {/* STEP 3: IN TRANSIT TO DESTINATION */}
                {rideStep === 'IN_TRANSIT' && (
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black border border-emerald-500/30 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        {isAm ? 'ደረጃ 3: በጉዞ ላይ' : 'In Transit'}
                      </span>
                      <div className="flex items-center gap-2">
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${activeRide.destination?.lat || 9.0185},${activeRide.destination?.lng || 38.7705}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow active-press"
                          title="Open Google Maps Navigation"
                        >
                          <Navigation className="w-3.5 h-3.5" /> Maps
                        </a>
                        <span className="text-base font-black text-amber-400 font-mono">
                          {activeRide.fare?.totalFare || 380} ETB
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">{isAm ? 'መድረሻ' : 'Heading To'}</p>
                      <h4 className="text-sm font-bold text-white line-clamp-1">{activeRide.destination?.address}</h4>
                    </div>

                    <button
                      onClick={handleCompleteTrip}
                      className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-sm shadow-xl flex items-center justify-center gap-2 transition active-press"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{isAm ? 'ጉዞ አጠናቅቅ & ክፍያ ተቀበል' : 'Complete Trip & Collect Fare'}</span>
                    </button>
                  </div>
                )}

                {/* STEP 4: TRIP COMPLETED & FARE COLLECTION */}
                {rideStep === 'COMPLETED' && (
                  <div className="space-y-3.5 text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-white">
                        {isAm ? 'ጉዞ ተጠናቋል! ክፍያ ይቀበሉ' : 'Trip Completed! Collect Fare'}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {isAm ? 'ተሳፋሪው የቴሌብር QR ኮድዎን መቃኘት ይችላል' : 'Passenger can scan your Telebirr QR below'}
                      </p>
                    </div>

                    {/* Dynamic Telebirr In-Cab QR */}
                    {qrDataUrl && (
                      <div className="bg-white p-3 rounded-2xl max-w-[170px] mx-auto shadow-md">
                        <img src={qrDataUrl} alt="Telebirr QR" className="w-full h-auto" />
                        <span className="text-[10px] text-slate-900 font-black uppercase tracking-wider block mt-1">
                          Telebirr Direct Pay
                        </span>
                      </div>
                    )}

                    {/* Fare and 0% Commission Confirmation */}
                    <div className="bg-slate-800 rounded-2xl p-3 space-y-1.5 text-xs text-left">
                      <div className="flex justify-between">
                        <span className="text-slate-400">{isAm ? 'የጉዞ ዋጋ' : 'Fare Amount'}:</span>
                        <strong className="text-amber-400 text-sm">{activeRide.fare?.totalFare || 380} ETB</strong>
                      </div>
                      <div className="flex justify-between text-emerald-400">
                        <span>{isAm ? 'የቼበለው ኮሚሽን' : 'Chebelew Commission'}:</span>
                        <span className="font-bold">0.00 ETB (100% Direct to You)</span>
                      </div>
                    </div>

                    {/* Cash Received Toggle */}
                    <button
                      onClick={() => setCashCollectedConfirmed(!cashCollectedConfirmed)}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition ${
                        cashCollectedConfirmed
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700'
                      }`}
                    >
                      <Check className={`w-4 h-4 ${cashCollectedConfirmed ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <span>{cashCollectedConfirmed ? (isAm ? 'ጥሬ ገንዘብ ተቀብያለሁ ✓' : 'Cash Received in Hand ✓') : (isAm ? 'በጥሬ ገንዘብ ተቀብለዋል?' : 'Mark Cash as Received')}</span>
                    </button>

                    <button
                      onClick={handleCloseCompletedSummary}
                      className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-2xl text-xs transition active-press"
                    >
                      {isAm ? 'ለቀጣይ ጉዞ ዝግጁ / Ready for Next Ride' : 'Ready for Next Ride / ለቀጣይ ጉዞ ዝግጁ'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==============================================================
            TAB 2: EARNINGS & SHIFT NET PROFITABILITY
            ============================================================== */}
        {activeTab === 'earnings' && (
          <div className="h-full w-full overflow-y-auto p-4 space-y-4 max-w-lg mx-auto pb-20">
            <div>
              <h2 className="text-base font-black text-white">{isAm ? 'የፈረቃ ገቢ እና ትርፍ' : 'Shift Intelligence'}</h2>
              <p className="text-xs text-slate-400">{isAm ? 'ከነዳጅ እና ወጪዎች በኋላ የሚቀር ንጹህ ትርፍ' : 'Net in-pocket profitability after fuel & expenses'}</p>
            </div>

            {/* Shift Profit Card */}
            <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-teal-800 rounded-3xl p-5 text-white shadow-xl space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                {isAm ? 'የዛሬ ንጹህ ትርፍ (Net In-Pocket)' : "Today's Net In-Pocket Profit"}
              </span>
              <h3 className="text-3xl font-black">{shiftStats.netProfit} <span className="text-lg font-normal">ETB</span></h3>
              <div className="pt-2 border-t border-emerald-500/40 flex justify-between text-xs text-emerald-100">
                <span>{shiftStats.tripsCompleted} {isAm ? 'ጉዞዎች' : 'Trips Completed'}</span>
                <span>{shiftStats.onlineHours} {isAm ? 'ሰዓታት' : 'Hours Online'}</span>
              </div>
            </div>

            {/* Expense Deductions Breakdown */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5 text-xs">
              <h3 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                {isAm ? 'የቀን ወጪዎች ዝርዝር' : 'Daily Cost Deductions'}
              </h3>
              <div className="flex justify-between text-slate-300">
                <span>Gross Fares Collected:</span>
                <strong className="text-white">+{shiftStats.grossEarnings} ETB</strong>
              </div>
              <div className="flex justify-between text-rose-400">
                <span>Estimated Fuel Expense:</span>
                <span>-{shiftStats.fuelExpenses} ETB</span>
              </div>
              <div className="flex justify-between text-rose-400">
                <span>Maintenance & Tire Reserve:</span>
                <span>-{shiftStats.maintenanceEstimate} ETB</span>
              </div>
              <div className="flex justify-between text-amber-400">
                <span>Chebelew Daily Subscription:</span>
                <span>-{shiftStats.subscriptionFeeDaily} ETB</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between font-black text-emerald-400 text-sm">
                <span>Net In-Pocket Profit:</span>
                <span>{shiftStats.netProfit} ETB</span>
              </div>
            </div>

            {/* 0% Commission Comparison */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-300 space-y-1">
              <p className="font-bold text-amber-200">Chebelew 0% Advantage:</p>
              <p>
                On traditional 15% commission platforms, you would have paid <strong>{Math.round(shiftStats.grossEarnings * 0.15)} ETB</strong> in commissions today. With Chebelew, you only paid your 50 ETB subscription!
              </p>
            </div>
          </div>
        )}

        {/* ==============================================================
            TAB 3: 0% COMMISSION SUBSCRIPTIONS
            ============================================================== */}
        {activeTab === 'subscription' && (
          <div className="h-full w-full overflow-y-auto p-4 space-y-4 max-w-lg mx-auto pb-20">
            <DriverSubscriptionTab
              driver={driver}
              language={language}
              onRefreshDriver={fetchDriverProfile}
            />
          </div>
        )}

        {/* ==============================================================
            TAB 4: DESTINATION CORRIDOR ("ON-MY-WAY")
            ============================================================== */}
        {activeTab === 'destination' && (
          <div className="h-full w-full overflow-y-auto p-4 space-y-4 max-w-lg mx-auto pb-20">
            <div>
              <h2 className="text-base font-black text-white">{isAm ? 'የጉዞ አቅጣጫ ምረጥ' : 'Destination Filter'}</h2>
              <p className="text-xs text-slate-400">{isAm ? 'ወደ ቤት በሚሄዱበት መስመር ብቻ ጉዞዎችን ይቀበሉ' : 'Only receive rides along your corridor (Heading Home)'}</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">{isAm ? 'የኮሪደር ማጣሪያ ሁነታ' : 'Corridor Matching Mode'}</span>
                <button
                  onClick={() => setIsFilterActive(!isFilterActive)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition active-press ${
                    isFilterActive ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isFilterActive ? (isAm ? 'በርቷል' : 'ACTIVE') : (isAm ? 'ጠፍቷል' : 'DISABLED')}
                </button>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">{isAm ? 'የአዲስ አበባ መዳረሻ ሰፈር' : 'Target Neighborhood or Hub in Addis'}</label>
                <input
                  type="text"
                  placeholder="e.g. Gerji Imperial, CMC, Ayat, Lebu, Piassa"
                  value={destinationFilter}
                  onChange={(e) => setDestinationFilter(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>{isAm ? 'የመስመር ራዲየስ መቻቻል' : 'Corridor Radius Tolerance'}:</span>
                  <span className="font-bold text-amber-400">{corridorRadiusKm} km</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="5.0"
                  step="0.5"
                  value={corridorRadiusKm}
                  onChange={(e) => setCorridorRadiusKm(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5 pt-1">
                <p className="text-[11px] text-slate-400">{isAm ? 'ፈጣን የአቅጣጫ አማራጮች' : 'Quick Corridor Shortcuts'}:</p>
                <div className="flex flex-wrap gap-1.5">
                  {['✈️ Bole Airport', '🏢 Kazanchis', '🏛️ Meskel Sq', '☕ Piassa', '🏘️ CMC Michael', '🛣️ Lebu'].map((loc) => (
                    <button
                      key={loc}
                      onClick={() => {
                        setDestinationFilter(loc);
                        setIsFilterActive(true);
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs border border-slate-700 transition active-press"
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================
            TAB 5: PROFILE & DIRECT PAYMENT RAILS
            ============================================================== */}
        {activeTab === 'profile' && (
          <div className="h-full w-full overflow-y-auto p-4 space-y-4 max-w-lg mx-auto pb-20">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg">
                  {driverName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{driverName}</h3>
                  <p className="text-xs text-amber-400 font-mono">{driverPhone}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{vehicle}</p>
                </div>
              </div>
              <button
                onClick={() => setIsAuthOpen(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition active-press"
              >
                Switch
              </button>
            </div>

            <DriverPaymentRailsTab driverId={driverId} />
            <DriverKYCVerification driver={driver} language={language} onKycUpdated={fetchDriverProfile} />
          </div>
        )}
      </main>

      {/* ==============================================================
          SLIDE-UP YANGO PRO STYLE INCOMING RIDE OFFER BOTTOM SHEET
          ============================================================== */}
      {incomingOffer && (
        <div className="fixed inset-0 z-[1500] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in pointer-events-auto">
          <div className="w-full max-w-md bg-slate-900 border-t-2 sm:border-2 border-amber-500 rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 text-center relative overflow-hidden urgent-pulse animate-slide-up">
            {/* Top Linear Countdown Timer Bar */}
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-amber-400 h-full transition-all duration-1000 ease-linear"
                style={{ width: `${(countdown / 15) * 100}%` }}
              />
            </div>

            {/* Header & Net Fare */}
            <div className="flex items-center justify-between pt-1">
              <div className="text-left">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
                  {isAm ? 'አዲስ ጉዞ ጥሪ' : 'NEW RIDE OFFER'}
                </span>
                <p className="text-[10px] text-slate-400 mt-1">
                  {incomingOffer.riderName || 'Passenger'} • ★ 4.95
                </p>
              </div>
              <div className="text-right">
                <h3 className="text-2xl font-black text-white font-mono">
                  {incomingOffer.fare?.totalFare || 380} <span className="text-xs font-bold text-amber-400">ETB</span>
                </h3>
                <span className="text-[10px] text-emerald-400 font-bold block">100% Direct to You</span>
              </div>
            </div>

            {/* Route Details */}
            <div className="bg-slate-800/80 rounded-2xl p-3.5 text-left space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div className="overflow-hidden">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    {isAm ? 'መነሻ ቦታ (~1.2 ኪ.ሜ ርቀት • ~3 ደቂቃ)' : 'Pickup (~1.2 km away • ~3 min ETA)'}
                  </span>
                  <p className="font-semibold text-slate-100 truncate">{incomingOffer.pickup?.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 pt-1.5 border-t border-slate-700/60">
                <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Navigation className="w-3.5 h-3.5" />
                </div>
                <div className="overflow-hidden">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    {isAm ? 'መድረሻ ቦታ (~4.8 ኪ.ሜ ጉዞ)' : 'Destination (~4.8 km trip)'}
                  </span>
                  <p className="font-semibold text-slate-100 truncate">{incomingOffer.destination?.address}</p>
                </div>
              </div>
            </div>

            {/* Accept / Decline Action Buttons */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <button
                onClick={handleDeclineRide}
                className="py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-bold rounded-2xl text-xs transition border border-slate-700 active-press col-span-1"
              >
                {isAm ? 'እምቢ' : 'Decline'} ({countdown}s)
              </button>
              <button
                onClick={handleAcceptRide}
                className="py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-2xl text-sm shadow-xl shadow-amber-500/25 transition active-press col-span-2 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{isAm ? 'ጉዞውን ተቀበል' : 'Accept Ride / ተቀበል'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          BOTTOM IN-CAB NAVIGATION BAR
          ============================================================== */}
      <nav className="h-16 bg-slate-900/95 backdrop-blur-2xl border-t border-slate-800 flex items-center justify-around px-2 z-40 shrink-0 pb-safe">
        {[
          { tab: 'radar', label: isAm ? 'ራዳር' : 'Radar', icon: Compass },
          { tab: 'earnings', label: isAm ? 'ገቢ' : 'Earnings', icon: DollarSign },
          { tab: 'subscription', label: isAm ? 'ምዝገባ' : '0% Plans', icon: Award },
          { tab: 'destination', label: isAm ? 'አቅጣጫ' : 'Corridor', icon: Sliders },
          { tab: 'profile', label: isAm ? 'መለያ' : 'Profile', icon: User },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.tab;
          return (
            <button
              key={item.tab}
              onClick={() => {
                setActiveTab(item.tab as DriverTab);
                sounds.playBeep(650, 'sine', 0.05);
              }}
              className={`flex flex-col items-center justify-center w-16 py-1 rounded-2xl transition active-press ${
                isActive ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition ${
                  isActive ? 'bg-amber-500/15' : 'bg-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              </div>
              <span className={`text-[10px] mt-0.5 ${isActive ? 'font-black' : 'font-semibold'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Driver Switch/Auth Modal */}
      <MobileAuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        defaultRole="driver"
        language={language}
        onAuthenticated={(authenticatedUser) => {
          setDriverId(authenticatedUser.id);
          setDriverName(authenticatedUser.name);
          setDriverPhone(authenticatedUser.phone);
          setIsAuthOpen(false);
          sounds.playBeep(880, 'sine', 0.2);
        }}
      />
    </div>
  );
};
