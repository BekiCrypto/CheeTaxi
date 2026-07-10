import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { nanoid } from 'nanoid';
import { PrismaService } from '../common/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { GeoService } from '../geo/geo.service';
import { DispatchService } from '../dispatch/dispatch.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { WS_EVENTS } from '@cheetaxi/shared';

interface RequestTripInput {
  passengerUserId: string;
  pickup: { lat: number; lng: number; address?: string };
  dropoff: { lat: number; lng: number; address?: string };
  stops?: Array<{ lat: number; lng: number; address?: string }>;
  mode: string;
  vehicleType: string;
  paymentMethod: string;
  scheduledFor?: string;
  promoCode?: string;
  notes?: string;
  passengerCount?: number;
}

@Injectable()
export class TripsService {
  private readonly logger = new Logger('TripsService');

  constructor(
    private prisma: PrismaService,
    private pricing: PricingService,
    private geo: GeoService,
    private dispatch: DispatchService,
    private notifications: NotificationsService,
    private realtime: RealtimeGateway,
  ) {}

  async request(input: RequestTripInput) {
    // Validate passenger
    const passenger = await this.prisma.passenger.findUnique({
      where: { userId: input.passengerUserId },
      include: { user: true },
    });
    if (!passenger) throw new NotFoundException('Passenger profile not found');
    if (passenger.blockedFromBooking) throw new BadRequestException('Account is restricted from booking');

    // Get fare quote
    const quote = await this.pricing.getQuote({
      vehicleType: input.vehicleType,
      pickup: input.pickup,
      dropoff: input.dropoff,
      promoCode: input.promoCode,
    });

    const pickupGeohash = this.geo.geohash(input.pickup.lat, input.pickup.lng);
    const dropoffGeohash = this.geo.geohash(input.dropoff.lat, input.dropoff.lng);

    // Create trip
    const trip = await this.prisma.trip.create({
      data: {
        passengerId: passenger.id,
        passengerUserId: input.passengerUserId,
        mode: input.mode as any,
        status: 'REQUESTED',
        pickupAddress: input.pickup.address ?? `${input.pickup.lat},${input.pickup.lng}`,
        pickupLatitude: input.pickup.lat,
        pickupLongitude: input.pickup.lng,
        pickupGeohash,
        dropoffAddress: input.dropoff.address ?? `${input.dropoff.lat},${input.dropoff.lng}`,
        dropoffLatitude: input.dropoff.lat,
        dropoffLongitude: input.dropoff.lng,
        dropoffGeohash,
        stops: input.stops ?? undefined,
        baseFare: quote.baseFare,
        distanceFare: quote.distanceFare,
        timeFare: quote.timeFare,
        surgeMultiplier: quote.surgeMultiplier,
        promoDiscount: quote.promoDiscount,
        taxAmount: quote.taxAmount,
        totalFare: quote.totalFare,
        currency: quote.currency,
        paymentMethod: input.paymentMethod as any,
        scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : null,
        shareToken: nanoid(16),
        shareExpiresAt: new Date(Date.now() + 24 * 3600 * 1000),
      },
      include: { passenger: { include: { user: true } } },
    });

    // Record event
    await this.recordEvent(trip.id, 'requested', { fare: quote }, input.passengerUserId);

    // Enqueue for dispatch (unless scheduled for later)
    if (!input.scheduledFor) {
      await this.dispatch.enqueue(trip.id, pickupGeohash, input.vehicleType as any);
    }

    // Notify passenger
    await this.notifications.sendToUser(input.passengerUserId, {
      channel: 'PUSH',
      code: 'TRIP_REQUESTED',
      vars: { pickup: input.pickup.address ?? 'your location' },
    });

    return {
      tripId: trip.id,
      publicId: trip.publicId,
      status: trip.status,
      estimate: quote,
      shareToken: trip.shareToken,
    };
  }

  async accept(driverUserId: string, tripId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId: driverUserId },
      include: { currentVehicle: true, user: true },
    });
    if (!driver) throw new NotFoundException('Driver not found');
    if (!driver.online) throw new BadRequestException('Driver must be online');
    if (!driver.currentVehicleId) throw new BadRequestException('No active vehicle');

    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.status !== 'REQUESTED' && trip.status !== 'SEARCHING') {
      throw new BadRequestException(`Trip is in status ${trip.status}, cannot accept`);
    }

    const updated = await this.prisma.trip.update({
      where: { id: tripId },
      data: {
        driverId: driver.id,
        vehicleId: driver.currentVehicleId,
        status: 'DRIVER_ASSIGNED',
        acceptedAt: new Date(),
      },
      include: { passenger: { include: { user: true } } },
    });

    await this.dispatch.markAssigned(tripId);
    await this.recordEvent(tripId, 'assigned', { driverId: driver.id }, driverUserId);
    this.realtime.emitTripEvent(tripId, WS_EVENTS.TRIP_ASSIGNED, {
      tripId, driverId: driver.id, vehicleId: driver.currentVehicleId,
      driverName: `${driver.user.firstName} ${driver.user.lastName}`,
      plateNumber: driver.currentVehicle?.plateNumber,
    });

    // Notify passenger
    await this.notifications.sendToUser(updated.passengerUserId, {
      channel: 'PUSH',
      code: 'DRIVER_ASSIGNED',
      vars: {
        driverName: `${driver.user.firstName} ${driver.user.lastName}`,
        eta: 5, // computed from distance in real impl
        plateNumber: driver.currentVehicle?.plateNumber ?? '',
      },
    });

    return updated;
  }

  async arrive(driverUserId: string, tripId: string) {
    const driver = await this.prisma.driver.findUnique({ where: { userId: driverUserId } });
    if (!driver) throw new NotFoundException('Driver not found');
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip || trip.driverId !== driver.id) throw new BadRequestException('Trip not assigned to you');

    const updated = await this.prisma.trip.update({
      where: { id: tripId },
      data: { status: 'DRIVER_ARRIVED', arrivedAt: new Date() },
    });
    await this.recordEvent(tripId, 'arrived', {}, driverUserId);
    this.realtime.emitTripEvent(tripId, WS_EVENTS.TRIP_ARRIVED, { tripId });
    await this.notifications.sendToUser(trip.passengerUserId, {
      channel: 'PUSH',
      code: 'DRIVER_ARRIVED',
      vars: { driverName: `${driver.user.firstName}` },
    });
    return updated;
  }

  async start(driverUserId: string, tripId: string) {
    const driver = await this.prisma.driver.findUnique({ where: { userId: driverUserId } });
    if (!driver) throw new NotFoundException('Driver not found');
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip || trip.driverId !== driver.id) throw new BadRequestException('Trip not assigned to you');

    const updated = await this.prisma.trip.update({
      where: { id: tripId },
      data: { status: 'IN_PROGRESS', startedAt: new Date() },
    });
    await this.prisma.driver.update({
      where: { id: driver.id },
      data: { status: 'ON_TRIP' },
    });
    await this.recordEvent(tripId, 'started', {}, driverUserId);
    this.realtime.emitTripEvent(tripId, WS_EVENTS.TRIP_STARTED, { tripId });
    return updated;
  }

  async complete(driverUserId: string, tripId: string, completionData?: { actualDistanceMeters?: number; actualDurationSeconds?: number }) {
    const driver = await this.prisma.driver.findUnique({ where: { userId: driverUserId } });
    if (!driver) throw new NotFoundException('Driver not found');
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip || trip.driverId !== driver.id) throw new BadRequestException('Trip not assigned to you');
    if (trip.status !== 'IN_PROGRESS') throw new BadRequestException('Trip is not in progress');

    const updated = await this.prisma.trip.update({
      where: { id: tripId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        distanceMeters: completionData?.actualDistanceMeters ?? trip.distanceMeters,
        durationSeconds: completionData?.actualDurationSeconds ?? trip.durationSeconds,
      },
    });

    // Update driver stats
    await this.prisma.driver.update({
      where: { id: driver.id },
      data: {
        status: 'ONLINE',
        totalTrips: { increment: 1 },
        completedTrips: { increment: 1 },
        totalEarnings: { increment: trip.totalFare },
      },
    });
    // Update passenger stats
    await this.prisma.passenger.update({
      where: { id: trip.passengerId },
      data: {
        totalTrips: { increment: 1 },
        completedTrips: { increment: 1 },
        totalSpent: { increment: trip.totalFare },
      },
    });

    // Create invoice
    await this.prisma.invoice.create({
      data: {
        tripId: trip.id,
        passengerUserId: trip.passengerUserId,
        subtotal: trip.baseFare + trip.distanceFare + trip.timeFare,
        tax: trip.taxAmount,
        discount: trip.promoDiscount,
        total: trip.totalFare,
        currency: trip.currency,
      },
    });

    await this.recordEvent(tripId, 'completed', completionData ?? {}, driverUserId);
    this.realtime.emitTripEvent(tripId, WS_EVENTS.TRIP_COMPLETED, {
      tripId, totalFare: updated.totalFare, currency: updated.currency,
    });

    // Notify passenger — request rating
    await this.notifications.sendToUser(trip.passengerUserId, {
      channel: 'PUSH',
      code: 'TRIP_COMPLETED',
      vars: { currency: trip.currency, amount: String(trip.totalFare) },
    });

    return updated;
  }

  async cancel(userId: string, tripId: string, reason: string, by: 'passenger' | 'driver' | 'system') {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');
    if (['COMPLETED', 'CANCELLED_BY_PASSENGER', 'CANCELLED_BY_DRIVER', 'CANCELLED_BY_SYSTEM'].includes(trip.status)) {
      throw new BadRequestException('Trip cannot be cancelled in current state');
    }

    const status = by === 'passenger' ? 'CANCELLED_BY_PASSENGER' : by === 'driver' ? 'CANCELLED_BY_DRIVER' : 'CANCELLED_BY_SYSTEM';
    const updated = await this.prisma.trip.update({
      where: { id: tripId },
      data: { status: status as any, cancelledAt: new Date(), cancellationReason: reason },
    });

    await this.dispatch.markExpired(tripId);
    await this.recordEvent(tripId, 'cancelled', { by, reason }, userId);
    this.realtime.emitTripEvent(tripId, WS_EVENTS.TRIP_CANCELLED, { tripId, by, reason });

    // Stats
    if (by === 'passenger') {
      await this.prisma.passenger.update({
        where: { id: trip.passengerId },
        data: { cancelledTrips: { increment: 1 } },
      });
    } else if (by === 'driver' && trip.driverId) {
      await this.prisma.driver.update({
        where: { id: trip.driverId },
        data: { cancelledTrips: { increment: 1 } },
      });
    }

    return updated;
  }

  async getById(tripId: string, includeRelations = true) {
    return this.prisma.trip.findUnique({
      where: { id: tripId },
      include: includeRelations
        ? {
            passenger: { include: { user: { select: { firstName: true, lastName: true, phone: true, avatarUrl: true } } } },
            driver: { include: { user: { select: { firstName: true, lastName: true, phone: true, avatarUrl: true } }, currentVehicle: true } },
            events: { orderBy: { occurredAt: 'asc' } },
            ratings: true,
            invoice: true,
          }
        : undefined,
    });
  }

  async getPublicByShareToken(shareToken: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { shareToken },
      select: {
        id: true,
        publicId: true,
        status: true,
        pickupAddress: true,
        dropoffAddress: true,
        pickupLatitude: true,
        pickupLongitude: true,
        dropoffLatitude: true,
        dropoffLongitude: true,
        totalFare: true,
        currency: true,
        requestedAt: true,
        completedAt: true,
        driver: {
          select: {
            user: { select: { firstName: true, lastName: true, avatarUrl: true } },
            currentVehicle: { select: { plateNumber: true, make: true, model: true, color: true } },
            ratingAverage: true,
          },
        },
      },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    return trip;
  }

  async listForPassenger(userId: string, page = 1, limit = 20, status?: string) {
    const passenger = await this.prisma.passenger.findUnique({ where: { userId } });
    if (!passenger) throw new NotFoundException('Passenger not found');
    const [items, total] = await Promise.all([
      this.prisma.trip.findMany({
        where: { passengerId: passenger.id, ...(status ? { status: status as any } : {}) },
        orderBy: { requestedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.trip.count({ where: { passengerId: passenger.id } }),
    ]);
    return { items, total, page, limit };
  }

  async listForDriver(userId: string, page = 1, limit = 20, status?: string) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new NotFoundException('Driver not found');
    const [items, total] = await Promise.all([
      this.prisma.trip.findMany({
        where: { driverId: driver.id, ...(status ? { status: status as any } : {}) },
        orderBy: { requestedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.trip.count({ where: { driverId: driver.id } }),
    ]);
    return { items, total, page, limit };
  }

  private async recordEvent(tripId: string, eventType: string, metadata: unknown, actorUserId?: string) {
    await this.prisma.tripEvent.create({
      data: { tripId, eventType, metadata: metadata as any, actorUserId },
    });
  }
}
