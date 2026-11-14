import React, { useState, useEffect, useRef } from 'react';
import { 
  Car, DollarSign, Award, Sliders, User, Power, ShieldAlert,
  Phone, Navigation, CheckCircle2, XCircle, MapPin, QrCode, 
  ArrowRight, Clock, AlertTriangle, RefreshCw, Compass
} from 'lucide-react';
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
    cityCode: 'ADD',
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
    } catch (e) {
      // Keep existing state on error
    }
  };

  useEffect(() => {
    if (driverId) {
      fetchDriverProfile();
    }
  }, [driverId]);

  const [isOnline, setIsOnline] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Active Ride and Incoming Offer States
  const [incomingOffer, setIncomingOffer] = useState<Ride | null>(null);
  const [countdown, setCountdown] = useState(15);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [rideStep, setRideStep] = useState<'NONE' | 'TO_PICKUP' | 'AT_PICKUP' | 'IN_TRANSIT' | 'COMPLETED'>('NONE');

  // Destination Filter ("On-My-Way")
  const [destinationFilter, setDestinationFilter] = useState('');
  const [isFilterActive, setIsFilterActive] = useState(false);

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

  // Current Driver GPS
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number; heading: number }>({
    lat: 9.0105,
    lng: 38.7615,
    heading: 0,
  });

  const countdownIntervalRef = useRef<any>(null);

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

    // Register driver with socket
    socket.emit('driver:register', { driverId });

    // Incoming ride broadcast
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
      // Simulate micro-drift in Addis Ababa
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

  // Step 1 -> Step 2: Arrived at Pickup
  const handleArrivedAtPickup = () => {
    if (!activeRide || !socket) return;
    socket.emit('ride:arrived', { rideId: activeRide.id });
    setRideStep('AT_PICKUP');
    sounds.playBeep(700, 'sine', 0.2);
  };

  // Step 2 -> Step 3: Start Trip
  const handleStartTrip = () => {
    if (!activeRide || !socket) return;
    socket.emit('ride:start', { rideId: activeRide.id });
    setRideStep('IN_TRANSIT');
    sounds.playBeep(850, 'sine', 0.2);
  };

  // Step 3 -> Step 4: Complete Trip & Collect Fare
  const handleCompleteTrip = () => {
    if (!activeRide || !socket) return;
    socket.emit('ride:complete', { rideId: activeRide.id });
    setRideStep('COMPLETED');
    sounds.playPaymentSuccess();

    // Update shift stats
    const fare = activeRide.fare?.totalFare || 250;
    setShiftStats((prev) => ({
      ...prev,
      grossEarnings: prev.grossEarnings + fare,
      tripsCompleted: prev.tripsCompleted + 1,
      netProfit: prev.netProfit + fare,
    }));
  };

  const handleCloseCompletedSummary = () => {
    setActiveRide(null);
    setRideStep('NONE');
  };

  const t = translations[language] || translations.en;

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Driver Mobile Header */}
      <header className="h-14 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 px-4 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center font-black text-slate-950 text-base shadow-md">
            ቼ
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-wider text-white uppercase">DRIVER CABIN</span>
              <span className="text-[10px] font-bold text-amber-400 font-serif">አሽከርካሪ</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              0% Commission • Addis Ababa
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Online / Offline Toggle */}
          <button
            onClick={handleToggleOnline}
            className={`px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 shadow-lg transition ${
              isOnline
                ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-400/40'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </button>

          {/* Quick SOS Emergency 991 */}
          <a
            href="tel:991"
            className="w-8 h-8 rounded-full bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 flex items-center justify-center text-xs font-bold transition"
          >
            <ShieldAlert className="w-4 h-4" />
          </a>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 relative overflow-hidden">
        {/* TAB 1: RADAR & IN-CAB OPERATION */}
        {activeTab === 'radar' && (
          <div className="h-full w-full relative">
            <AddisMap
              pickup={activeRide?.pickup}
              destination={activeRide?.destination}
              routeCoordinates={activeRide?.routeCoordinates || []}
              activeDriverLocation={[driverLocation.lat, driverLocation.lng]}
              activeDriverHeading={driverLocation.heading}
              className="h-full w-full"
            />

            {/* Offline Floating Overlay */}
            {!isOnline && !activeRide && (
              <div className="absolute top-4 left-4 right-4 z-[900] bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 text-center shadow-2xl">
                <p className="text-xs font-bold text-slate-300">You are currently OFFLINE</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Toggle ONLINE above to start receiving Addis Ababa trip offers.</p>
                <button
                  onClick={handleToggleOnline}
                  className="mt-3 px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition"
                >
                  Go Online Now
                </button>
              </div>
            )}

            {/* In-Ride Step-by-Step HUD */}
            {activeRide && rideStep !== 'NONE' && (
              <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 animate-slide-up">
                {/* Step 1: Heading to Pickup */}
                {rideStep === 'TO_PICKUP' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30">
                        Step 1: En Route to Pickup
                      </span>
                      <a
                        href={`tel:${activeRide.riderPhone}`}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5" /> Call Passenger
                      </a>
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
                      className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-2xl text-sm shadow-xl flex items-center justify-center gap-2 transition"
                    >
                      <CheckCircle2 className="w-5 h-5" /> I Have Arrived at Pickup
                    </button>
                  </div>
                )}

                {/* Step 2: At Pickup */}
                {rideStep === 'AT_PICKUP' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold border border-purple-500/30">
                        Step 2: Passenger Boarding
                      </span>
                      <span className="text-xs text-amber-400 font-mono font-bold animate-pulse">
                        Waiting for Passenger
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white">{activeRide.riderName}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Destination: <strong className="text-slate-200">{activeRide.destination?.address}</strong>
                      </p>
                    </div>

                    <button
                      onClick={handleStartTrip}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-sm shadow-xl flex items-center justify-center gap-2 transition"
                    >
                      <Navigation className="w-5 h-5" /> Start Trip / ጉዞውን ጀምር
                    </button>
                  </div>
                )}

                {/* Step 3: In Transit */}
                {rideStep === 'IN_TRANSIT' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        In Transit to Destination
                      </span>
                      <span className="text-sm font-black text-amber-400 font-mono">
                        {activeRide.fare?.totalFare || 0} ETB
                      </span>
                    </div>

                    <div>
                      <p className="text-[11px] text-slate-400 uppercase font-bold">Heading To</p>
                      <h4 className="text-sm font-bold text-white line-clamp-1">{activeRide.destination?.address}</h4>
                    </div>

                    <button
                      onClick={handleCompleteTrip}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-sm shadow-xl flex items-center justify-center gap-2 transition"
                    >
                      <CheckCircle2 className="w-5 h-5" /> Complete Trip & Collect Fare
                    </button>
                  </div>
                )}

                {/* Step 4: Completed Summary */}
                {rideStep === 'COMPLETED' && (
                  <div className="space-y-3">
                    <div className="text-center space-y-1">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h4 className="text-base font-black text-white">Trip Completed Successfully!</h4>
                      <p className="text-xs text-slate-400">Collect fare directly via your configured payment rail</p>
                    </div>

                    <div className="bg-slate-800 rounded-2xl p-3.5 space-y-2 border border-slate-700">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Payable Total:</span>
                        <strong className="text-amber-400 text-base">{activeRide.fare?.totalFare || 0} ETB</strong>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-emerald-400">
                        <span>Chebelew Platform Fee (0% Rule):</span>
                        <span className="font-bold">0.00 ETB (You keep 100%)</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-slate-400">
                        <span>FDRE Ministry of Revenues 15% VAT:</span>
                        <span>{activeRide.fare?.vatAmount || 0} ETB (Reg 570/2025)</span>
                      </div>
                    </div>

                    <button
                      onClick={handleCloseCompletedSummary}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition"
                    >
                      Ready for Next Ride
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: EARNINGS & NET PROFIT */}
        {activeTab === 'earnings' && (
          <div className="h-full w-full overflow-y-auto p-4 space-y-4 max-w-lg mx-auto pb-20">
            <div>
              <h2 className="text-base font-black text-white">Daily Earnings & Profit / ገቢ</h2>
              <p className="text-xs text-slate-400">0% Commission Net Profitability Intelligence</p>
            </div>

            {/* Net Profit Card */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-800 rounded-3xl p-5 text-white shadow-xl space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                Today's Net Profit (After Fuel & Exp.)
              </span>
              <h3 className="text-3xl font-black">{shiftStats.netProfit.toLocaleString()} <span className="text-lg">ETB</span></h3>

              <div className="pt-2 border-t border-emerald-500/30 flex justify-between items-center text-xs">
                <span>Completed Trips: <strong>{shiftStats.tripsCompleted}</strong></span>
                <span>Active Time: <strong>{shiftStats.onlineHours} hrs</strong></span>
              </div>
            </div>

            {/* Expense Breakdown */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Breakdown Calculator</h4>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Gross Fares Collected:</span>
                <strong className="text-white">+{shiftStats.grossEarnings} ETB</strong>
              </div>
              <div className="flex justify-between text-xs text-rose-400">
                <span>Estimated Fuel Expense:</span>
                <span>-{shiftStats.fuelExpenses} ETB</span>
              </div>
              <div className="flex justify-between text-xs text-rose-400">
                <span>Vehicle Maintenance Reserve:</span>
                <span>-{shiftStats.maintenanceEstimate} ETB</span>
              </div>
              <div className="flex justify-between text-xs text-rose-400">
                <span>Daily 0% Platform Subscription:</span>
                <span>-{shiftStats.subscriptionFeeDaily} ETB</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between text-xs font-black text-emerald-400">
                <span>Net In-Pocket Profit:</span>
                <span>{shiftStats.netProfit} ETB</span>
              </div>
            </div>

            {/* 0% Commission Comparison */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-300 space-y-1">
              <p className="font-bold text-amber-200">Chebelew 0% Advantage:</p>
              <p>On traditional 15% commission apps, you would have paid <strong>{Math.round(shiftStats.grossEarnings * 0.15)} ETB</strong> in commissions today. With Chebelew, you only paid your 50 ETB daily subscription!</p>
            </div>
          </div>
        )}

        {/* TAB 3: 0% SUBSCRIPTION */}
        {activeTab === 'subscription' && (
          <div className="h-full w-full overflow-y-auto p-4 space-y-4 max-w-lg mx-auto pb-20">
            <DriverSubscriptionTab
              driver={driver}
              language={language}
              onRefreshDriver={fetchDriverProfile}
            />
          </div>
        )}

        {/* TAB 4: DESTINATION FILTER ("ON-MY-WAY") */}
        {activeTab === 'destination' && (
          <div className="h-full w-full overflow-y-auto p-4 space-y-4 max-w-lg mx-auto pb-20">
            <div>
              <h2 className="text-base font-black text-white">Destination Filter / አቅጣጫ ምረጥ</h2>
              <p className="text-xs text-slate-400">Only receive rides along your corridor (Heading Home)</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Corridor Matching Mode</span>
                <button
                  onClick={() => setIsFilterActive(!isFilterActive)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                    isFilterActive
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isFilterActive ? 'ACTIVE' : 'DISABLED'}
                </button>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Target Neighborhood or Hub in Addis</label>
                <input
                  type="text"
                  placeholder="e.g. Gerji Imperial, CMC, Ayat, Lebu, Piassa"
                  value={destinationFilter}
                  onChange={(e) => setDestinationFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5 pt-1">
                <p className="text-[11px] text-slate-400">Quick Corridor Shortcuts:</p>
                <div className="flex flex-wrap gap-1.5">
                  {['Bole Airport', 'CMC Michael', 'Kazanchis', 'Meskel Square', 'Lebu Mebrathail'].map((loc) => (
                    <button
                      key={loc}
                      onClick={() => {
                        setDestinationFilter(loc);
                        setIsFilterActive(true);
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs border border-slate-700 transition"
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: PROFILE & DIRECT PAYMENT RAILS */}
        {activeTab === 'profile' && (
          <div className="h-full w-full overflow-y-auto p-4 space-y-4 max-w-lg mx-auto pb-20">
            {/* Driver Profile Summary */}
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
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition"
              >
                Switch
              </button>
            </div>

            {/* Direct Payment Rails Setup (Telebirr & CBE) */}
            <DriverPaymentRailsTab
              driverId={driverId}
            />

            {/* Driver KYC & Permit Status */}
            <DriverKYCVerification
              driver={driver}
              language={language}
              onKycUpdated={fetchDriverProfile}
            />
          </div>
        )}
      </main>

      {/* FULLSCREEN INCOMING RIDE OFFER MODAL */}
      {incomingOffer && (
        <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border-2 border-amber-500 rounded-3xl shadow-2xl p-6 space-y-5 text-center relative overflow-hidden">
            {/* Circular Countdown Progress */}
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
              <div
                className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin"
                style={{ animationDuration: '1s' }}
              />
              <span className="text-2xl font-black text-amber-400 font-mono">{countdown}</span>
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-wider">
                Incoming Ride Offer / አዲስ ጉዞ
              </span>
              <h3 className="text-2xl font-black text-white mt-2">
                {incomingOffer.fare?.totalFare || 0} <span className="text-sm font-bold text-amber-400">ETB</span>
              </h3>
              <p className="text-xs text-emerald-400 font-bold">100% Direct to You (0% Platform Fee)</p>
            </div>

            {/* Locations */}
            <div className="bg-slate-800/80 rounded-2xl p-4 text-left space-y-2.5 text-xs">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Pickup (~1.2 km away)</span>
                  <p className="font-semibold text-slate-200 line-clamp-1">{incomingOffer.pickup?.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Destination</span>
                  <p className="font-semibold text-slate-200 line-clamp-1">{incomingOffer.destination?.address}</p>
                </div>
              </div>
            </div>

            {/* Accept / Decline Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleDeclineRide}
                className="py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl text-xs transition border border-slate-700"
              >
                Decline ({countdown}s)
              </button>
              <button
                onClick={handleAcceptRide}
                className="py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-sm shadow-xl transition"
              >
                ACCEPT RIDE 🚖
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Driver Bottom Tab Navigation */}
      <nav className="h-16 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 px-2 flex items-center justify-around z-30 shrink-0">
        <button
          onClick={() => setActiveTab('radar')}
          className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition ${
            activeTab === 'radar' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Car className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">In-Cab</span>
        </button>

        <button
          onClick={() => setActiveTab('earnings')}
          className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition ${
            activeTab === 'earnings' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <DollarSign className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Earnings</span>
        </button>

        <button
          onClick={() => setActiveTab('subscription')}
          className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition ${
            activeTab === 'subscription' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">0% Plans</span>
        </button>

        <button
          onClick={() => setActiveTab('destination')}
          className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition ${
            activeTab === 'destination' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Corridor</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition ${
            activeTab === 'profile' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Profile</span>
        </button>
      </nav>

      {/* Driver Mobile Auth Modal */}
      <MobileAuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        defaultRole="driver"
        language={language}
        onAuthenticated={(authUser) => {
          setDriverId(authUser.id);
          setDriverName(authUser.name);
          setDriverPhone(authUser.phone);
          if (onLanguageChange && authUser.language) {
            onLanguageChange(authUser.language);
          }
        }}
      />
    </div>
  );
};
