import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';

const DISPATCH_QUEUE_KEY = 'dispatch:queue';
const DRIVER_LOCATION_KEY = 'geo:drivers:online';
const OFFER_TTL_SECONDS = 15; // driver has 15s to accept
const MAX_OFFER_RADIUS_METERS = 5000;
const SEARCH_RADIUS_INCREMENT = 1000;

@Injectable()
export class DispatchService {
  private readonly logger = new Logger('DispatchService');

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /** Enqueue a trip for dispatch. */
  async enqueue(tripId: string, pickupGeohash: string, vehicleType: string, priority = 0) {
    await this.prisma.dispatchQueue.create({
      data: {
        tripId,
        geohash: pickupGeohash,
        vehicleType: vehicleType as any,
        priority,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min total search
      },
    });
    // Trigger immediate search
    void this.processTrip(tripId).catch((err) =>
      this.logger.error(`Dispatch failed for ${tripId}: ${err.message}`),
    );
    return { queued: true };
  }

  /** Process a queued trip: find nearby drivers and offer them sequentially. */
  async processTrip(tripId: string) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip || trip.status !== 'REQUESTED') return;

    const pickup = { lat: trip.pickupLatitude, lng: trip.pickupLongitude };
    const vehicleType = await this.resolveVehicleType(trip);
    const searchRadius = SEARCH_RADIUS_INCREMENT;
    const nearby = await this.redis.geoRadius(
      DRIVER_LOCATION_KEY,
      pickup.lng,
      pickup.lat,
      MAX_OFFER_RADIUS_METERS,
    );

    if (nearby.length === 0) {
      await this.markNoDriverFound(tripId);
      return;
    }

    // Get drivers sorted by distance, filter by vehicle type match + valid subscription
    const driverIds = nearby.map((n) => n.member);
    const drivers = await this.prisma.driver.findMany({
      where: {
        id: { in: driverIds },
        online: true,
        status: 'ONLINE',
        availableModes: { has: vehicleType as any },
      },
      include: { subscriptionAssignments: { where: { plan: { isActive: true } }, include: { plan: true } } },
    });

    const eligible = drivers.filter((d) => this.hasActiveSubscription(d.subscriptionAssignments));
    if (eligible.length === 0) {
      await this.markNoDriverFound(tripId);
      return;
    }

    // Send offer to closest driver
    const closest = eligible
      .map((d) => {
        const match = nearby.find((n) => n.member === d.id);
        return { driver: d, distance: match?.distance ?? Infinity };
      })
      .sort((a, b) => a.distance - b.distance)[0];

    if (!closest) {
      await this.markNoDriverFound(tripId);
      return;
    }

    await this.offerTripToDriver(tripId, closest.driver.id, closest.distance);
  }

  /** Offer the trip to a driver — creates DriverOffer with TTL. */
  async offerTripToDriver(tripId: string, driverId: string, distanceMeters: number) {
    const expiresAt = new Date(Date.now() + OFFER_TTL_SECONDS * 1000);
    await this.prisma.driverOffer.create({
      data: { tripId, driverId, expiresAt },
    });

    // Push the offer via notifications (real impl: WebSocket + Push)
    await this.prisma.notification.create({
      data: {
        userId: (await this.prisma.driver.findUnique({ where: { id: driverId } }))?.userId ?? '',
        channel: 'PUSH',
        title: 'New trip request',
        body: `Pickup ${Math.round(distanceMeters)}m away — fare estimate available`,
        payload: { type: 'trip_offer', tripId, expiresAt: expiresAt.toISOString() },
        status: 'QUEUED',
      },
    });

    // Auto-expire the offer if no response
    setTimeout(() => void this.expireOfferIfPending(tripId, driverId), OFFER_TTL_SECONDS * 1000);
  }

  async respondToOffer(driverId: string, tripId: string, accept: boolean) {
    const offer = await this.prisma.driverOffer.findFirst({
      where: { tripId, driverId, accepted: false, rejected: false, expiresAt: { gt: new Date() } },
    });
    if (!offer) return null;

    await this.prisma.driverOffer.update({
      where: { id: offer.id },
      data: { accepted: accept, rejected: !accept, respondedAt: new Date() },
    });

    if (!accept) {
      // Move to next driver
      void this.processTrip(tripId).catch(() => undefined);
    }
    return { accept };
  }

  async markAssigned(tripId: string) {
    await this.prisma.dispatchQueue.updateMany({
      where: { tripId, status: 'queued' },
      data: { status: 'assigned' },
    });
  }

  async markExpired(tripId: string) {
    await this.prisma.dispatchQueue.updateMany({
      where: { tripId },
      data: { status: 'expired' },
    });
  }

  async markNoDriverFound(tripId: string) {
    await this.prisma.trip.update({
      where: { id: tripId },
      data: { status: 'NO_DRIVER_FOUND' },
    });
    await this.markExpired(tripId);
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (trip) {
      await this.prisma.notification.create({
        data: {
          userId: trip.passengerUserId,
          channel: 'PUSH',
          title: 'No driver found',
          body: 'We could not find a driver nearby. Please try again.',
          payload: { type: 'no_driver', tripId },
          status: 'QUEUED',
        },
      });
    }
  }

  private async expireOfferIfPending(tripId: string, driverId: string) {
    const offer = await this.prisma.driverOffer.findFirst({
      where: { tripId, driverId, accepted: false, rejected: false },
    });
    if (offer) {
      await this.prisma.driverOffer.update({
        where: { id: offer.id },
        data: { rejected: true, respondedAt: new Date() },
      });
      // Move to next driver
      void this.processTrip(tripId).catch(() => undefined);
    }
  }

  private hasActiveSubscription(assignments: any[]): boolean {
    if (assignments.length === 0) return false;
    return assignments.some((a) => {
      const sub = a.subscription;
      if (!sub) return false;
      return sub.status === 'ACTIVE' && sub.endsAt && sub.endsAt > new Date();
    });
  }

  private async resolveVehicleType(trip: any): Promise<string> {
    // Map trip mode → default vehicle type
    const map: Record<string, string> = {
      TAXI: 'TAXI',
      RIDE_SHARING: 'RIDE_SHARING',
      MOTORCYCLE: 'MOTORCYCLE',
      THREE_WHEELER: 'THREE_WHEELER',
      COURIER: 'COURIER',
      FOOD_DELIVERY: 'FOOD_DELIVERY',
      PARCEL: 'PARCEL',
      MEDICAL: 'MEDICAL',
      TRUCK: 'TRUCK',
      INTERCITY: 'INTERCITY',
      RENTAL: 'RENTAL',
      EMERGENCY: 'EMERGENCY',
    };
    return map[trip.mode] ?? 'TAXI';
  }
}
