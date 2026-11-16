/**
 * Chebelew Addis Driver Community Hazard & Traffic Radar ("ደራሽ / Derash")
 * 
 * Enables independent drivers across Addis Ababa to crowdsource and receive
 * real-time road condition alerts (traffic jams, traffic police checkpoints,
 * road closures, accidents, and driver emergency assistance).
 * 
 * Works completely independently without needing municipal or corporate APIs.
 */

import { v4 as uuidv4 } from 'uuid';

export type HazardType = 'traffic_jam' | 'police_checkpoint' | 'road_closure' | 'accident' | 'driver_sos';

export interface CommunityHazard {
  id: string;
  type: HazardType;
  reportedByDriverId: string;
  reportedByDriverName: string;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  description: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  upvotesCount: number;
  createdAt: string;
  expiresAt: string; // Typically 60-120 mins TTL
}

// In-memory active hazard cache (Addis road hazards are ephemeral)
const activeHazards: Map<string, CommunityHazard> = new Map();

// Seed initial prominent Addis Ababa traffic hotspots if empty
function initializeDefaultHotspots() {
  if (activeHazards.size === 0) {
    const now = Date.now();
    const hotspots: CommunityHazard[] = [
      {
        id: 'hazard_mzk_01',
        type: 'traffic_jam',
        reportedByDriverId: 'driver_ahmed_01',
        reportedByDriverName: 'Ahmed Kebede',
        location: {
          address: 'Mexico Square Roundabout',
          lat: 9.0105,
          lng: 38.7460,
        },
        description: 'Heavy bottleneck around Mexico Underpass heading to Tor Hailoch',
        severity: 'high',
        upvotesCount: 14,
        createdAt: new Date(now - 15 * 60000).toISOString(),
        expiresAt: new Date(now + 90 * 60000).toISOString(),
      },
      {
        id: 'hazard_meg_02',
        type: 'traffic_jam',
        reportedByDriverId: 'driver_samuel_02',
        reportedByDriverName: 'Samuel Bekele',
        location: {
          address: 'Megenagna Roundabout (Near Zefmesh Mall)',
          lat: 9.0210,
          lng: 38.7990,
        },
        description: 'Slow-moving queue on Ring Road off-ramp towards Bole',
        severity: 'moderate',
        upvotesCount: 9,
        createdAt: new Date(now - 25 * 60000).toISOString(),
        expiresAt: new Date(now + 60 * 60000).toISOString(),
      },
      {
        id: 'hazard_chk_03',
        type: 'police_checkpoint',
        reportedByDriverId: 'driver_dawit_03',
        reportedByDriverName: 'Dawit Mengistu',
        location: {
          address: 'Gotera Interchange (Kera to Bole turn)',
          lat: 8.9890,
          lng: 38.7520,
        },
        description: 'Routine document & taxi yellow ribbon inspection active',
        severity: 'moderate',
        upvotesCount: 22,
        createdAt: new Date(now - 40 * 60000).toISOString(),
        expiresAt: new Date(now + 80 * 60000).toISOString(),
      },
    ];

    for (const h of hotspots) {
      activeHazards.set(h.id, h);
    }
  }
}

export class CommunityHazardService {
  /**
   * Report a new road condition or driver alert
   */
  static reportHazard(data: {
    type: HazardType;
    driverId: string;
    driverName: string;
    address: string;
    lat: number;
    lng: number;
    description: string;
    severity?: 'low' | 'moderate' | 'high' | 'critical';
    ttlMinutes?: number;
  }): CommunityHazard {
    initializeDefaultHotspots();
    const id = `hazard_${uuidv4().substring(0, 8)}`;
    const now = Date.now();
    const ttl = (data.ttlMinutes || 90) * 60000;

    const hazard: CommunityHazard = {
      id,
      type: data.type,
      reportedByDriverId: data.driverId,
      reportedByDriverName: data.driverName,
      location: {
        address: data.address,
        lat: data.lat,
        lng: data.lng,
      },
      description: data.description,
      severity: data.severity || (data.type === 'driver_sos' ? 'critical' : 'moderate'),
      upvotesCount: 1,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + ttl).toISOString(),
    };

    activeHazards.set(id, hazard);
    return hazard;
  }

  /**
   * Retrieve active hazards in Addis Ababa
   */
  static getActiveHazards(): CommunityHazard[] {
    initializeDefaultHotspots();
    const now = Date.now();
    const valid: CommunityHazard[] = [];

    for (const [id, h] of activeHazards.entries()) {
      if (new Date(h.expiresAt).getTime() > now) {
        valid.push(h);
      } else {
        activeHazards.delete(id);
      }
    }

    return valid.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Upvote/confirm an active road report
   */
  static upvoteHazard(hazardId: string): CommunityHazard | null {
    const hazard = activeHazards.get(hazardId);
    if (!hazard) return null;
    hazard.upvotesCount += 1;
    return hazard;
  }
}
