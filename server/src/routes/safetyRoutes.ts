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

  return router;
}
