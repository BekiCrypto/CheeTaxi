// GraphQL resolvers — delegates to existing services.
// Note: @nestjs/graphql package provides the decorators.

import { PrismaService } from '../common/prisma.service';
import { TripsService } from '../trips/trips.service';
import { PricingService } from '../pricing/pricing.service';

// Type definitions for GraphQL — plain classes
export class TripType {
  id!: string;
  publicId!: string;
  status!: string;
  mode!: string;
  pickupAddress!: string;
  dropoffAddress!: string;
  totalFare!: number;
  currency!: string;
  requestedAt!: string;
  completedAt?: string;
}

export class FareQuoteType {
  baseFare!: number;
  distanceFare!: number;
  timeFare!: number;
  surgeMultiplier!: number;
  totalFare!: number;
  currency!: string;
  distanceMeters!: number;
  durationSeconds!: number;
}

export class UserType {
  id!: string;
  phone!: string;
  firstName!: string;
  lastName!: string;
  role!: string;
  status!: string;
}

// Resolvers — use dynamic imports to avoid build-time dependency on @nestjs/graphql
// when it's not installed. In production, install @nestjs/graphql + @nestjs/apollo.

export class UserResolver {
  constructor(private prisma: PrismaService) {}

  async me(req: any) {
    if (!req?.user) return null;
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id } });
    return user ? {
      id: user.id, phone: user.phone, firstName: user.firstName,
      lastName: user.lastName, role: user.role, status: user.status,
    } : null;
  }
}

export class TripResolver {
  constructor(
    private prisma: PrismaService,
    private trips: TripsService,
  ) {}

  async myTrips(req: any, limit: number = 20) {
    const result = await this.trips.listForPassenger(req.user.id, 1, limit);
    return result.items.map((t: any) => ({
      id: t.id, publicId: t.publicId, status: t.status, mode: t.mode,
      pickupAddress: t.pickupAddress, dropoffAddress: t.dropoffAddress,
      totalFare: Number(t.totalFare), currency: t.currency,
      requestedAt: t.requestedAt, completedAt: t.completedAt,
    }));
  }

  async trip(id: string) {
    const trip = await this.trips.getById(id);
    if (!trip) return null;
    return {
      id: trip.id, publicId: trip.publicId, status: trip.status, mode: trip.mode,
      pickupAddress: trip.pickupAddress, dropoffAddress: trip.dropoffAddress,
      totalFare: Number(trip.totalFare), currency: trip.currency,
      requestedAt: trip.requestedAt, completedAt: trip.completedAt,
    };
  }

  async requestTrip(
    req: any,
    pickupLat: number, pickupLng: number,
    dropoffLat: number, dropoffLng: number,
    mode: string, vehicleType: string, paymentMethod: string,
    pickupAddress?: string, dropoffAddress?: string,
  ) {
    const result = await this.trips.request({
      passengerUserId: req.user.id,
      pickup: { lat: pickupLat, lng: pickupLng, address: pickupAddress },
      dropoff: { lat: dropoffLat, lng: dropoffLng, address: dropoffAddress },
      mode, vehicleType, paymentMethod,
    });
    return {
      id: result.tripId, publicId: result.publicId, status: 'REQUESTED', mode,
      pickupAddress: pickupAddress ?? '', dropoffAddress: dropoffAddress ?? '',
      totalFare: result.estimate.totalFare, currency: result.estimate.currency,
      requestedAt: new Date().toISOString(),
    };
  }
}

export class PricingResolver {
  constructor(
    private pricing: PricingService,
  ) {}

  async fareQuote(
    vehicleType: string,
    pickupLat: number, pickupLng: number,
    dropoffLat: number, dropoffLng: number,
    city: string = 'Addis Ababa',
  ) {
    const quote = await this.pricing.getQuote({
      vehicleType,
      pickup: { lat: pickupLat, lng: pickupLng },
      dropoff: { lat: dropoffLat, lng: dropoffLng },
      city,
    });
    return quote;
  }
}
