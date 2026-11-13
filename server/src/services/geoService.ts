import { LocationPoint } from '../../../shared/types.js';

export interface AddisLandmark {
  id: string;
  name: string;
  nameAm: string;
  lat: number;
  lng: number;
  category: 'transit' | 'hotel' | 'commercial' | 'square' | 'institution';
  description: string;
}

export const ADDIS_LANDMARKS: AddisLandmark[] = [
  {
    id: 'bole_airport',
    name: 'Bole Addis Ababa International Airport',
    nameAm: 'ቦሌ ዓለም አቀፍ አውሮፕላን ማረፊያ',
    lat: 8.9778,
    lng: 38.7993,
    category: 'transit',
    description: 'Terminal 1 & 2 Departure / Arrival',
  },
  {
    id: 'meskel_square',
    name: 'Meskel Square',
    nameAm: 'መስቀል አደባባይ',
    lat: 9.0105,
    lng: 38.7615,
    category: 'square',
    description: 'City Center & Light Rail hub',
  },
  {
    id: 'kazanchis_uneca',
    name: 'UNECA Conference Centre (Kazanchis)',
    nameAm: 'የተመድ ኢኮኖሚክ ኮሚሽን (ካዛንቺስ)',
    lat: 9.0185,
    lng: 38.7705,
    category: 'institution',
    description: 'Kazanchis diplomatic & business quarter',
  },
  {
    id: 'piassa_churchill',
    name: 'Piassa & Churchill Avenue',
    nameAm: 'ፒያሳ እና ቸርችል ጎዳና',
    lat: 9.0345,
    lng: 38.7525,
    category: 'commercial',
    description: 'Historic retail and municipal hub',
  },
  {
    id: 'mexico_square',
    name: 'Mexico Square',
    nameAm: 'ሜክሲኮ አደባባይ',
    lat: 9.0101,
    lng: 38.7450,
    category: 'square',
    description: 'Commercial interchange & bus terminals',
  },
  {
    id: 'bole_medhanialem',
    name: 'Bole Medhanialem & Edna Mall Area',
    nameAm: 'ቦሌ መድኃኔዓለም እና ኤድና ሞል',
    lat: 8.9950,
    lng: 38.7880,
    category: 'commercial',
    description: 'Restaurants, malls, cafes corridor',
  },
  {
    id: 'megenagna',
    name: 'Megenagna Roundabout',
    nameAm: 'መገናኛ አደባባይ',
    lat: 9.0210,
    lng: 38.8020,
    category: 'transit',
    description: 'Major transit terminal & commerce',
  },
  {
    id: 'sarbet_au',
    name: 'Sarbet & African Union HQ',
    nameAm: 'ሳርቤት እና የአፍሪካ ህብረት ዋና መሥሪያ ቤት',
    lat: 8.9970,
    lng: 38.7360,
    category: 'institution',
    description: 'AU Headquarters & diplomatic residences',
  },
  {
    id: 'mercato',
    name: 'Addis Mercato (Grand Market)',
    nameAm: 'አዲስ መርካቶ',
    lat: 9.0300,
    lng: 38.7390,
    category: 'commercial',
    description: "Africa's largest open-air commercial market",
  },
  {
    id: 'cmc_michael',
    name: 'CMC St. Michael Area',
    nameAm: 'ሲኤምሲ ቅዱስ ሚካኤል አካባቢ',
    lat: 9.0240,
    lng: 38.8550,
    category: 'commercial',
    description: 'Eastern residential & commercial corridor',
  },
  {
    id: 'gotera',
    name: 'Gotera Interchange',
    nameAm: 'ጎተራ ማስተላለፊያ',
    lat: 8.9910,
    lng: 38.7550,
    category: 'transit',
    description: 'Debre Zeit Road junction',
  },
  {
    id: 'sheraton_addis',
    name: 'Sheraton Addis Luxury Collection',
    nameAm: 'ሸራተን አዲስ ሆቴል',
    lat: 9.0195,
    lng: 38.7610,
    category: 'hotel',
    description: 'Taitu Street luxury hotel',
  },
];

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

  // Intermediate slight curve to simulate Addis Ababa road network curvature
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
