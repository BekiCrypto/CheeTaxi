import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

// Geohash encode/decode (compact impl)
const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

export function encodeGeohash(lat: number, lng: number, precision = 7): string {
  let minLat = -90, maxLat = 90;
  let minLng = -180, maxLng = 180;
  let hash = '';
  let even = true;
  let bit = 0;
  let ch = 0;
  while (hash.length < precision) {
    if (even) {
      const mid = (minLng + maxLng) / 2;
      if (lng >= mid) { ch |= (1 << (4 - bit)); minLng = mid; }
      else { maxLng = mid; }
    } else {
      const mid = (minLat + maxLat) / 2;
      if (lat >= mid) { ch |= (1 << (4 - bit)); minLat = mid; }
      else { maxLat = mid; }
    }
    even = !even;
    if (bit < 4) { bit++; }
    else { hash += BASE32[ch]; bit = 0; ch = 0; }
  }
  return hash;
}

@Injectable()
export class GeoService {
  private readonly logger = new Logger('GeoService');

  constructor(private prisma: PrismaService) {}

  geohash(lat: number, lng: number, precision = 7): string {
    return encodeGeohash(lat, lng, precision);
  }

  /** Distance between two points in meters (Haversine). */
  haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
    const R = 6371000;
    const dLat = this.toRad(b.lat - a.lat);
    const dLng = this.toRad(b.lng - a.lng);
    const s =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRad(a.lat)) * Math.cos(this.toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  }

  /** ETA estimate in seconds (assumes ~25 km/h urban average). */
  etaSeconds(distanceMeters: number, avgSpeedKmh = 25): number {
    return Math.round((distanceMeters / 1000) / avgSpeedKmh * 3600);
  }

  /** Geocode an address string → coordinates. Uses OpenStreetMap Nominatim. */
  async geocode(address: string): Promise<{ latitude: number; longitude: number; displayName: string }[]> {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=5&addressdetails=1`;
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'CheeTaxi/1.0 (ops@cheetaxi.africa)' } });
      if (!res.ok) throw new Error(`Nominatim responded ${res.status}`);
      const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
      return data.map((d) => ({
        latitude: Number(d.lat),
        longitude: Number(d.lon),
        displayName: d.display_name,
      }));
    } catch (err) {
      this.logger.error(`Geocode failed for "${address}": ${(err as Error).message}`);
      return [];
    }
  }

  /** Reverse geocode coordinates → address. */
  async reverseGeocode(lat: number, lng: number): Promise<{ address: string; city?: string; country?: string } | null> {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'CheeTaxi/1.0 (ops@cheetaxi.africa)' } });
      if (!res.ok) throw new Error(`Nominatim responded ${res.status}`);
      const data = (await res.json()) as {
        display_name: string;
        address?: { city?: string; town?: string; country?: string };
      };
      return {
        address: data.display_name,
        city: data.address?.city ?? data.address?.town,
        country: data.address?.country,
      };
    } catch (err) {
      this.logger.error(`Reverse geocode failed: ${(err as Error).message}`);
      return null;
    }
  }

  /** Search places (landmarks, airports, etc.) by name. */
  async searchPlaces(query: string, country?: string, limit = 10) {
    return this.prisma.place.findMany({
      where: {
        name: { contains: query, mode: 'insensitive' },
        ...(country ? { country: country as any } : {}),
      },
      take: limit,
    });
  }

  /** Check if a point is inside any geofence of the given type. */
  async checkGeofence(lat: number, lng: number, type?: string): Promise<{ inside: boolean; geofences: any[] }> {
    // For simplicity, do a bounding-box check against stored geofences.
    // Production: use PostGIS ST_Contains or Turf.js.
    const geofences = await this.prisma.geofence.findMany({
      where: { isActive: true, ...(type ? { type } : {}) },
    });
    const matching: any[] = [];
    for (const g of geofences) {
      const geom = g.geometry as any;
      if (geom?.type !== 'Polygon') continue;
      if (this.pointInPolygon([lng, lat], geom.coordinates[0])) {
        matching.push({ id: g.id, name: g.name, type: g.type });
      }
    }
    return { inside: matching.length > 0, geofences: matching };
  }

  private pointInPolygon(point: [number, number], polygon: number[][]): boolean {
    let inside = false;
    const [x, y] = point;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];
      const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }
}
