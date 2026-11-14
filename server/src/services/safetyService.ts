import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database.js';
import { RouteDeviationAlert, SosIncident } from '../../../shared/types.js';

function computeDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export interface ReportSosInput {
  rideId?: string;
  deliveryId?: string;
  reporterUserId: string;
  reporterName: string;
  reporterPhone: string;
  reporterRole: 'rider' | 'driver' | 'courier';
  currentLat: number;
  currentLng: number;
  safetyNotes?: string;
}

export class SafetyService {
  /**
   * Records an emergency SOS alert and dispatches operational incident workflow
   */
  static triggerSos(input: ReportSosInput): SosIncident {
    const incidentId = `sos_${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO sos_incidents (
        id, ride_id, delivery_id, reporter_user_id, reporter_name,
        reporter_phone, reporter_role, current_lat, current_lng,
        status, safety_notes, created_at
      ) VALUES (
        @id, @rideId, @deliveryId, @reporterUserId, @reporterName,
        @reporterPhone, @reporterRole, @currentLat, @currentLng,
        'OPEN', @safetyNotes, @createdAt
      )
    `);

    stmt.run({
      id: incidentId,
      rideId: input.rideId || null,
      deliveryId: input.deliveryId || null,
      reporterUserId: input.reporterUserId,
      reporterName: input.reporterName,
      reporterPhone: input.reporterPhone,
      reporterRole: input.reporterRole,
      currentLat: input.currentLat,
      currentLng: input.currentLng,
      safetyNotes: input.safetyNotes || 'SOS button triggered from mobile application',
      createdAt: now,
    });

    console.warn(`[SAFETY ALERT] SOS Incident #${incidentId} reported by ${input.reporterName} (${input.reporterPhone}) at [${input.currentLat}, ${input.currentLng}]`);

    return this.getIncidentById(incidentId)!;
  }

  /**
   * Escalates incident to Federal/City Police (991) or safety response patrol
   */
  static escalateToPolice(incidentId: string, officerNotes?: string): SosIncident {
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE sos_incidents
      SET status = 'ESCALATED_POLICE',
          safety_notes = COALESCE(safety_notes || ' | ', '') || ?,
          resolved_at = NULL
      WHERE id = ?
    `).run(
      `Escalated to Ethiopian Police 991: ${officerNotes || 'Emergency dispatch'} (${now})`,
      incidentId
    );

    return this.getIncidentById(incidentId)!;
  }

  /**
   * Resolves emergency incident
   */
  static resolveSos(incidentId: string, resolutionSummary: string): SosIncident {
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE sos_incidents
      SET status = 'RESOLVED',
          safety_notes = COALESCE(safety_notes || ' | ', '') || ?,
          resolved_at = ?
      WHERE id = ?
    `).run(`Resolution: ${resolutionSummary}`, now, incidentId);

    return this.getIncidentById(incidentId)!;
  }

  /**
   * Get single incident by ID
   */
  static getIncidentById(incidentId: string): SosIncident | null {
    const row = db.prepare('SELECT * FROM sos_incidents WHERE id = ?').get(incidentId) as any;
    if (!row) return null;

    return {
      id: row.id,
      rideId: row.ride_id || undefined,
      deliveryId: row.delivery_id || undefined,
      reporterUserId: row.reporter_user_id,
      reporterName: row.reporter_name,
      reporterPhone: row.reporter_phone,
      reporterRole: row.reporter_role,
      currentLat: row.current_lat,
      currentLng: row.current_lng,
      status: row.status,
      safetyNotes: row.safety_notes,
      createdAt: row.created_at,
      resolvedAt: row.resolved_at || undefined,
    };
  }

  /**
   * List all active or historic SOS alerts
   */
  static listIncidents(): SosIncident[] {
    const rows = db.prepare('SELECT * FROM sos_incidents ORDER BY created_at DESC LIMIT 50').all() as any[];
    return rows.map((r) => this.getIncidentById(r.id)).filter(Boolean) as SosIncident[];
  }

  // --------------------------------------------------------------------------
  // Priority 0: Route Deviation Anomaly Detection (Section 3.4 & Workstream 10)
  // --------------------------------------------------------------------------

  /**
   * Checks whether the current vehicle location has deviated significantly from planned route
   */
  static checkRouteDeviation(input: {
    rideId: string;
    driverId: string;
    riderId: string;
    actualLat: number;
    actualLng: number;
    expectedCoords: [number, number][];
    thresholdMeters?: number;
  }): RouteDeviationAlert | null {
    const threshold = input.thresholdMeters || 600; // 600m standard safety threshold

    if (!input.expectedCoords || input.expectedCoords.length === 0) {
      return null;
    }

    // Find minimum distance from actual coordinate to any waypoint in planned route
    let minDistance = Infinity;
    for (const coord of input.expectedCoords) {
      const dist = computeDistanceMeters(input.actualLat, input.actualLng, coord[0], coord[1]);
      if (dist < minDistance) {
        minDistance = dist;
      }
    }

    const roundedDistance = Math.round(minDistance);

    // If deviation exceeds threshold, record alert in route_deviations table
    if (roundedDistance >= threshold) {
      const id = `dev_${uuidv4().substring(0, 8)}`;
      const now = new Date().toISOString();

      db.prepare(`
        INSERT INTO route_deviations (
          id, ride_id, driver_id, rider_id, expected_coords_json,
          actual_lat, actual_lng, deviation_meters, status, created_at
        ) VALUES (
          @id, @rideId, @driverId, @riderId, @expectedCoordsJson,
          @actualLat, @actualLng, @deviationMeters, 'FLAGGED', @createdAt
        )
      `).run({
        id,
        rideId: input.rideId,
        driverId: input.driverId,
        riderId: input.riderId,
        expectedCoordsJson: JSON.stringify(input.expectedCoords),
        actualLat: input.actualLat,
        actualLng: input.actualLng,
        deviationMeters: roundedDistance,
        createdAt: now,
      });

      console.warn(
        `[SAFETY MONITOR] Route deviation detected for Ride #${input.rideId}: ${roundedDistance}m (Threshold: ${threshold}m)`
      );

      return {
        id,
        rideId: input.rideId,
        driverId: input.driverId,
        riderId: input.riderId,
        expectedCoords: input.expectedCoords,
        actualLocation: [input.actualLat, input.actualLng],
        deviationMeters: roundedDistance,
        status: 'FLAGGED',
        createdAt: now,
      };
    }

    return null;
  }

  /**
   * List all route deviation alerts
   */
  static listRouteDeviations(status?: string): RouteDeviationAlert[] {
    let query = 'SELECT * FROM route_deviations';
    const params: any[] = [];
    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }
    query += ' ORDER BY created_at DESC LIMIT 50';

    const rows = db.prepare(query).all(...params) as any[];
    return rows.map((r) => ({
      id: r.id,
      rideId: r.ride_id,
      driverId: r.driver_id,
      riderId: r.rider_id,
      expectedCoords: JSON.parse(r.expected_coords_json),
      actualLocation: [r.actual_lat, r.actual_lng],
      deviationMeters: r.deviation_meters,
      status: r.status,
      resolvedBy: r.resolved_by || undefined,
      resolutionNotes: r.resolution_notes || undefined,
      createdAt: r.created_at,
    }));
  }

  /**
   * Resolve route deviation alert
   */
  static resolveRouteDeviation(
    deviationId: string,
    resolutionNotes: string,
    resolvedBy: string,
    status: 'RESOLVED_NORMAL_TRAFFIC' | 'ESCALATED' = 'RESOLVED_NORMAL_TRAFFIC'
  ): RouteDeviationAlert | null {
    db.prepare(`
      UPDATE route_deviations
      SET status = ?,
          resolution_notes = ?,
          resolved_by = ?
      WHERE id = ?
    `).run(status, resolutionNotes, resolvedBy, deviationId);

    const row = db.prepare('SELECT * FROM route_deviations WHERE id = ?').get(deviationId) as any;
    if (!row) return null;

    return {
      id: row.id,
      rideId: row.ride_id,
      driverId: row.driver_id,
      riderId: row.rider_id,
      expectedCoords: JSON.parse(row.expected_coords_json),
      actualLocation: [row.actual_lat, row.actual_lng],
      deviationMeters: row.deviation_meters,
      status: row.status,
      resolvedBy: row.resolved_by || undefined,
      resolutionNotes: row.resolution_notes || undefined,
      createdAt: row.created_at,
    };
  }
}
