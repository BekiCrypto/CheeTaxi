import { Ride, LocationPoint, AggregatorProviderId } from './types.js';

export interface TripValueMetrics {
  compositeScore: number; // 0 to 100
  effectiveHourlyRateEtb: number; // Net earnings / (Total engagement hours)
  netTakeHomeEtb: number; // Total fare - platform fee - fuel expense
  fuelCostEstimateEtb: number; // (pickup distance + trip distance) * fuel cost/km
  pickupDistanceKm: number;
  pickupEtaMinutes: number;
  tripDistanceKm: number;
  tripDurationMinutes: number;
  totalEngagementMinutes: number;
  trafficIndex: number; // 1.0 (light) to 1.8 (heavy)
  trafficDescription: string;
  surgeMultiplier: number;
  isAiRecommended: boolean;
  recommendationTag: string; // e.g. "★ HIGHEST HOURLY PROFIT (+48%)"
  recommendationReason: string; // e.g. "Shortest pickup (0.9km) + 0% platform commission"
  profitAdvantagePercent?: number; // % advantage over the lowest competing offer
}

export interface MultiProviderRideOffer extends Ride {
  providerId: AggregatorProviderId;
  providerName: string;
  providerLogo?: string;
  commissionRate: number; // 0.0 for Chebelew, 0.12 - 0.15 for third parties
  valueMetrics: TripValueMetrics;
  expiresInSeconds: number;
}

// Fuel cost benchmark in Addis Ababa: ~4.2 ETB per kilometer
const FUEL_COST_PER_KM = 4.2;

/**
 * Calculates haversine distance between two coordinates in kilometers
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Estimates traffic congestion index for prominent Addis Ababa corridors
 */
export function estimateCorridorTraffic(pickup: LocationPoint, destination: LocationPoint): {
  index: number;
  description: string;
} {
  const addressCombined = `${pickup.address || ''} ${destination.address || ''}`.toLowerCase();

  if (addressCombined.includes('airport') || addressCombined.includes('bole') || addressCombined.includes('ring road')) {
    return { index: 1.05, description: 'Express Corridor (Fast Flow)' };
  } else if (addressCombined.includes('piassa') || addressCombined.includes('mercato') || addressCombined.includes('autobus')) {
    return { index: 1.65, description: 'Dense Urban Zone (Heavy Congestion)' };
  } else if (addressCombined.includes('kazanchis') || addressCombined.includes('meskel') || addressCombined.includes('mexico')) {
    return { index: 1.35, description: 'Moderate City Traffic' };
  } else if (addressCombined.includes('cmc') || addressCombined.includes('ayat') || addressCombined.includes('lebu')) {
    return { index: 1.15, description: 'Suburban Arterial (Smooth)' };
  }

  return { index: 1.25, description: 'Standard Addis Traffic' };
}

/**
 * Evaluates a single ride offer and calculates its AI Trip Value metrics
 */
export function evaluateTripValue(
  ride: Ride,
  driverLocation: { lat: number; lng: number },
  providerOverrides?: {
    providerId?: AggregatorProviderId;
    providerName?: string;
    commissionRate?: number;
    surgeMultiplier?: number;
  }
): MultiProviderRideOffer {
  const providerId: AggregatorProviderId = providerOverrides?.providerId || (ride.providerId as AggregatorProviderId) || 'chebelew';
  const commissionRate = providerOverrides?.commissionRate ?? (providerId === 'chebelew' ? 0.0 : 0.15);
  const surgeMultiplier = providerOverrides?.surgeMultiplier ?? 1.0;

  let providerName = providerOverrides?.providerName;
  if (!providerName) {
    switch (providerId) {
      case 'chebelew':
        providerName = 'Chebelew Direct (0% Fee)';
        break;
      case 'yango':
        providerName = 'Yango Partner Bridge';
        break;
      case 'ride':
        providerName = 'RIDE Partner Fleet';
        break;
      case 'feres':
        providerName = 'Feres Dispatch Network';
        break;
      default:
        providerName = 'Multi-Provider Aggregator';
    }
  }

  // 1. Pickup proximity and deadheading
  const pickupDist = calculateDistanceKm(
    driverLocation.lat,
    driverLocation.lng,
    ride.pickup.lat,
    ride.pickup.lng
  );
  const pickupEta = Math.max(2, Math.round(pickupDist * 2.2 + 1));

  // 2. Traffic estimation
  const traffic = estimateCorridorTraffic(ride.pickup, ride.destination);
  const tripDurationMinutes = Math.round(ride.durationMinutes * traffic.index);
  const totalEngagementMinutes = pickupEta + tripDurationMinutes;
  const totalEngagementHours = Math.max(0.1, totalEngagementMinutes / 60);

  // 3. Financial Net Payout calculation
  const grossFare = ride.fare?.totalFare || 380;
  const platformFee = grossFare * commissionRate;
  const totalDistance = pickupDist + ride.distanceKm;
  const fuelExpense = Number((totalDistance * FUEL_COST_PER_KM).toFixed(2));
  const netTakeHome = Math.max(0, Math.round(grossFare - platformFee - fuelExpense));

  // 4. Effective Hourly Take-Home Rate
  const effectiveHourlyRate = Math.round(netTakeHome / totalEngagementHours);

  // 5. Composite Value Score (0 - 100)
  // - 40% Hourly Rate (benchmarked against 500 ETB/hr target)
  // - 30% Pickup Proximity (< 1.5km = max score)
  // - 20% Net Profit Margin
  // - 10% Traffic & Ease
  const hourlyScore = Math.min(40, (effectiveHourlyRate / 600) * 40);
  const proximityScore = Math.max(0, Math.min(30, 30 - (pickupDist - 0.5) * 6));
  const marginScore = Math.min(20, (netTakeHome / grossFare) * 20);
  const trafficEaseScore = Math.max(0, Math.min(10, 10 - (traffic.index - 1.0) * 12));

  const compositeScore = Math.round(hourlyScore + proximityScore + marginScore + trafficEaseScore);

  let recommendationTag = '⚡ GOOD MATCH';
  let recommendationReason = 'Standard rate along active corridor';

  if (effectiveHourlyRate >= 500 && pickupDist <= 2.0) {
    recommendationTag = '★ TOP VALUE (+45% Net/hr)';
    recommendationReason = `Quick ${pickupDist}km pickup with ${effectiveHourlyRate} ETB/hr net in-pocket`;
  } else if (pickupDist <= 1.2) {
    recommendationTag = '⚡ FASTEST PICKUP';
    recommendationReason = `Only ${pickupDist}km (${pickupEta} mins) away at ${ride.pickup.address?.substring(0, 24)}...`;
  } else if (grossFare >= 600) {
    recommendationTag = '💰 HIGH FARE CORRIDOR';
    recommendationReason = `Long haul trip: ${grossFare} ETB gross (${ride.distanceKm} km)`;
  } else if (commissionRate === 0.0) {
    recommendationTag = '🛡️ 100% IN-POCKET';
    recommendationReason = '0% Chebelew Platform Fee — Keep every Birr of fare';
  }

  const valueMetrics: TripValueMetrics = {
    compositeScore: Math.min(99, Math.max(10, compositeScore)),
    effectiveHourlyRateEtb: effectiveHourlyRate,
    netTakeHomeEtb: netTakeHome,
    fuelCostEstimateEtb: fuelExpense,
    pickupDistanceKm: pickupDist,
    pickupEtaMinutes: pickupEta,
    tripDistanceKm: ride.distanceKm,
    tripDurationMinutes,
    totalEngagementMinutes,
    trafficIndex: traffic.index,
    trafficDescription: traffic.description,
    surgeMultiplier,
    isAiRecommended: false,
    recommendationTag,
    recommendationReason,
  };

  return {
    ...ride,
    providerId,
    providerName,
    commissionRate,
    valueMetrics,
    expiresInSeconds: 15,
  };
}

/**
 * Ranks multiple simultaneous ride offers and tags the optimal AI recommendation
 */
export function rankAndRecommendOffers(
  offers: Ride[],
  driverLocation: { lat: number; lng: number }
): MultiProviderRideOffer[] {
  if (!offers || offers.length === 0) return [];

  // Evaluate each offer
  const scoredOffers = offers.map((offer, idx) => {
    // Generate distinct provider parameters if not already specified
    let providerId: AggregatorProviderId = (offer.providerId as AggregatorProviderId) || 'chebelew';
    let providerName: string | undefined = undefined;
    let commissionRate = 0.0;

    if (idx === 1 && providerId === 'chebelew') {
      providerId = 'yango';
      providerName = 'Yango Partner Bridge';
      commissionRate = 0.12;
    } else if (idx === 2 && providerId === 'chebelew') {
      providerId = 'ride';
      providerName = 'RIDE Partner Fleet';
      commissionRate = 0.15;
    }

    return evaluateTripValue(offer, driverLocation, {
      providerId,
      providerName,
      commissionRate,
    });
  });

  // Sort by composite score descending
  scoredOffers.sort((a, b) => b.valueMetrics.compositeScore - a.valueMetrics.compositeScore);

  // Tag #1 as AI recommended
  if (scoredOffers.length > 0) {
    scoredOffers[0].valueMetrics.isAiRecommended = true;

    // Calculate comparative profit advantage if competing offers exist
    if (scoredOffers.length > 1) {
      const best = scoredOffers[0].valueMetrics.effectiveHourlyRateEtb;
      const runnerUp = scoredOffers[1].valueMetrics.effectiveHourlyRateEtb;
      if (runnerUp > 0 && best > runnerUp) {
        const diffPercent = Math.round(((best - runnerUp) / runnerUp) * 100);
        scoredOffers[0].valueMetrics.profitAdvantagePercent = diffPercent;
        scoredOffers[0].valueMetrics.recommendationTag = `★ AI TOP VALUE (+${diffPercent}% Net/hr)`;
      }
    }
  }

  return scoredOffers;
}
