import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';

/**
 * Autonomous Vehicle dispatch integration.
 *
 * CheeTaxi's dispatch API is vehicle-agnostic — the existing DispatchService
 * searches for nearby "drivers" via Redis GEO. AVs are registered as a
 * special fleet type and report their location the same way human drivers do.
 *
 * This service handles:
 *   • AV fleet registration (Waymo, Cruise, local partners)
 *   • AV vehicle heartbeat ingestion
 *   • AV-specific dispatch (no offer/accept flow — AVs are dispatched directly)
 *   • AV status monitoring (battery, errors, offline alerts)
 */
@Injectable()
export class AvService {
  private readonly logger = new Logger('AvService');
  private readonly AV_LOCATION_KEY = 'geo:av:online';
  private readonly HEARTBEAT_TTL_SECONDS = 120; // AV offline if no heartbeat for 2 min

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async registerFleet(data: {
    name: string; provider: string; apiEndpoint: string; apiKey?: string;
    country: string; city: string;
  }): Promise<{ fleetId: string }> {
    const fleet = await this.prisma.avFleet.create({
      data: {
        name: data.name,
        provider: data.provider,
        apiEndpoint: data.apiEndpoint,
        apiKey: data.apiKey,
        country: data.country as any,
        city: data.city,
      },
    });
    return { fleetId: fleet.id };
  }

  async registerVehicle(fleetId: string, data: {
    identifier: string; vehicleType: string; capacity?: number;
  }): Promise<{ vehicleId: string }> {
    const vehicle = await this.prisma.avVehicle.create({
      data: {
        fleetId,
        identifier: data.identifier,
        vehicleType: data.vehicleType as any,
        capacity: data.capacity ?? 4,
      },
    });
    return { vehicleId: vehicle.id };
  }

  /** AV heartbeat — called by the AV fleet provider every 10-30 seconds. */
  async heartbeat(vehicleIdentifier: string, data: {
    latitude: number; longitude: number; batteryPercent?: number; status?: string;
  }): Promise<void> {
    const vehicle = await this.prisma.avVehicle.findUnique({
      where: { identifier: vehicleIdentifier },
    });
    if (!vehicle) throw new NotFoundException('AV vehicle not found');

    await this.prisma.avVehicle.update({
      where: { id: vehicle.id },
      data: {
        latitude: data.latitude,
        longitude: data.longitude,
        batteryPercent: data.batteryPercent,
        status: data.status ?? 'idle',
        lastHeartbeatAt: new Date(),
      },
    });

    // Register in Redis GEO for dispatch (same as human drivers)
    if (data.status !== 'offline' && data.status !== 'error') {
      await this.redis.geoAdd(this.AV_LOCATION_KEY, data.longitude, data.latitude, vehicle.id);
      await this.redis.set(`av:online:${vehicle.id}`, { ts: Date.now() }, this.HEARTBEAT_TTL_SECONDS);
    } else {
      await this.redis.geoRemove(this.AV_LOCATION_KEY, vehicle.id);
    }
  }

  /** Find nearby AVs — called by DispatchService when no human drivers available. */
  async findNearbyAvs(lat: number, lng: number, radiusMeters = 5000): Promise<any[]> {
    const nearby = await this.redis.geoRadius(this.AV_LOCATION_KEY, lng, lat, radiusMeters);
    if (nearby.length === 0) return [];

    const vehicleIds = nearby.map((n) => n.member);
    const vehicles = await this.prisma.avVehicle.findMany({
      where: { id: { in: vehicleIds }, status: { in: ['idle', 'en_route'] } },
      include: { fleet: true },
    });

    return vehicles.map((v) => {
      const match = nearby.find((n) => n.member === v.id);
      return {
        ...v,
        distanceMeters: match?.distance ?? null,
        isAutonomous: true,
      };
    });
  }

  /** Dispatch an AV directly (no offer/accept flow — AVs are commanded). */
  async dispatchAv(vehicleId: string, tripId: string): Promise<{ dispatched: boolean }> {
    const vehicle = await this.prisma.avVehicle.findUnique({
      where: { id: vehicleId },
      include: { fleet: true },
    });
    if (!vehicle) throw new NotFoundException('AV vehicle not found');
    if (!['idle', 'en_route'].includes(vehicle.status)) {
      return { dispatched: false };
    }

    // Call the AV fleet provider's dispatch API
    try {
      const res = await fetch(`${vehicle.fleet.apiEndpoint}/dispatch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(vehicle.fleet.apiKey ? { Authorization: `Bearer ${vehicle.fleet.apiKey}` } : {}),
        },
        body: JSON.stringify({
          vehicleId: vehicle.identifier,
          tripId,
          pickupLocation: { lat: vehicle.latitude, lng: vehicle.longitude },
        }),
      });

      if (!res.ok) {
        this.logger.error(`AV dispatch failed: ${res.status} ${await res.text()}`);
        return { dispatched: false };
      }

      await this.prisma.avVehicle.update({
        where: { id: vehicleId },
        data: { status: 'en_route' },
      });

      return { dispatched: true };
    } catch (err) {
      this.logger.error(`AV dispatch error: ${(err as Error).message}`);
      return { dispatched: false };
    }
  }

  /** Get AV fleet status for the ops dashboard. */
  async getFleetStatus(): Promise<any> {
    const fleets = await this.prisma.avFleet.findMany({
      where: { isActive: true },
      include: {
        vehicles: {
          select: { id: true, status: true, batteryPercent: true, lastHeartbeatAt: true },
        },
      },
    });

    return fleets.map((f) => ({
      ...f,
      vehicleCount: f.vehicles.length,
      idleCount: f.vehicles.filter((v) => v.status === 'idle').length,
      onTripCount: f.vehicles.filter((v) => v.status === 'on_trip').length,
      offlineCount: f.vehicles.filter((v) => v.status === 'offline' || !v.lastHeartbeatAt || v.lastHeartbeatAt < new Date(Date.now() - 5 * 60 * 1000)).length,
    }));
  }
}
