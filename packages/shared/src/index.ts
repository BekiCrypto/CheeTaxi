// CheeTaxi — Shared domain types & DTOs used across web, mobile, and API.
// Mirrors the Prisma enums but framework-agnostic so Flutter / web / API can
// all consume the same contracts.

export const USER_ROLES = [
  'SUPER_ADMIN',
  'PLATFORM_ADMIN',
  'OPERATIONS',
  'FINANCE',
  'SUPPORT',
  'DISPATCHER',
  'COMPLIANCE',
  'SAFETY',
  'FRAUD',
  'MARKETING',
  'FLEET_MANAGER',
  'REGIONAL_MANAGER',
  'CITY_MANAGER',
  'REGULATOR',
  'DRIVER',
  'PASSENGER',
  'DEVELOPER',
  'AUDITOR',
  'READ_ONLY',
] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const TRIP_STATUSES = [
  'REQUESTED',
  'SEARCHING',
  'DRIVER_ASSIGNED',
  'DRIVER_ARRIVING',
  'DRIVER_ARRIVED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED_BY_PASSENGER',
  'CANCELLED_BY_DRIVER',
  'CANCELLED_BY_SYSTEM',
  'NO_DRIVER_FOUND',
] as const;
export type TripStatus = (typeof TRIP_STATUSES)[number];

export const TRIP_MODES = [
  'TAXI',
  'RIDE_SHARING',
  'MOTORCYCLE',
  'THREE_WHEELER',
  'COURIER',
  'FOOD_DELIVERY',
  'PARCEL',
  'MEDICAL',
  'TRUCK',
  'SCHEDULED',
  'AIRPORT',
  'CORPORATE',
  'SCHOOL',
  'RENTAL',
  'INTERCITY',
  'EMERGENCY',
] as const;
export type TripMode = (typeof TRIP_MODES)[number];

export const VEHICLE_TYPES = [
  'TAXI',
  'RIDE_SHARING',
  'MOTORCYCLE',
  'THREE_WHEELER',
  'COURIER',
  'FOOD_DELIVERY',
  'PARCEL',
  'MEDICAL',
  'TRUCK',
  'RENTAL',
  'INTERCITY',
  'EMERGENCY',
] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export const PAYMENT_METHODS = ['CASH', 'WALLET', 'CARD', 'CORPORATE_ACCOUNT', 'SUBSCRIPTION'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const SUBSCRIPTION_TIERS = [
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'QUARTERLY',
  'YEARLY',
  'CORPORATE_FLEET',
  'ENTERPRISE',
  'GOVERNMENT',
] as const;
export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number];

// ─── API DTOs ───────────────────────────────────────────────────────────────

export interface AuthSignupDto {
  phone: string;
  password?: string;
  firstName: string;
  lastName: string;
  email?: string;
  role?: UserRole;
  referralCode?: string;
}

export interface AuthLoginDto {
  identifier: string; // phone or email
  password?: string;
  otp?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserPublic {
  id: string;
  publicId: string;
  phone: string;
  email: string | null;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  role: UserRole;
  status: string;
  preferredLanguage: string;
  country: string;
  city: string | null;
  createdAt: string;
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface TripRequestDto {
  pickup: GeoPoint & { address?: string };
  dropoff: GeoPoint & { address?: string };
  stops?: Array<GeoPoint & { address?: string }>;
  mode: TripMode;
  vehicleType: VehicleType;
  paymentMethod: PaymentMethod;
  scheduledFor?: string;
  promoCode?: string;
  notes?: string;
  passengerCount?: number;
}

export interface TripQuote {
  tripId: string;
  estimate: {
    distanceMeters: number;
    durationSeconds: number;
    baseFare: number;
    distanceFare: number;
    timeFare: number;
    surgeMultiplier: number;
    promoDiscount: number;
    taxAmount: number;
    totalFare: number;
    currency: string;
  };
  eta: number; // minutes to pickup
  expiresAt: string;
}

export interface DriverLocationUpdate {
  driverId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speedKmh?: number;
  accuracyMeters?: number;
  timestamp: string;
}

export interface SubscriptionPurchaseDto {
  planCode: string;
  paymentMethod: PaymentMethod;
  autoRenew?: boolean;
  driverIds?: string[]; // for fleet plans
}

export interface WalletTopupDto {
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  provider: 'stripe' | 'chapa' | 'telebirr';
  returnUrl: string;
}

export interface SOSRequestDto {
  tripId?: string;
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  reason?: string;
}

// ─── WebSocket Events ───────────────────────────────────────────────────────

export const WS_EVENTS = {
  TRIP_REQUESTED: 'trip.requested',
  TRIP_ASSIGNED: 'trip.assigned',
  TRIP_ARRIVING: 'trip.arriving',
  TRIP_ARRIVED: 'trip.arrived',
  TRIP_STARTED: 'trip.started',
  TRIP_COMPLETED: 'trip.completed',
  TRIP_CANCELLED: 'trip.cancelled',
  DRIVER_LOCATION: 'driver.location',
  DRIVER_STATUS: 'driver.status',
  TRIP_OFFER: 'driver.offer',
  TRIP_OFFER_RESPONSE: 'driver.offer.response',
  NOTIFICATION: 'notification',
  SOS_TRIGGERED: 'sos.triggered',
  WALLET_UPDATED: 'wallet.updated',
} as const;
export type WsEventName = (typeof WS_EVENTS)[keyof typeof WS_EVENTS];

// ─── Constants ──────────────────────────────────────────────────────────────

export const SUPPORTED_LANGUAGES = [
  'en',
  'am',
  'om',
  'ti',
  'so',
  'ar',
  'fr',
  'sw',
  'pt',
] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const SUPPORTED_CURRENCIES = [
  { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br', country: 'ETHIOPIA' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', country: 'KENYA' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', country: 'NIGERIA' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵', country: 'GHANA' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', country: 'SOUTH_AFRICA' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', country: 'EGYPT' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'DH', country: 'MOROCCO' },
  { code: 'RWF', name: 'Rwandan Franc', symbol: 'RF', country: 'RWANDA' },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', country: 'TANZANIA' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', country: 'UGANDA' },
  { code: 'XOF', name: 'West African CFA Franc', symbol: 'CFA', country: 'SENEGAL' },
  { code: 'USD', name: 'US Dollar', symbol: '$', country: 'OTHER' },
] as const;

export const AFRICAN_COUNTRIES = [
  'ETHIOPIA', 'KENYA', 'NIGERIA', 'GHANA', 'SOUTH_AFRICA', 'EGYPT', 'MOROCCO',
  'RWANDA', 'TANZANIA', 'UGANDA', 'SENEGAL', 'IVORY_COAST', 'OTHER',
] as const;
