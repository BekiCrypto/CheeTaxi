import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database.js';
import { estimateRoadMetrics, generateRouteCoordinates } from '../services/geoService.js';
import { getFareEstimates } from '../services/fareService.js';
import { DispatchService } from '../services/dispatchService.js';
import { ProviderAggregatorService } from '../services/providerAggregatorService.js';
import { Server as SocketIOServer } from 'socket.io';
import { PassengerComfortPreferences, ScheduledRide } from '../../../shared/types.js';

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
    const routeCoordinates = generateRouteCoordinates(pickup.lat, pickup.lng, destination.lat, destination.lng, 24);

    return res.json({
      distanceKm: metrics.distanceKm,
      durationMinutes: metrics.durationMinutes,
      estimates,
      routeCoordinates,
    });
  });

  /**
   * Request a new ride
   */
  router.post('/', async (req, res) => {
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
      providerId = 'chebelew',
      fareEtb,
    } = req.body;

    if (!riderId || !pickup || !destination) {
      return res.status(400).json({ error: 'Missing mandatory ride creation parameters' });
    }

    let partnerOrderId: string | undefined = undefined;
    let customNotes = operatorNotes;

    if (providerId && providerId !== 'chebelew') {
      try {
        const partnerDispatch = await ProviderAggregatorService.dispatchPartnerOrder(providerId as any, {
          pickupAddress: pickup.address || 'Addis Ababa',
          pickupLat: pickup.lat,
          pickupLng: pickup.lng,
          destinationAddress: destination.address || 'Addis Ababa',
          destinationLat: destination.lat,
          destinationLng: destination.lng,
          vehicleCategory,
          passengerName: riderName || 'Passenger',
          passengerPhone: riderPhone || '+251911223344',
          fareEtb: Number(fareEtb) || 300,
        });
        partnerOrderId = partnerDispatch.partnerOrderId;
        customNotes = `Booked via ${partnerDispatch.providerName} (#${partnerOrderId}) • Assigned: ${partnerDispatch.assignedDriver}`;
      } catch (err: any) {
        console.warn(`[RideRouter] Partner dispatch failed for ${providerId}:`, err.message);
      }
    }

    // Determine whether to auto-assign immediately:
    // If autoAssign was explicitly passed, respect it.
    // Otherwise, manual dispatch auto-assigns, whereas mobile passenger hailing starts in REQUESTED state.
    const shouldAutoAssign = req.body.autoAssign !== undefined ? Boolean(req.body.autoAssign) : Boolean(isManualDispatch);

    const ride = DispatchService.createRide({
      riderId,
      riderName: riderName || 'Passenger',
      riderPhone: riderPhone || '+251911223344',
      pickup,
      destination,
      vehicleCategory,
      paymentMethod,
      isManualDispatch,
      operatorNotes: customNotes,
      providerId: providerId as any,
      partnerOrderId,
      driverId: req.body.driverId,
      autoAssign: shouldAutoAssign,
    });

    // Notify connected clients
    if (ride.driverId) {
      io.to(`driver:${ride.driverId}`).emit('driver:incoming_ride', ride);
      io.to(`driver:${ride.driverId}`).emit('driver:ride_assigned', ride);
    } else {
      // Broadcast incoming ride request to nearby eligible drivers
      // The driver retains full agency: they inspect the AI trip recommendations and choose to accept
      const eligible = DispatchService.findEligibleDrivers(pickup.lat, pickup.lng, vehicleCategory, 10);
      for (const d of eligible) {
        io.to(`driver:${d.id}`).emit('driver:incoming_ride', ride);
      }
      io.emit('driver:ride_broadcast', ride);
    }
    io.to('admin:dispatch').emit('admin:new_trip', ride);

    return res.status(201).json({ success: true, ride });
  });

  /**
   * Driver accepts a ride request (REST fallback / alternative to socket)
   */
  router.post('/:id/accept', (req, res) => {
    const { driverId } = req.body;
    if (!driverId) {
      return res.status(400).json({ error: 'driverId is required' });
    }

    try {
      const assigned = DispatchService.assignDriver(req.params.id, driverId);
      if (!assigned) {
        return res.status(404).json({ error: 'Ride not found or already assigned' });
      }

      io.to(`ride:${req.params.id}`).emit('ride:status_changed', assigned);
      io.to(`driver:${driverId}`).emit('driver:ride_assigned', assigned);
      io.emit('driver:ride_withdrawn', { rideId: req.params.id });
      io.to('admin:dispatch').emit('admin:trip_updated', assigned);

      return res.json({ success: true, ride: assigned });
    } catch (err: any) {
      if (err.message === 'DRIVER_ALREADY_BUSY') {
        return res.status(409).json({
          error: 'Driver is currently on another active trip (In-Flight Lock Active)',
          code: 'DRIVER_ACTIVE_TRIP_LOCKED',
        });
      }
      return res.status(400).json({ error: err.message || 'Failed to accept ride' });
    }
  });

  /**
   * Get active in-flight ride for user (rider or driver) for seamless session restore
   */
  router.get('/active/:userId', (req, res) => {
    const ride = DispatchService.getActiveRideForUser(req.params.userId);
    return res.json({ success: true, ride });
  });

  /**
   * Driver reports arrived at pickup (REST fallback & dual-path redundancy)
   */
  router.post('/:id/arrive', (req, res) => {
    const updated = DispatchService.updateRideStatus(req.params.id, 'ARRIVED');
    if (!updated) {
      return res.status(404).json({ error: 'Ride not found' });
    }
    io.to(`ride:${req.params.id}`).emit('ride:status_changed', updated);
    io.to('admin:dispatch').emit('admin:trip_updated', updated);
    return res.json({ success: true, ride: updated });
  });

  /**
   * Driver starts the trip (REST fallback & dual-path redundancy)
   */
  router.post('/:id/start', (req, res) => {
    const updated = DispatchService.updateRideStatus(req.params.id, 'IN_PROGRESS');
    if (!updated) {
      return res.status(404).json({ error: 'Ride not found' });
    }
    io.to(`ride:${req.params.id}`).emit('ride:status_changed', updated);
    io.to('admin:dispatch').emit('admin:trip_updated', updated);
    return res.json({ success: true, ride: updated });
  });

  /**
   * Driver completes the trip (REST fallback & dual-path redundancy)
   */
  router.post('/:id/complete', (req, res) => {
    const updated = DispatchService.updateRideStatus(req.params.id, 'COMPLETED');
    if (!updated) {
      return res.status(404).json({ error: 'Ride not found' });
    }
    io.to(`ride:${req.params.id}`).emit('ride:status_changed', updated);
    io.to('admin:dispatch').emit('admin:trip_updated', updated);
    return res.json({ success: true, ride: updated });
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
    const updated = DispatchService.updateRideStatus(req.params.id, 'CANCELLED', {
      cancelReason: reason || 'Ride cancelled',
      cancelledBy,
    });
    if (!updated) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    if (updated.driverId) {
      io.to(`driver:${updated.driverId}`).emit('driver:ride_cancelled', { rideId: req.params.id });
    }
    io.emit('driver:ride_withdrawn', { rideId: req.params.id });
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
  const getUserRidesHandler = (req: any, res: any) => {
    const rows = db.prepare(`
      SELECT * FROM rides
      WHERE rider_id = ? OR driver_id = (SELECT id FROM drivers WHERE user_id = ?)
      ORDER BY created_at DESC
      LIMIT 20
    `).all(req.params.userId, req.params.userId) as any[];

    const rides = rows.map((r) => DispatchService.getRideById(r.id)).filter(Boolean);
    return res.json({ rides });
  };

  router.get('/user/:userId', getUserRidesHandler);
  router.get('/history/:userId', getUserRidesHandler);

  // --------------------------------------------------------------------------
  // Priority 1: Scheduled & Recurring Bookings (Workstream 5)
  // --------------------------------------------------------------------------

  /**
   * Create a scheduled or recurring ride
   */
  router.post('/schedule', (req, res) => {
    const {
      riderId,
      riderName = 'Passenger',
      riderPhone = '+251911223344',
      scheduledTime,
      pickup,
      destination,
      vehicleCategory = 'sedan',
      flightNumber,
      airportTerminal,
      recurrenceType = 'once',
      notes,
    } = req.body;

    if (!riderId || !scheduledTime || !pickup || !destination) {
      return res.status(400).json({ error: 'riderId, scheduledTime, pickup, and destination are required' });
    }

    const id = `sched_${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO scheduled_rides (
        id, rider_id, rider_name, rider_phone, scheduled_time,
        pickup_json, destination_json, vehicle_category, flight_number,
        airport_terminal, recurrence_type, status, notes, created_at
      ) VALUES (
        @id, @riderId, @riderName, @riderPhone, @scheduledTime,
        @pickupJson, @destinationJson, @vehicleCategory, @flightNumber,
        @airportTerminal, @recurrenceType, 'SCHEDULED', @notes, @createdAt
      )
    `).run({
      id,
      riderId,
      riderName,
      riderPhone,
      scheduledTime,
      pickupJson: JSON.stringify(pickup),
      destinationJson: JSON.stringify(destination),
      vehicleCategory,
      flightNumber: flightNumber || null,
      airportTerminal: airportTerminal || null,
      recurrenceType,
      notes: notes || null,
      createdAt: now,
    });

    const scheduledRide: ScheduledRide = {
      id,
      riderId,
      riderName,
      riderPhone,
      scheduledTime,
      pickup,
      destination,
      vehicleCategory,
      flightNumber,
      airportTerminal,
      recurrenceType,
      status: 'SCHEDULED',
      notes,
      createdAt: now,
    };

    io.to('admin:dispatch').emit('admin:scheduled_ride_created', scheduledRide);

    return res.status(201).json({ success: true, scheduledRide });
  });

  /**
   * List scheduled rides for a user
   */
  router.get('/scheduled/user/:userId', (req, res) => {
    const rows = db.prepare(`
      SELECT * FROM scheduled_rides
      WHERE rider_id = ?
      ORDER BY scheduled_time ASC
    `).all(req.params.userId) as any[];

    const scheduledRides: ScheduledRide[] = rows.map((r) => ({
      id: r.id,
      riderId: r.rider_id,
      riderName: r.rider_name,
      riderPhone: r.rider_phone,
      scheduledTime: r.scheduled_time,
      pickup: JSON.parse(r.pickup_json),
      destination: JSON.parse(r.destination_json),
      vehicleCategory: r.vehicle_category,
      flightNumber: r.flight_number || undefined,
      airportTerminal: r.airport_terminal || undefined,
      recurrenceType: r.recurrence_type || 'once',
      assignedDriverId: r.assigned_driver_id || undefined,
      assignedDriverName: r.assigned_driver_name || undefined,
      assignedDriverPhone: r.assigned_driver_phone || undefined,
      status: r.status,
      notes: r.notes || undefined,
      createdAt: r.created_at,
    }));

    return res.json({ scheduledRides });
  });

  /**
   * List all scheduled rides (Admin dispatch view)
   */
  router.get('/scheduled', (_req, res) => {
    const rows = db.prepare(`
      SELECT * FROM scheduled_rides
      ORDER BY scheduled_time ASC
    `).all() as any[];

    const scheduledRides: ScheduledRide[] = rows.map((r) => ({
      id: r.id,
      riderId: r.rider_id,
      riderName: r.rider_name,
      riderPhone: r.rider_phone,
      scheduledTime: r.scheduled_time,
      pickup: JSON.parse(r.pickup_json),
      destination: JSON.parse(r.destination_json),
      vehicleCategory: r.vehicle_category,
      flightNumber: r.flight_number || undefined,
      airportTerminal: r.airport_terminal || undefined,
      recurrenceType: r.recurrence_type || 'once',
      assignedDriverId: r.assigned_driver_id || undefined,
      assignedDriverName: r.assigned_driver_name || undefined,
      assignedDriverPhone: r.assigned_driver_phone || undefined,
      status: r.status,
      notes: r.notes || undefined,
      createdAt: r.created_at,
    }));

    return res.json({ scheduledRides });
  });

  /**
   * Cancel scheduled ride
   */
  router.post('/scheduled/:id/cancel', (req, res) => {
    const ride = db.prepare('SELECT * FROM scheduled_rides WHERE id = ?').get(req.params.id);
    if (!ride) {
      return res.status(404).json({ error: 'Scheduled ride not found' });
    }

    db.prepare("UPDATE scheduled_rides SET status = 'CANCELLED' WHERE id = ?").run(req.params.id);
    io.to('admin:dispatch').emit('admin:scheduled_ride_cancelled', { id: req.params.id });

    return res.json({ success: true, message: 'Scheduled ride cancelled' });
  });

  /**
   * Assign driver to scheduled ride
   */
  router.post('/scheduled/:id/assign', (req, res) => {
    const { driverId } = req.body;
    if (!driverId) {
      return res.status(400).json({ error: 'driverId is required' });
    }

    const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(driverId) as any;
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    db.prepare(`
      UPDATE scheduled_rides
      SET assigned_driver_id = ?,
          assigned_driver_name = ?,
          assigned_driver_phone = ?,
          status = 'ASSIGNED'
      WHERE id = ?
    `).run(driver.id, driver.full_name, driver.phone, req.params.id);

    const updated = db.prepare('SELECT * FROM scheduled_rides WHERE id = ?').get(req.params.id) as any;
    io.to(`driver:${driver.id}`).emit('driver:scheduled_ride_assigned', updated);
    io.to('admin:dispatch').emit('admin:scheduled_ride_assigned', updated);

    return res.json({ success: true, scheduledRide: updated });
  });

  // --------------------------------------------------------------------------
  // Priority 1: Passenger Comfort Preferences (Workstream 5)
  // --------------------------------------------------------------------------

  /**
   * Get passenger comfort preferences
   */
  router.get('/preferences/:userId', (req, res) => {
    const row = db.prepare('SELECT * FROM passenger_comfort_preferences WHERE user_id = ?').get(
      req.params.userId
    ) as any;

    if (!row) {
      // Default preferences
      const defaults: PassengerComfortPreferences = {
        userId: req.params.userId,
        acRequired: false,
        quietRide: false,
        extraLuggage: false,
        temperaturePreference: 'normal',
        femaleDriverPreference: false,
        accessibilityAssistance: false,
        petFriendly: false,
        childSeat: false,
        notes: '',
        updatedAt: new Date().toISOString(),
      };
      return res.json({ preferences: defaults });
    }

    const prefs: PassengerComfortPreferences = {
      userId: row.user_id,
      acRequired: Boolean(row.ac_required),
      quietRide: Boolean(row.quiet_ride),
      extraLuggage: Boolean(row.extra_luggage),
      temperaturePreference: row.temperature_preference || 'normal',
      femaleDriverPreference: Boolean(row.female_driver_preference),
      accessibilityAssistance: Boolean(row.accessibility_assistance),
      petFriendly: Boolean(row.pet_friendly),
      childSeat: Boolean(row.child_seat),
      notes: row.notes || '',
      updatedAt: row.updated_at,
    };

    return res.json({ preferences: prefs });
  });

  /**
   * Save / update passenger comfort preferences
   */
  router.put('/preferences/:userId', (req, res) => {
    const userId = req.params.userId;
    const {
      acRequired = false,
      quietRide = false,
      extraLuggage = false,
      temperaturePreference = 'normal',
      femaleDriverPreference = false,
      accessibilityAssistance = false,
      petFriendly = false,
      childSeat = false,
      notes = '',
    } = req.body;

    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO passenger_comfort_preferences (
        user_id, ac_required, quiet_ride, extra_luggage, temperature_preference,
        female_driver_preference, accessibility_assistance, pet_friendly, child_seat, notes, updated_at
      ) VALUES (
        @userId, @acRequired, @quietRide, @extraLuggage, @temperaturePreference,
        @femaleDriverPreference, @accessibilityAssistance, @petFriendly, @childSeat, @notes, @updatedAt
      )
      ON CONFLICT(user_id) DO UPDATE SET
        ac_required = excluded.ac_required,
        quiet_ride = excluded.quiet_ride,
        extra_luggage = excluded.extra_luggage,
        temperature_preference = excluded.temperature_preference,
        female_driver_preference = excluded.female_driver_preference,
        accessibility_assistance = excluded.accessibility_assistance,
        pet_friendly = excluded.pet_friendly,
        child_seat = excluded.child_seat,
        notes = excluded.notes,
        updated_at = excluded.updated_at
    `).run({
      userId,
      acRequired: acRequired ? 1 : 0,
      quietRide: quietRide ? 1 : 0,
      extraLuggage: extraLuggage ? 1 : 0,
      temperaturePreference,
      femaleDriverPreference: femaleDriverPreference ? 1 : 0,
      accessibilityAssistance: accessibilityAssistance ? 1 : 0,
      petFriendly: petFriendly ? 1 : 0,
      childSeat: childSeat ? 1 : 0,
      notes,
      updatedAt: now,
    });

    return res.json({
      success: true,
      preferences: {
        userId,
        acRequired,
        quietRide,
        extraLuggage,
        temperaturePreference,
        femaleDriverPreference,
        accessibilityAssistance,
        petFriendly,
        childSeat,
        notes,
        updatedAt: now,
      },
    });
  });

  return router;
}
