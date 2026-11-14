import { Router } from 'express';
import { SafetyService } from '../services/safetyService.js';
import { Server as SocketIOServer } from 'socket.io';

export function createSafetyRouter(io: SocketIOServer) {
  const router = Router();

  /**
   * Trigger SOS Emergency
   */
  router.post('/sos', (req, res) => {
    const {
      rideId,
      deliveryId,
      reporterUserId,
      reporterName,
      reporterPhone,
      reporterRole = 'rider',
      currentLat,
      currentLng,
      safetyNotes,
    } = req.body;

    if (!reporterUserId || currentLat === undefined || currentLng === undefined) {
      return res.status(400).json({ error: 'Missing emergency coordinates or reporter user ID' });
    }

    const incident = SafetyService.triggerSos({
      rideId,
      deliveryId,
      reporterUserId,
      reporterName: reporterName || 'Anonymous User',
      reporterPhone: reporterPhone || '+251...',
      reporterRole,
      currentLat,
      currentLng,
      safetyNotes,
    });

    // Alert all connected operations dispatchers and safety officers immediately
    io.to('admin:dispatch').emit('safety:sos_alert', incident);

    return res.status(201).json({
      success: true,
      incident,
      emergencyContacts: {
        police: '991',
        chebelewHotline: '9922',
        ambulance: '907',
      },
    });
  });

  /**
   * List incidents
   */
  router.get('/incidents', (req, res) => {
    const incidents = SafetyService.listIncidents();
    return res.json({ incidents });
  });

  /**
   * Escalate incident to Ethiopian Police 991
   */
  router.post('/incidents/:id/escalate', (req, res) => {
    const { notes } = req.body;
    const incident = SafetyService.escalateToPolice(req.params.id, notes);
    io.to('admin:dispatch').emit('safety:incident_updated', incident);
    return res.json({ success: true, incident });
  });

  /**
   * Resolve incident
   */
  router.post('/incidents/:id/resolve', (req, res) => {
    const { summary } = req.body;
    const incident = SafetyService.resolveSos(
      req.params.id,
      summary || 'Passenger and driver confirmed safe'
    );
    io.to('admin:dispatch').emit('safety:incident_updated', incident);
    return res.json({ success: true, incident });
  });

  // --------------------------------------------------------------------------
  // Priority 0: Route Deviation Anomaly Detection Endpoints
  // --------------------------------------------------------------------------

  /**
   * Check vehicle coordinate against planned route
   */
  router.post('/check-deviation', (req, res) => {
    const { rideId, driverId, riderId, actualLat, actualLng, expectedCoords, thresholdMeters } = req.body;

    if (!rideId || actualLat === undefined || actualLng === undefined || !expectedCoords) {
      return res.status(400).json({ error: 'rideId, actualLat, actualLng, and expectedCoords are required' });
    }

    const alert = SafetyService.checkRouteDeviation({
      rideId,
      driverId: driverId || 'unknown_driver',
      riderId: riderId || 'unknown_rider',
      actualLat,
      actualLng,
      expectedCoords,
      thresholdMeters,
    });

    if (alert) {
      io.to('admin:dispatch').emit('safety:route_deviation', alert);
      return res.json({ isDeviated: true, alert });
    }

    return res.json({ isDeviated: false, alert: null });
  });

  /**
   * List all route deviation alerts
   */
  router.get('/deviations', (req, res) => {
    const status = req.query.status as string;
    const deviations = SafetyService.listRouteDeviations(status);
    return res.json({ deviations });
  });

  /**
   * Resolve route deviation alert
   */
  router.post('/deviations/:id/resolve', (req, res) => {
    const { resolutionNotes = 'Driver followed authorized bypass', resolvedBy = 'Operations Dispatcher', status = 'RESOLVED_NORMAL_TRAFFIC' } = req.body;
    const alert = SafetyService.resolveRouteDeviation(req.params.id, resolutionNotes, resolvedBy, status);
    if (!alert) {
      return res.status(404).json({ error: 'Route deviation alert not found' });
    }

    io.to('admin:dispatch').emit('safety:deviation_resolved', alert);
    return res.json({ success: true, alert });
  });

  return router;
}
