// ============================================================================
// CHEBELEW MULTI-COUNTRY MOBILITY & DELIVERY ECOSYSTEM - SHARED DOMAIN TYPES
// Specification: Version 2.0 (Master Development Execution Order)
// ============================================================================

export type UserRole =
  | 'super_admin'
  | 'platform_admin'
  | 'country_admin'
  | 'city_manager'
  | 'dispatcher'
  | 'finance_officer'
  | 'compliance_officer'
  | 'safety_officer'
  | 'support_agent'
  | 'fleet_manager'
  | 'corporate_admin'
  | 'regulator'
  | 'driver'
  | 'courier'
  | 'rider';

export type Language = 'en' | 'am' | 'om' | 'ti' | 'so' | 'sw';

export type VehicleCategory =
  | 'sedan'
  | 'minivan'
  | 'comfort'
  | 'partner_ride'
  | 'partner_feres'
  | 'delivery_moto'
  | 'delivery_van';

export type KycStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export type RideStatus =
  | 'REQUESTED'
  | 'ASSIGNED'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type DeliveryStatus =
  | 'REQUESTED'
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED';

export type PaymentMethod = 'CASH' | 'TELEBIRR' | 'BANK_TRANSFER' | 'CORPORATE_BILLING' | 'CARD';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export type SubscriptionBillingPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type SubscriptionStatus = 'active' | 'expired' | 'grace_period' | 'cancelled';

// ----------------------------------------------------------------------------
// Core User & Identity
// ----------------------------------------------------------------------------
export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  role: UserRole;
  language: Language;
  countryCode: string;
  avatarUrl?: string;
  isVerified: boolean;
  corporateId?: string;
  fleetId?: string;
  createdAt: string;
}

// ----------------------------------------------------------------------------
// Country & Multi-Tenant Configuration
// ----------------------------------------------------------------------------
export interface CountryConfig {
  countryCode: string; // e.g. "ET", "KE"
  countryName: string; // "Ethiopia", "Kenya"
  currency: string; // "ETB", "KES"
  currencySymbol: string; // "Br", "KSh"
  phonePrefix: string; // "+251", "+254"
  defaultLanguage: Language;
  supportedLanguages: Language[];
  vatRate: number; // 0.15 for Ethiopia (Reg. No. 570/2025)
  taxAuthorityName: string; // "FDRE Ministry of Revenues"
  emergencyPoliceNumber: string; // "991"
  emergencySupportNumber: string; // "9922"
  isActive: boolean;
}

// ----------------------------------------------------------------------------
// Driver & Subscription Model (Founder Mandate: 0% Trip Commission)
// ----------------------------------------------------------------------------
export interface SubscriptionPlan {
  id: string;
  name: string;
  nameAm: string;
  nameOm?: string;
  nameTi?: string;
  billingPeriod: SubscriptionBillingPeriod;
  durationDays: number;
  priceAmount: number;
  currency: string;
  countryCode: string;
  cityCode: string;
  vehicleCategory: VehicleCategory;
  isActive: boolean;
  features: string[];
}

export interface DriverSubscription {
  id: string;
  driverId: string;
  planId: string;
  planName: string;
  billingPeriod: SubscriptionBillingPeriod;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  gracePeriodEndsAt?: string;
  autoRenew: boolean;
  amountPaid: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Driver {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  avatarUrl?: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  vehiclePlate: string;
  vehicleColor: string;
  vehicleCategory: VehicleCategory;
  licenseNumber: string;
  kycStatus: KycStatus;
  kycNotes?: string;
  isOnline: boolean;
  isBusy: boolean;
  currentLat: number;
  currentLng: number;
  heading?: number;
  rating: number;
  totalRides: number;
  walletBalanceEtb: number; // Gross fares accumulated
  subscriptionStatus: SubscriptionStatus;
  activeSubscriptionId?: string;
  subscriptionExpiresAt?: string;
  activeRideId?: string;
  activeDeliveryId?: string;
  fleetId?: string;
  countryCode: string;
  cityCode: string;
}

// ----------------------------------------------------------------------------
// Fare & Pricing Engine (100% Net Earnings Retention to Subscribed Driver)
// ----------------------------------------------------------------------------
export interface FareCalculation {
  baseFare: number;
  distanceKm: number;
  distanceFare: number;
  durationMinutes: number;
  timeFare: number;
  subtotal: number;
  vatRate: number; // 0.15 per Ethiopian Regulation No. 570/2025
  vatAmount: number;
  totalFare: number;
  platformTakeRate: number; // 0.00 for Subscribed Chebelew Independent Drivers!
  platformCommission: number; // 0.00 ETB
  telebirrFee: number;
  driverNetPayout: number; // Subtotal (100% fare retention to driver)
}

export interface FareEstimate {
  category: VehicleCategory;
  displayName: string;
  displayNameAm: string;
  description: string;
  descriptionAm: string;
  capacity: number;
  fare: FareCalculation;
  etaMinutes: number;
  isAggregatedPartner?: boolean;
  partnerName?: string;
}

export interface LocationPoint {
  address: string;
  addressAm?: string;
  lat: number;
  lng: number;
  landmark?: string;
}

// ----------------------------------------------------------------------------
// Rides & Trips
// ----------------------------------------------------------------------------
export interface Ride {
  id: string;
  riderId: string;
  riderName: string;
  riderPhone: string;
  driverId?: string;
  driver?: Driver;
  pickup: LocationPoint;
  destination: LocationPoint;
  vehicleCategory: VehicleCategory;
  distanceKm: number;
  durationMinutes: number;
  fare: FareCalculation;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: RideStatus;
  telebirrOrderId?: string;
  telebirrTransactionNo?: string;
  cancelReason?: string;
  cancelledBy?: 'rider' | 'driver' | 'admin';
  rating?: number;
  review?: string;
  tipAmount?: number;
  routeCoordinates?: [number, number][];
  currentDriverLocation?: [number, number];
  isManualDispatch?: boolean;
  operatorNotes?: string;
  corporateId?: string;
  countryCode: string;
  createdAt: string;
  updatedAt: string;
}

// ----------------------------------------------------------------------------
// Delivery & Logistics Subsystem
// ----------------------------------------------------------------------------
export type DeliveryPackageCategory = 'parcel' | 'document' | 'food' | 'grocery' | 'b2b';

export interface DeliveryOrder {
  id: string;
  senderId: string;
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  pickup: LocationPoint;
  dropoff: LocationPoint;
  category: DeliveryPackageCategory;
  packageDescription: string;
  weightKg?: number;
  deliverySpeed: 'express' | 'standard' | 'scheduled';
  scheduledTime?: string;
  priceEtb: number;
  vatEtb: number;
  totalEtb: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  courierId?: string;
  courier?: Driver;
  status: DeliveryStatus;
  pickupOtp: string;
  dropoffOtp: string;
  proofOfDeliveryPhotoUrl?: string;
  recipientSignatureUrl?: string;
  trackingCoordinates?: [number, number][];
  createdAt: string;
  updatedAt: string;
}

// ----------------------------------------------------------------------------
// Corporate Transportation Platform
// ----------------------------------------------------------------------------
export interface CorporateAccount {
  id: string;
  companyName: string;
  registrationNumber: string;
  tinNumber: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  creditLimitEtb: number;
  spentThisMonthEtb: number;
  billingCycle: 'monthly' | 'bi-weekly';
  status: 'active' | 'suspended';
  countryCode: string;
  createdAt: string;
}

export interface CorporateEmployee {
  id: string;
  corporateId: string;
  name: string;
  phone: string;
  email: string;
  department: string;
  monthlyAllowanceEtb: number;
  spentThisMonthEtb: number;
  isActive: boolean;
}

// ----------------------------------------------------------------------------
// Fleet Management Platform
// ----------------------------------------------------------------------------
export interface Fleet {
  id: string;
  ownerUserId: string;
  fleetName: string;
  registrationNumber: string;
  contactPhone: string;
  totalVehicles: number;
  totalDrivers: number;
  countryCode: string;
  cityCode: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

// ----------------------------------------------------------------------------
// Aggregator Provider Integrations
// ----------------------------------------------------------------------------
export type AggregatorProviderId = 'chebelew' | 'ride' | 'feres' | 'zayride' | 'yango';
export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface TariffRate {
  category: VehicleCategory;
  baseFare: number;
  perKm: number;
  perMinute: number;
  minFare: number;
  waitingPerMinute: number;
  nightMultiplier: number;
  peakMultiplier: number;
  airportSurcharge: number;
  cancellationFee: number;
  capacity: number;
  displayName: string;
  displayNameAm: string;
  description: string;
  descriptionAm: string;
  updatedAt?: string;
}

export interface SystemSettings {
  vatRate: number;
  taxAuthorityName: string;
  vatRegulationReference: string;
  driverCommissionPercent: number;
  telebirrGatewayFeePercent: number;
  maxDispatchRadiusKm: number;
  driverAcceptanceTimeoutSec: number;
  freeCancellationWindowMin: number;
  driverFreeWaitTimeMin: number;
  emergencyPoliceHotline: string;
  customerSupportHotline: string;
  ambulanceHotline: string;
  subDailyPriceEtb: number;
  subWeeklyPriceEtb: number;
  subMonthlyPriceEtb: number;
  subQuarterlyPriceEtb: number;
  subYearlyPriceEtb: number;
  subGracePeriodHours: number;
}

export interface ProviderAdapterConfig {
  id: AggregatorProviderId;
  name: string;
  apiUrl: string;
  apiKey?: string;
  webhookSecret?: string;
  dispatchMode?: 'polling' | 'webhook_push' | 'bidirectional';
  isEnabled?: boolean;
  circuitState: CircuitBreakerState;
  failureCount: number;
  lastFailureTime?: string;
  latencyMs?: number;
  markupPercent?: number;
  tariffMultiplier?: number;
  timeoutMs?: number;
  errorThreshold?: number;
  isAuthorized: boolean;
  integrationReadinessStatus: 'live_api' | 'sandbox_adapter' | 'onboarding_readiness';
  updatedAt?: string;
}

export interface ProviderRoutingLog {
  id: string;
  timestamp: string;
  pickupAddress: string;
  destinationAddress: string;
  vehicleCategory: VehicleCategory;
  providerId: AggregatorProviderId;
  providerName: string;
  estimatedFare: number;
  latencyMs: number;
  httpStatus: number;
  circuitState: CircuitBreakerState;
  actionStatus: 'OFFER_RETURNED' | 'CIRCUIT_TRIPPED' | 'TIMEOUT' | 'DISPATCHED' | 'HANDSHAKE_OK';
  details?: string;
}

export interface AggregatedTransportOffer {
  providerId: AggregatorProviderId;
  providerName: string;
  category: VehicleCategory;
  estimatedFare: number;
  currency: string;
  estimatedArrivalMins: number;
  journeyDurationMins: number;
  vehicleDetails: string;
  reliabilityScore: number;
  isAvailable: boolean;
  circuitStatus: CircuitBreakerState;
}

// ----------------------------------------------------------------------------
// Safety, Emergency & SOS Incident Management
// ----------------------------------------------------------------------------
export interface SosIncident {
  id: string;
  rideId?: string;
  deliveryId?: string;
  reporterUserId: string;
  reporterName: string;
  reporterPhone: string;
  reporterRole: 'rider' | 'driver' | 'courier';
  currentLat: number;
  currentLng: number;
  status: 'OPEN' | 'INVESTIGATING' | 'ESCALATED_POLICE' | 'RESOLVED';
  safetyNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

// ----------------------------------------------------------------------------
// Support, Tickets & Disputes
// ----------------------------------------------------------------------------
export interface SupportTicket {
  id: string;
  ride_id?: string;
  user_id: string;
  user_name: string;
  user_phone: string;
  user_role: 'rider' | 'driver' | 'courier';
  category: 'lost_item' | 'fare_dispute' | 'driver_behavior' | 'app_issue' | 'payment';
  subject: string;
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------------------
// Developer Ecosystem & API Keys
// ----------------------------------------------------------------------------
export interface DeveloperApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  hashedSecret: string;
  environment: 'live' | 'test';
  rateLimitPerMinute: number;
  isActive: boolean;
  createdAt: string;
  lastUsedAt?: string;
}

// ----------------------------------------------------------------------------
// Telebirr Digital Payment Integration
// ----------------------------------------------------------------------------
export interface TelebirrOrder {
  orderId: string;
  rideId?: string;
  subscriptionId?: string;
  deliveryId?: string;
  amountEtb: number;
  payerPhone: string;
  receiverTitle: string;
  subject: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  outTradeNo: string;
  transactionNo?: string;
  ussdPushCode?: string;
  qrPayload?: string;
  h5PaymentUrl?: string;
  createdAt: string;
  completedAt?: string;
}

// ----------------------------------------------------------------------------
// Reporting & Platform Metrics
// ----------------------------------------------------------------------------
export interface VatReportSummary {
  period: string;
  totalTripsCompleted: number;
  totalGrossGmvEtb: number;
  totalVatRemittableEtb: number; // 15% of gross fare
  totalSubscriptionRevenueEtb: number;
  totalPlatformCommissionEtb: number; // 0 for independent subscribed drivers
  totalDriverNetPayoutEtb: number;
  vatRegulationReference: string;
}

export interface SystemMetrics {
  activeDriversCount: number;
  onlineDriversCount: number;
  activeTripsCount: number;
  todayCompletedTrips: number;
  todayGmvEtb: number;
  todayVatCollectedEtb: number;
  todaySubscriptionRevenueEtb: number;
  activeDeliveriesCount: number;
  openSosCount: number;
  averageEtaMinutes: number;
  acceptanceRatePercent: number;
}
