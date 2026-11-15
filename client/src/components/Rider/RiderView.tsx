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
  Sliders,
  Calendar,
  Plane,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Luggage,
  Wind,
  VolumeX,
  Wallet,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AddisMap } from '../Map/AddisMap';
import { LocationSearchInput } from './LocationSearchInput';
import { TelebirrModal } from '../Payment/TelebirrModal';
import { VatReceiptModal } from '../Payment/VatReceiptModal';
import { RoutedPaymentModal } from '../Payment/RoutedPaymentModal';
import { PassengerWalletModal } from '../Payment/PassengerWalletModal';
import { RiderDeliveryPanel } from './RiderDeliveryPanel';
import { PassengerOnboardingModal } from '../Onboarding/PassengerOnboardingModal';
import { ADDIS_LANDMARKS, AddisLandmark } from '@shared/landmarks';
import {
  Driver,
  FareEstimate,
  LocationPoint,
  MarketplaceOffer,
  OfferComparisonMode,
  PassengerComfortPreferences,
  PaymentMethod,
  Ride,
  ScheduledRide,
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

interface RealisticNearbyCab extends Driver {
  distanceMeters: number;
  initialOffsetLat: number;
  initialOffsetLng: number;
}

const REALISTIC_CAB_BLUEPRINTS = [
  {
    id: 'sim_driver_ahmed',
    fullName: 'Ahmed Mohammed (አህመድ)',
    phone: '+251912334455',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    vehicleMake: 'Toyota',
    vehicleModel: 'Corolla Exec',
    vehicleYear: 2019,
    vehiclePlate: 'ET-3-A78945',
    vehicleColor: 'Silver Gray',
    vehicleCategory: 'sedan' as VehicleCategory,
    licenseNumber: 'AA-DL-98231',
    rating: 4.92,
    totalRides: 482,
    offsetLat: 0.0021,
    offsetLng: -0.0018,
    heading: 65,
    distanceMeters: 310,
  },
  {
    id: 'sim_driver_yared',
    fullName: 'Yared Tadesse (ያሬድ)',
    phone: '+251915778899',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    vehicleMake: 'Hyundai',
    vehicleModel: 'Elantra Comfort',
    vehicleYear: 2022,
    vehiclePlate: 'ET-3-D19022',
    vehicleColor: 'Midnight Blue',
    vehicleCategory: 'comfort' as VehicleCategory,
    licenseNumber: 'AA-DL-51209',
    rating: 4.95,
    totalRides: 390,
    offsetLat: 0.0016,
    offsetLng: 0.0032,
    heading: 220,
    distanceMeters: 410,
  },
  {
    id: 'sim_driver_dawit',
    fullName: 'Dawit Bekele (ዳዊት)',
    phone: '+251913445566',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    vehicleMake: 'Toyota',
    vehicleModel: 'Avanza 7-Seater',
    vehicleYear: 2021,
    vehiclePlate: 'ET-3-B45210',
    vehicleColor: 'Metallic White',
    vehicleCategory: 'minivan' as VehicleCategory,
    licenseNumber: 'AA-DL-77412',
    rating: 4.88,
    totalRides: 615,
    offsetLat: -0.0031,
    offsetLng: 0.0026,
    heading: 140,
    distanceMeters: 520,
  },
  {
    id: 'sim_driver_bethlehem',
    fullName: 'Bethlehem Girma (ቤተልሔም)',
    phone: '+251914556677',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    vehicleMake: 'Toyota',
    vehicleModel: 'Vitz Compact',
    vehicleYear: 2019,
    vehiclePlate: 'ET-3-C88190',
    vehicleColor: 'Deep Blue',
    vehicleCategory: 'sedan' as VehicleCategory,
    licenseNumber: 'AA-DL-63109',
    rating: 4.90,
    totalRides: 520,
    offsetLat: -0.0026,
    offsetLng: -0.0031,
    heading: 310,
    distanceMeters: 640,
  },
  {
    id: 'sim_driver_kalkidan',
    fullName: 'Kalkidan Alemu (ቃልኪዳን)',
    phone: '+251916332211',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    vehicleMake: 'Suzuki',
    vehicleModel: 'Dzire GLX',
    vehicleYear: 2023,
    vehiclePlate: 'ET-3-E55319',
    vehicleColor: 'Pearl White',
    vehicleCategory: 'sedan' as VehicleCategory,
    licenseNumber: 'AA-DL-38192',
    rating: 4.86,
    totalRides: 275,
    offsetLat: 0.0038,
    offsetLng: -0.0015,
    heading: 85,
    distanceMeters: 780,
  },
  {
    id: 'sim_driver_tewodros',
    fullName: 'Tewodros Kassaye (ቴዎድሮስ)',
    phone: '+251917884433',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
    vehicleMake: 'Toyota',
    vehicleModel: 'RAV4 Executive',
    vehicleYear: 2022,
    vehiclePlate: 'ET-3-F77102',
    vehicleColor: 'Dark Gray',
    vehicleCategory: 'comfort' as VehicleCategory,
    licenseNumber: 'AA-DL-82731',
    rating: 4.94,
    totalRides: 440,
    offsetLat: -0.0041,
    offsetLng: 0.0037,
    heading: 175,
    distanceMeters: 890,
  },
];

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
  const [simulatedCabs, setSimulatedCabs] = useState<RealisticNearbyCab[]>([]);
  const [searchElapsedSeconds, setSearchElapsedSeconds] = useState(0);
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

  // Advanced Payment Systems: Direct Driver Rails & Passenger Wallet
  const [showRoutedPaymentModal, setShowRoutedPaymentModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [passengerWalletBalance, setPassengerWalletBalance] = useState<number | null>(null);

  // Passenger Onboarding Flow
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  // Intelligent Multi-Provider Comparison (Section 3.1)
  const [comparisonMode, setComparisonMode] = useState<OfferComparisonMode>('best_value');
  const [marketplaceOffers, setMarketplaceOffers] = useState<MarketplaceOffer[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);

  // Comfort Preferences (Workstream 5)
  const [showComfortModal, setShowComfortModal] = useState(false);
  const [comfortPreferences, setComfortPreferences] = useState<PassengerComfortPreferences>({
    userId: currentRiderId,
    acRequired: false,
    quietRide: false,
    extraLuggage: false,
    temperaturePreference: 'normal',
    femaleDriverPreference: false,
    accessibilityAssistance: false,
    petFriendly: false,
    childSeat: false,
    notes: '',
    updatedAt: new Date().toISOString(),
  });

  // Scheduled & Recurring Bookings (Workstream 5)
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [airportTerminal, setAirportTerminal] = useState('Terminal 2 International');
  const [recurrenceType, setRecurrenceType] = useState<'once' | 'daily' | 'weekly'>('once');
  const [scheduleSuccessMsg, setScheduleSuccessMsg] = useState<string | null>(null);

  // History & Support Modals
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyRides, setHistoryRides] = useState<Ride[]>([]);
  const [selectedReceiptRide, setSelectedReceiptRide] = useState<Ride | null>(null);

  // Delight Factor & Minimal Modal States
  const [isCtaHovered, setIsCtaHovered] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [isVehiclesExpanded, setIsVehiclesExpanded] = useState(false);
  const [isOffersExpanded, setIsOffersExpanded] = useState(false);
  const [isPreferencesExpanded, setIsPreferencesExpanded] = useState(false);
  const [isTripDetailsExpanded, setIsTripDetailsExpanded] = useState(false);
  const [isHudMinimized, setIsHudMinimized] = useState(false);

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

  // Fetch online drivers & comfort preferences
  useEffect(() => {
    fetch('/api/drivers')
      .then((res) => res.json())
      .then((data) => {
        if (data.drivers) setAvailableDrivers(data.drivers);
      })
      .catch(console.error);

    fetch(`/api/rides/preferences/${currentRiderId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.preferences) setComfortPreferences(data.preferences);
      })
      .catch(console.error);

    fetch(`/api/wallet/${currentRiderId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.wallet) setPassengerWalletBalance(data.wallet.balanceEtb);
      })
      .catch(console.error);
  }, [currentRiderId]);

  // Initialize and cluster realistic available cabs around hailed pickup location
  useEffect(() => {
    if (!pickup?.lat || !pickup?.lng) return;

    const initialCabs: RealisticNearbyCab[] = REALISTIC_CAB_BLUEPRINTS.map((bp) => {
      const lat = pickup.lat + bp.offsetLat;
      const lng = pickup.lng + bp.offsetLng;
      const distM = Math.round(
        Math.sqrt(
          Math.pow((lat - pickup.lat) * 111000, 2) +
          Math.pow((lng - pickup.lng) * 111000 * Math.cos((pickup.lat * Math.PI) / 180), 2)
        )
      );
      return {
        id: bp.id,
        userId: `user_${bp.id}`,
        fullName: bp.fullName,
        phone: bp.phone,
        avatarUrl: bp.avatarUrl,
        vehicleMake: bp.vehicleMake,
        vehicleModel: bp.vehicleModel,
        vehicleYear: bp.vehicleYear,
        vehiclePlate: bp.vehiclePlate,
        vehicleColor: bp.vehicleColor,
        vehicleCategory: bp.vehicleCategory,
        licenseNumber: bp.licenseNumber,
        kycStatus: 'approved',
        isOnline: true,
        isBusy: false,
        currentLat: lat,
        currentLng: lng,
        heading: bp.heading,
        rating: bp.rating,
        totalRides: bp.totalRides,
        walletBalanceEtb: 3850,
        subscriptionStatus: 'active',
        countryCode: 'ET',
        cityCode: 'ADDIS_ABABA',
        distanceMeters: distM,
        initialOffsetLat: bp.offsetLat,
        initialOffsetLng: bp.offsetLng,
      };
    });

    setSimulatedCabs(initialCabs);
  }, [pickup.lat, pickup.lng]);

  // Live Cruising Simulation: animate available cabs along road headings around hailed location
  useEffect(() => {
    if (!pickup?.lat || !pickup?.lng) return;

    const interval = setInterval(() => {
      setSimulatedCabs((prev) =>
        prev.map((cab) => {
          if (activeRide?.driver?.id === cab.id) return cab;

          const speed = 0.00006; // Cruising ~25 km/h
          const rad = ((cab.heading || 0) * Math.PI) / 180;
          let nextLat = cab.currentLat + Math.cos(rad) * speed;
          let nextLng = cab.currentLng + Math.sin(rad) * speed;
          let nextHeading = cab.heading || 0;

          // Boundary limit: Keep within ~1.2 km of the hailed location
          const dLat = nextLat - pickup.lat;
          const dLng = nextLng - pickup.lng;
          const distSq = dLat * dLat + dLng * dLng;

          if (distSq > 0.00016) {
            const targetAngle = (Math.atan2(-dLng, -dLat) * 180) / Math.PI;
            nextHeading = (targetAngle + 360) % 360;
          } else if (Math.random() < 0.25) {
            nextHeading = (nextHeading + (Math.random() * 30 - 15) + 360) % 360;
          }

          const distM = Math.round(
            Math.sqrt(
              Math.pow((nextLat - pickup.lat) * 111000, 2) +
              Math.pow((nextLng - pickup.lng) * 111000 * Math.cos((pickup.lat * Math.PI) / 180), 2)
            )
          );

          return {
            ...cab,
            currentLat: nextLat,
            currentLng: nextLng,
            heading: Math.round(nextHeading),
            distanceMeters: distM,
          };
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [pickup.lat, pickup.lng, activeRide?.driver?.id]);

  // Handle Search Countdown & Auto-Match Simulation
  useEffect(() => {
    if (!activeRide || activeRide.status !== 'REQUESTED') {
      setSearchElapsedSeconds(0);
      return;
    }

    const timer = setInterval(() => {
      setSearchElapsedSeconds((prev) => prev + 1);
    }, 1000);

    // Auto-match after 5.5s: assign closest cab
    const matchTimeout = setTimeout(() => {
      if (activeRide && activeRide.status === 'REQUESTED') {
        const closestCab = simulatedCabs[0] || REALISTIC_CAB_BLUEPRINTS[0];
        const assignedDriver: Driver = {
          id: closestCab.id,
          userId: `user_${closestCab.id}`,
          fullName: closestCab.fullName,
          phone: closestCab.phone,
          avatarUrl: closestCab.avatarUrl,
          vehicleMake: closestCab.vehicleMake,
          vehicleModel: closestCab.vehicleModel,
          vehicleYear: closestCab.vehicleYear,
          vehiclePlate: closestCab.vehiclePlate,
          vehicleColor: closestCab.vehicleColor,
          vehicleCategory: (closestCab.vehicleCategory || selectedCategory) as VehicleCategory,
          licenseNumber: closestCab.licenseNumber,
          kycStatus: 'approved',
          isOnline: true,
          isBusy: true,
          currentLat: closestCab.currentLat,
          currentLng: closestCab.currentLng,
          heading: closestCab.heading,
          rating: closestCab.rating,
          totalRides: closestCab.totalRides,
          walletBalanceEtb: 3850,
          subscriptionStatus: 'active',
          countryCode: 'ET',
          cityCode: 'ADDIS_ABABA',
        };

        const updatedRide: Ride = {
          ...activeRide,
          status: 'ASSIGNED',
          driverId: assignedDriver.id,
          driver: assignedDriver,
        };

        setActiveRide(updatedRide);
        setActiveDriverPos([assignedDriver.currentLat, assignedDriver.currentLng]);
        setActiveDriverHeading(assignedDriver.heading || 0);
        if (onRideActive) onRideActive(updatedRide);
        sounds.playRideAccepted();

        if (socket) {
          socket.emit('ride:accept', { rideId: activeRide.id, driverId: assignedDriver.id });
        }
      }
    }, 5500);

    return () => {
      clearInterval(timer);
      clearTimeout(matchTimeout);
    };
  }, [activeRide?.id, activeRide?.status, simulatedCabs]);

  // Live driver approach simulation: driver moves toward passenger pickup
  useEffect(() => {
    if (!activeRide || activeRide.status !== 'ASSIGNED' || !activeRide.driver || !activeDriverPos) return;

    const approachInterval = setInterval(() => {
      setActiveDriverPos((current) => {
        if (!current) return current;
        const [lat, lng] = current;
        const dLat = pickup.lat - lat;
        const dLng = pickup.lng - lng;
        const dist = Math.sqrt(dLat * dLat + dLng * dLng);

        // Arrived within ~40 meters
        if (dist < 0.0004) {
          setActiveRide((prev) => (prev ? { ...prev, status: 'ARRIVED' } : null));
          sounds.playIncomingRideAlert();
          return [pickup.lat, pickup.lng];
        }

        const step = 0.18;
        const nextLat = lat + dLat * step;
        const nextLng = lng + dLng * step;
        const rad = Math.atan2(dLng, dLat);
        const heading = ((rad * 180) / Math.PI + 360) % 360;
        setActiveDriverHeading(Math.round(heading));

        return [nextLat, nextLng];
      });
    }, 2000);

    return () => clearInterval(approachInterval);
  }, [activeRide?.status, activeRide?.driver?.id, pickup.lat, pickup.lng]);

  // Fetch fare estimates and marketplace multi-provider offers
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

    // Section 3.1: Query Multi-Provider Comparison Engine with Active Mode & Preferences
    fetch('/api/providers/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pickup,
        destination,
        category: selectedCategory,
        mode: comparisonMode,
        preferences: comfortPreferences,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.offers) {
          setMarketplaceOffers(data.offers);
          if (!selectedOfferId && data.offers.length > 0) {
            setSelectedOfferId(data.offers[0].id);
          }
        }
      })
      .catch(console.error);
  }, [pickup, destination, selectedCategory, comparisonMode, comfortPreferences]);

  const handleSavePreferences = async (updated: PassengerComfortPreferences) => {
    try {
      setComfortPreferences(updated);
      await fetch(`/api/rides/preferences/${currentRiderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      setShowComfortModal(false);
    } catch (e) {
      console.error('Failed to update comfort preferences', e);
    }
  };

  const handleCreateScheduledRide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledDate || !scheduledTime) {
      alert('Please select both date and time for scheduled pickup.');
      return;
    }
    try {
      const scheduledIso = new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString();
      const res = await fetch('/api/rides/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          riderId: currentRiderId,
          riderName: currentRiderName,
          riderPhone: currentRiderPhone,
          scheduledTime: scheduledIso,
          pickup,
          destination,
          vehicleCategory: selectedCategory,
          flightNumber: flightNumber || undefined,
          airportTerminal: airportTerminal || undefined,
          recurrenceType,
          notes: flightNumber ? `Airport Transfer (Flight ${flightNumber}, ${airportTerminal})` : 'Scheduled Pickup',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setScheduleSuccessMsg('Scheduled booking confirmed! Operations dispatcher assigned.');
        setTimeout(() => {
          setScheduleSuccessMsg(null);
          setShowScheduleModal(false);
          setFlightNumber('');
        }, 2200);
      }
    } catch (err: any) {
      alert('Failed to schedule ride: ' + err.message);
    }
  };

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
      const selectedOffer = marketplaceOffers.find((o) => o.id === selectedOfferId);
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
          providerId: selectedOffer?.providerId || 'chebelew',
          providerOfferId: selectedOffer?.id,
          fareEtb: selectedOffer?.estimatedFare,
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

  const fallbackEstimates: FareEstimate[] = [
    {
      category: 'sedan',
      displayName: 'Chebelew Standard',
      displayNameAm: 'ቼበለው ስታንዳርድ (ሴዳን)',
      description: 'Toyota Corolla / Vitz / Dzire - 4 passenger seats with A/C',
      descriptionAm: 'ቶዮታ ኮሮላ / ቪትዝ / ዲዛየር - 4 መቀመጫ ከአየር ማቀዝቀዣ ጋር',
      capacity: 4,
      etaMinutes: 3,
      fare: {
        baseFare: 100,
        distanceKm: 6.2,
        distanceFare: 62,
        durationMinutes: 14,
        timeFare: 30,
        subtotal: 192,
        vatRate: 0.15,
        vatAmount: 28.8,
        totalFare: 192,
        platformCommission: 0,
        platformTakeRate: 0,
        telebirrFee: 0,
        driverNetPayout: 192,
      },
    },
    {
      category: 'comfort',
      displayName: 'Chebelew Comfort',
      displayNameAm: 'ቼበለው ኮምፈርት (ቪአይፒ)',
      description: 'Hyundai Elantra / Camry / RAV4 - Premium business comfort',
      descriptionAm: 'ሂዩንዳይ ኤላንትራ / ካምሪ / ራቭ4 - ከፍተኛ ምቾት',
      capacity: 4,
      etaMinutes: 5,
      fare: {
        baseFare: 160,
        distanceKm: 6.2,
        distanceFare: 110,
        durationMinutes: 14,
        timeFare: 71,
        subtotal: 341,
        vatRate: 0.15,
        vatAmount: 51.15,
        totalFare: 341,
        platformCommission: 0,
        platformTakeRate: 0,
        telebirrFee: 0,
        driverNetPayout: 341,
      },
    },
    {
      category: 'minivan',
      displayName: 'Chebelew XL',
      displayNameAm: 'ቼበለው ኤክስኤል (ሚኒቫን)',
      description: 'Toyota Avanza / Noah - 7 seats for groups and airport luggage',
      descriptionAm: 'ቶዮታ አቫንዛ / ኖህ - 7 መቀመጫ ለቤተሰብና ሻንጣ',
      capacity: 7,
      etaMinutes: 6,
      fare: {
        baseFare: 140,
        distanceKm: 6.2,
        distanceFare: 85,
        durationMinutes: 14,
        timeFare: 47,
        subtotal: 272,
        vatRate: 0.15,
        vatAmount: 40.8,
        totalFare: 272,
        platformCommission: 0,
        platformTakeRate: 0,
        telebirrFee: 0,
        driverNetPayout: 272,
      },
    },
  ];

  const nonPartnerEstimates = estimates.filter((e) => !e.isAggregatedPartner);
  const displayEstimates = nonPartnerEstimates.length > 0 ? nonPartnerEstimates : fallbackEstimates;
  const selectedEstimate = displayEstimates.find((e) => e.category === selectedCategory) || displayEstimates[0];
  const isAmharic = language === 'am';

  return (
    <div className="relative h-[calc(100vh-68px)] w-full overflow-hidden bg-slate-100">
      {/* 100% Edge-to-Edge Full-Screen Interactive Addis Ababa Map (Visible on Both Screens) */}
      <div className="absolute inset-0 z-0 w-full h-full">
        <AddisMap
          pickup={pickup}
          destination={destination}
          drivers={simulatedCabs.length > 0 ? simulatedCabs : availableDrivers}
          activeDriverLocation={activeDriverPos || (activeRide?.driver ? [activeRide.driver.currentLat, activeRide.driver.currentLng] : undefined)}
          activeDriverHeading={activeDriverHeading || (activeRide?.driver?.heading || 0)}
          activeDriverPlate={activeRide?.driver?.vehiclePlate}
          routeCoordinates={activeRide?.routeCoordinates || routeCoordinates}
          onMapClick={handleMapClick}
          pickingMode={mapPickingMode}
          onCancelPicking={() => setMapPickingMode(null)}
          isSearching={activeRide?.status === 'REQUESTED'}
        />
      </div>

      {!activeRide ? (
        /* Screen 1: Booking & Route Selection Floating Panel */
        <div className="absolute top-3 bottom-3 left-3 w-[calc(100%-24px)] sm:w-[420px] xl:w-[440px] frosted-glass rounded-3xl border border-white/70 shadow-2xl z-20 flex flex-col overflow-hidden backdrop-blur-xl">
          {/* Top Destination Selector */}
          <div className="p-4 border-b border-slate-200/50 space-y-3 bg-white/60 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse" />
              {t.whereTo}
            </h2>
            {/* Sleek, consolidated utility toolbar */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowWalletModal(true)}
                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-2xs cursor-pointer"
                title="Chebelew Passenger Wallet"
              >
                <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {passengerWalletBalance !== null ? `${passengerWalletBalance.toFixed(0)} Br` : 'Wallet'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setShowOnboardingModal(true)}
                className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center transition shadow-2xs cursor-pointer"
                title={language === 'am' ? 'የተሳፋሪ መገለጫ ይመዝገቡ' : 'Onboard Profile'}
              >
                <UserPlus className="w-3.5 h-3.5 text-brand-600" />
              </button>
              <button
                type="button"
                onClick={loadHistory}
                className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center transition shadow-2xs cursor-pointer"
                title={t.tripHistory}
              >
                <History className="w-3.5 h-3.5 text-slate-600" />
              </button>
              <button
                type="button"
                onClick={() => setShowSupportModal(true)}
                className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center transition shadow-2xs cursor-pointer"
                title={t.supportHelp}
              >
                <HelpCircle className="w-3.5 h-3.5 text-slate-600" />
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

        {/* Content based on Delivery Mode or Booking Mode */}
        {riderMode === 'deliveries' ? (
          <div className="p-5 flex-1 overflow-y-auto no-scrollbar">
            <RiderDeliveryPanel
              currentRiderId={currentRiderId}
              currentRiderName={currentRiderName}
              currentRiderPhone={currentRiderPhone}
              pickup={pickup}
              destination={destination}
              language={language}
            />
          </div>
        ) : (
          <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between overflow-y-auto no-scrollbar">
            <div className="space-y-2.5">
              {/* Vehicle Category Selector (Yango Style - Visible & Selectable in 1-Tap) */}
              <div className="space-y-1.5">
                {displayEstimates.map((est) => {
                  const isSelected = selectedCategory === est.category;
                  return (
                    <button
                      key={est.category}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(est.category as VehicleCategory);
                        const matchingOffer = marketplaceOffers.find(
                          (o) => o.providerId === 'chebelew' && o.vehicleCategory === est.category
                        );
                        if (matchingOffer) setSelectedOfferId(matchingOffer.id);
                      }}
                      className={`w-full p-2.5 rounded-2xl border-2 transition-all flex items-center justify-between text-left cursor-pointer group ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/80 shadow-xs ring-2 ring-amber-500/20'
                          : 'border-slate-200/80 bg-white/90 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition shadow-2xs ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 font-black'
                              : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                          }`}
                        >
                          <Car className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-xs text-slate-900">{est.displayName}</span>
                            {isSelected ? (
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full border border-emerald-200">
                                0% Fee
                              </span>
                            ) : (
                              <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.2 rounded-full">
                                {est.capacity} seats
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span>⏱️ ~{est.etaMinutes || 3}m away</span>
                            <span>•</span>
                            <span>{est.category === 'comfort' ? 'VIP A/C' : est.category === 'minivan' ? 'Luggage & 7 Seats' : 'Fast Sedan'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-2">
                        <div>
                          <div className="text-sm font-black text-slate-900 font-mono">
                            {est.fare.totalFare.toFixed(0)} <span className="text-[10px] font-semibold text-slate-500">ETB</span>
                          </div>
                          <span className="text-[9px] text-slate-400 block font-medium">Fixed Upfront</span>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Yango-Level Collapsible: 5 Fleet Quotes & Algorithmic Ranking */}
              <div className="rounded-2xl border border-slate-200/90 bg-white/90 backdrop-blur-md shadow-xs overflow-hidden transition-all duration-300">
                <button
                  type="button"
                  onClick={() => setIsOffersExpanded(!isOffersExpanded)}
                  className="w-full p-2.5 flex items-center justify-between text-left hover:bg-slate-50 transition cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-xs">
                      <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-900">
                          {isAmharic ? 'የታክሲ ማህበራት ዋጋ ንፅፅር' : 'Compare 5 Fleet Quotes'}
                        </span>
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.2 rounded-full border border-emerald-200">
                          Best: {marketplaceOffers[0]?.estimatedFare || 185} ETB
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Meter Cab • Municipal Co-op • 0% Direct Match
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-brand-700 bg-brand-50 group-hover:bg-brand-100 px-2 py-0.5 rounded-lg border border-brand-200/80 transition">
                    <span>{isOffersExpanded ? (isAmharic ? 'አሳጥር' : 'Fold') : (isAmharic ? 'ንፅፅር' : 'Compare')}</span>
                    {isOffersExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </div>
                </button>

                {isOffersExpanded && (
                  <div className="p-3 pt-1 border-t border-slate-100 space-y-2 animate-fade-in bg-slate-50/50">
                    <div className="grid grid-cols-4 gap-1 p-1 bg-slate-200/70 rounded-xl text-[10px] font-bold text-center">
                      {[
                        { mode: 'best_value', label: isAmharic ? 'ምርጥ' : 'Best' },
                        { mode: 'cheapest', label: isAmharic ? 'ቅናሽ' : 'Cheap' },
                        { mode: 'fastest_pickup', label: isAmharic ? 'ፈጣን' : 'Fast' },
                        { mode: 'premium_comfort', label: isAmharic ? 'ምቾት' : 'Comfort' },
                      ].map((item) => (
                        <button
                          key={item.mode}
                          type="button"
                          onClick={() => setComparisonMode(item.mode as any)}
                          className={`py-1 rounded-lg transition ${
                            comparisonMode === item.mode
                              ? 'bg-white text-slate-900 shadow-xs font-black'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-1.5 max-h-44 overflow-y-auto no-scrollbar">
                      {marketplaceOffers.slice(0, 5).map((offer) => {
                        const isSelected = selectedOfferId === offer.id;
                        const isChebelew = offer.providerId === 'chebelew';
                        return (
                          <div
                            key={offer.id}
                            onClick={() => setSelectedOfferId(offer.id)}
                            className={`p-2 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'border-amber-500 bg-amber-50/80 shadow-xs ring-1 ring-amber-500/30'
                                : 'border-slate-200/80 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="text-xs font-black text-amber-500">★ {offer.driverRating || 4.8}</div>
                              <div>
                                <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                                  <span>{offer.providerName}</span>
                                  {isChebelew && (
                                    <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1 rounded">0% Fee</span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  ⏱️ ETA: {offer.estimatedPickupMinutes}m • 🏁 {offer.estimatedJourneyMinutes}m trip
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-mono font-black text-slate-900">
                                {offer.estimatedFare} <span className="text-[9px] font-semibold text-slate-500">ETB</span>
                              </div>
                              <div className="text-[9px] text-slate-400 font-medium">Score: {offer.scoreBreakdown?.totalOfferScore?.toFixed(0) || 85}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowCompareModal(true)}
                      className="w-full py-1 text-[11px] font-bold text-brand-600 hover:text-brand-700 text-center"
                    >
                      Open Full 4-Mode Offer Analyzer →
                    </button>
                  </div>
                )}
              </div>

              {/* Yango-Level Payment & Options Bar */}
              <div className="flex items-center gap-1.5 text-xs">
                {/* Payment Method Pill */}
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(true)}
                  className="flex-1 p-2 bg-white/90 hover:bg-white border border-slate-200/90 rounded-2xl flex items-center justify-between font-bold text-slate-800 transition shadow-2xs cursor-pointer group"
                  title="Select Payment Method"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <CreditCard className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-left">
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Payment</span>
                      <span className="text-xs font-extrabold text-slate-900 line-clamp-1">
                        {paymentMethod === 'TELEBIRR'
                          ? 'Telebirr (1,058 Br)'
                          : paymentMethod === 'CASH'
                          ? 'Cash to Driver'
                          : paymentMethod === 'BANK_TRANSFER'
                          ? 'CBE Birr / Bank'
                          : 'Corporate'}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                </button>

                {/* Ride Comfort & Options */}
                <button
                  type="button"
                  onClick={() => setShowComfortModal(true)}
                  className="p-2 bg-white/90 hover:bg-white border border-slate-200/90 rounded-2xl flex items-center gap-1.5 font-bold text-slate-700 transition shadow-2xs cursor-pointer"
                  title="Ride Comfort Preferences & Silent Trip"
                >
                  <Sliders className="w-4 h-4 text-brand-600" />
                  <span className="hidden sm:inline">Options</span>
                </button>

                {/* Schedule Advance Trip */}
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(true)}
                  className="p-2 bg-white/90 hover:bg-white border border-slate-200/90 rounded-2xl flex items-center gap-1.5 font-bold text-slate-700 transition shadow-2xs cursor-pointer"
                  title="Schedule Trip & Flight Tracking"
                >
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span className="hidden sm:inline">Schedule</span>
                </button>
              </div>
            </div>

            {/* Bottom Booking CTA & Micro-Trust Bar */}
            <div className="pt-2 space-y-2 border-t border-slate-200/60">
              <button
                type="button"
                onClick={handleRequestRide}
                disabled={isCalculating}
                onMouseEnter={() => setIsCtaHovered(true)}
                onMouseLeave={() => setIsCtaHovered(false)}
                className="w-full relative group overflow-hidden bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 active:scale-[0.99] text-slate-950 font-black py-3.5 px-4 rounded-2xl text-sm flex items-center justify-between shadow-xl shadow-amber-500/25 transition-all duration-300 disabled:opacity-60 cursor-pointer"
              >
                {/* Glowing shimmer reflection */}
                <div className="absolute inset-0 bg-white/25 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out pointer-events-none" />

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-950 text-white flex items-center justify-center shadow-xs">
                    <Car className="w-4 h-4 text-amber-400 fill-amber-400" />
                  </div>
                  <span className="tracking-tight font-black text-sm text-slate-950">
                    {isAmharic
                      ? `${selectedEstimate?.displayName || 'ስታንዳርድ'} እዘዝ`
                      : `Request ${selectedEstimate?.displayName || 'Standard'}`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-black text-slate-950">
                    {selectedEstimate?.fare.totalFare.toFixed(0) || 192} ETB
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-950 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>

              {/* Ultra-Clean Micro-Trust Line */}
              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 font-medium">
                <span className="flex items-center gap-1 text-emerald-600 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  0% Commission
                </span>
                <span>•</span>
                <span>100% to Driver</span>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setShowTaxModal(true)}
                  className="text-brand-600 hover:text-brand-700 underline font-semibold flex items-center gap-0.5 cursor-pointer"
                >
                  <span>VAT 570/2025</span>
                  <Info className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    ) : (
        /* Screen 2: Active Ride Live HUD Floating Over Full-Screen Map */
        <div className={`absolute top-3 left-3 right-3 sm:right-auto sm:w-[400px] xl:w-[420px] z-20 frosted-glass rounded-3xl border border-white/80 shadow-2xl overflow-hidden animate-slide-up flex flex-col transition-all duration-300 backdrop-blur-xl ${
          isHudMinimized ? 'max-h-auto' : 'max-h-[calc(100%-24px)]'
        }`}>
          {/* Live HUD Header with Minimize / Expand toggle */}
          <div className="p-3.5 bg-slate-900/95 text-white flex items-center justify-between border-b border-slate-800 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                {activeRide.status === 'REQUESTED'
                  ? (isAmharic ? 'አቅራቢያ ያሉ ታክሲዎችን በመፈለግ ላይ...' : 'Connecting Nearby Taxis...')
                  : activeRide.status === 'ASSIGNED'
                  ? (isAmharic ? 'አሽከርካሪ ወደ እርስዎ እየመጣ ነው' : 'Driver Heading to You')
                  : activeRide.status === 'ARRIVED'
                  ? (isAmharic ? 'አሽከርካሪ ደርሷል (ይሳፈሩ)' : 'Driver Arrived (Board Now)')
                  : activeRide.status === 'IN_PROGRESS'
                  ? (isAmharic ? 'ጉዞ በሂደት ላይ' : 'Trip in Progress')
                  : activeRide.status === 'COMPLETED'
                  ? (isAmharic ? 'ጉዞው ተጠናቋል' : 'Trip Completed')
                  : activeRide.status}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsHudMinimized(!isHudMinimized)}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold text-slate-200 flex items-center gap-1 transition cursor-pointer"
              title={isHudMinimized ? "Expand Ride Details" : "Minimize to View Full Map"}
            >
              {isHudMinimized ? (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Expand ▴</span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Map View ▾</span>
                </>
              )}
            </button>
          </div>

          {/* Minimized Pill */}
          {isHudMinimized ? (
            <div
              onClick={() => setIsHudMinimized(false)}
              className="p-3 bg-white/95 text-xs font-bold flex items-center justify-between cursor-pointer hover:bg-white transition"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shadow">
                  {activeRide.driver?.fullName ? activeRide.driver.fullName.charAt(0) : '🚗'}
                </div>
                <div>
                  <div className="font-extrabold text-slate-900 text-xs">
                    {activeRide.driver?.fullName || (isAmharic ? 'አሽከርካሪ' : 'Driver')}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {activeRide.driver?.vehiclePlate || 'ETA ~3 mins'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono font-black text-emerald-700 text-sm">
                  {activeRide.fare.totalFare.toFixed(0)} ETB
                </div>
                <span className="text-[10px] text-brand-600 font-bold underline">Tap to view</span>
              </div>
            </div>
          ) : (
            /* Full Live HUD Content */
            <div className="p-4 space-y-4 overflow-y-auto no-scrollbar flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Uber/Yango Radar Search Animation & Realistic Available Cabs Live Telemetry */}
              {activeRide.status === 'REQUESTED' ? (
                <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 text-white p-5 rounded-2xl shadow-2xl relative overflow-hidden space-y-4">
                  {/* Ambient background glow */}
                  <div className="absolute -top-16 -right-16 w-36 h-36 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

                  {/* Concentric Animated Radar Rings */}
                  <div className="relative w-28 h-28 mx-auto flex items-center justify-center my-1">
                    <div className="absolute inset-0 rounded-full border border-brand-500/30 animate-ping opacity-75" />
                    <div className="absolute w-20 h-20 rounded-full border-2 border-brand-400/40 animate-pulse" />
                    <div className="absolute w-14 h-14 rounded-full bg-brand-500/20 flex items-center justify-center" />
                    <div className="relative z-10 w-11 h-11 rounded-full bg-brand-500 shadow-lg shadow-brand-500/50 flex items-center justify-center text-white">
                      <Car className="w-5 h-5 animate-bounce" />
                    </div>
                  </div>

                  <div className="text-center">
                    <h3 className="font-extrabold text-base text-white">Connecting with nearby taxis...</h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-[320px] mx-auto">
                      Broadcasting ride request to certified Chebelew drivers near{' '}
                      <span className="text-brand-300 font-semibold">{pickup.address.split(',')[0]}</span>
                    </p>
                  </div>

                  {/* Realistic Available Cabs around Hailed Location Feed */}
                  <div className="space-y-2 pt-1 text-left">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium px-1">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{simulatedCabs.length || 5} certified cabs receiving broadcast</span>
                      </span>
                      <span className="font-mono text-[10px] text-brand-300">Radius: 1.2 km</span>
                    </div>

                    <div className="space-y-1.5 max-h-44 overflow-y-auto no-scrollbar">
                      {simulatedCabs.slice(0, 3).map((cab) => (
                        <div
                          key={cab.id}
                          className="flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-xs transition"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-brand-500/20 border border-brand-400/40 flex items-center justify-center text-brand-300 shrink-0">
                              <Car className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="font-bold text-white text-[11px] flex items-center gap-1.5">
                                <span>{cab.fullName.split(' ')[0]}</span>
                                <span className="font-mono text-[10px] text-slate-400">({cab.vehiclePlate})</span>
                              </div>
                              <div className="text-[10px] text-slate-300">
                                {cab.vehicleMake} {cab.vehicleModel} • ★{cab.rating}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                              {cab.distanceMeters || 320}m
                            </span>
                            <span className="block text-[9px] text-slate-400">Pinging...</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Match ETA & Animated Progress Bar */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-brand-300 px-1">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 animate-spin" />
                        <span>Estimated match: ~1-2 mins</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {Math.min(100, Math.round((searchElapsedSeconds / 5.5) * 100))}%
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-brand-500 to-emerald-400 h-full rounded-full transition-all duration-1000 ease-linear"
                        style={{ width: `${Math.min(100, Math.round((searchElapsedSeconds / 5.5) * 100))}%` }}
                      />
                    </div>
                  </div>

                  {/* Cancel Button */}
                  <button
                    type="button"
                    onClick={handleCancelRide}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-white/10 hover:bg-white/15 transition border border-white/10 flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel Request (0 ETB Fee)</span>
                  </button>
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

              {/* Yango-Level Collapsible Trip Fare Breakdown */}
              <div className="rounded-xl border border-slate-200/90 bg-white/95 overflow-hidden transition-all shadow-2xs">
                <button
                  type="button"
                  onClick={() => setIsTripDetailsExpanded(!isTripDetailsExpanded)}
                  className="w-full p-3 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer"
                >
                  <div className="text-left">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Fare Breakdown</span>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-slate-900 font-mono">
                        {activeRide.fare.totalFare.toFixed(2)} ETB
                      </span>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">
                        0% Commission
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                    <span>{isTripDetailsExpanded ? 'Hide' : 'Details'}</span>
                    {isTripDetailsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </div>
                </button>

                {isTripDetailsExpanded && (
                  <div className="p-3 pt-1 border-t border-slate-100 space-y-1.5 text-[11px] animate-fade-in bg-slate-50/50">
                    <div className="flex justify-between text-slate-600">
                      <span>Base Pickup Fare</span>
                      <span className="font-mono">{activeRide.fare.baseFare?.toFixed(2) || '100.00'} ETB</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Distance ({activeRide.fare.distanceKm?.toFixed(1) || 6.2} km)</span>
                      <span className="font-mono">{activeRide.fare.distanceFare?.toFixed(2) || '62.00'} ETB</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Time ({activeRide.fare.durationMinutes || 14} mins)</span>
                      <span className="font-mono">{activeRide.fare.timeFare?.toFixed(2) || '30.00'} ETB</span>
                    </div>
                    <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
                      <span>Subtotal</span>
                      <span className="font-mono">{activeRide.fare.subtotal?.toFixed(2) || '192.00'} ETB</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>15% VAT (Reg 570/2025 Included)</span>
                      <span className="font-mono">{activeRide.fare.vatAmount?.toFixed(2) || '28.80'} ETB</span>
                    </div>
                    <div className="flex justify-between text-slate-900 font-extrabold pt-1 border-t border-slate-300">
                      <span>Total Fare</span>
                      <span className="font-mono">{activeRide.fare.totalFare.toFixed(2)} ETB</span>
                    </div>
                  </div>
                )}
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
              {activeRide.paymentStatus !== 'PAID' && (
                <button
                  onClick={() => setShowRoutedPaymentModal(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-md"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-200" />
                  <span>
                    Pay Now (Direct Driver Rails / Wallet / Telebirr) • {activeRide.fare.totalFare.toFixed(2)} ETB
                  </span>
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
    )}

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

      {/* Advanced Routed Payment Modal (Direct Driver Rails vs Platform Escrow + Wallet) */}
      {activeRide && (
        <RoutedPaymentModal
          ride={activeRide}
          isOpen={showRoutedPaymentModal}
          userId={currentRiderId}
          userPhone={currentRiderPhone}
          onSuccess={(audit) => {
            setShowRoutedPaymentModal(false);
            setActiveRide({
              ...activeRide,
              paymentStatus: 'PAID',
            });
            setShowReceiptModal(true);
          }}
          onClose={() => setShowRoutedPaymentModal(false)}
          onOpenWalletModal={() => {
            setShowRoutedPaymentModal(false);
            setShowWalletModal(true);
          }}
        />
      )}

      {/* Passenger Wallet Modal (Multi-Rail Top Up & Balance) */}
      <PassengerWalletModal
        userId={currentRiderId}
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onBalanceUpdated={(balance) => setPassengerWalletBalance(balance)}
      />

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
      {/* Comfort Preferences Modal (Workstream 5) */}
      {showComfortModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-brand-500" />
                <h3 className="font-bold text-sm text-slate-800">
                  {language === 'am' ? 'የተሳፋሪ ምቾት ምርጫዎች' : 'Passenger Comfort Preferences'}
                </h3>
              </div>
              <button onClick={() => setShowComfortModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <Wind className="w-4 h-4 text-sky-500" />
                  <div>
                    <span className="font-bold text-slate-800 block">Air Conditioning (A/C)</span>
                    <span className="text-[10px] text-slate-500">Ensure cabin cooling is active upon pickup</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={comfortPreferences.acRequired}
                  onChange={(e) => setComfortPreferences({ ...comfortPreferences, acRequired: e.target.checked })}
                  className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <VolumeX className="w-4 h-4 text-violet-500" />
                  <div>
                    <span className="font-bold text-slate-800 block">Quiet Ride</span>
                    <span className="text-[10px] text-slate-500">Low audio volume & minimal driver conversation</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={comfortPreferences.quietRide}
                  onChange={(e) => setComfortPreferences({ ...comfortPreferences, quietRide: e.target.checked })}
                  className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <Luggage className="w-4 h-4 text-amber-500" />
                  <div>
                    <span className="font-bold text-slate-800 block">Extra Luggage Space</span>
                    <span className="text-[10px] text-slate-500">Trunk room for 3+ bags or airport suitcases</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={comfortPreferences.extraLuggage}
                  onChange={(e) => setComfortPreferences({ ...comfortPreferences, extraLuggage: e.target.checked })}
                  className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <div>
                    <span className="font-bold text-slate-800 block">Female Driver Preference</span>
                    <span className="text-[10px] text-slate-500">Prioritize vetted female driver if available nearby</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={comfortPreferences.femaleDriverPreference}
                  onChange={(e) => setComfortPreferences({ ...comfortPreferences, femaleDriverPreference: e.target.checked })}
                  className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
                />
              </label>

              <div className="pt-1">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Cabin Temperature</label>
                <div className="grid grid-cols-3 gap-2 text-center font-bold">
                  {(['cool', 'normal', 'warm'] as const).map((temp) => (
                    <button
                      key={temp}
                      type="button"
                      onClick={() => setComfortPreferences({ ...comfortPreferences, temperaturePreference: temp })}
                      className={`py-1.5 rounded-lg border text-xs capitalize ${
                        comfortPreferences.temperaturePreference === temp
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      {temp}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleSavePreferences(comfortPreferences)}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm"
            >
              Save Preferences
            </button>
          </div>
        </div>
      )}

      {/* Scheduled Rides & Airport Transfer Modal (Workstream 5) */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Plane className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-800">
                  {language === 'am' ? 'ቀጠሮ እና አየር ማረፊያ ጉዞ' : 'Schedule Ride / Airport Transfer'}
                </h3>
              </div>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {scheduleSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-bold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{scheduleSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateScheduledRide} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pickup Date</label>
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2 font-mono text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pickup Time</label>
                  <input
                    type="time"
                    required
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2 font-mono text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 space-y-2">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <Plane className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Bole International Airport Details (Optional)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-600 font-medium block">Flight Number</label>
                    <input
                      type="text"
                      placeholder="e.g. ET-500"
                      value={flightNumber}
                      onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                      className="w-full border border-slate-300 rounded-lg p-1.5 font-mono text-xs uppercase focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 font-medium block">Terminal</label>
                    <select
                      value={airportTerminal}
                      onChange={(e) => setAirportTerminal(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-1.5 text-xs bg-white focus:outline-none"
                    >
                      <option value="Terminal 2 International">Terminal 2 (International)</option>
                      <option value="Terminal 1 Domestic">Terminal 1 (Domestic)</option>
                      <option value="VIP Lounge / Cargo">VIP / Diplomatic</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Recurrence</label>
                <div className="grid grid-cols-3 gap-2 text-center font-bold">
                  {(['once', 'daily', 'weekly'] as const).map((rec) => (
                    <button
                      key={rec}
                      type="button"
                      onClick={() => setRecurrenceType(rec)}
                      className={`py-1.5 rounded-lg border text-xs capitalize ${
                        recurrenceType === rec
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      {rec === 'once' ? 'One-Time' : rec}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition shadow-sm"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Intelligent Multi-Provider Quotes Comparison Modal */}
      {showCompareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 shadow-2xl border border-slate-200/80 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {isAmharic ? 'የአቅራቢዎች ንፅፅር' : 'Compare Taxi Network Quotes'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isAmharic ? '4-ደረጃ ስልታዊ ንፅፅር እና ፈቃድ ያላቸው ታክሲዎች' : '4-Mode algorithmic ranking across authorized networks'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCompareModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 4-Mode Filter Tabs */}
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
              {[
                { mode: 'best_value', label: isAmharic ? 'ምርጥ ዋጋ' : 'Best Value' },
                { mode: 'cheapest', label: isAmharic ? 'ቅናሽ' : 'Cheapest' },
                { mode: 'fastest_pickup', label: isAmharic ? 'ፈጣን' : 'Fastest' },
                { mode: 'premium_comfort', label: isAmharic ? 'ምቾት' : 'Comfort' },
              ].map((item) => (
                <button
                  key={item.mode}
                  type="button"
                  onClick={() => setComparisonMode(item.mode as any)}
                  className={`py-1.5 rounded-lg transition text-center cursor-pointer ${
                    comparisonMode === item.mode
                      ? 'bg-white text-brand-700 shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Provider List */}
            <div className="space-y-2">
              {marketplaceOffers.map((offer) => {
                const isSelected = selectedOfferId === offer.id;
                const isChebelew = offer.providerId === 'chebelew';

                return (
                  <div
                    key={offer.id}
                    onClick={() => {
                      if (offer.isAvailable) {
                        setSelectedOfferId(offer.id);
                        if (isChebelew) setSelectedCategory('sedan');
                        setShowCompareModal(false);
                      }
                    }}
                    className={`p-3.5 rounded-2xl border-2 transition cursor-pointer flex items-center justify-between ${
                      !offer.isAvailable
                        ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
                        : isSelected
                        ? 'bg-brand-50/70 border-brand-500 shadow-sm ring-1 ring-brand-500/20'
                        : 'bg-white border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-xs ${
                          isChebelew ? 'bg-brand-500 text-white' : 'bg-slate-700 text-white'
                        }`}
                      >
                        {isChebelew ? 'ቼ' : (offer.providerName.charAt(0) || 'P')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-slate-900">
                            {offer.providerName}
                          </span>
                          {isChebelew && (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">
                              0% FEE
                            </span>
                          )}
                          {offer.driverRating && (
                            <span className="text-[11px] text-amber-600 font-bold">
                              ★ {offer.driverRating.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>⏱️ ~{offer.estimatedPickupMinutes}m pickup</span>
                          <span>•</span>
                          <span>🏁 {offer.estimatedJourneyMinutes}m trip</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-black text-slate-900 font-mono">
                        {offer.estimatedFare.toFixed(0)}{' '}
                        <span className="text-[10px] font-semibold text-slate-500">ETB</span>
                      </div>
                      <span className="text-[9px] text-slate-400 block font-medium">
                        {offer.isConfirmedPrice ? 'Fixed Price' : 'Estimated Meter'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowCompareModal(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Rail Selector Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">{t.paymentMethod}</h3>
                  <p className="text-[11px] text-slate-500">100% Direct driver payout rails</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('TELEBIRR');
                  setShowPaymentModal(false);
                }}
                className={`w-full p-3.5 rounded-2xl border-2 flex items-center justify-between text-left transition cursor-pointer ${
                  paymentMethod === 'TELEBIRR'
                    ? 'border-[#0070ba] bg-blue-50/70 shadow-xs'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#0070ba] flex items-center justify-center">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-xs text-slate-900 block">{t.telebirr}</span>
                    <span className="text-[11px] text-slate-500">Official Ethio Telecom Gateway</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {passengerWalletBalance !== null ? `${passengerWalletBalance.toFixed(0)} Br` : 'Active'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('CASH');
                  setShowPaymentModal(false);
                }}
                className={`w-full p-3.5 rounded-2xl border-2 flex items-center justify-between text-left transition cursor-pointer ${
                  paymentMethod === 'CASH'
                    ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-xs text-slate-900 block">{t.cash}</span>
                    <span className="text-[11px] text-slate-500">Direct physical payment to driver</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-500">0% Comm.</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('BANK_TRANSFER');
                  setShowPaymentModal(false);
                }}
                className={`w-full p-3.5 rounded-2xl border-2 flex items-center justify-between text-left transition cursor-pointer ${
                  paymentMethod === 'BANK_TRANSFER'
                    ? 'border-purple-600 bg-purple-50/70 shadow-xs'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-xs text-slate-900 block">CBE Birr / Bank</span>
                    <span className="text-[11px] text-slate-500">Direct account-to-account transfer</span>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('CORPORATE_BILLING');
                  setShowPaymentModal(false);
                }}
                className={`w-full p-3.5 rounded-2xl border-2 flex items-center justify-between text-left transition cursor-pointer ${
                  paymentMethod === 'CORPORATE_BILLING'
                    ? 'border-amber-600 bg-amber-50/70 shadow-xs'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-xs text-slate-900 block">Corporate Fleet</span>
                    <span className="text-[11px] text-slate-500">Ethiopian Airlines Fleet Account</span>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FDRE Regulation 570/2025 Tax & 0% Commission Policy Modal */}
      {showTaxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Tax Law & 0% Guarantee</h3>
                  <p className="text-[11px] text-slate-500">FDRE Reg. No. 570/2025 Compliant</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTaxModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900">
                <span className="font-bold block mb-1">🛡️ 0% Platform Commission Guarantee</span>
                <p className="text-[11px]">
                  Chebelew charges 0% commission on independent rides. 100% of the net fare goes directly to the driver via verified Ethiopian payment rails.
                </p>
              </div>

              {selectedEstimate && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Base Fare Subtotal:</span>
                    <span className="font-bold text-slate-800">{selectedEstimate.fare.subtotal.toFixed(2)} ETB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">+ 15% VAT (Reg 570/2025):</span>
                    <span className="font-bold text-emerald-700">{selectedEstimate.fare.vatAmount.toFixed(2)} ETB</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 text-xs font-black text-slate-900">
                    <span>Total Upfront Price:</span>
                    <span>{selectedEstimate.fare.totalFare.toFixed(2)} ETB</span>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowTaxModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition"
            >
              Understood
            </button>
          </div>
        </div>
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
