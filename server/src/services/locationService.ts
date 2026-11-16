import { db } from '../db/database.js';
import { calculateHaversineDistance } from './geoService.js';

export interface DriverLiveLocation {
  driverId: string;
  lat: number;
  lng: number;
  heading: number;
  activeRideId?: string | null;
  updatedAt: number; // Unix timestamp in ms
  dirty: boolean;
}

export class LocationService {
  private static store = new Map<string, DriverLiveLocation>();
  private static flushIntervalTimer: NodeJS.Timeout | null = null;
  private static STALE_THRESHOLD_MS = 90 * 1000; // 90 seconds per Directive 6A

  /**
   * Initializes the in-memory store from database and starts background batch flush
   */
  static init() {
    try {
      const rows = db.prepare('SELECT id, current_lat, current_lng, heading, active_ride_id FROM drivers').all() as any[];
      const now = Date.now();
      for (const r of rows) {
        if (r.current_lat && r.current_lng) {
          this.store.set(r.id, {
            driverId: r.id,
            lat: Number(r.current_lat),
            lng: Number(r.current_lng),
            heading: Number(r.heading || 0),
            activeRideId: r.active_ride_id || null,
            updatedAt: now,
            dirty: false,
          });
        }
      }
    } catch (e) {
      // Table may not yet be initialized in some test sequences
    }

    if (!this.flushIntervalTimer) {
      this.flushIntervalTimer = setInterval(() => {
        this.flushDirtyLocations();
      }, 10000).unref(); // Batch flush every 10 seconds
    }
  }

  /**
   * Update or record live driver location in memory
   * Zero disk I/O on hot path
   */
  static updateLocation(driverId: string, lat: number, lng: number, heading = 0, activeRideId?: string | null) {
    const existing = this.store.get(driverId);
    this.store.set(driverId, {
      driverId,
      lat,
      lng,
      heading,
      activeRideId: activeRideId !== undefined ? activeRideId : (existing?.activeRideId || null),
      updatedAt: Date.now(),
      dirty: true,
    });
  }

  /**
   * Get current live location for driver
   */
  static getLocation(driverId: string): DriverLiveLocation | null {
    const loc = this.store.get(driverId);
    if (loc) return loc;

    // Fallback query from db if not in memory
    try {
      const r = db.prepare('SELECT id, current_lat, current_lng, heading, active_ride_id, location_updated_at FROM drivers WHERE id = ?').get(driverId) as any;
      if (r && r.current_lat && r.current_lng) {
        const parsed = {
          driverId: r.id,
          lat: Number(r.current_lat),
          lng: Number(r.current_lng),
          heading: Number(r.heading || 0),
          activeRideId: r.active_ride_id || null,
          updatedAt: r.location_updated_at ? new Date(r.location_updated_at).getTime() : Date.now(),
          dirty: false,
        };
        this.store.set(driverId, parsed);
        return parsed;
      }
    } catch (e) {}

    return null;
  }

  /**
   * Checks whether a driver's GPS coordinates are stale (> 90 seconds old)
   */
  static isDriverStale(driverId: string, customThresholdMs = this.STALE_THRESHOLD_MS): boolean {
    const loc = this.getLocation(driverId);
    if (!loc) return true;
    return (Date.now() - loc.updatedAt) > customThresholdMs;
  }

  /**
   * Find nearby active drivers in memory within maxRadiusKm
   */
  static findNearbyDrivers(lat: number, lng: number, maxRadiusKm: number, maxAgeMs = this.STALE_THRESHOLD_MS): { driverId: string; distanceKm: number; lat: number; lng: number }[] {
    const now = Date.now();
    const results: { driverId: string; distanceKm: number; lat: number; lng: number }[] = [];

    for (const loc of this.store.values()) {
      if ((now - loc.updatedAt) > maxAgeMs) continue; // Exclude stale GPS signals
      const dist = calculateHaversineDistance(lat, lng, loc.lat, loc.lng);
      if (dist <= maxRadiusKm) {
        results.push({
          driverId: loc.driverId,
          distanceKm: dist,
          lat: loc.lat,
          lng: loc.lng,
        });
      }
    }

    return results.sort((a, b) => a.distanceKm - b.distanceKm);
  }

  /**
   * Flush all dirty locations to SQLite in a single batched transaction
   */
  static flushDirtyLocations(): number {
    const dirtyRecords: DriverLiveLocation[] = [];
    for (const loc of this.store.values()) {
      if (loc.dirty) {
        dirtyRecords.push(loc);
        loc.dirty = false;
      }
    }

    if (dirtyRecords.length === 0) return 0;

    try {
      const updateStmt = db.prepare(`
        UPDATE drivers
        SET current_lat = ?, current_lng = ?, heading = ?, location_updated_at = ?
        WHERE id = ?
      `);

      const flushTx = db.transaction((records: DriverLiveLocation[]) => {
        const nowIso = new Date().toISOString();
        for (const rec of records) {
          updateStmt.run(rec.lat, rec.lng, rec.heading, nowIso, rec.driverId);
        }
      });

      flushTx(dirtyRecords);
    } catch (err) {
      console.error('Error flushing dirty driver locations to SQLite:', err);
    }

    return dirtyRecords.length;
  }

  /**
   * Immediately flush a single driver or all to disk
   */
  static flushImmediate(driverId?: string) {
    if (driverId) {
      const loc = this.store.get(driverId);
      if (loc) {
        try {
          db.prepare(`
            UPDATE drivers
            SET current_lat = ?, current_lng = ?, heading = ?, location_updated_at = ?
            WHERE id = ?
          `).run(loc.lat, loc.lng, loc.heading, new Date().toISOString(), driverId);
          loc.dirty = false;
        } catch (e) {}
      }
    } else {
      this.flushDirtyLocations();
    }
  }

  /**
   * Clear in-memory store and stop timer (useful for test tear-downs)
   */
  static reset() {
    if (this.flushIntervalTimer) {
      clearInterval(this.flushIntervalTimer);
      this.flushIntervalTimer = null;
    }
    this.store.clear();
  }

  static getStoreSize(): number {
    return this.store.size;
  }
}

// Automatically initialize on import
LocationService.init();
