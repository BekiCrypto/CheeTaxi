import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Navigation,
  Clock,
  Shield,
  Phone,
  Share2,
  AlertTriangle,
  Star,
  CheckCircle,
  Car,
  Users,
  ChevronRight,
  Info,
  DollarSign,
  Smartphone,
  Sparkles,
  History,
  HelpCircle,
  Send,
  X,
  Package,
  Building2,
  CreditCard,
  UserPlus,
  ArrowUpDown,
} from 'lucide-react';
import { AddisMap } from '../Map/AddisMap';
import { LocationSearchInput } from './LocationSearchInput';
import { TelebirrModal } from '../Payment/TelebirrModal';
import { VatReceiptModal } from '../Payment/VatReceiptModal';
import { RiderDeliveryPanel } from './RiderDeliveryPanel';
import { PassengerOnboardingModal } from '../Onboarding/PassengerOnboardingModal';
import { ADDIS_LANDMARKS, AddisLandmark } from '@shared/landmarks';
import {
  Driver,
  FareEstimate,
  LocationPoint,
  PaymentMethod,
  Ride,
  TelebirrOrder,
  VehicleCategory,
} from '@shared/types';
import { translations, Language } from '../../i18n/translations';
import { sounds } from '../../utils/audio';

interface RiderViewProps {
  currentRiderId: string;
  currentRiderName: string;
  currentRiderPhone: string;
  language: Language;
  socket: any;
  onRideActive?: (ride: Ride | null) => void;
}

export const RiderView: React.FC<RiderViewProps> = ({
  currentRiderId,
  currentRiderName,
  currentRiderPhone,
  language,
  socket,
  onRideActive,
}) => {
  const t = translations[language];

  // Locations
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

  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [estimates, setEstimates] = useState<FareEstimate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<VehicleCategory>('sedan');
  const [riderMode, setRiderMode] = useState<'rides' | 'deliveries'>('rides');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TELEBIRR');
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);

  // Live driver position & calculated route for active ride
  const [activeDriverPos, setActiveDriverPos] = useState<[number, number] | undefined>(undefined);
  const [activeDriverHeading, setActiveDriverHeading] = useState<number>(0);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [mapPickingMode, setMapPickingMode] = useState<'pickup' | 'destination' | null>(null);

  // Modals
  const [telebirrOrder, setTelebirrOrder] = useState<TelebirrOrder | null>(null);
  const [showTelebirrModal, setShowTelebirrModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [tipValue, setTipValue] = useState(0);
  const [quickNoteSent, setQuickNoteSent] = useState<string | null>(null);

  // Passenger Onboarding Flow
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  // History & Support Modals
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyRides, setHistoryRides] = useState<Ride[]>([]);
  const [selectedReceiptRide, setSelectedReceiptRide] = useState<Ride | null>(null);

  const [showSupportModal, setShowSupportModal] = useState(false);
  const [ticketCategory, setTicketCategory] = useState<'lost_item' | 'fare_dispute' | 'payment' | 'driver_behavior' | 'app_issue'>('lost_item');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState(false);

  const loadHistory = () => {
    fetch(`/api/rides/user/${currentRiderId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.rides) setHistoryRides(data.rides);
        setShowHistoryModal(true);
      })
      .catch(console.error);
  };

  const handleSendTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rideId: activeRide?.id,
          userId: currentRiderId,
          userName: currentRiderName,
          userPhone: currentRiderPhone,
          userRole: 'rider',
          category: ticketCategory,
          subject: ticketSubject,
          message: ticketMessage,
        }),
      });
      if (res.ok) {
        setTicketSuccess(true);
        setTimeout(() => {
          setTicketSuccess(false);
          setShowSupportModal(false);
          setTicketSubject('');
          setTicketMessage('');
        }, 2500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch online drivers
  useEffect(() => {
    fetch('/api/drivers')
      .then((res) => res.json())
      .then((data) => {
        if (data.drivers) setAvailableDrivers(data.drivers);
      })
      .catch(console.error);
  }, []);

  // Fetch fare estimates whenever pickup or destination changes
  useEffect(() => {
    if (!pickup || !destination) return;
    setIsCalculating(true);

    fetch('/api/rides/estimate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pickup, destination }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.estimates) {
          setEstimates(data.estimates);
        }
        if (data.routeCoordinates) {
          setRouteCoordinates(data.routeCoordinates);
        }
      })
      .catch(console.error)
      .finally(() => setIsCalculating(false));
  }, [pickup, destination]);

  // Socket listener for ride status updates & location ticks
  useEffect(() => {
    if (!socket || !activeRide) return;

    socket.emit('join:ride', activeRide.id);

    const onStatusChanged = (updatedRide: Ride) => {
      setActiveRide(updatedRide);
      if (onRideActive) onRideActive(updatedRide);

      if (updatedRide.status === 'ASSIGNED') {
        sounds.playRideAccepted();
      } else if (updatedRide.status === 'ARRIVED') {
        sounds.playIncomingRideAlert();
      } else if (updatedRide.status === 'COMPLETED') {
        sounds.playPaymentSuccess();
        setShowRatingModal(true);
      }
    };

    const onLocationTick = (data: { driverLocation: [number, number]; heading: number }) => {
      setActiveDriverPos(data.driverLocation);
      setActiveDriverHeading(data.heading);
    };

    socket.on('ride:status_changed', onStatusChanged);
    socket.on('ride:location_tick', onLocationTick);

    return () => {
      socket.off('ride:status_changed', onStatusChanged);
      socket.off('ride:location_tick', onLocationTick);
    };
  }, [socket, activeRide?.id]);

  // Request a ride
  const handleRequestRide = async () => {
    try {
      const res = await fetch('/api/rides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          riderId: currentRiderId,
          riderName: currentRiderName,
          riderPhone: currentRiderPhone,
          pickup,
          destination,
          vehicleCategory: selectedCategory,
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (data.success && data.ride) {
        setActiveRide(data.ride);
        if (onRideActive) onRideActive(data.ride);
        sounds.playIncomingRideAlert();
      }
    } catch (err) {
      console.error('Failed to book ride:', err);
    }
  };

  // Cancel ride
  const handleCancelRide = async () => {
    if (!activeRide) return;
    try {
      await fetch(`/api/rides/${activeRide.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Passenger cancelled', cancelledBy: 'rider' }),
      });
      setActiveRide(null);
      if (onRideActive) onRideActive(null);
    } catch (err) {
      console.error('Failed to cancel ride:', err);
    }
  };

  // Open Telebirr payment
  const handleOpenTelebirrPayment = async () => {
    if (!activeRide) return;
    try {
      const res = await fetch('/api/telebirr/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rideId: activeRide.id,
          amountEtb: activeRide.fare.totalFare,
          payerPhone: currentRiderPhone,
        }),
      });
      const data = await res.json();
      if (data.success && data.order) {
        setTelebirrOrder(data.order);
        setShowTelebirrModal(true);
      }
    } catch (err) {
      console.error('Failed to initiate Telebirr:', err);
    }
  };

  // Submit Rating
  const handleSubmitRating = async () => {
    if (!activeRide) return;
    try {
      await fetch(`/api/rides/${activeRide.id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: ratingValue,
          review: 'Great ride with Chebelew!',
          tipAmount: tipValue,
        }),
      });
      setShowRatingModal(false);
      setShowReceiptModal(true);
    } catch (err) {
      console.error('Failed to rate:', err);
    }
  };

  // Swap pickup & destination
  const handleSwapLocations = () => {
    const temp = pickup;
    setPickup(destination);
    setDestination(temp);
  };

  // Map click handler when in picking mode
  const handleMapClick = (lat: number, lng: number) => {
    if (!mapPickingMode) return;

    let nearest = ADDIS_LANDMARKS[0];
    let minD = Infinity;
    for (const lm of ADDIS_LANDMARKS) {
      const d = Math.hypot(lm.lat - lat, lm.lng - lng);
      if (d < minD) {
        minD = d;
        nearest = lm;
      }
    }

    const isClose = minD < 0.008; // ~800m
    const point: LocationPoint = {
      address: isClose ? `Near ${nearest.name}` : `Selected Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      addressAm: isClose ? `${nearest.nameAm} አቅራቢያ` : `የተመረጠ ቦታ (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      lat,
      lng,
    };

    if (mapPickingMode === 'pickup') {
      setPickup(point);
    } else {
      setDestination(point);
    }
    setMapPickingMode(null);
  };

  const POPULAR_CHIPS = [
    { label: '✈️ Airport', labelAm: '✈️ አውሮፕላን ማረፊያ', id: 'bole_airport' },
    { label: '🛍️ Edna Mall', labelAm: '🛍️ ኤድና ሞል', id: 'bole_medhanialem' },
    { label: '🏢 Kazanchis', labelAm: '🏢 ካዛንቺስ', id: 'kazanchis_uneca' },
    { label: '🏛️ Meskel Sq', labelAm: '🏛️ መስቀል አደባባይ', id: 'meskel_square' },
    { label: '🏨 Skylight', labelAm: '🏨 ስካይላይት', id: 'skylight_hotel' },
    { label: '☕ Piassa', labelAm: '☕ ፒያሳ', id: 'piassa_churchill' },
    { label: '🏥 Tikur Anbessa', labelAm: '🏥 ጥቁር አንበሳ', id: 'tikur_anbessa' },
  ];

  const selectedEstimate = estimates.find((e) => e.category === selectedCategory);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-68px)] w-full overflow-hidden bg-slate-50">
      {/* Left Control Panel / Booking Sheet */}
      <div className="w-full lg:w-[440px] xl:w-[480px] bg-white border-r border-slate-200 flex flex-col h-full shadow-lg z-20 overflow-y-auto">
        {/* Top Destination Selector */}
        <div className="p-5 border-b border-slate-100 space-y-3.5 bg-gradient-to-b from-slate-50 to-white">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse" />
              {t.whereTo}
            </h2>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowOnboardingModal(true)}
                className="p-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                title={language === 'am' ? 'የተሳፋሪ መገለጫ ይመዝገቡ' : 'Onboard Profile'}
              >
                <UserPlus className="w-3.5 h-3.5 text-brand-600" />
                <span className="hidden sm:inline">{language === 'am' ? 'መገለጫ ማዋቀር' : 'Onboard Profile'}</span>
              </button>
              <button
                type="button"
                onClick={loadHistory}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                title={t.tripHistory}
              >
                <History className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.tripHistory}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowSupportModal(true)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                title={t.supportHelp}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Support</span>
              </button>
            </div>
          </div>

          {/* Pickup & Destination Interactive Search Inputs with Swap Control */}
          <div className="relative space-y-2">
            <LocationSearchInput
              type="pickup"
              value={pickup}
              onChange={(pt) => setPickup(pt)}
              onPickOnMap={() => setMapPickingMode('pickup')}
              language={language}
              placeholder={language === 'am' ? 'የመነሻ ቦታ ይምረጡ' : 'Set pickup location'}
            />

            {/* Floating Swap Button */}
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10">
              <button
                type="button"
                onClick={handleSwapLocations}
                className="w-7 h-7 rounded-full bg-white shadow-md border border-slate-200 text-slate-600 hover:text-brand-600 hover:border-brand-300 flex items-center justify-center transition active:scale-90"
                title="Swap Pickup & Destination"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>

            <LocationSearchInput
              type="destination"
              value={destination}
              onChange={(pt) => setDestination(pt)}
              onPickOnMap={() => setMapPickingMode('destination')}
              language={language}
              placeholder={language === 'am' ? 'የት መሄድ ይፈልጋሉ?' : 'Where to?'}
            />
          </div>

          {/* Popular Landmark Quick Chips */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              {language === 'am' ? 'ተወዳጅ መዳረሻዎች' : 'Popular Destinations'}
            </span>
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              {POPULAR_CHIPS.map((chip) => {
                const landmark = ADDIS_LANDMARKS.find((l) => l.id === chip.id);
                if (!landmark) return null;
                const isCurrentDest = destination.address === landmark.name;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => {
                      setDestination({
                        address: landmark.name,
                        addressAm: landmark.nameAm,
                        lat: landmark.lat,
                        lng: landmark.lng,
                      });
                    }}
                    className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition ${
                      isCurrentDest
                        ? 'bg-brand-500 text-white border-brand-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {language === 'am' ? chip.labelAm : chip.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ride vs Delivery Mode Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setRiderMode('rides')}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
                riderMode === 'rides'
                  ? 'bg-white text-brand-600 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>Ride Hailing</span>
            </button>
            <button
              type="button"
              onClick={() => setRiderMode('deliveries')}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
                riderMode === 'deliveries'
                  ? 'bg-white text-brand-600 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Delivery & Courier</span>
            </button>
          </div>
        </div>

        {/* Content based on Active Ride status or Delivery Mode */}
        {riderMode === 'deliveries' ? (
          <div className="p-5 flex-1">
            <RiderDeliveryPanel
              currentRiderId={currentRiderId}
              currentRiderName={currentRiderName}
              currentRiderPhone={currentRiderPhone}
              pickup={pickup}
              destination={destination}
              language={language}
            />
          </div>
        ) : !activeRide ? (
          <div className="p-5 space-y-5 flex-1">
            {/* Vehicle Options */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                {language === 'am' ? 'የመኪና ምርጫ' : 'Select Ride Category'}
              </label>

              <div className="space-y-2.5">
                {estimates
                  .filter((e) => !e.isAggregatedPartner)
                  .map((est) => {
                    const isSelected = selectedCategory === est.category;
                    return (
                      <div
                        key={est.category}
                        onClick={() => setSelectedCategory(est.category)}
                        className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex items-center justify-between ${
                          isSelected
                            ? 'border-brand-500 bg-brand-50/40 shadow-sm'
                            : 'border-slate-100 hover:border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-11 h-11 rounded-lg flex items-center justify-center font-bold text-sm ${
                              isSelected ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            <Car className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                              {language === 'am' ? est.displayNameAm : est.displayName}
                              <span className="text-[10px] text-slate-500 font-normal flex items-center gap-0.5">
                                <Users className="w-3 h-3" /> {est.capacity}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                              {language === 'am' ? est.descriptionAm : est.description}
                            </div>
                            <div className="text-[10px] text-brand-700 font-semibold mt-0.5">
                              ETA ~{est.etaMinutes} mins away
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-extrabold text-slate-900">
                            {est.fare.totalFare.toFixed(0)} <span className="text-[10px]">ETB</span>
                          </div>
                          <span className="text-[10px] text-emerald-600 font-medium block">
                            Inc. 15% VAT
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Aggregator Comparison Drawer */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  {t.partnerComparison}
                </span>
                <span className="text-[10px] text-slate-500">Live Comparison</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                {/* Chebelew */}
                <div className="bg-white p-2.5 rounded-lg border-2 border-brand-500 shadow-sm relative">
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-brand-500 text-white text-[9px] font-black px-1.5 rounded-full">
                    BEST
                  </div>
                  <div className="font-bold text-brand-700 text-[11px] mt-1">Chebelew</div>
                  <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                    {selectedEstimate?.fare.totalFare.toFixed(0)} <span className="text-[9px]">ETB</span>
                  </div>
                  <div className="text-[10px] text-emerald-600 font-bold mt-1">Direct Match</div>
                </div>

                {/* Partner Metered Taxi */}
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-slate-600">
                  <div className="font-bold text-slate-800 text-[11px]">Metered Cab</div>
                  <div className="text-sm font-bold text-slate-700 mt-0.5">
                    {estimates.find((e) => e.category === 'partner_ride')?.fare.totalFare.toFixed(0) || '245'}{' '}
                    <span className="text-[9px]">ETB</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Partner Network</div>
                </div>

                {/* Municipal Taxi Cooperative */}
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-slate-600">
                  <div className="font-bold text-slate-800 text-[11px]">Taxi Co-op</div>
                  <div className="text-sm font-bold text-slate-700 mt-0.5">
                    {estimates.find((e) => e.category === 'partner_feres')?.fare.totalFare.toFixed(0) || '230'}{' '}
                    <span className="text-[9px]">ETB</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Municipal Association</div>
                </div>
              </div>
            </div>

            {/* VAT Regulation 570/2025 Breakdown Notice */}
            {selectedEstimate && (
              <div className="bg-blue-50/60 rounded-xl p-3.5 border border-blue-100 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-blue-900">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>{t.vatRegulation}</span>
                </div>
                <div className="text-blue-800 text-[11px] leading-relaxed">
                  {t.vatNotice}
                </div>
                <div className="flex justify-between pt-1 border-t border-blue-200/60 font-mono text-[11px] text-blue-950">
                  <span>Fare: {selectedEstimate.fare.subtotal.toFixed(2)} ETB</span>
                  <span className="font-bold text-emerald-700">
                    +15% VAT: {selectedEstimate.fare.vatAmount.toFixed(2)} ETB
                  </span>
                </div>
              </div>
            )}

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                {t.paymentMethod}
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('TELEBIRR')}
                  className={`p-2.5 rounded-xl border-2 flex items-center justify-center gap-1.5 font-bold transition ${
                    paymentMethod === 'TELEBIRR'
                      ? 'border-[#0070ba] bg-blue-50/50 text-[#0070ba]'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-[#0070ba]" />
                  <span>{t.telebirr}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`p-2.5 rounded-xl border-2 flex items-center justify-center gap-1.5 font-bold transition ${
                    paymentMethod === 'CASH'
                      ? 'border-emerald-600 bg-emerald-50/50 text-emerald-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>{t.cash}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('BANK_TRANSFER')}
                  className={`p-2.5 rounded-xl border-2 flex items-center justify-center gap-1.5 font-bold transition ${
                    paymentMethod === 'BANK_TRANSFER'
                      ? 'border-purple-600 bg-purple-50/50 text-purple-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-purple-600" />
                  <span>CBE Birr / Bank</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CORPORATE_BILLING')}
                  className={`p-2.5 rounded-xl border-2 flex items-center justify-center gap-1.5 font-bold transition ${
                    paymentMethod === 'CORPORATE_BILLING'
                      ? 'border-amber-600 bg-amber-50/50 text-amber-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-amber-600" />
                  <span>Corporate Account</span>
                </button>
              </div>

              {paymentMethod === 'CORPORATE_BILLING' && (
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-center justify-between">
                  <span>🏢 Billed to <strong>Ethiopian Airlines Commercial Fleet</strong></span>
                  <span className="font-mono font-bold text-amber-700">Allowance: 12,500 ETB</span>
                </div>
              )}
            </div>

            {/* Book Now Button */}
            <button
              onClick={handleRequestRide}
              disabled={isCalculating}
              className="w-full bg-brand-500 hover:bg-brand-600 active:scale-[0.99] text-white font-extrabold py-3.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-500/30 transition disabled:opacity-60"
            >
              <span>{t.bookNow}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Live Ride Status Card */
          <div className="p-5 space-y-5 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Uber Radar Search Animation when REQUESTED */}
              {activeRide.status === 'REQUESTED' ? (
                <div className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden space-y-4">
                  {/* Concentric Animated Radar Rings */}
                  <div className="relative w-32 h-32 flex items-center justify-center my-2">
                    <div className="absolute inset-0 rounded-full border border-brand-500/30 animate-ping opacity-75" />
                    <div className="absolute w-24 h-24 rounded-full border-2 border-brand-400/40 animate-pulse" />
                    <div className="absolute w-16 h-16 rounded-full bg-brand-500/20 flex items-center justify-center" />
                    <div className="relative z-10 w-12 h-12 rounded-full bg-brand-500 shadow-lg shadow-brand-500/50 flex items-center justify-center text-white">
                      <Car className="w-6 h-6 animate-bounce" />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-base text-white">Connecting with nearby taxis...</h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-[280px]">
                      Broadcasting ride request to certified Chebelew drivers near {pickup.address.split(',')[0]}
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3.5 py-1.5 rounded-full text-xs font-semibold text-brand-300 border border-white/10">
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    <span>Estimated match: ~1-2 mins</span>
                  </div>
                </div>
              ) : (
                <>
                  {/* Status Header */}
                  <div className="bg-slate-900 text-white p-4 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-brand-300">TRIP ID: {activeRide.id}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-brand-500 text-white">
                        {activeRide.status}
                      </span>
                    </div>
                    <div className="text-base font-bold text-white pt-1">
                      {activeRide.status === 'ASSIGNED' && t.driverAssigned}
                      {activeRide.status === 'ARRIVED' && t.driverArrived}
                      {activeRide.status === 'IN_PROGRESS' && t.tripInProgress}
                      {activeRide.status === 'COMPLETED' && t.tripCompleted}
                    </div>
                  </div>

                  {/* Uber 4-digit Safety PIN Badge */}
                  {activeRide.status !== 'COMPLETED' && (
                    <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
                          <Shield className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-black tracking-wider text-amber-700 block">4-Digit Boarding PIN</span>
                          <span className="text-xs text-slate-600">Share with driver before boarding</span>
                        </div>
                      </div>
                      <div className="font-mono text-lg font-black tracking-widest text-slate-900 bg-white px-3 py-1 rounded-lg border border-amber-300 shadow-sm">
                        {activeRide.id.slice(-4).toUpperCase()}
                      </div>
                    </div>
                  )}

                  {/* Driver & Vehicle Details */}
                  {activeRide.driver && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={activeRide.driver.avatarUrl}
                            alt={activeRide.driver.fullName}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow"
                          />
                          <div>
                            <div className="font-bold text-sm text-slate-800">
                              {activeRide.driver.fullName}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              <span>{activeRide.driver.rating}</span>
                              <span>• {activeRide.driver.totalRides} trips</span>
                            </div>
                          </div>
                        </div>

                        <a
                          href={`tel:${activeRide.driver.phone}`}
                          className="p-2.5 bg-emerald-100 text-emerald-800 rounded-full hover:bg-emerald-200 transition"
                          title={t.callDriver}
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      </div>

                      <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-lg border border-slate-100 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Vehicle</span>
                          <span className="font-semibold text-slate-700">
                            {activeRide.driver.vehicleMake} {activeRide.driver.vehicleModel}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">License Plate</span>
                          <span className="font-mono font-bold text-slate-800">
                            {activeRide.driver.vehiclePlate}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick message chips to driver */}
                  {(activeRide.status === 'ASSIGNED' || activeRide.status === 'ARRIVED') && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-500">Quick Note to Driver:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          'Waiting at main gate',
                          'Wearing black jacket',
                          'Have light luggage',
                          'Please turn on AC',
                        ].map((msg) => (
                          <button
                            key={msg}
                            type="button"
                            onClick={() => {
                              setQuickNoteSent(msg);
                              setTimeout(() => setQuickNoteSent(null), 3500);
                            }}
                            className="text-[11px] bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 font-medium py-1 px-2.5 rounded-full border border-slate-200 transition active:scale-95"
                          >
                            {msg}
                          </button>
                        ))}
                      </div>
                      {quickNoteSent && (
                        <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Sent to driver: &quot;{quickNoteSent}&quot;</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Post-trip Rating & Tipping on COMPLETED */}
                  {activeRide.status === 'COMPLETED' && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                      <div className="text-center">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-1">
                          <CheckCircle className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-sm text-slate-800">Trip Completed!</h4>
                        <p className="text-xs text-slate-500">How was your trip with {activeRide.driver?.fullName || 'the driver'}?</p>
                      </div>

                      {/* Star Rating */}
                      <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRatingValue(star)}
                            className="p-1 hover:scale-110 transition"
                          >
                            <Star
                              className={`w-6 h-6 ${
                                star <= ratingValue
                                  ? 'text-amber-500 fill-amber-500'
                                  : 'text-slate-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>

                      {/* Tip Selector */}
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 block mb-1.5 text-center">Add Driver Tip (Optional):</span>
                        <div className="grid grid-cols-4 gap-1.5">
                          {[0, 20, 50, 100].map((tip) => (
                            <button
                              key={tip}
                              type="button"
                              onClick={() => setTipValue(tip)}
                              className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition ${
                                tipValue === tip
                                  ? 'bg-brand-500 text-white border-brand-600 shadow'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {tip === 0 ? 'No Tip' : `${tip} ETB`}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleSubmitRating}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-lg text-xs transition"
                      >
                        Submit Rating & Tip
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Live Fare & Payment Status */}
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Total Fare</span>
                  <span className="text-base font-extrabold text-slate-900">
                    {activeRide.fare.totalFare.toFixed(2)} ETB
                  </span>
                  <span className="text-[10px] text-emerald-600 block">Inc. 15% VAT</span>
                </div>

                <div className="text-right">
                  <span className="text-slate-400 block text-[10px]">Payment</span>
                  <span className="font-bold text-slate-800 uppercase">
                    {activeRide.paymentMethod}
                  </span>
                  <span
                    className={`text-[10px] font-bold block ${
                      activeRide.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {activeRide.paymentStatus === 'PAID' ? '✓ PAID' : 'PENDING'}
                  </span>
                </div>
              </div>

              {/* Safety & SOS Bar */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm('Trigger SOS to Police 991 and Chebelew Emergency Safety Response?')) {
                      try {
                        await fetch('/api/safety/sos', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            rideId: activeRide.id,
                            reporterUserId: currentRiderId,
                            reporterName: currentRiderName,
                            reporterPhone: currentRiderPhone,
                            reporterRole: 'rider',
                            currentLat: pickup.lat,
                            currentLng: pickup.lng,
                            notes: 'Passenger SOS Panic Button pressed during live trip.',
                          }),
                        });
                        alert('Emergency SOS dispatched! Police 991 & Chebelew Operations Team notified.');
                      } catch (err: any) {
                        alert('SOS failed: ' + err.message);
                      }
                    }
                  }}
                  className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>{t.sosEmergency}</span>
                </button>
                <button
                  onClick={() => alert(`Chebelew Trip Link: https://chebelew.et/track/${activeRide.id}`)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Share2 className="w-4 h-4 text-slate-600" />
                  <span>{t.shareTrip}</span>
                </button>
              </div>
            </div>

            {/* Bottom Action buttons */}
            <div className="space-y-2 pt-4 border-t border-slate-100">
              {activeRide.paymentMethod === 'TELEBIRR' && activeRide.paymentStatus !== 'PAID' && (
                <button
                  onClick={handleOpenTelebirrPayment}
                  className="w-full bg-[#0070ba] hover:bg-[#004c82] text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-md"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Pay Now via Telebirr ({activeRide.fare.totalFare.toFixed(2)} ETB)</span>
                </button>
              )}

              {activeRide.status === 'COMPLETED' && (
                <button
                  onClick={() => setShowReceiptModal(true)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>{t.viewReceipt}</span>
                </button>
              )}

              {activeRide.status !== 'COMPLETED' && activeRide.status !== 'CANCELLED' && (
                <button
                  onClick={handleCancelRide}
                  className="w-full bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 font-semibold py-2.5 px-4 rounded-xl text-xs transition"
                >
                  Cancel Ride
                </button>
              )}

              {activeRide.status === 'COMPLETED' && (
                <button
                  onClick={() => {
                    setActiveRide(null);
                    if (onRideActive) onRideActive(null);
                  }}
                  className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition"
                >
                  Book Another Ride
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Map Canvas */}
      <div className="flex-1 h-full relative">
        <AddisMap
          pickup={pickup}
          destination={destination}
          drivers={availableDrivers}
          activeDriverLocation={activeDriverPos || (activeRide?.driver ? [activeRide.driver.currentLat, activeRide.driver.currentLng] : undefined)}
          activeDriverHeading={activeDriverHeading || (activeRide?.driver?.heading || 0)}
          activeDriverPlate={activeRide?.driver?.vehiclePlate}
          routeCoordinates={activeRide?.routeCoordinates || routeCoordinates}
          onMapClick={handleMapClick}
          pickingMode={mapPickingMode}
          onCancelPicking={() => setMapPickingMode(null)}
        />
      </div>

      {/* Telebirr Payment Modal */}
      {telebirrOrder && (
        <TelebirrModal
          order={telebirrOrder}
          isOpen={showTelebirrModal}
          onSuccess={(updatedOrder) => {
            setShowTelebirrModal(false);
            if (activeRide) {
              setActiveRide({
                ...activeRide,
                paymentStatus: 'PAID',
                telebirrOrderId: updatedOrder.orderId,
                telebirrTransactionNo: updatedOrder.transactionNo,
              });
            }
          }}
          onClose={() => setShowTelebirrModal(false)}
        />
      )}

      {/* Electronic VAT Tax Receipt Modal */}
      {activeRide && (
        <VatReceiptModal
          ride={activeRide}
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
        />
      )}

      {/* Post Trip Rating Modal */}
      {showRatingModal && activeRide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">{t.rateDriver}</h3>
            <p className="text-xs text-slate-500">
              How was your trip with {activeRide.driver?.fullName || 'the driver'}?
            </p>

            {/* Stars */}
            <div className="flex justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRatingValue(star)}
                  className="p-1 transition transform hover:scale-110"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= ratingValue ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Tip Option */}
            <div className="text-left space-y-1.5">
              <span className="text-xs font-semibold text-slate-700">{t.tipDriver}</span>
              <div className="grid grid-cols-4 gap-2">
                {[0, 20, 50, 100].map((tip) => (
                  <button
                    key={tip}
                    onClick={() => setTipValue(tip)}
                    className={`py-1.5 rounded-lg text-xs font-bold border ${
                      tipValue === tip
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    {tip === 0 ? 'No tip' : `+${tip}`}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSubmitRating}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition"
            >
              {t.submitRating}
            </button>
          </div>
        </div>
      )}

      {/* Trip History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-brand-400" />
                <h3 className="font-bold text-sm">{t.tripHistory}</h3>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
              {historyRides.length === 0 ? (
                <div className="text-center py-10 text-slate-400">No past trips found.</div>
              ) : (
                historyRides.map((r) => (
                  <div key={r.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-slate-800">#{r.id}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-slate-600 space-y-0.5">
                      <div className="truncate"><strong>From:</strong> {r.pickup.address}</div>
                      <div className="truncate"><strong>To:</strong> {r.destination.address}</div>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                      <span className="font-mono font-bold text-slate-900">
                        {r.fare.totalFare.toFixed(2)} ETB ({r.paymentMethod})
                      </span>
                      <button
                        onClick={() => {
                          setSelectedReceiptRide(r);
                          setShowReceiptModal(true);
                        }}
                        className="bg-brand-500 hover:bg-brand-600 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] transition"
                      >
                        {t.viewReceipt}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Support & Dispute Ticket Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-brand-400" />
                <h3 className="font-bold text-sm">{t.supportHelp}</h3>
              </div>
              <button onClick={() => setShowSupportModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendTicket} className="p-5 space-y-3.5 text-xs">
              {ticketSuccess && (
                <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-lg border border-emerald-200 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Ticket received! Support officer will follow up shortly.</span>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Issue Category</label>
                <select
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="lost_item">Lost Item in Taxi</option>
                  <option value="fare_dispute">Fare / Tariff Dispute</option>
                  <option value="payment">Telebirr / Payment Query</option>
                  <option value="driver_behavior">Driver Conduct</option>
                  <option value="app_issue">Technical / App Issue</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Left phone in backseat of Corolla"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Detailed Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide details to assist the Addis Ababa operations center..."
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSupportModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Ticket</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tax receipt for selected historic ride or active completed ride */}
      {(selectedReceiptRide || (activeRide && showReceiptModal)) && (
        <VatReceiptModal
          ride={selectedReceiptRide || activeRide!}
          isOpen={showReceiptModal}
          onClose={() => {
            setShowReceiptModal(false);
            setSelectedReceiptRide(null);
          }}
        />
      )}
      {/* Passenger Onboarding Flow Modal */}
      <PassengerOnboardingModal
        isOpen={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
        onComplete={() => {
          setShowOnboardingModal(false);
        }}
        language={language}
      />
    </div>
  );
};
