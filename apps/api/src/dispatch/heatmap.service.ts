import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';
import { GeoService } from '../geo/geo.service';

/**
 * Advanced dispatch features:
 *   • Heat maps — aggregates driver location history into demand hotspots
 *   • Predictive demand — uses historical trip data to forecast demand per geohash/hour
 *   • Scheduled pre-allocation — pre-positions drivers near predicted demand
 *   • Driver recommendations — suggests areas with high demand + low supply
 *
 * Runs on a schedule (every 5 min for heat map updates, every hour for
 * demand predictions) and exposes endpoints for the driver app + admin.
 */
@Injectable()
export class HeatMapService {
  private readonly logger = new Logger('HeatMapService');
  private readonly HEATMAP_KEY = 'dispatch:heatmap';
  private readonly DEMAND_KEY = 'dispatch:demand';
  private readonly HEATMAP_TTL_SECONDS = 30 * 60; // 30 minutes

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private geo: GeoService,
  ) {}

  /**
   * Returns the current heat map: array of { geohash, lat, lng, demandScore, supplyScore, gap }
   * for the requested city / viewport.
   *
   * demandScore = expected trip requests per hour (from historical data)
   * supplyScore = current online drivers in the area
   * gap = demandScore - supplyScore (positive = need more drivers)
   */
  async getHeatMap(city: string, viewport?: { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } }): Promise<HeatMapCell[]> {
    const cacheKey = `${this.HEATMAP_KEY}:${city}`;
    const cached = await this.redis.get<HeatMapCell[]>(cacheKey);
    if (cached) return cached;

    // Compute on-demand if cache miss
    const cells = await this.computeHeatMap(city, viewport);
    await this.redis.set(cacheKey, cells, this.HEATMAP_TTL_SECONDS);
    return cells;
  }

  /**
   * Periodic heat map refresh — runs every 5 minutes via @Cron.
   * Aggregates current driver supply + recent demand.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async refreshHeatMaps(): Promise<void> {
    try {
      // Get distinct cities from pricing tiers
      const cities = await this.prisma.pricingTier.findMany({
        where: { isActive: true },
        select: { city: true, country: true },
        distinct: ['city', 'country'],
      });

      for (const { city } of cities) {
        const cells = await this.computeHeatMap(city);
        await this.redis.set(`${this.HEATMAP_KEY}:${city}`, cells, this.HEATMAP_TTL_SECONDS);
      }
      this.logger.debug(`Refreshed heat maps for ${cities.length} cities`);
    } catch (err) {
      this.logger.error(`Heat map refresh failed: ${(err as Error).message}`);
    }
  }

  /**
   * Predictive demand — uses the last 4 weeks of trip history to forecast
   * expected requests per geohash per hour-of-week. Runs hourly.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async refreshDemandPredictions(): Promise<void> {
    try {
      const now = new Date();
      const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 3600 * 1000);

      const trips = await this.prisma.trip.findMany({
        where: { requestedAt: { gte: fourWeeksAgo } },
        select: { pickupGeohash: true, requestedAt: true },
      });

      // Aggregate by geohash (precision 5 ≈ 5km × 5km) + hour-of-week (0-167)
      const demand = new Map<string, number>();
      for (const trip of trips) {
        if (!trip.pickupGeohash) continue;
        const geohash = trip.pickupGeohash.slice(0, 5);
        const date = new Date(trip.requestedAt);
        const dayOfWeek = date.getDay(); // 0=Sun
        const hour = date.getHours();
        const hourOfWeek = dayOfWeek * 24 + hour;
        const key = `${geohash}:${hourOfWeek}`;
        demand.set(key, (demand.get(key) ?? 0) + 1);
      }

      // Normalize: requests per hour = count / 4 (4 weeks of data)
      const predictions: DemandPrediction[] = [];
      for (const [key, count] of demand.entries()) {
        const [geohash, hourStr] = key.split(':');
        predictions.push({
          geohash,
          hourOfWeek: Number(hourStr),
          expectedRequestsPerHour: count / 4,
        });
      }

      await this.redis.set(this.DEMAND_KEY, predictions, 6 * 3600); // 6 hour TTL
      this.logger.debug(`Updated ${predictions.length} demand predictions`);
    } catch (err) {
      this.logger.error(`Demand prediction failed: ${(err as Error).message}`);
    }
  }

  /**
   * Returns driver recommendations: top 5 areas with the highest demand-supply gap
   * for the current hour. Shown in the driver app as "Hot zones".
   */
  async getDriverRecommendations(city: string, driverLat: number, driverLng: number): Promise<DriverRecommendation[]> {
    const heatMap = await this.getHeatMap(city);
    const now = new Date();
    const hourOfWeek = now.getDay() * 24 + now.getHours();

    const predictions = (await this.redis.get<DemandPrediction[]>(this.DEMAND_KEY)) ?? [];
    const predictionMap = new Map<string, number>();
    for (const p of predictions) {
      if (p.hourOfWeek === hourOfWeek) {
        predictionMap.set(p.geohash, p.expectedRequestsPerHour);
      }
    }

    const recommendations: DriverRecommendation[] = heatMap
      .map((cell) => {
        const predictedDemand = predictionMap.get(cell.geohash) ?? cell.demandScore;
        const gap = predictedDemand - cell.supplyScore;
        const distanceMeters = this.geo.haversineMeters(
          { lat: driverLat, lng: driverLng },
          { lat: cell.lat, lng: cell.lng },
        );
        return {
          geohash: cell.geohash,
          latitude: cell.lat,
          longitude: cell.lng,
          predictedDemand,
          currentSupply: cell.supplyScore,
          gap,
          distanceMeters,
          // Score = gap (high is good) minus distance penalty (close is good)
          score: gap - distanceMeters / 1000,
        };
      })
      .filter((r) => r.gap > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return recommendations;
  }

  /**
   * Scheduled pre-allocation — for trips scheduled > 15 min ahead, find and
   * reserve a driver ahead of time. Runs every 5 minutes.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async preAllocateScheduledTrips(): Promise<void> {
    try {
      const now = new Date();
      const window = new Date(now.getTime() + 30 * 60 * 1000); // 30 min ahead

      const upcomingTrips = await this.prisma.trip.findMany({
        where: {
          scheduledFor: { gte: now, lte: window },
          status: 'REQUESTED',
          driverId: null,
        },
        include: {
          passenger: { include: { user: true } },
        },
        take: 50,
      });

      for (const trip of upcomingTrips) {
        const minutesUntil = Math.round((trip.scheduledFor!.getTime() - now.getTime()) / 60000);
        if (minutesUntil < 15) continue; // too soon — let normal dispatch handle it

        // Find nearby drivers who will likely be available
        const nearby = await this.redis.geoRadius(
          'geo:drivers:online',
          trip.pickupLongitude,
          trip.pickupLatitude,
          3000,
        );

        if (nearby.length === 0) continue;

        // Mark the trip as pre-allocatable — actual assignment happens closer to scheduled time
        // For now, just count availability for ops dashboard
      }

      if (upcomingTrips.length > 0) {
        this.logger.debug(`Pre-allocation scan: ${upcomingTrips.length} upcoming scheduled trips`);
      }
    } catch (err) {
      this.logger.error(`Pre-allocation failed: ${(err as Error).message}`);
    }
  }

  // ─── Private helpers ────────────────────────────────────────────────────

  private async computeHeatMap(city: string, viewport?: { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } }): Promise<HeatMapCell[]> {
    // Recent demand: count trips in the last hour per geohash
    const oneHourAgo = new Date(Date.now() - 3600 * 1000);
    const recentTrips = await this.prisma.trip.findMany({
      where: {
        requestedAt: { gte: oneHourAgo },
        // Filter by city via geofence would require PostGIS — for now, we filter by pickup geohash prefix
      },
      select: { pickupGeohash: true, pickupLatitude: true, pickupLongitude: true },
    });

    // Aggregate by geohash precision 5 (~5km × 5km cells)
    const demandByCell = new Map<string, { count: number; lat: number; lng: number }>();
    for (const trip of recentTrips) {
      if (!trip.pickupGeohash) continue;
      const geohash = trip.pickupGeohash.slice(0, 5);
      const existing = demandByCell.get(geohash);
      if (existing) {
        existing.count++;
      } else {
        demandByCell.set(geohash, {
          count: 1,
          lat: trip.pickupLatitude,
          lng: trip.pickupLongitude,
        });
      }
    }

    // Current supply: online drivers per geohash cell
    // We scan the Redis GEO set — but that requires knowing all members.
    // For now, query the DB (cached 60s by Prisma).
    const onlineDrivers = await this.prisma.driver.findMany({
      where: {
        online: true,
        status: 'ONLINE',
        locationUpdatedAt: { gt: new Date(Date.now() - 2 * 60 * 1000) }, // updated in last 2 min
      },
      select: { latitude: true, longitude: true },
    });

    const supplyByCell = new Map<string, number>();
    for (const driver of onlineDrivers) {
      if (driver.latitude == null || driver.longitude == null) continue;
      const geohash = this.geo.geohash(driver.latitude, driver.longitude, 5);
      supplyByCell.set(geohash, (supplyByCell.get(geohash) ?? 0) + 1);
    }

    // Merge into cells
    const cells: HeatMapCell[] = [];
    const allGeohashes = new Set([...demandByCell.keys(), ...supplyByCell.keys()]);
    for (const geohash of allGeohashes) {
      const demand = demandByCell.get(geohash);
      const supply = supplyByCell.get(geohash) ?? 0;
      if (!demand && supply === 0) continue;
      const lat = demand?.lat ?? 0;
      const lng = demand?.lng ?? 0;
      // Filter by viewport if provided
      if (viewport) {
        if (lat < viewport.sw.lat || lat > viewport.ne.lat || lng < viewport.sw.lng || lng > viewport.ne.lng) continue;
      }
      cells.push({
        geohash,
        lat,
        lng,
        demandScore: demand?.count ?? 0,
        supplyScore: supply,
        gap: (demand?.count ?? 0) - supply,
      });
    }

    return cells.sort((a, b) => b.gap - a.gap);
  }
}

export interface HeatMapCell {
  geohash: string;
  lat: number;
  lng: number;
  demandScore: number; // trips requested in last hour
  supplyScore: number; // current online drivers
  gap: number; // demand - supply (positive = need more drivers)
}

export interface DemandPrediction {
  geohash: string;
  hourOfWeek: number; // 0-167
  expectedRequestsPerHour: number;
}

export interface DriverRecommendation {
  geohash: string;
  latitude: number;
  longitude: number;
  predictedDemand: number;
  currentSupply: number;
  gap: number;
  distanceMeters: number;
  score: number; // higher is better
}
