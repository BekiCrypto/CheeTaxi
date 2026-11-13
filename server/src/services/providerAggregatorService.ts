import {
  AggregatedTransportOffer,
  AggregatorProviderId,
  CircuitBreakerState,
  LocationPoint,
  ProviderAdapterConfig,
  VehicleCategory,
} from '../../../shared/types.js';
import { estimateRoadMetrics } from './geoService.js';
import { calculateFare } from './fareService.js';
import { DispatchService } from './dispatchService.js';

interface ProviderState {
  config: ProviderAdapterConfig;
  failureCount: number;
  lastFailureTime?: number;
}

export class ProviderAggregatorService {
  private static providers: Map<AggregatorProviderId, ProviderState> = new Map([
    [
      'chebelew',
      {
        config: {
          id: 'chebelew',
          name: 'Chebelew Independent Fleet',
          apiUrl: 'internal://chebelew-dispatch',
          circuitState: 'CLOSED',
          failureCount: 0,
          isAuthorized: true,
          integrationReadinessStatus: 'live_api',
        },
        failureCount: 0,
      },
    ],
    [
      'ride',
      {
        config: {
          id: 'ride',
          name: 'RIDE (Hybrid Designs PLC)',
          apiUrl: 'https://api.partner.ride-ethiopia.com/v1',
          circuitState: 'CLOSED',
          failureCount: 0,
          isAuthorized: true,
          integrationReadinessStatus: 'sandbox_adapter',
        },
        failureCount: 0,
      },
    ],
    [
      'feres',
      {
        config: {
          id: 'feres',
          name: 'Feres Technologies',
          apiUrl: 'https://api.partner.feres.et/v1',
          circuitState: 'CLOSED',
          failureCount: 0,
          isAuthorized: true,
          integrationReadinessStatus: 'sandbox_adapter',
        },
        failureCount: 0,
      },
    ],
    [
      'zayride',
      {
        config: {
          id: 'zayride',
          name: 'ZayRide Platform',
          apiUrl: 'https://api.zayride.et/v2',
          circuitState: 'CLOSED',
          failureCount: 0,
          isAuthorized: false,
          integrationReadinessStatus: 'onboarding_readiness',
        },
        failureCount: 0,
      },
    ],
  ]);

  /**
   * Simulates or triggers a provider circuit breaker failure
   */
  static recordProviderFailure(providerId: AggregatorProviderId) {
    const p = this.providers.get(providerId);
    if (!p) return;

    p.failureCount += 1;
    p.lastFailureTime = Date.now();

    if (p.failureCount >= 3) {
      p.config.circuitState = 'OPEN';
      console.warn(`[CircuitBreaker] Provider ${providerId} tripped OPEN due to repeated failures.`);
    }
  }

  /**
   * Resets a provider circuit breaker to CLOSED
   */
  static resetProviderCircuit(providerId: AggregatorProviderId) {
    const p = this.providers.get(providerId);
    if (!p) return;

    p.failureCount = 0;
    p.config.circuitState = 'CLOSED';
    p.lastFailureTime = undefined;
  }

  /**
   * Retrieves all provider statuses and circuit health
   */
  static getProviderStatuses(): ProviderAdapterConfig[] {
    return Array.from(this.providers.values()).map((p) => p.config);
  }

  /**
   * Unified normalized multi-provider search & ranking
   */
  static searchAndRankOffers(
    pickup: LocationPoint,
    destination: LocationPoint,
    category: VehicleCategory = 'sedan'
  ): AggregatedTransportOffer[] {
    const metrics = estimateRoadMetrics(pickup.lat, pickup.lng, destination.lat, destination.lng);
    const offers: AggregatedTransportOffer[] = [];

    // 1. Chebelew Independent Fleet (Always authoritative, 0% commission model)
    const chebelewFare = calculateFare(category, metrics.distanceKm, metrics.durationMinutes);
    const chebelewAvailable = DispatchService.findEligibleDrivers(pickup.lat, pickup.lng, category).length > 0;

    offers.push({
      providerId: 'chebelew',
      providerName: 'Chebelew Standard (Direct Dispatch)',
      category,
      estimatedFare: chebelewFare.totalFare,
      currency: 'ETB',
      estimatedArrivalMins: chebelewAvailable ? 4 : 7,
      journeyDurationMins: metrics.durationMinutes,
      vehicleDetails: 'Vetted Chebelew Driver • 100% Earnings Retention',
      reliabilityScore: 98,
      isAvailable: true,
      circuitStatus: 'CLOSED',
    });

    // 2. Query External Aggregated Partners through Adapter Architecture
    for (const [id, provider] of this.providers.entries()) {
      if (id === 'chebelew') continue;

      // Check Circuit Breaker
      if (provider.config.circuitState === 'OPEN') {
        const cooldown = 30000; // 30s probe cooldown
        if (Date.now() - (provider.lastFailureTime || 0) > cooldown) {
          provider.config.circuitState = 'HALF_OPEN';
        } else {
          // Provider offline / failed: Circuit is open, present as unavailable to passenger with OPEN status
          offers.push({
            providerId: id,
            providerName: provider.config.name,
            category,
            estimatedFare: 0,
            currency: 'ETB',
            estimatedArrivalMins: 0,
            journeyDurationMins: metrics.durationMinutes,
            vehicleDetails: 'Provider temporarily offline (Circuit Breaker Tripped)',
            reliabilityScore: 0,
            isAvailable: false,
            circuitStatus: 'OPEN',
          });
          continue;
        }
      }

      // Partner price normalization
      let partnerFare = chebelewFare.totalFare;
      let etaMins = 5;
      let vehicleText = 'Partner Taxi Network';
      let score = 92;

      if (id === 'ride') {
        partnerFare = Number((chebelewFare.totalFare * 1.08).toFixed(2));
        etaMins = 3;
        vehicleText = '30,000+ Cabs Standby • Meter Tariff';
        score = 94;
      } else if (id === 'feres') {
        partnerFare = Number((chebelewFare.totalFare * 0.98).toFixed(2));
        etaMins = 6;
        vehicleText = 'Feres Miles Cashback Eligible';
        score = 89;
      } else if (id === 'zayride') {
        partnerFare = Number((chebelewFare.totalFare * 1.02).toFixed(2));
        etaMins = 8;
        vehicleText = 'Fixed Meter Fleet';
        score = 87;
      }

      offers.push({
        providerId: id,
        providerName: provider.config.name,
        category,
        estimatedFare: partnerFare,
        currency: 'ETB',
        estimatedArrivalMins: etaMins,
        journeyDurationMins: metrics.durationMinutes,
        vehicleDetails: vehicleText,
        reliabilityScore: score,
        isAvailable: provider.config.isAuthorized,
        circuitStatus: provider.config.circuitState,
      });
    }

    // Sort: Chebelew primary direct dispatch first, then available by lowest estimated fare
    return offers.sort((a, b) => {
      if (a.providerId === 'chebelew' && b.providerId !== 'chebelew') return -1;
      if (b.providerId === 'chebelew' && a.providerId !== 'chebelew') return 1;
      if (a.isAvailable && !b.isAvailable) return -1;
      if (!a.isAvailable && b.isAvailable) return 1;
      return a.estimatedFare - b.estimatedFare;
    });
  }
}
