import React, { useState, useEffect } from 'react';
import { 
  Car, Clock, Wallet, Bookmark, User, ShieldAlert, Globe, 
  MapPin, Plus, Trash2, CheckCircle2, ChevronRight, Phone,
  Receipt, ArrowUpRight, AlertTriangle, Star, RefreshCw,
  Search, Sliders, Share2, X, Send, Navigation, ArrowUpDown,
  Sparkles, CreditCard, ChevronDown, ChevronUp, Check, ShieldCheck,
  ChevronLeft, Info, HelpCircle, LocateFixed, Crosshair, Building,
  ShoppingBag, Hotel, Compass, Activity, FileText, CheckCircle, Radio
} from 'lucide-react';
import { AddisMap } from '../Map/AddisMap';
import { Language, translations } from '../../i18n/translations';
import { MobileAuthModal } from '../Onboarding/MobileAuthModal';
import { VatReceiptModal } from '../Payment/VatReceiptModal';
import { PassengerWalletModal } from '../Payment/PassengerWalletModal';
import { ADDIS_LANDMARKS, AddisLandmark } from '@shared/landmarks';
import { sounds } from '../../utils/audio';
import { Ride, Driver, MarketplaceOffer, LocationPoint, PaymentMethod, VehicleCategory } from '@shared/types';

interface PassengerMobileShellProps {
  currentRiderId: string;
  currentRiderName: string;
  currentRiderPhone: string;
  language: Language;
  onLanguageChange?: (lang: Language) => void;
  socket: any;
}

type MobileTab = 'ride' | 'activity' | 'wallet' | 'saved' | 'profile';
type SheetState = 'EXPLORE' | 'OFFERS' | 'ACTIVE_RIDE' | 'COMPLETED_SUMMARY';

interface SavedPlace {
  id: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
  iconType: 'home' | 'work' | 'airport' | 'other';
}

export const PassengerMobileShell: React.FC<PassengerMobileShellProps> = ({
  currentRiderId: initialRiderId,
  currentRiderName: initialRiderName,
  currentRiderPhone: initialRiderPhone,
  language,
  onLanguageChange,
  socket,
}) => {
  const [activeTab, setActiveTab] = useState<MobileTab>('ride');
  const [sheetState, setSheetState] = useState<SheetState>('EXPLORE');
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);

  const [user, setUser] = useState({
    id: initialRiderId,
    name: initialRiderName,
    phone: initialRiderPhone,
    role: 'rider',
    language,
  });

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [tripHistory, setTripHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Map & Locations
  const [pickup, setPickup] = useState<LocationPoint>({
    address: 'Bole Medhanialem Mall, Addis Ababa',
    addressAm: 'ቦሌ መድኃኔዓለም እና ኤድና ሞል',
    lat: 8.995,
    lng: 38.788,
  });

  const [destination, setDestination] = useState<LocationPoint>({
    address: 'UNECA Conference Centre (Kazanchis)',
    addressAm: 'የተመድ ኢኮኖሚክ ኮሚሽን (ካዛንቺስ)',
    lat: 9.0185,
    lng: 38.7705,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingDest, setIsSearchingDest] = useState(false);

  // Service Category & Offers
  const [selectedCategory, setSelectedCategory] = useState<VehicleCategory>('sedan');
  const [comparisonMode, setComparisonMode] = useState<'best_value' | 'cheapest' | 'fastest_pickup' | 'premium_comfort'>('best_value');
  const [marketplaceOffers, setMarketplaceOffers] = useState<MarketplaceOffer[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState<string>('chebelew_direct');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TELEBIRR');
  const [isLoadingOffers, setIsLoadingOffers] = useState(false);

  // Receipt & Wallet Modals
  const [selectedReceiptRide, setSelectedReceiptRide] = useState<Ride | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(1250);

  // Search enhancements
  const [searchCategoryFilter, setSearchCategoryFilter] = useState<'all' | 'transit' | 'commercial' | 'hotel' | 'square' | 'institution'>('all');
  const [isEditingPickupInSearch, setIsEditingPickupInSearch] = useState(false);
  const [pickupSearchQuery, setPickupSearchQuery] = useState('');

  // Safety settings & Cancel Protection
  const [requireSafetyPin, setRequireSafetyPin] = useState(true);
  const [emergencyContact, setEmergencyContact] = useState('+251911998877');
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);

  // Collapsible Accordions for Clean Yango-style Map-Dominant UI
  const [showAllOffers, setShowAllOffers] = useState(false);
  const [showPickupNotes, setShowPickupNotes] = useState(false);
  const [showPaymentRails, setShowPaymentRails] = useState(false);
  const [showCategoryDetails, setShowCategoryDetails] = useState(false);

  // Live Ride Tracking
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [liveDriverPos, setLiveDriverPos] = useState<{ lat: number; lng: number; heading?: number } | null>(null);
  const [safetyPin] = useState('4892');
  const [isHoveredBook, setIsHoveredBook] = useState(false);

  // Rating State
  const [userRating, setUserRating] = useState(5);
  const [tipAmount, setTipAmount] = useState(20);
  const [selectedFeedbackTags, setSelectedFeedbackTags] = useState<string[]>([]);

  // Driver Instructions & Scheduling
  const [pickupNotes, setPickupNotes] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleDateTime, setScheduleDateTime] = useState('');
  const [flightNumber, setFlightNumber] = useState('');

  // Available Drivers for Map
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);

  // Saved Places
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([
    {
      id: 'sp_home',
      label: 'Home / ቤት',
      address: 'CMC Michael, Addis Ababa',
      lat: 9.025,
      lng: 38.835,
      iconType: 'home',
    },
    {
      id: 'sp_work',
      label: 'Office / ሥራ',
      address: 'Kazanchis, ECA Conference Center',
      lat: 9.018,
      lng: 38.771,
      iconType: 'work',
    },
    {
      id: 'sp_airport',
      label: 'Bole Airport / ቦሌ አየር ማረፊያ',
      address: 'Addis Ababa Bole International Airport, Terminal 2',
      lat: 8.9778,
      lng: 38.7993,
      iconType: 'airport',
    },
  ]);

  const [newPlaceLabel, setNewPlaceLabel] = useState('');
  const [newPlaceAddress, setNewPlaceAddress] = useState('');

  // Online / Offline monitor & session restore
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    let activeUserId = user.id;
    try {
      const cached = localStorage.getItem('chebelew_active_user');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.role === 'rider') {
          setUser(parsed);
          activeUserId = parsed.id;
        }
      }
    } catch (e) {}

    // Restore active in-flight trip if user refreshes or reopens app
    const restoreActiveTrip = async (uid: string) => {
      try {
        const res = await fetch(`/api/rides/active/${uid}`);
        if (res.ok) {
          const data = await res.json();
          if (data.ride && ['REQUESTED', 'ASSIGNED', 'ARRIVED', 'IN_PROGRESS'].includes(data.ride.status)) {
            setActiveRide(data.ride);
            setSheetState('ACTIVE_RIDE');
            if (data.ride.pickup) setPickup(data.ride.pickup);
            if (data.ride.destination) setDestination(data.ride.destination);
            if (data.ride.currentDriverLocation) {
              setLiveDriverPos({
                lat: data.ride.currentDriverLocation[0],
                lng: data.ride.currentDriverLocation[1],
              });
            }
          }
        }
      } catch (e) {}
    };

    restoreActiveTrip(activeUserId);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch Drivers in Addis Ababa for real-time map radar
  const fetchDrivers = async () => {
    try {
      const res = await fetch('/api/drivers');
      if (res.ok) {
        const data = await res.json();
        if (data.drivers) {
          setAvailableDrivers(data.drivers);
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchDrivers();
    const interval = setInterval(fetchDrivers, 12000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Multi-Provider Comparison Offers
  const fetchOffers = async () => {
    setIsLoadingOffers(true);
    try {
      const res = await fetch('/api/providers/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup,
          destination,
          vehicleCategory: selectedCategory,
          mode: comparisonMode,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.offers && data.offers.length > 0) {
          setMarketplaceOffers(data.offers);
          setSelectedOfferId(data.offers[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load comparison offers:', e);
    } finally {
      setIsLoadingOffers(false);
    }
  };

  useEffect(() => {
    if (pickup && destination) {
      fetchOffers();
    }
  }, [pickup, destination, selectedCategory, comparisonMode]);

  // Socket Telemetry Listeners & Real-Time Redundancy
  useEffect(() => {
    if (!socket) return;

    if (activeRide?.id) {
      socket.emit('join:ride', activeRide.id);
      socket.emit('join:rider', user.id);
    }

    const handleRideUpdate = (updatedRide: Ride) => {
      if (!updatedRide) return;
      if (activeRide && updatedRide.id === activeRide.id) {
        setActiveRide(updatedRide);
        if (updatedRide.status === 'ASSIGNED' && activeRide.status === 'REQUESTED') {
          sounds.playRideAccepted();
        } else if (updatedRide.status === 'ARRIVED') {
          sounds.playBeep(650, 'sine', 0.25);
        } else if (updatedRide.status === 'COMPLETED') {
          setSheetState('COMPLETED_SUMMARY');
          sounds.playPaymentSuccess();
        } else if (updatedRide.status === 'CANCELLED') {
          setActiveRide(null);
          setSheetState('EXPLORE');
        }

        if (updatedRide.currentDriverLocation) {
          setLiveDriverPos({
            lat: updatedRide.currentDriverLocation[0],
            lng: updatedRide.currentDriverLocation[1],
          });
        }
      }
    };

    const handleLocationTick = (data: { rideId: string; driverLocation: [number, number]; heading?: number }) => {
      if (activeRide && data.rideId === activeRide.id) {
        setLiveDriverPos({ lat: data.driverLocation[0], lng: data.driverLocation[1], heading: data.heading });
      }
    };

    const handleLocationUpdate = (data: { driverId: string; lat: number; lng: number; heading?: number }) => {
      if (activeRide?.driverId && data.driverId === activeRide.driverId) {
        setLiveDriverPos({ lat: data.lat, lng: data.lng, heading: data.heading });
      }
    };

    socket.on('ride:status_changed', handleRideUpdate);
    socket.on('ride:updated', handleRideUpdate);
    socket.on('ride:status_change', handleRideUpdate);
    socket.on('ride:location_tick', handleLocationTick);
    socket.on('driver:location_update', handleLocationUpdate);

    // Guaranteed polling fallback every 3s during active matching/trip
    const pollInterval = setInterval(async () => {
      if (activeRide && activeRide.status !== 'COMPLETED' && activeRide.status !== 'CANCELLED') {
        try {
          const res = await fetch(`/api/rides/${activeRide.id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.ride && data.ride.status !== activeRide.status) {
              handleRideUpdate(data.ride);
            }
          }
        } catch (e) {}
      }
    }, 3000);

    return () => {
      socket.off('ride:status_changed', handleRideUpdate);
      socket.off('ride:updated', handleRideUpdate);
      socket.off('ride:status_change', handleRideUpdate);
      socket.off('ride:location_tick', handleLocationTick);
      socket.off('driver:location_update', handleLocationUpdate);
      clearInterval(pollInterval);
    };
  }, [socket, activeRide?.id, activeRide?.status, activeRide?.driverId, user.id]);

  // Fetch ride history
  const fetchRideHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/rides/user/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setTripHistory(data.rides || []);
      }
    } catch (e) {
      console.error('Failed to load ride history:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'activity') {
      fetchRideHistory();
    }
  }, [activeTab]);

  // Handle Request Ride
  const handleRequestRide = async () => {
    try {
      const selectedOffer = marketplaceOffers.find((o) => o.id === selectedOfferId) || marketplaceOffers[0];
      const res = await fetch('/api/rides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          riderId: user.id,
          riderName: user.name,
          riderPhone: user.phone,
          pickup,
          destination,
          vehicleCategory: selectedCategory,
          paymentMethod,
          providerId: selectedOffer?.providerId || 'chebelew',
          providerOfferId: selectedOffer?.id,
          fareEtb: selectedOffer?.estimatedFare || 240,
          operatorNotes: pickupNotes || undefined,
          autoAssign: false,
        }),
      });

      const data = await res.json();
      if (data.success && data.ride) {
        setActiveRide(data.ride);
        setSheetState('ACTIVE_RIDE');
        sounds.playIncomingRideAlert();
        if (socket) {
          socket.emit('join:ride', data.ride.id);
          socket.emit('join:rider', user.id);
        }
      }
    } catch (e) {
      console.error('Failed to book ride:', e);
    }
  };

  // Cancel active ride
  const handleCancelActiveRide = async () => {
    if (!activeRide) return;
    try {
      await fetch(`/api/rides/${activeRide.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Passenger cancelled from mobile app', cancelledBy: 'rider' }),
      });
      setActiveRide(null);
      setSheetState('EXPLORE');
      sounds.playBeep(350, 'square', 0.2);
    } catch (e) {
      console.error('Failed to cancel ride:', e);
    }
  };

  // Trigger Emergency SOS Incident
  const handleTriggerEmergencySos = async () => {
    sounds.playBeep(900, 'sawtooth', 0.5);
    try {
      await fetch('/api/safety/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rideId: activeRide?.id,
          reporterUserId: user.id,
          reporterName: user.name,
          reporterPhone: user.phone,
          reporterRole: 'rider',
          currentLat: liveDriverPos?.lat || pickup?.lat || 9.0105,
          currentLng: liveDriverPos?.lng || pickup?.lng || 38.7615,
          safetyNotes: `Passenger triggered emergency SOS during active trip #${activeRide?.id || 'none'}`,
        }),
      });
    } catch (e) {}
    setIsSosModalOpen(true);
  };

  // Submit Driver Rating
  const handleSubmitRating = async () => {
    if (!activeRide) {
      setSheetState('EXPLORE');
      return;
    }
    try {
      await fetch(`/api/rides/${activeRide.id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: userRating,
          tipAmount,
        }),
      });
      setActiveRide(null);
      setSheetState('EXPLORE');
      sounds.playBeep(880, 'sine', 0.2);
    } catch (e) {
      setActiveRide(null);
      setSheetState('EXPLORE');
    }
  };

  const handleSelectLandmark = (lm: AddisLandmark) => {
    setDestination({
      address: lm.name,
      addressAm: lm.nameAm,
      lat: lm.lat,
      lng: lm.lng,
    });
    setIsSearchingDest(false);
    setSheetState('OFFERS');
  };

  const POPULAR_HUBS = [
    { label: '✈️ Bole Airport T2', name: 'Bole International Airport, Terminal 2', lat: 8.9778, lng: 38.7993 },
    { label: '🏢 Kazanchis (ECA)', name: 'UNECA Conference Centre (Kazanchis)', lat: 9.0185, lng: 38.7705 },
    { label: '🏛️ Meskel Square', name: 'Meskel Square Exhibition Center', lat: 9.0105, lng: 38.7615 },
    { label: '🛍️ Edna Mall', name: 'Bole Medhanialem Mall & Cinema', lat: 8.995, lng: 38.788 },
    { label: '☕ Piassa Churchill', name: 'Churchill Avenue, Piassa Addis', lat: 9.0315, lng: 38.7525 },
    { label: '🏨 Skylight Hotel', name: 'Ethiopian Skylight Hotel, Bole', lat: 8.987, lng: 38.789 },
  ];

  const VEHICLE_CATEGORIES: { id: VehicleCategory; label: string; sub: string; fare: number; icon: string }[] = [
    { id: 'sedan', label: 'Economy', sub: 'Toyota Corolla, Dzire', fare: 220, icon: '🚗' },
    { id: 'comfort', label: 'Comfort VIP', sub: 'Executive, Guaranteed A/C', fare: 320, icon: '🚙' },
    { id: 'minivan', label: 'Minivan 7-Pax', sub: 'Spacious luggage & seats', fare: 420, icon: '🚐' },
    { id: 'delivery_moto', label: 'Fast Courier', sub: 'Express Addis Parcel', fare: 110, icon: '📦' },
  ];

  const t = translations[language] || translations.en;
  const isAm = language === 'am';

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-100 overflow-hidden select-none font-sans">
      {/* Offline Status Alert */}
      {!isOnline && (
        <div className="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-bold flex items-center justify-between z-50 shadow-md">
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> Offline Mode — Addis Data Cached
          </span>
          <span className="text-[10px] font-mono animate-pulse">RECONNECTING</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 relative overflow-hidden">
        {/* ==============================================================
            TAB 1: RIDE (EDGE-TO-EDGE MAP & UBER-LEVEL MOBILE BOTTOM SHEET)
            ============================================================== */}
        {activeTab === 'ride' && (
          <div className="h-full w-full relative">
            {/* Edge-to-Edge Full-Screen Interactive Map */}
            <div className="absolute inset-0 z-0">
              <AddisMap
                pickup={activeRide?.pickup || pickup}
                destination={activeRide?.destination || destination}
                drivers={availableDrivers}
                activeDriverLocation={liveDriverPos ? [liveDriverPos.lat, liveDriverPos.lng] : undefined}
                activeDriverHeading={liveDriverPos?.heading || 0}
                activeDriverPlate={activeRide?.driver?.vehiclePlate}
                routeCoordinates={activeRide?.routeCoordinates || []}
                isSearching={activeRide?.status === 'REQUESTED'}
                className="h-full w-full"
              />
            </div>

            {/* TOP DYNAMIC ISLAND & FLOATING CONTROLS */}
            <div className="absolute top-4 left-4 right-4 z-[900] flex flex-col gap-2 pointer-events-none">
              {/* Dynamic Header Pill */}
              <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-2.5 shadow-2xl flex items-center justify-between pointer-events-auto">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setIsAuthOpen(true)}
                    className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-md active-press"
                  >
                    {user.name.charAt(0)}
                  </button>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black tracking-wide text-white">CHEBELEW</span>
                      <span className="text-[10px] text-amber-400 font-serif font-bold">ቼበለው</span>
                    </div>
                    <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                      {availableDrivers.length > 0 ? `${availableDrivers.length} Taxis Nearby` : 'Active Addis Fleet'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Language Switch */}
                  {onLanguageChange && (
                    <button
                      onClick={() => onLanguageChange(isAm ? 'en' : 'am')}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-[11px] font-bold text-slate-200 border border-slate-700 active-press"
                    >
                      {isAm ? 'ENG' : 'አማ'}
                    </button>
                  )}

                  {/* Quick Police SOS 991 */}
                  <button
                    type="button"
                    onClick={handleTriggerEmergencySos}
                    className="px-2.5 py-1 bg-rose-600/25 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg text-xs font-black border border-rose-500/40 flex items-center gap-1 transition shadow active-press cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" /> 991
                  </button>
                </div>
              </div>

              {/* Active Trip Floating Pill (when ride is in progress) */}
              {activeRide && (
                <div className="bg-gradient-to-r from-brand-600 to-indigo-700 text-white p-3 rounded-2xl shadow-2xl border border-white/20 flex items-center justify-between pointer-events-auto animate-slide-up">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <Car className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                        {activeRide.status === 'ASSIGNED' ? 'Driver Arriving' : 'Trip In Progress'}
                      </span>
                      <p className="text-xs font-bold line-clamp-1">{activeRide.destination?.address}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSheetState('ACTIVE_RIDE')}
                    className="px-3 py-1 bg-white text-slate-900 rounded-xl text-xs font-black shadow active-press"
                  >
                    View
                  </button>
                </div>
              )}
            </div>

            {/* FLOATING MAP ACTION BUTTONS (RECENTER & SWAP) */}
            <div className="absolute right-4 bottom-[calc(44vh+14px)] z-[950] flex flex-col gap-2 pointer-events-auto">
              <button
                type="button"
                onClick={() => {
                  sounds.playBeep(750, 'sine', 0.05);
                  setPickup({ ...pickup });
                }}
                className="w-11 h-11 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-amber-400 border border-slate-700/80 shadow-2xl backdrop-blur-xl flex items-center justify-center transition active-press"
                title="Recenter Map on Current Location"
              >
                <LocateFixed className="w-5 h-5" />
              </button>

              {sheetState === 'OFFERS' && (
                <button
                  type="button"
                  onClick={() => {
                    const prev = pickup;
                    setPickup(destination);
                    setDestination(prev);
                    sounds.playBeep(650, 'sine', 0.05);
                  }}
                  className="w-11 h-11 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-2xl backdrop-blur-xl flex items-center justify-center transition active-press"
                  title="Swap Pickup and Destination"
                >
                  <ArrowUpDown className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* UBER/YANGO-LEVEL FLOATING MOBILE BOTTOM SHEET */}
            <div
              className={`absolute bottom-0 left-0 right-0 z-[1000] mobile-bottom-sheet rounded-t-[32px] transition-all duration-300 ease-out flex flex-col ${
                isSheetExpanded
                  ? 'max-h-[88vh]'
                  : sheetState === 'EXPLORE'
                  ? 'max-h-[42vh]'
                  : sheetState === 'ACTIVE_RIDE'
                  ? 'max-h-[44vh]'
                  : 'max-h-[64vh]'
              } pb-20`}
            >
              {/* Drag Handle Bar */}
              <div
                onClick={() => setIsSheetExpanded(!isSheetExpanded)}
                className="w-full pt-2.5 pb-1 cursor-pointer flex justify-center"
              >
                <div className="w-12 h-1.5 rounded-full bg-slate-600/70 hover:bg-slate-500 transition" />
              </div>

              <div className="px-5 overflow-y-auto space-y-3">
                {/* -------------------------------------------------------------
                    SHEET STAGE 1: EXPLORE & QUICK DESTINATION DISCOVERY (YANGO STYLE)
                    ------------------------------------------------------------- */}
                {sheetState === 'EXPLORE' && (
                  <div className="space-y-3 pt-1">
                    {/* Line 1: Minimalist "Where to?" Search Bar */}
                    <div
                      onClick={() => setIsSearchingDest(true)}
                      className="bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 rounded-2xl p-3 flex items-center justify-between cursor-pointer shadow-lg active-press transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                          <Search className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            {isAm ? 'የት መሄድ ይፈልጋሉ?' : 'Where to?'}
                          </p>
                          <h3 className="text-xs font-bold text-white line-clamp-1">
                            {destination.address || (isAm ? 'መዳረሻ ይምረጡ...' : 'Select destination in Addis Ababa...')}
                          </h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] bg-slate-900/90 text-amber-400 px-2 py-0.5 rounded-lg border border-slate-700 font-bold">
                          {isAm ? 'አሁን' : 'Now'}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>

                    {/* Line 2: Quick Saved Places (Home, Office, Airport) One-Tap Strip */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const home = savedPlaces.find((p) => p.id === 'sp_home') || savedPlaces[0];
                          setDestination({ address: home.address, lat: home.lat, lng: home.lng });
                          sounds.playBeep(700, 'sine', 0.05);
                          setSheetState('OFFERS');
                        }}
                        className="p-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 rounded-xl flex items-center gap-2 text-left active-press transition"
                      >
                        <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 text-xs">
                          🏠
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-white leading-tight">Home</p>
                          <p className="text-[9px] text-slate-400 truncate">CMC Michael</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const work = savedPlaces.find((p) => p.id === 'sp_work') || savedPlaces[1];
                          setDestination({ address: work.address, lat: work.lat, lng: work.lng });
                          sounds.playBeep(700, 'sine', 0.05);
                          setSheetState('OFFERS');
                        }}
                        className="p-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 rounded-xl flex items-center gap-2 text-left active-press transition"
                      >
                        <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 text-xs">
                          💼
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-white leading-tight">Office</p>
                          <p className="text-[9px] text-slate-400 truncate">Kazanchis</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const airport = savedPlaces.find((p) => p.id === 'sp_airport') || savedPlaces[2];
                          setDestination({ address: airport.address, lat: airport.lat, lng: airport.lng });
                          sounds.playBeep(700, 'sine', 0.05);
                          setSheetState('OFFERS');
                        }}
                        className="p-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 rounded-xl flex items-center gap-2 text-left active-press transition"
                      >
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-xs">
                          ✈️
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-white leading-tight">Airport</p>
                          <p className="text-[9px] text-slate-400 truncate">Bole T2</p>
                        </div>
                      </button>
                    </div>

                    {/* Line 3: Horizontal Quick Hub Chips (Zero scrollbar, one-tap) */}
                    <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                      {POPULAR_HUBS.map((hub) => (
                        <button
                          key={hub.label}
                          onClick={() => {
                            setDestination({
                              address: hub.name,
                              lat: hub.lat,
                              lng: hub.lng,
                            });
                            setSheetState('OFFERS');
                          }}
                          className="px-3 py-1.5 bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700/60 rounded-xl text-[11px] font-bold text-slate-200 shrink-0 flex items-center gap-1.5 shadow-sm active-press transition"
                        >
                          <span>{hub.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Line 4: Compact Horizontal Vehicle Class Selector */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between px-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {isAm ? 'የአገልግሎት ደረጃ' : 'Ride Class'}
                        </span>
                        <button
                          onClick={() => setShowCategoryDetails(!showCategoryDetails)}
                          className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5 hover:underline"
                        >
                          <span>{showCategoryDetails ? (isAm ? 'አሳጥር' : 'Fold') : (isAm ? 'ዝርዝር' : 'Details')}</span>
                          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showCategoryDetails ? 'rotate-180' : ''}`} />
                        </button>
                      </div>

                      {/* Sleek horizontal 4-pill tier strip */}
                      <div className="grid grid-cols-4 gap-1.5">
                        {VEHICLE_CATEGORIES.map((cat) => {
                          const isSelected = selectedCategory === cat.id;
                          return (
                            <button
                              key={cat.id}
                              onClick={() => {
                                setSelectedCategory(cat.id);
                                setSheetState('OFFERS');
                              }}
                              className={`p-2 rounded-xl border transition text-center active-press flex flex-col items-center justify-center ${
                                isSelected
                                    ? 'bg-amber-500/20 border-amber-500 shadow ring-1 ring-amber-500/40 text-white'
                                    : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800 text-slate-300'
                              }`}
                            >
                              <span className="text-lg leading-none">{cat.icon}</span>
                              <span className="text-[10px] font-bold mt-1 line-clamp-1">{cat.label.split(' ')[0]}</span>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[9px] font-black text-amber-400 font-mono">{cat.fare} Br</span>
                                <span className="text-[8px] text-slate-400 font-bold">{cat.id === 'minivan' ? '7p' : '4p'}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Foldable details if user clicks "Details" */}
                      {showCategoryDetails && (
                        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 space-y-1.5 animate-slide-up text-xs">
                          <div className="flex justify-between items-center text-[10px] text-emerald-400 font-bold">
                            <span>🛡️ 100% Fare to Driver</span>
                            <span>0% Chebelew Platform Surcharge</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-300">
                            <div>🚗 Economy: Corolla, Dzire (Daily travel)</div>
                            <div>🚙 Comfort VIP: Guaranteed A/C & leather interior</div>
                            <div>🚐 Minivan: 7 passengers with luggage room</div>
                            <div>📦 Fast Courier: Express document & parcel</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Transparency & Regulation Guarantee */}
                    <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 pt-0.5 font-medium">
                      <span className="flex items-center gap-1 text-emerald-400 font-bold">
                        <ShieldCheck className="w-3.5 h-3.5" /> 0% Commission
                      </span>
                      <span>•</span>
                      <span>100% to Driver</span>
                      <span>•</span>
                      <span>FDRE Reg 570/2025 VAT</span>
                    </div>
                  </div>
                )}

                {/* -------------------------------------------------------------
                    SHEET STAGE 2: MULTI-PROVIDER COMPARISON & BOOKING (YANGO COLLAPSIBLE)
                    ------------------------------------------------------------- */}
                {sheetState === 'OFFERS' && (
                  <div className="space-y-2.5 pt-1">
                    {/* Sleek Route Header Bar */}
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                      <button
                        onClick={() => setSheetState('EXPLORE')}
                        className="text-xs text-slate-400 hover:text-white font-bold flex items-center gap-1 active-press"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> {isAm ? 'ቀይር' : 'Change'}
                      </button>

                      {/* Route Micro-summary */}
                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-300 max-w-[200px] truncate">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                        <span className="truncate">{pickup.address.split(',')[0]}</span>
                        <span className="text-slate-500">➔</span>
                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                        <span className="truncate text-white">{destination.address.split(',')[0]}</span>
                      </div>

                      <span className="text-[10px] font-mono text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                        0% FEE
                      </span>
                    </div>

                    {/* Hero Offer Card (Selected Active Offer) */}
                    {(() => {
                      const activeOffer = marketplaceOffers.find((o) => o.id === selectedOfferId) || marketplaceOffers[0];
                      const isChebelew = !activeOffer || activeOffer.providerId === 'chebelew';

                      return (
                        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-amber-500/40 rounded-2xl p-3 shadow-lg flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-base shadow ${
                              isChebelew ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-700 text-white'
                            }`}>
                              {isChebelew ? 'ቼ' : (activeOffer?.providerName?.charAt(0) || 'C')}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h4 className="text-xs font-black text-white">
                                  {activeOffer?.providerName || 'Chebelew Direct Driver'}
                                </h4>
                                <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] font-black rounded">
                                  {isChebelew ? '0% FEE' : 'STANDARD'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {activeOffer?.estimatedPickupMinutes || 3} min away • {selectedCategory.toUpperCase()}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-base font-black text-amber-400 font-mono">
                              {activeOffer?.estimatedFare || 220} <span className="text-xs">ETB</span>
                            </div>
                            <p className="text-[9px] text-slate-400 font-mono">Guaranteed Fare</p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* COLLAPSIBLE ACCORDION 1: Compare Other Providers & Modes */}
                    <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 overflow-hidden">
                      <button
                        onClick={() => setShowAllOffers(!showAllOffers)}
                        className="w-full p-2.5 flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white transition active-press"
                      >
                        <div className="flex items-center gap-2">
                          <Sliders className="w-3.5 h-3.5 text-amber-400" />
                          <span>{isAm ? 'አማራጮችን አወዳድር' : 'Compare Other Providers & Modes'}</span>
                          <span className="text-[10px] text-amber-400 font-mono font-bold">
                            ({marketplaceOffers.length} offers)
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400">
                            {showAllOffers ? (isAm ? 'ዝጋ' : 'Fold') : (isAm ? 'ክፈት' : 'Expand')}
                          </span>
                          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showAllOffers ? 'rotate-180' : ''}`} />
                        </div>
                      </button>

                      {showAllOffers && (
                        <div className="p-2.5 pt-0 border-t border-slate-800/60 space-y-2 animate-slide-up">
                          {/* 4-Mode Filter Tabs */}
                          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-xl text-[10px] font-bold">
                            {[
                              { mode: 'best_value', label: 'Best Value' },
                              { mode: 'cheapest', label: 'Cheapest' },
                              { mode: 'fastest_pickup', label: 'Fastest' },
                              { mode: 'premium_comfort', label: 'Comfort' },
                            ].map((item) => (
                              <button
                                key={item.mode}
                                onClick={() => setComparisonMode(item.mode as any)}
                                className={`py-1 rounded-lg transition text-center active-press ${
                                  comparisonMode === item.mode
                                    ? 'bg-amber-500 text-slate-950 font-black shadow'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>

                          {/* Offer Cards Stream */}
                          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
                            {marketplaceOffers.map((offer) => {
                              const isSelected = selectedOfferId === offer.id;
                              const isChebelew = offer.providerId === 'chebelew';

                              return (
                                <div
                                  key={offer.id}
                                  onClick={() => {
                                    setSelectedOfferId(offer.id);
                                  }}
                                  className={`p-2 rounded-xl border transition cursor-pointer active-press flex items-center justify-between ${
                                    isSelected
                                      ? 'bg-amber-500/15 border-amber-500 shadow-sm ring-1 ring-amber-500/40'
                                      : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/50'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                                        isChebelew ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-700 text-white'
                                      }`}
                                    >
                                      {isChebelew ? 'ቼ' : offer.providerName.charAt(0)}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-1">
                                        <span className="text-xs font-bold text-white">{offer.providerName}</span>
                                        {isChebelew && (
                                          <span className="text-[8px] bg-emerald-500/20 text-emerald-400 font-bold px-1 rounded">
                                            0% FEE
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[10px] text-slate-400">{offer.estimatedPickupMinutes || 3}m away</p>
                                    </div>
                                  </div>

                                  <div className="text-right">
                                    <span className="text-xs font-black text-amber-400 font-mono">
                                      {offer.estimatedFare} ETB
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* COLLAPSIBLE ACCORDION 2: Payment Rail & Taxes */}
                    <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 overflow-hidden">
                      <button
                        onClick={() => setShowPaymentRails(!showPaymentRails)}
                        className="w-full p-2.5 flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white transition active-press"
                      >
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                          <span>Payment: <strong className="text-amber-400">{paymentMethod}</strong></span>
                          <span className="text-[9px] text-emerald-400 font-mono font-bold">• 15% VAT Included</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showPaymentRails ? 'rotate-180' : ''}`} />
                        </div>
                      </button>

                      {showPaymentRails && (
                        <div className="p-2.5 pt-0 border-t border-slate-800/60 space-y-1.5 animate-slide-up text-xs">
                          <div className="grid grid-cols-2 gap-1.5 pt-1">
                            {[
                              { id: 'TELEBIRR', label: 'Telebirr (Direct)', icon: '📱' },
                              { id: 'CBE_BIRR', label: 'CBE Birr', icon: '🏦' },
                              { id: 'CASH', label: 'Cash to Driver', icon: '💵' },
                              { id: 'WALLET', label: 'Chebelew Wallet', icon: '👛' },
                            ].map((rail) => (
                              <button
                                key={rail.id}
                                onClick={() => {
                                  setPaymentMethod(rail.id as PaymentMethod);
                                  setShowPaymentRails(false);
                                }}
                                className={`p-2 rounded-xl border text-left active-press transition flex items-center gap-2 ${
                                  paymentMethod === rail.id
                                    ? 'bg-amber-500/20 border-amber-500 text-white font-bold'
                                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                                }`}
                              >
                                <span>{rail.icon}</span>
                                <span className="text-[11px] truncate">{rail.label}</span>
                              </button>
                            ))}
                          </div>
                          <p className="text-[9px] text-slate-400 text-center pt-0.5">
                            FDRE Regulation 570/2025 electronic tax receipt automatically issued.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* COLLAPSIBLE ACCORDION 3: Pickup Note & Special Requirements */}
                    <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 overflow-hidden">
                      <button
                        onClick={() => setShowPickupNotes(!showPickupNotes)}
                        className="w-full p-2.5 flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white transition active-press"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">
                            {pickupNotes ? `Note: "${pickupNotes}"` : (isAm ? 'የመነሻ ማስታወሻ ወይም በር ቁጥር...' : 'Pickup Note / Gate Info (Optional)')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showPickupNotes ? 'rotate-180' : ''}`} />
                        </div>
                      </button>

                      {showPickupNotes && (
                        <div className="p-2.5 pt-0 border-t border-slate-800/60 space-y-2 animate-slide-up">
                          <div className="pt-1">
                            <input
                              type="text"
                              value={pickupNotes}
                              onChange={(e) => setPickupNotes(e.target.value)}
                              placeholder="e.g. Gate 3, Awash Bank building, yellow umbrella..."
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                            />
                          </div>
                          {destination.address.toLowerCase().includes('airport') && (
                            <div>
                              <input
                                type="text"
                                value={flightNumber}
                                onChange={(e) => setFlightNumber(e.target.value)}
                                placeholder="Flight # (e.g. ET 302) for Terminal pickup coordination"
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Waiting & Cancellation Policy Micro-bar */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-0.5">
                      <span>⏱️ Free cancel within 3 min</span>
                      <span>🛡️ 3 min free driver wait time</span>
                    </div>

                    {/* Primary Confirmation CTA with Delight Hover Text & Flight Animation */}
                    <button
                      onClick={handleRequestRide}
                      onMouseEnter={() => setIsHoveredBook(true)}
                      onMouseLeave={() => setIsHoveredBook(false)}
                      className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-2xl text-sm shadow-xl flex items-center justify-center gap-2.5 transition active-press group"
                    >
                      <Send className={`w-4 h-4 ${isHoveredBook ? 'animate-plane-fly' : ''}`} />
                      <span>
                        {isHoveredBook
                          ? (isAm ? 'እንሂድ! 🚀' : "Let's Roll! 🚀")
                          : (isAm
                              ? `አሁን ቼበለው ይዘዙ • ${(marketplaceOffers.find((o) => o.id === selectedOfferId) || marketplaceOffers[0])?.estimatedFare || 220} ብር`
                              : `Confirm Chebelew Ride • ${(marketplaceOffers.find((o) => o.id === selectedOfferId) || marketplaceOffers[0])?.estimatedFare || 220} ETB`)}
                      </span>
                    </button>
                  </div>
                )}

                {/* -------------------------------------------------------------
                    SHEET STAGE 3: ACTIVE IN-CAB LIVE RIDE HUD
                    ------------------------------------------------------------- */}
                {sheetState === 'ACTIVE_RIDE' && activeRide && (
                  <div className="space-y-4 pt-1 animate-slide-up">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                        <span className="text-xs font-black uppercase text-emerald-400">
                          {activeRide.status === 'REQUESTED'
                            ? (isAm ? 'አቅራቢያ ታክሲዎችን በመፈለግ ላይ...' : 'Connecting with nearby taxis...')
                            : activeRide.status === 'ASSIGNED'
                            ? (isAm ? 'ሾፌሩ ወደ እርስዎ እየመጣ ነው' : 'Driver Heading to You')
                            : activeRide.status === 'ARRIVED'
                            ? (isAm ? 'ሾፌሩ ደርሷል (ይሳፈሩ)' : 'Driver Arrived at Pickup')
                            : activeRide.status === 'IN_PROGRESS'
                            ? (isAm ? 'ጉዞ በሂደት ላይ' : 'In Transit to Destination')
                            : activeRide.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsSheetExpanded(!isSheetExpanded)}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-700 flex items-center gap-1 active-press"
                          title={isSheetExpanded ? "Switch to Map View" : "View Full Details"}
                        >
                          {isSheetExpanded ? '▾ Map View' : '▴ Details'}
                        </button>
                        <span className="text-[11px] font-mono text-slate-400">
                          #{activeRide.id.slice(0, 6)}
                        </span>
                      </div>
                    </div>

                    {/* MATCHMAKING RADAR HUD (WHEN IN REQUESTED STATUS) */}
                    {activeRide.status === 'REQUESTED' ? (
                      <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 text-white p-4 rounded-2xl shadow-2xl relative overflow-hidden space-y-4">
                        {/* Ambient background glow */}
                        <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

                        {/* Radar Sonar Wave & Pulse */}
                        <div className="flex items-center gap-3.5">
                          <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                            <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" />
                            <div className="absolute inset-1 rounded-full bg-amber-500/30 animate-pulse" />
                            <div className="relative w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30">
                              <Radio className="w-5 h-5 animate-spin" style={{ animationDuration: '3s' }} />
                            </div>
                          </div>

                          <div className="space-y-0.5">
                            <h3 className="text-sm font-black text-white tracking-tight">
                              {isAm ? 'ከአቅራቢያ ታክሲዎች ጋር በማገናኘት ላይ...' : 'Connecting with nearby taxis...'}
                            </h3>
                            <p className="text-[11px] text-slate-400 leading-snug">
                              {isAm
                                ? `ለተረጋገጡ የጨበለው ሾፌሮች በ${activeRide.pickup?.address?.split(',')[0] || 'መነሻዎ'} አቅራቢያ ጥያቄ በመላክ ላይ`
                                : `Broadcasting ride request to certified Chebelew drivers near ${activeRide.pickup?.address?.split(',')[0] || 'your pickup'}`}
                            </p>
                          </div>
                        </div>

                        {/* Real-Time Dispatch Corridor Telemetry */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/60 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                            <div>
                              <span className="text-[10px] text-slate-400 block">{isAm ? 'ግምታዊ ማገናኛ' : 'Estimated match'}</span>
                              <span className="font-bold text-slate-200">~1-2 mins</span>
                            </div>
                          </div>
                          <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/60 flex items-center gap-2">
                            <Car className="w-4 h-4 text-emerald-400 shrink-0" />
                            <div>
                              <span className="text-[10px] text-slate-400 block">{isAm ? 'በአካባቢው ያሉ' : 'Nearby online'}</span>
                              <span className="font-bold text-slate-200">{availableDrivers.length || 5} cabs alerted</span>
                            </div>
                          </div>
                        </div>

                        {/* Shimmering Route Preview */}
                        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1 border-b border-slate-800/80">
                            <span>{activeRide.vehicleCategory.toUpperCase()} • {activeRide.paymentMethod}</span>
                            <span className="font-bold text-amber-400">{activeRide.fare?.totalFare || 240} ETB</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                            <p className="text-slate-300 text-[11px] line-clamp-1">{activeRide.pickup.address}</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                            <p className="text-slate-300 text-[11px] line-clamp-1">{activeRide.destination.address}</p>
                          </div>
                        </div>

                        {/* Cancel Request Button */}
                        <button
                          type="button"
                          onClick={handleCancelActiveRide}
                          className="w-full py-2.5 bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 text-xs font-bold rounded-xl border border-slate-700 hover:border-rose-500/40 transition active-press"
                        >
                          {isAm ? 'ጥያቄውን ሰርዝ' : 'Cancel Request'}
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Driver Card with Verified Photo & Plate */}
                        <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/80 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-amber-500 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg">
                                {activeRide.driver?.fullName ? activeRide.driver.fullName.charAt(0) : 'D'}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <h3 className="text-sm font-bold text-white">
                                    {activeRide.driver?.fullName || 'Ahmed Mohammed'}
                                  </h3>
                                  <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded">
                                    ★ {activeRide.driver?.rating || '4.92'}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-400">
                                  {activeRide.driver ? `${activeRide.driver.vehicleMake} ${activeRide.driver.vehicleModel}` : 'Toyota Corolla (White)'}
                                </p>
                              </div>
                            </div>

                            {/* License Plate Badge */}
                            <div className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-center font-mono font-bold text-xs text-amber-400 shadow">
                              {activeRide.driver?.vehiclePlate || 'AA 3 45982'}
                            </div>
                          </div>

                          {/* 4-Digit Safety PIN Pill */}
                          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-2.5 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-emerald-400" />
                              <span className="text-slate-300 font-bold">Safety PIN:</span>
                              <span className="px-2 py-0.5 bg-emerald-500 text-slate-950 font-black rounded-lg font-mono tracking-widest text-sm">
                                {safetyPin}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400">Give to driver</span>
                          </div>
                        </div>

                        {/* Quick Action Buttons (Call, Live Share, SOS) */}
                        <div className="grid grid-cols-3 gap-2">
                          <a
                            href={`tel:${activeRide.driver?.phone || '+251911223344'}`}
                            className="py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700 active-press"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-400" /> Call Driver
                          </a>

                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/track/${activeRide.id}`);
                              alert('Live SafeTrip Tracking link copied! Share with family or emergency contacts.');
                            }}
                            className="py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700 active-press"
                          >
                            <Share2 className="w-3.5 h-3.5 text-amber-400" /> Share Trip
                          </button>

                          <button
                            type="button"
                            onClick={handleTriggerEmergencySos}
                            className="py-2.5 bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-rose-500/40 active-press transition cursor-pointer"
                          >
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> SOS 991
                          </button>
                        </div>

                        {/* Cancel Trip Button */}
                        <button
                          type="button"
                          onClick={() => setIsCancelConfirmOpen(true)}
                          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-rose-400 text-xs font-bold rounded-xl border border-rose-500/20 active-press transition"
                        >
                          Cancel Ride / ጉዞ ሰርዝ
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* -------------------------------------------------------------
                    SHEET STAGE 4: TRIP COMPLETED & ELECTRONIC VAT RECEIPT
                    ------------------------------------------------------------- */}
                {sheetState === 'COMPLETED_SUMMARY' && (
                  <div className="space-y-4 pt-1 animate-slide-up text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>

                    <div>
                      <h3 className="text-base font-black text-white">Trip Completed Safely!</h3>
                      <p className="text-xs text-slate-400">Thank you for riding with Chebelew</p>
                    </div>

                    {/* Electronic Tax Breakdown */}
                    <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700 text-left space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Paid Fare:</span>
                        <strong className="text-amber-400 text-sm">
                          {activeRide?.fare?.totalFare || 240} ETB
                        </strong>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>FDRE 15% VAT (Reg 570/2025):</span>
                        <span>{activeRide?.fare?.vatAmount || 31.3} ETB</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-emerald-400">
                        <span>Chebelew Commission:</span>
                        <span className="font-bold">0.00 ETB (100% to Driver)</span>
                      </div>
                    </div>

                    {/* View Official VAT Receipt Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (activeRide) {
                          setSelectedReceiptRide(activeRide);
                          setShowReceiptModal(true);
                        }
                      }}
                      className="w-full py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-emerald-500/30 transition active-press"
                    >
                      <Receipt className="w-4 h-4 text-emerald-400" /> View Official Reg 570/2025 VAT Receipt
                    </button>

                    {/* Driver Rating & Tip */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-300">Rate Your Driver</p>
                      <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setUserRating(star)}
                            className="p-1 active-press"
                          >
                            <Star
                              className={`w-7 h-7 ${
                                star <= userRating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                              }`}
                            />
                          </button>
                        ))}
                      </div>

                      <div className="flex justify-center gap-2 pt-2">
                        {[0, 20, 50, 100].map((amount) => (
                          <button
                            key={amount}
                            onClick={() => setTipAmount(amount)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold active-press ${
                              tipAmount === amount
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {amount === 0 ? 'No Tip' : `+${amount} ETB`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Feedback Tags */}
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                        Compliment & Feedback
                      </p>
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {['🌟 Clean Car', '🛡️ Safe Driving', '⚡ Fast Route', '💬 Polite Driver', '🎵 Good Music', '❄️ Great A/C'].map((tag) => {
                          const isTagSelected = selectedFeedbackTags.includes(tag);
                          return (
                            <button
                              key={tag}
                              onClick={() => {
                                if (isTagSelected) {
                                  setSelectedFeedbackTags(selectedFeedbackTags.filter((t) => t !== tag));
                                } else {
                                  setSelectedFeedbackTags([...selectedFeedbackTags, tag]);
                                }
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition active-press border ${
                                isTagSelected
                                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                              }`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        onClick={() => {
                          // Swap pickup and destination for return trip
                          const prevPickup = pickup;
                          setPickup(destination);
                          setDestination(prevPickup);
                          setActiveRide(null);
                          setSheetState('OFFERS');
                        }}
                        className="py-3 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-xl text-xs border border-slate-700 transition active-press"
                      >
                        🔄 Book Return Trip
                      </button>

                      <button
                        onClick={handleSubmitRating}
                        className="py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-xl active-press"
                      >
                        Done & Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* FULLSCREEN DESTINATION SEARCH OVERLAY MODAL (DUAL INPUT & CATEGORY FILTER) */}
            {isSearchingDest && (
              <div className="fixed inset-0 z-[1500] bg-slate-950 p-4 flex flex-col animate-fade-in">
                {/* Search Header Bar */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsSearchingDest(false)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-200 active-press transition"
                    >
                      ← Back
                    </button>
                    <div>
                      <h3 className="text-sm font-black text-white">{isAm ? 'መዳረሻ ይፈልጉ' : 'Select Destination'}</h3>
                      <p className="text-[10px] text-slate-400">Addis Ababa Metropolitan Area</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsSearchingDest(false);
                      setSheetState('EXPLORE');
                    }}
                    className="text-xs text-amber-400 font-bold hover:underline"
                  >
                    Done
                  </button>
                </div>

                {/* Dual Pickup & Destination Box with Swap */}
                <div className="my-3 p-3 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 relative">
                  {/* Pickup Row */}
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                    <input
                      type="text"
                      value={pickup.address}
                      onChange={(e) => setPickup({ ...pickup, address: e.target.value })}
                      placeholder="Pickup spot in Addis..."
                      className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playBeep(800, 'sine', 0.05);
                        setPickup({
                          address: 'Bole Medhanialem Mall, Addis Ababa',
                          addressAm: 'ቦሌ መድኃኔዓለም እና ኤድና ሞል',
                          lat: 8.995,
                          lng: 38.788,
                        });
                      }}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[10px] font-bold rounded-lg border border-slate-700 flex items-center gap-1 shrink-0 active-press"
                      title="Use Current Location"
                    >
                      <Crosshair className="w-3 h-3" /> GPS
                    </button>
                  </div>

                  <div className="border-t border-slate-800/80 my-1 relative">
                    <button
                      type="button"
                      onClick={() => {
                        const prev = pickup;
                        setPickup(destination);
                        setDestination(prev);
                        sounds.playBeep(700, 'sine', 0.05);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-700 flex items-center justify-center transition active-press"
                      title="Swap Pickup & Destination"
                    >
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Destination Row */}
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="Where to? (e.g. Airport, Bole, Kazanchis, Piassa)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 font-bold focus:outline-none"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Category Filter Pills Strip */}
                <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar">
                  {[
                    { id: 'all', label: 'All Hubs' },
                    { id: 'transit', label: '✈️ Airport & Transit' },
                    { id: 'commercial', label: '🛍️ Malls & Shopping' },
                    { id: 'hotel', label: '🏨 Luxury Hotels' },
                    { id: 'square', label: '🏛️ City Squares' },
                    { id: 'institution', label: '🏢 Institutions' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSearchCategoryFilter(cat.id as any)}
                      className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition shrink-0 active-press ${
                        searchCategoryFilter === cat.id
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Filtered Landmark Results List */}
                <div className="flex-1 overflow-y-auto space-y-2 pt-1 no-scrollbar">
                  {ADDIS_LANDMARKS.filter((lm) => {
                    const matchesCategory = searchCategoryFilter === 'all' || lm.category === searchCategoryFilter;
                    const matchesQuery =
                      !searchQuery ||
                      lm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (lm.nameAm && lm.nameAm.includes(searchQuery));
                    return matchesCategory && matchesQuery;
                  }).map((lm) => (
                    <div
                      key={lm.id}
                      onClick={() => {
                        sounds.playBeep(720, 'sine', 0.05);
                        handleSelectLandmark(lm);
                      }}
                      className="p-3 bg-slate-900 hover:bg-slate-800/90 border border-slate-800/80 rounded-2xl flex items-center justify-between cursor-pointer active-press transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                          {lm.category === 'transit' ? '✈️' : lm.category === 'hotel' ? '🏨' : lm.category === 'commercial' ? '🛍️' : '📍'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-white">{lm.name}</h4>
                            <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                              {lm.category}
                            </span>
                          </div>
                          {lm.nameAm && <p className="text-[11px] text-amber-300 font-serif mt-0.5">{lm.nameAm}</p>}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                  ))}
                </div>

                {/* Bottom Quick Action: Pick directly on map */}
                <div className="pt-2 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchingDest(false);
                      setSheetState('EXPLORE');
                    }}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-800 active-press transition"
                  >
                    <MapPin className="w-4 h-4" /> Set Pin Directly on Addis Map
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==============================================================
            TAB 2: ACTIVITY & TRIP HISTORY
            ============================================================== */}
        {activeTab === 'activity' && (
          <div className="h-full w-full overflow-y-auto p-4 space-y-4 max-w-lg mx-auto pb-20 no-scrollbar">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-white">Your Trips / ጉዞዎችዎ</h2>
                <p className="text-xs text-slate-400">Electronic Tax Invoices & Ride History</p>
              </div>
              <button
                onClick={fetchRideHistory}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition active-press"
                title="Refresh trip history"
              >
                <RefreshCw className={`w-4 h-4 ${loadingHistory ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* LIVE TRIP IN PROGRESS CARD IF ACTIVE */}
            {activeRide && (
              <div
                onClick={() => {
                  setActiveTab('ride');
                  sounds.playBeep(700, 'sine', 0.05);
                }}
                className="bg-gradient-to-r from-amber-500/20 via-amber-600/10 to-slate-900 border border-amber-500/50 rounded-2xl p-4 flex items-center justify-between cursor-pointer active-press hover:border-amber-400 transition shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold animate-pulse shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-amber-400 uppercase tracking-wide">Live Trip in Progress</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    </div>
                    <p className="text-xs text-white font-bold truncate max-w-[200px]">
                      {activeRide.destination?.address || 'Trip in Progress'}
                    </p>
                    <p className="text-[11px] text-slate-400">Status: {activeRide.status}</p>
                  </div>
                </div>
                <span className="px-3 py-1.5 bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow shrink-0">
                  Track on Map ➔
                </span>
              </div>
            )}

            {tripHistory.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
                <Car className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-300">No Past Trips Recorded</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Your completed trips across Addis Ababa and Bole Airport will appear here with Ministry of Revenues tax receipts.
                </p>
                <button
                  onClick={() => setActiveTab('ride')}
                  className="mt-2 px-5 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs active-press"
                >
                  Book Your First Ride
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {tripHistory.map((trip) => (
                  <div key={trip.id} className="bg-slate-900 border border-slate-800/90 rounded-2xl p-4 space-y-3 shadow-md hover:border-slate-700 transition">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400 font-mono">
                        #{trip.id.slice(0, 10)}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                        {trip.status}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-2 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{trip.pickup?.address || 'Pickup'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">{trip.destination?.address || 'Destination'}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-400 text-[11px]">Fare: </span>
                        <strong className="text-white text-sm font-black">{trip.fare?.totalFare || 0} ETB</strong>
                        <span className="text-[10px] text-slate-500 ml-1">({trip.paymentMethod || 'CASH'})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedReceiptRide(trip);
                            setShowReceiptModal(true);
                            sounds.playBeep(700, 'sine', 0.05);
                          }}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl font-bold text-[11px] flex items-center gap-1.5 border border-slate-700 active-press transition"
                        >
                          <Receipt className="w-3.5 h-3.5" /> Tax Invoice
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (trip.pickup) setPickup(trip.pickup);
                            if (trip.destination) setDestination(trip.destination);
                            setActiveTab('ride');
                            setSheetState('OFFERS');
                            setShowAllOffers(true);
                            sounds.playBeep(800, 'sine', 0.05);
                          }}
                          className="px-2.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-xl font-bold text-[11px] flex items-center gap-1 active-press transition"
                        >
                          <RefreshCw className="w-3 h-3" /> Rebook
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==============================================================
            TAB 3: WALLET & MULTI-RAIL PAYMENT
            ============================================================== */}
        {activeTab === 'wallet' && (
          <div className="h-full w-full overflow-y-auto p-4 space-y-4 max-w-lg mx-auto pb-20 no-scrollbar">
            <div>
              <h2 className="text-base font-black text-white">Digital Wallet / የኪስ ቦርሳ</h2>
              <p className="text-xs text-slate-400">Telebirr, CBE Birr & International Cards</p>
            </div>

            {/* Wallet Balance Card */}
            <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 rounded-3xl p-5 text-slate-950 shadow-xl space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-slate-900/80">
                    Chebelew Passenger Balance
                  </p>
                  <h3 className="text-3xl font-black tracking-tight mt-1">{walletBalance.toFixed(2)} <span className="text-lg">ETB</span></h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowWalletModal(true);
                    sounds.playBeep(800, 'sine', 0.05);
                  }}
                  className="px-3.5 py-2 bg-slate-950 hover:bg-slate-900 text-amber-400 rounded-2xl font-black text-xs shadow-lg flex items-center gap-1.5 active-press transition"
                >
                  <Plus className="w-4 h-4" /> Top Up
                </button>
              </div>

              {/* Quick Amount Reload Shortcuts */}
              <div className="flex gap-2 pt-1">
                {[100, 250, 500, 1000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setShowWalletModal(true);
                      sounds.playBeep(750, 'sine', 0.05);
                    }}
                    className="flex-1 py-1.5 rounded-xl bg-slate-950/20 hover:bg-slate-950/30 text-slate-950 font-black text-[11px] border border-slate-950/20 transition active-press text-center"
                  >
                    +{amt} Br
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-900/20 flex justify-between items-center text-xs font-bold">
                <span>NBE Exchange Rate: ~124.50 ETB / USD</span>
                <span className="bg-slate-950/15 px-2 py-0.5 rounded-lg">Verified Account</span>
              </div>
            </div>

            {/* Payment Methods List */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Connected Payment Rails</h3>

              {/* Telebirr */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow">
                    TB
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Telebirr Digital Wallet</h4>
                    <p className="text-xs text-slate-400 font-mono">{user.phone}</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                  Active
                </span>
              </div>

              {/* Commercial Bank of Ethiopia (CBE) */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-700 text-white font-black flex items-center justify-center text-sm shadow">
                    CBE
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">CBE Birr / Commercial Bank</h4>
                    <p className="text-xs text-slate-400 font-mono">1000••••••••4892</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold">
                  Linked
                </span>
              </div>

              {/* International Credit/Debit Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white font-black flex items-center justify-center text-sm shadow">
                    VISA
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">International Card</h4>
                    <p className="text-xs text-slate-400 font-mono">•••• 8821 (Auto USD/ETB)</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold">
                  NBE Rate
                </span>
              </div>
            </div>

            {/* 0% Commission Policy Guarantee */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 text-xs text-slate-400 space-y-1">
              <p className="font-bold text-slate-200">Zero Commission Fare Policy:</p>
              <p>Passengers pay standard regulated fares with no platform surcharge. Independent drivers keep 100% of the trip fare via their fixed subscription.</p>
            </div>
          </div>
        )}

        {/* ==============================================================
            TAB 4: SAVED PLACES
            ============================================================== */}
        {activeTab === 'saved' && (
          <div className="h-full w-full overflow-y-auto p-4 space-y-4 max-w-lg mx-auto pb-20 no-scrollbar">
            <div>
              <h2 className="text-base font-black text-white">Saved Places / የተቀመጡ ቦታዎች</h2>
              <p className="text-xs text-slate-400">1-Tap Fast Pickup & Destination Selection</p>
            </div>

            <div className="space-y-2.5">
              {savedPlaces.map((place) => (
                <div key={place.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400">
                      <Bookmark className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{place.label}</h4>
                      <p className="text-xs text-slate-400 line-clamp-1">{place.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setDestination({
                          address: place.address,
                          lat: place.lat,
                          lng: place.lng,
                        });
                        setActiveTab('ride');
                        setSheetState('OFFERS');
                      }}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition active-press"
                    >
                      Select
                    </button>
                    <button
                      onClick={() => setSavedPlaces(savedPlaces.filter((p) => p.id !== place.id))}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Place Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newPlaceLabel || !newPlaceAddress) return;
                const newPlace: SavedPlace = {
                  id: `sp_${Date.now()}`,
                  label: newPlaceLabel,
                  address: newPlaceAddress,
                  lat: 9.0105,
                  lng: 38.7615,
                  iconType: 'other',
                };
                setSavedPlaces([...savedPlaces, newPlace]);
                setNewPlaceLabel('');
                setNewPlaceAddress('');
              }}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3"
            >
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Add Custom Location</h3>
              <div>
                <input
                  type="text"
                  placeholder="Label (e.g. Gym, Mother's Home, Church)"
                  value={newPlaceLabel}
                  onChange={(e) => setNewPlaceLabel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Address or landmark in Addis Ababa"
                  value={newPlaceAddress}
                  onChange={(e) => setNewPlaceAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition active-press"
              >
                <Plus className="w-4 h-4" /> Save Place
              </button>
            </form>
          </div>
        )}

        {/* ==============================================================
            TAB 5: PROFILE & SUPPORT
            ============================================================== */}
        {activeTab === 'profile' && (
          <div className="h-full w-full overflow-y-auto p-4 space-y-4 max-w-lg mx-auto pb-20 no-scrollbar">
            <div>
              <h2 className="text-base font-black text-white">Account & Safety / መለያ እና ደህንነት</h2>
              <p className="text-xs text-slate-400">Settings, 4-Digit PIN & 24/7 Ethiopian Hotlines</p>
            </div>

            {/* Profile Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{user.name}</h3>
                  <p className="text-xs text-amber-400 font-mono">{user.phone}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Verified Passenger • Addis Ababa</p>
                </div>
              </div>
              <button
                onClick={() => setIsAuthOpen(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition active-press"
              >
                Switch
              </button>
            </div>

            {/* Passenger Safety Toolkit */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Safety & Verification Toolkit</span>
              </div>

              {/* 4-Digit Boarding PIN Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="pr-3">
                  <div className="text-xs font-bold text-white">4-Digit Boarding PIN</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Require driver to input your secret 4-digit PIN before starting trip.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRequireSafetyPin(!requireSafetyPin)}
                  className={`w-12 h-6 rounded-full transition p-0.5 flex items-center ${
                    requireSafetyPin ? 'bg-amber-500 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-slate-950 block shadow" />
                </button>
              </div>

              {/* Trusted Emergency Contact */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1.5">
                <div className="text-xs font-bold text-white">Emergency Contact Phone</div>
                <div className="text-[11px] text-slate-400">
                  Auto-sent live tracking link whenever Emergency SOS is triggered.
                </div>
                <input
                  type="tel"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-amber-400 focus:outline-none focus:border-amber-500"
                  placeholder="+251 9XX XXX XXX"
                />
              </div>
            </div>

            {/* Quick Support & Help Shortcuts */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span>Passenger Help & Dispute Support</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => alert('Lost & Found item ticket opened. Chebelew Support will contact your driver.')}
                  className="p-2.5 bg-slate-800/90 hover:bg-slate-800 rounded-xl text-slate-300 border border-slate-700 text-left transition active-press"
                >
                  🎒 Lost & Found Item
                </button>
                <button
                  type="button"
                  onClick={() => alert('Fare Review ticket initiated for your latest trip.')}
                  className="p-2.5 bg-slate-800/90 hover:bg-slate-800 rounded-xl text-slate-300 border border-slate-700 text-left transition active-press"
                >
                  ⚖️ Fare Dispute
                </button>
              </div>
            </div>

            {/* Language Switcher */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <Globe className="w-4 h-4 text-amber-400" />
                <span>Preferred Language / ቋንቋ</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { code: 'en', label: 'English' },
                  { code: 'am', label: 'አማርኛ (Amharic)' },
                  { code: 'om', label: 'Afaan Oromoo' },
                  { code: 'ti', label: 'ትግርኛ (Tigrinya)' },
                ].map((l) => (
                  <button
                    key={l.code}
                    onClick={() => onLanguageChange && onLanguageChange(l.code as any)}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition text-left active-press ${
                      language === l.code
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Emergency Hotlines */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>24/7 Ethiopian Emergency Hotlines</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href="tel:991"
                  className="p-3 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl text-xs font-bold border border-rose-500/30 flex items-center justify-center gap-2 transition active-press"
                >
                  <Phone className="w-4 h-4" /> Police (991)
                </a>
                <a
                  href="tel:9922"
                  className="p-3 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl text-xs font-bold border border-slate-700 flex items-center justify-center gap-2 transition active-press"
                >
                  <ShieldCheck className="w-4 h-4" /> Chebelew 9922
                </a>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ==============================================================
          BOTTOM NAVIGATION BAR (APPLE HIG / UBER FLOATING DOCK)
          ============================================================== */}
      <nav className="h-16 bg-slate-900/95 backdrop-blur-2xl border-t border-slate-800 flex items-center justify-around px-2 z-40 shrink-0 pb-safe">
        {[
          { tab: 'ride', label: isAm ? 'ጉዞ' : 'Ride', icon: Car },
          { tab: 'activity', label: isAm ? 'እንቅስቃሴ' : 'Activity', icon: Clock },
          { tab: 'wallet', label: isAm ? 'ቦርሳ' : 'Wallet', icon: Wallet },
          { tab: 'saved', label: isAm ? 'ቦታዎች' : 'Saved', icon: Bookmark },
          { tab: 'profile', label: isAm ? 'መለያ' : 'Profile', icon: User },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.tab;
          return (
            <button
              key={item.tab}
              onClick={() => {
                setActiveTab(item.tab as MobileTab);
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

      {/* Ethiopian Phone OTP Authentication Modal */}
      <MobileAuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        defaultRole="rider"
        language={language}
        onAuthenticated={(authenticatedUser) => {
          setUser(authenticatedUser);
          setIsAuthOpen(false);
          sounds.playBeep(880, 'sine', 0.2);
        }}
      />

      {/* Official Electronic VAT Tax Receipt Modal */}
      {selectedReceiptRide && (
        <VatReceiptModal
          ride={selectedReceiptRide}
          isOpen={showReceiptModal}
          onClose={() => {
            setShowReceiptModal(false);
            setSelectedReceiptRide(null);
          }}
        />
      )}

      {/* Passenger Digital Wallet Modal (Telebirr, CBE, Visa/Mastercard) */}
      <PassengerWalletModal
        userId={user.id}
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onBalanceUpdated={(newBal) => {
          setWalletBalance(newBal);
        }}
      />

      {/* Safe Ride Cancellation Confirmation Dialog */}
      {isCancelConfirmOpen && (
        <div className="fixed inset-0 z-[1200] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-white">Cancel Your Ride Request?</h3>
              <p className="text-xs text-slate-400">
                Your driver is currently on route. In accordance with Chebelew's zero-penalty policy, no cancellation fee applies within 3 minutes of match.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsCancelConfirmOpen(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl text-xs font-bold transition active-press"
              >
                Keep Ride
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCancelConfirmOpen(false);
                  handleCancelActiveRide();
                }}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-xs font-black transition active-press shadow-lg shadow-rose-950"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 24/7 Rapid Emergency SOS Modal */}
      {isSosModalOpen && (
        <div className="fixed inset-0 z-[1300] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-rose-500/80 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto animate-pulse">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-white">Emergency Response Active</h3>
              <p className="text-xs text-rose-400 font-bold">የአደጋ ጊዜ ፈጣን ጥሪ</p>
              <p className="text-[11px] text-slate-300">
                An incident alert has been dispatched to Chebelew 24/7 Security Operations with your live GPS location.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <a
                href="tel:991"
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg active-press"
              >
                <Phone className="w-4 h-4" /> Call Federal Police (991)
              </a>
              <a
                href="tel:9922"
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 active-press"
              >
                <Phone className="w-4 h-4 text-amber-400" /> Chebelew 24/7 Security Hotline (9922)
              </a>
              <a
                href="tel:907"
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 active-press"
              >
                <Phone className="w-4 h-4 text-emerald-400" /> Medical Ambulance (907)
              </a>
              {activeRide && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/track/${activeRide.id}`);
                    alert('SafeTrip Live Tracking link copied!');
                  }}
                  className="w-full py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 active-press"
                >
                  <Share2 className="w-4 h-4 text-brand-400" /> Share Live Trip Link
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsSosModalOpen(false)}
              className="w-full py-2.5 text-slate-400 hover:text-white text-xs font-semibold rounded-xl transition"
            >
              Dismiss / ዝጋ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
