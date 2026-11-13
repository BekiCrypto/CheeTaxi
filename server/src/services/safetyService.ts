import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database.js';
import { SosIncident } from '../../../shared/types.js';

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
}
