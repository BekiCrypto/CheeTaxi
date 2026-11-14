import { LocationPoint } from '../../../shared/types.js';
import { AddisLandmark, ADDIS_LANDMARKS } from '../../../shared/landmarks.js';

export { AddisLandmark, ADDIS_LANDMARKS };

/**
 * Calculates straight line distance (Haversine formula) in kilometers
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
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
  return R * c;
}

/**
 * Estimates realistic road distance and travel duration in Addis Ababa
 * City streets tortuosity factor ~1.28
 * Average speed ~ 24 km/h factoring in roundabouts & traffic
 */
export function estimateRoadMetrics(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): { distanceKm: number; durationMinutes: number } {
  const haversine = calculateHaversineDistance(lat1, lon1, lat2, lon2);
  const roadFactor = 1.28;
  const distanceKm = Math.max(1.0, Number((haversine * roadFactor).toFixed(2)));

  // Average city speed 24 km/h => 2.5 minutes per km + 3 minutes base buffer for signals
  const durationMinutes = Math.max(
    5,
    Math.round(distanceKm * 2.5 + 3)
  );

  return { distanceKm, durationMinutes };
}

/**
 * Generates an interpolated realistic route between two coordinates
 */
export function generateRouteCoordinates(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  steps: number = 20
): [number, number][] {
  const coordinates: [number, number][] = [];

  // Intermediate curve accounting for Addis Ababa road topography and elevation gradient
  const midLat = (startLat + endLat) / 2 + (Math.sin((startLng + endLng) * 10) * 0.003);
  const midLng = (startLng + endLng) / 2 + (Math.cos((startLat + endLat) * 10) * 0.003);

  // First half (start to mid)
  const halfSteps = Math.floor(steps / 2);
  for (let i = 0; i <= halfSteps; i++) {
    const t = i / halfSteps;
    const lat = startLat + (midLat - startLat) * t;
    const lng = startLng + (midLng - startLng) * t;
    coordinates.push([Number(lat.toFixed(6)), Number(lng.toFixed(6))]);
  }

  // Second half (mid to end)
  for (let i = 1; i <= halfSteps; i++) {
    const t = i / halfSteps;
    const lat = midLat + (endLat - midLat) * t;
    const lng = midLng + (endLng - midLng) * t;
    coordinates.push([Number(lat.toFixed(6)), Number(lng.toFixed(6))]);
  }

  return coordinates;
}

/**
 * Searches places in Addis Ababa by query string
 */
export function searchAddisPlaces(query: string): AddisLandmark[] {
  if (!query || query.trim().length === 0) {
    return ADDIS_LANDMARKS.slice(0, 6);
  }

  const q = query.toLowerCase().trim();
  return ADDIS_LANDMARKS.filter(
    (item) =>
      item.name.toLowerCase().includes(q) ||
      item.nameAm.includes(q) ||
      item.description.toLowerCase().includes(q)
  );
}

/**
 * Reverse geocodes nearest landmark or constructs readable address
 */
export function reverseGeocodeAddis(lat: number, lng: number): LocationPoint {
  let closest = ADDIS_LANDMARKS[0];
  let minDistance = Infinity;

  for (const landmark of ADDIS_LANDMARKS) {
    const d = calculateHaversineDistance(lat, lng, landmark.lat, landmark.lng);
    if (d < minDistance) {
      minDistance = d;
      closest = landmark;
    }
  }

  if (minDistance < 0.6) {
    return {
      address: closest.name,
      addressAm: closest.nameAm,
      lat,
      lng,
      landmark: closest.name,
    };
  }

  return {
    address: `Near ${closest.name} (${minDistance.toFixed(1)} km), Addis Ababa`,
    addressAm: `${closest.nameAm} አቅራቢያ (${minDistance.toFixed(1)} ኪ.ሜ)፣ አዲስ አበባ`,
    lat,
    lng,
    landmark: closest.name,
  };
}
