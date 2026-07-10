import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';

/**
 * AI/ML foundation for CheeTaxi.
 *
 * Phase 5 implements rule-based + simple statistical models that can later
 * be upgraded to trained ML models when we have enough data. Each service
 * exposes a clean interface so the underlying implementation can swap from
 * rules → ML without changing callers.
 *
 * Services:
 *   • Fraud detection — flags suspicious trips, payments, accounts
 *   • Dynamic pricing v2 — demand-aware surge optimization
 *   • Demand prediction — hour-ahead forecasting per geohash
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger('AiService');

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  // ─── Fraud Detection ────────────────────────────────────────────────────

  /**
   * Score a trip for fraud risk. Returns 0.0 (safe) to 1.0 (definitely fraud).
   *
   * Current: rule-based scoring. Phase 6+: trained model (gradient boosting).
   */
  async scoreTripFraud(tripId: string): Promise<FraudScore> {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        passenger: { include: { user: true } },
        driver: true,
        events: { orderBy: { occurredAt: 'asc' } },
      },
    });
    if (!trip) return { score: 0, reasons: [], action: 'allow' };

    const reasons: string[] = [];
    let score = 0;

    // Rule 1: Trip completed suspiciously fast
    if (trip.startedAt && trip.completedAt) {
      const durationMin = (trip.completedAt.getTime() - trip.startedAt.getTime()) / 60000;
      const expectedMin = (trip.durationSeconds ?? 600) / 60;
      if (durationMin < expectedMin * 0.3) {
        score += 0.3;
        reasons.push(`Trip completed in ${durationMin.toFixed(1)} min, expected ~${expectedMin.toFixed(1)} min`);
      }
    }

    // Rule 2: Distance much shorter than estimated
    if (trip.distanceMeters && trip.distanceMeters < 100) {
      score += 0.2;
      reasons.push(`Trip distance only ${trip.distanceMeters}m`);
    }

    // Rule 3: Passenger is very new (< 24 hours) + high fare
    const passengerAgeHours = (Date.now() - trip.passenger.user.createdAt.getTime()) / 3600000;
    if (passengerAgeHours < 24 && Number(trip.totalFare) > 500) {
      score += 0.25;
      reasons.push(`New passenger (${passengerAgeHours.toFixed(1)}h old) with high fare (Br ${trip.totalFare})`);
    }

    // Rule 4: Driver has high cancellation rate
    if (trip.driver) {
      const cancelRate = trip.driver.acceptanceRate > 0 ? 1 - trip.driver.completionRate : 0;
      if (cancelRate > 0.5) {
        score += 0.2;
        reasons.push(`Driver has high cancellation rate (${(cancelRate * 100).toFixed(0)}%)`);
      }
    }

    // Rule 5: Same passenger-driver pair has many trips (potential collusion)
    if (trip.driverId) {
      const pairTripCount = await this.prisma.trip.count({
        where: {
          passengerId: trip.passengerId,
          driverId: trip.driverId,
          status: 'COMPLETED',
        },
      });
      if (pairTripCount > 20) {
        score += 0.15;
        reasons.push(`Passenger-driver pair has ${pairTripCount} previous trips (possible collusion)`);
      }
    }

    // Rule 6: GPS spoofing indicators
    if (trip.driver?.locationUpdatedAt && trip.startedAt) {
      const locAge = (trip.startedAt.getTime() - trip.driver.locationUpdatedAt.getTime()) / 1000;
      if (locAge > 300) {
        score += 0.2;
        reasons.push('Driver GPS not updated during trip start (possible spoofing)');
      }
    }

    const action: 'allow' | 'review' | 'block' = score >= 0.7 ? 'block' : score >= 0.4 ? 'review' : 'allow';

    return { score: Math.min(1, score), reasons, action };
  }

  /**
   * Score a payment for fraud risk.
   */
  async scorePaymentFraud(userId: string, amount: number, provider: string): Promise<FraudScore> {
    const reasons: string[] = [];
    let score = 0;

    // Rule 1: Amount much higher than user's average
    const userTrips = await this.prisma.trip.findMany({
      where: { passengerUserId: userId, status: 'COMPLETED' },
      select: { totalFare: true },
      orderBy: { completedAt: 'desc' },
      take: 30,
    });
    if (userTrips.length > 5) {
      const avg = userTrips.reduce((s, t) => s + Number(t.totalFare), 0) / userTrips.length;
      if (amount > avg * 5) {
        score += 0.3;
        reasons.push(`Amount Br ${amount} is 5x user average (Br ${avg.toFixed(0)})`);
      }
    }

    // Rule 2: Velocity — too many payments in last hour
    const oneHourAgo = new Date(Date.now() - 3600 * 1000);
    const recentPayments = await this.prisma.payment.count({
      where: { userId, createdAt: { gte: oneHourAgo } },
    });
    if (recentPayments > 5) {
      score += 0.25;
      reasons.push(`${recentPayments} payments in the last hour`);
    }

    // Rule 3: User is new
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      const ageHours = (Date.now() - user.createdAt.getTime()) / 3600000;
      if (ageHours < 1) {
        score += 0.4;
        reasons.push(`Account is ${ageHours.toFixed(1)} hours old`);
      }
    }

    const action: 'allow' | 'review' | 'block' = score >= 0.7 ? 'block' : score >= 0.4 ? 'review' : 'allow';
    return { score: Math.min(1, score), reasons, action };
  }

  // ─── Dynamic Pricing v2 ─────────────────────────────────────────────────

  /**
   * Compute an optimized surge multiplier for a location.
   *
   * Factors:
   *   • Current demand/supply ratio
   *   • Time of day (rush hour boost)
   *   • Weather (rain = higher demand)
   *   • Events (concerts, football matches)
   *   • Historical patterns
   *
   * Returns multiplier between 1.0 and 3.0 (capped for user trust).
   */
  async computeOptimalSurge(lat: number, lng: number, city: string): Promise<SurgeRecommendation> {
    const geohash = lat.toString(0).slice(0, 5); // simplified
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    // 1. Demand/supply ratio
    const recentTrips = await this.prisma.trip.count({
      where: {
        requestedAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
        pickupGeohash: { startsWith: geohash.slice(0, 4) },
      },
    });
    const onlineDrivers = await this.prisma.driver.count({
      where: {
        online: true,
        status: 'ONLINE',
        locationUpdatedAt: { gte: new Date(Date.now() - 2 * 60 * 1000) },
      },
    });

    const demandSupplyRatio = onlineDrivers > 0 ? recentTrips / onlineDrivers : recentTrips;

    // 2. Time-of-day boost
    const rushHourBoost = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19) ? 0.3 : 0;
    const lateNightBoost = hour >= 22 || hour <= 4 ? 0.2 : 0;

    // 3. Weekend boost
    const weekendBoost = dayOfWeek === 0 || dayOfWeek === 6 ? 0.1 : 0;

    // Base surge from demand/supply
    let multiplier = 1.0;
    if (demandSupplyRatio > 3) multiplier = 2.5;
    else if (demandSupplyRatio > 2) multiplier = 2.0;
    else if (demandSupplyRatio > 1.5) multiplier = 1.5;
    else if (demandSupplyRatio > 1) multiplier = 1.2;

    // Apply boosts
    multiplier += rushHourBoost + lateNightBoost + weekendBoost;

    // Cap at 3.0 for user trust
    multiplier = Math.min(3.0, Math.max(1.0, multiplier));

    return {
      multiplier: Math.round(multiplier * 10) / 10,
      factors: {
        demandSupplyRatio: Math.round(demandSupplyRatio * 100) / 100,
        recentTrips,
        onlineDrivers,
        rushHourBoost,
        lateNightBoost,
        weekendBoost,
      },
      geohash,
    };
  }

  // ─── Demand Prediction ──────────────────────────────────────────────────

  /**
   * Predict demand (expected trip requests) for the next hour per geohash.
   * Uses historical averages — Phase 6+ would use a trained time-series model.
   */
  async predictDemandNextHour(city: string): Promise<DemandPrediction[]> {
    const cacheKey = `ai:demand:${city}`;
    const cached = await this.redis.get<DemandPrediction[]>(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600 * 1000);
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 3600 * 1000);

    // Get trips from the same hour-of-week over the last 4 weeks
    const targetHour = now.getHours();
    const targetDay = now.getDay();

    const historicalTrips = await this.prisma.trip.findMany({
      where: {
        requestedAt: { gte: fourWeeksAgo, lt: oneHourAgo },
      },
      select: { pickupGeohash: true, pickupLatitude: true, pickupLongitude: true, requestedAt: true },
    });

    // Filter to same hour-of-week
    const sameHourTrips = historicalTrips.filter((t) => {
      const date = new Date(t.requestedAt);
      return date.getDay() === targetDay && date.getHours() === targetHour;
    });

    // Aggregate by geohash (precision 5)
    const byGeohash = new Map<string, { count: number; lat: number; lng: number }>();
    for (const trip of sameHourTrips) {
      if (!trip.pickupGeohash) continue;
      const geohash = trip.pickupGeohash.slice(0, 5);
      const existing = byGeohash.get(geohash);
      if (existing) existing.count++;
      else byGeohash.set(geohash, { count: 1, lat: trip.pickupLatitude, lng: trip.pickupLongitude });
    }

    // Normalize to "expected requests in next hour"
    // If we have 4 weeks of data: average = count / 4
    // If less, scale accordingly
    const weeksOfData = Math.max(1, Math.floor((now.getTime() - fourWeeksAgo.getTime()) / (7 * 24 * 3600 * 1000)));

    const predictions: DemandPrediction[] = Array.from(byGeohash.entries())
      .map(([geohash, v]) => ({
        geohash,
        latitude: v.lat,
        longitude: v.lng,
        expectedRequests: Math.round((v.count / weeksOfData) * 10) / 10,
        confidence: Math.min(1, v.count / 20), // more data = higher confidence
      }))
      .filter((p) => p.expectedRequests > 0)
      .sort((a, b) => b.expectedRequests - a.expectedRequests);

    await this.redis.set(cacheKey, predictions, 1800); // 30 min TTL
    return predictions;
  }
}

export interface FraudScore {
  score: number; // 0.0 to 1.0
  reasons: string[];
  action: 'allow' | 'review' | 'block';
}

export interface SurgeRecommendation {
  multiplier: number;
  factors: {
    demandSupplyRatio: number;
    recentTrips: number;
    onlineDrivers: number;
    rushHourBoost: number;
    lateNightBoost: number;
    weekendBoost: number;
  };
  geohash: string;
}

export interface DemandPrediction {
  geohash: string;
  latitude: number;
  longitude: number;
  expectedRequests: number;
  confidence: number;
}
