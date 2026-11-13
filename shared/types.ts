export type UserRole = 'rider' | 'driver' | 'admin' | 'dispatcher';
export type Language = 'am' | 'en';

export type VehicleCategory = 'sedan' | 'minivan' | 'comfort' | 'partner_ride' | 'partner_feres';

export type KycStatus = 'pending' | 'approved' | 'rejected';

export type RideStatus =
  | 'REQUESTED'
  | 'ASSIGNED'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentMethod = 'CASH' | 'TELEBIRR';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED';

export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  role: UserRole;
  language: Language;
  avatarUrl?: string;
  createdAt: string;
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
  vehiclePlate: string; // e.g., "ET-3-A12345"
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
  walletBalanceEtb: number;
  activeRideId?: string;
}

export interface FareCalculation {
  baseFare: number;
  distanceKm: number;
  distanceFare: number;
  durationMinutes: number;
  timeFare: number;
  subtotal: number;
  vatRate: number; // e.g. 0.15 for 15% VAT per Ethiopian Regulation No. 570/2025
  vatAmount: number;
  totalFare: number;
  platformTakeRate: number; // 0.15 for 15% platform commission
  platformCommission: number;
  telebirrFee: number;
  driverNetPayout: number;
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
  routeCoordinates?: [number, number][]; // [lat, lng][]
  currentDriverLocation?: [number, number];
  isManualDispatch?: boolean;
  operatorNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TelebirrOrder {
  orderId: string;
  rideId: string;
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

export interface VatReportSummary {
  period: string;
  totalTripsCompleted: number;
  totalGrossGmvEtb: number;
  totalVatRemittableEtb: number; // 15% of gross fare
  totalPlatformCommissionEtb: number; // 15% of gross fare
  totalDriverNetPayoutEtb: number;
  vatRegulationReference: string; // "Federal Democratic Republic of Ethiopia Regulation No. 570/2025"
}

export interface SystemMetrics {
  activeDriversCount: number;
  onlineDriversCount: number;
  activeTripsCount: number;
  todayCompletedTrips: number;
  todayGmvEtb: number;
  todayVatCollectedEtb: number;
  averageEtaMinutes: number;
  acceptanceRatePercent: number;
}
