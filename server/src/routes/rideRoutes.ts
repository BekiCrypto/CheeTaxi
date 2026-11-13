import { Router } from 'express';
import { db } from '../db/database.js';
import { estimateRoadMetrics } from '../services/geoService.js';
import { getFareEstimates } from '../services/fareService.js';
import { DispatchService } from '../services/dispatchService.js';
import { Server as SocketIOServer } from 'socket.io';

export function createRideRouter(io: SocketIOServer) {
  const router = Router();

  /**
   * Calculate fare estimates across categories & aggregators
   */
  router.post('/estimate', (req, res) => {
    const { pickup, destination } = req.body;

    if (!pickup?.lat || !pickup?.lng || !destination?.lat || !destination?.lng) {
      return res.status(400).json({ error: 'Pickup and destination coordinates are required' });
    }

    const metrics = estimateRoadMetrics(pickup.lat, pickup.lng, destination.lat, destination.lng);
    const estimates = getFareEstimates(metrics.distanceKm, metrics.durationMinutes);

    return res.json({
      distanceKm: metrics.distanceKm,
      durationMinutes: metrics.durationMinutes,
      estimates,
    });
  });

  /**
   * Request a new ride
   */
  router.post('/', (req, res) => {
    const {
      riderId,
      riderName,
      riderPhone,
      pickup,
      destination,
      vehicleCategory = 'sedan',
      paymentMethod = 'TELEBIRR',
      isManualDispatch = false,
      operatorNotes,
    } = req.body;

    if (!riderId || !pickup || !destination) {
      return res.status(400).json({ error: 'Missing mandatory ride creation parameters' });
    }

    const ride = DispatchService.createRide({
      riderId,
      riderName: riderName || 'Passenger',
      riderPhone: riderPhone || '+251911223344',
      pickup,
      destination,
      vehicleCategory,
      paymentMethod,
      isManualDispatch,
      operatorNotes,
    });

    // Notify connected clients
    if (ride.driverId) {
      io.to(`driver:${ride.driverId}`).emit('driver:incoming_ride', ride);
    }
    io.to('admin:dispatch').emit('admin:new_trip', ride);

    return res.status(201).json({ success: true, ride });
  });

  /**
   * Get specific ride by ID
   */
  router.get('/:id', (req, res) => {
    const ride = DispatchService.getRideById(req.params.id);
    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }
    return res.json({ ride });
  });

  /**
   * Cancel a ride
   */
  router.post('/:id/cancel', (req, res) => {
    const { reason, cancelledBy = 'rider' } = req.body;
    const ride = DispatchService.getRideById(req.params.id);
    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE rides
      SET status = 'CANCELLED', cancel_reason = ?, cancelled_by = ?, updated_at = ?
      WHERE id = ?
    `).run(reason || 'Ride cancelled', cancelledBy, now, req.params.id);

    if (ride.driverId) {
      db.prepare('UPDATE drivers SET is_busy = 0, active_ride_id = NULL WHERE id = ?').run(
        ride.driverId
      );
      io.to(`driver:${ride.driverId}`).emit('driver:ride_cancelled', { rideId: req.params.id });
    }

    const updated = DispatchService.getRideById(req.params.id);
    io.to(`ride:${req.params.id}`).emit('ride:status_changed', updated);
    io.to('admin:dispatch').emit('admin:trip_updated', updated);

    return res.json({ success: true, ride: updated });
  });

  /**
   * Rate a completed ride
   */
  router.post('/:id/rate', (req, res) => {
    const { rating, review, tipAmount = 0 } = req.body;
    const ride = DispatchService.getRideById(req.params.id);
    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    db.prepare(`
      UPDATE rides
      SET rating = ?, review = ?, tip_amount = ?, updated_at = ?
      WHERE id = ?
    `).run(rating, review || null, tipAmount, new Date().toISOString(), req.params.id);

    // Update driver rating average
    if (ride.driverId) {
      const avg = db.prepare(`
        SELECT AVG(rating) as avgRating FROM rides WHERE driver_id = ? AND rating IS NOT NULL
      `).get(ride.driverId) as any;

      if (avg && avg.avgRating) {
        db.prepare('UPDATE drivers SET rating = ? WHERE id = ?').run(
          Number(avg.avgRating.toFixed(2)),
          ride.driverId
        );
      }
    }

    return res.json({ success: true, message: 'Rating saved' });
  });

  /**
   * Get rides history for user
   */
  router.get('/user/:userId', (req, res) => {
    const rows = db.prepare(`
      SELECT * FROM rides
      WHERE rider_id = ? OR driver_id = (SELECT id FROM drivers WHERE user_id = ?)
      ORDER BY created_at DESC
      LIMIT 20
    `).all(req.params.userId, req.params.userId) as any[];

    const rides = rows.map((r) => DispatchService.getRideById(r.id)).filter(Boolean);
    return res.json({ rides });
  });

  return router;
}
