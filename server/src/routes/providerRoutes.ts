import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database.js';
import { estimateRoadMetrics, generateRouteCoordinates } from '../services/geoService.js';
import { ProviderAggregatorService } from '../services/providerAggregatorService.js';
import { DispatchService } from '../services/dispatchService.js';
import { AggregatorProviderId, CircuitBreakerState } from '../../../shared/types.js';
import { Server as SocketIOServer } from 'socket.io';

export const providerRouter = Router();

let socketIO: SocketIOServer | null = null;
export function setProviderIO(io: SocketIOServer) {
  socketIO = io;
}

/**
 * Normalized multi-provider search & ranking
 * Supports mode: 'best_value' | 'cheapest' | 'fastest_pickup' | 'premium_comfort'
 * and passenger comfort preferences
 */
providerRouter.post('/offers', (req, res) => {
  const { pickup, destination, category = 'sedan', mode = 'best_value', preferences } = req.body;
  if (!pickup || !destination) {
    return res.status(400).json({ error: 'Pickup and destination are required' });
  }

  const offers = ProviderAggregatorService.searchAndRankOffers(pickup, destination, category, mode, preferences);
  return res.json({ offers, mode });
});

/**
 * Compatibility alias for search
 */
providerRouter.post('/search', (req, res) => {
  const { pickup, destination, category = 'sedan', vehicleCategory, mode = 'best_value', preferences } = req.body;
  const cat = vehicleCategory || category || 'sedan';
  if (!pickup || !destination) {
    return res.status(400).json({ error: 'Pickup and destination are required' });
  }

  const offers = ProviderAggregatorService.searchAndRankOffers(pickup, destination, cat, mode, preferences);
  return res.json({ offers, mode });
});

/**
 * Provider adapter status & circuit health
 */
providerRouter.get('/status', (_req, res) => {
  const statuses = ProviderAggregatorService.getProviderStatuses();
  return res.json({ providers: statuses });
});

/**
 * Provider adapter full configs
 */
providerRouter.get('/config', (_req, res) => {
  const configs = ProviderAggregatorService.getProviderStatuses();
  return res.json({ providers: configs });
});

/**
 * Update provider configuration (API endpoints, credentials, rates, thresholds)
 */
providerRouter.patch('/config/:id', (req, res) => {
  const providerId = req.params.id as AggregatorProviderId;
  const updates = req.body;

  const updated = ProviderAggregatorService.updateProviderConfig(providerId, updates);
  if (!updated) {
    return res.status(404).json({ error: `Provider ${providerId} not found` });
  }

  return res.json({ success: true, provider: updated });
});

/**
 * Simulate or test circuit breaker trip
 */
providerRouter.post('/circuit/trip', (req, res) => {
  const { providerId } = req.body;
  if (!providerId) return res.status(400).json({ error: 'providerId is required' });

  // Record 3 failures to trip circuit OPEN
  ProviderAggregatorService.recordProviderFailure(providerId as AggregatorProviderId);
  ProviderAggregatorService.recordProviderFailure(providerId as AggregatorProviderId);
  ProviderAggregatorService.recordProviderFailure(providerId as AggregatorProviderId);

  return res.json({
    success: true,
    message: `Provider ${providerId} circuit breaker tripped OPEN for fail-safe testing.`,
  });
});

/**
 * Reset single circuit breaker
 */
providerRouter.post('/circuit/reset', (req, res) => {
  const { providerId } = req.body;
  if (!providerId) return res.status(400).json({ error: 'providerId is required' });

  ProviderAggregatorService.resetProviderCircuit(providerId as AggregatorProviderId);
  return res.json({
    success: true,
    message: `Provider ${providerId} circuit reset to CLOSED.`,
  });
});

/**
 * Set explicit circuit state (CLOSED, OPEN, HALF_OPEN)
 */
providerRouter.post('/circuit/set-state', (req, res) => {
  const { providerId, state } = req.body;
  if (!providerId || !state) {
    return res.status(400).json({ error: 'providerId and state are required' });
  }

  ProviderAggregatorService.setCircuitState(providerId as AggregatorProviderId, state as CircuitBreakerState);
  return res.json({
    success: true,
    message: `Provider ${providerId} circuit state explicitly set to ${state}.`,
  });
});

/**
 * Reset all circuit breakers (backward compatibility)
 */
providerRouter.post('/reset-breaker', (_req, res) => {
  ProviderAggregatorService.resetAllCircuits();
  return res.json({
    success: true,
    message: 'All external provider circuit breakers reset to CLOSED (Healthy).',
  });
});

/**
 * Test ping / live API handshake
 */
providerRouter.post('/test-ping/:id', async (req, res) => {
  const providerId = req.params.id as AggregatorProviderId;
  try {
    const result = await ProviderAggregatorService.testProviderHandshake(providerId);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error executing ping handshake' });
  }
});

/**
 * Live Partner Order Dispatch Orchestration
 */
providerRouter.post('/dispatch/:id', async (req, res) => {
  const providerId = req.params.id as AggregatorProviderId;
  const {
    pickupAddress = 'Bole Medhanialem, Addis Ababa',
    pickupLat,
    pickupLng,
    destinationAddress = 'Meskel Square, Addis Ababa',
    destinationLat,
    destinationLng,
    vehicleCategory = 'sedan',
    passengerName = 'Abebe Bikila',
    passengerPhone = '+251911998877',
    fareEtb = 350.0,
    idempotencyKey,
  } = req.body;

  try {
    const dispatchResult = await ProviderAggregatorService.dispatchPartnerOrder(providerId, {
      pickupAddress,
      pickupLat,
      pickupLng,
      destinationAddress,
      destinationLat,
      destinationLng,
      vehicleCategory,
      passengerName,
      passengerPhone,
      fareEtb,
      idempotencyKey,
    });
    return res.json(dispatchResult);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Dispatch orchestration failed' });
  }
});

/**
 * Backwards-compatible mock-dispatch alias
 */
providerRouter.post('/mock-dispatch/:id', async (req, res) => {
  const providerId = req.params.id as AggregatorProviderId;
  const {
    pickupAddress = 'Bole Medhanialem, Addis Ababa',
    destinationAddress = 'Meskel Square, Addis Ababa',
    vehicleCategory = 'sedan',
    passengerName = 'Abebe Bikila',
    passengerPhone = '+251911998877',
    fareEtb = 350.0,
  } = req.body;

  try {
    const dispatchResult = await ProviderAggregatorService.dispatchPartnerOrder(providerId, {
      pickupAddress,
      destinationAddress,
      vehicleCategory,
      passengerName,
      passengerPhone,
      fareEtb,
    });
    return res.json(dispatchResult);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Dispatch failed' });
  }
});

/**
 * Provider Routing & Dispatch Traffic Logs
 */
providerRouter.get('/logs', (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
  const logs = ProviderAggregatorService.getRoutingLogs(limit);
  return res.json({ logs });
});

/**
 * Clear Routing Logs
 */
providerRouter.delete('/logs', (_req, res) => {
  ProviderAggregatorService.clearRoutingLogs();
  return res.json({ success: true, message: 'Aggregator routing logs cleared.' });
});

/**
 * Real-Time Available Cabs for Provider Aggregator Routing
 * Guarantees zero ghost dispatches by strictly excluding cabs on active trips (is_busy = 1 or active_ride_id != null)
 */
providerRouter.get('/availability', (req, res) => {
  const providerId = (req.query.providerId as AggregatorProviderId) || 'chebelew';
  const lat = req.query.lat ? parseFloat(req.query.lat as string) : 9.0105;
  const lng = req.query.lng ? parseFloat(req.query.lng as string) : 38.7615;
  const radiusKm = req.query.radius ? parseFloat(req.query.radius as string) : 10.0;
  const category = (req.query.category as any) || 'sedan';

  const availableDrivers = DispatchService.findEligibleDrivers(lat, lng, category, radiusKm);

  return res.json({
    success: true,
    providerId,
    timestamp: new Date().toISOString(),
    queryCenter: { lat, lng },
    radiusKm,
    availableCabsCount: availableDrivers.length,
    activeProtectionStatus: 'BLOCK_BUSY_DRIVERS_ACTIVE',
    cabs: availableDrivers.map((d: any) => ({
      driverId: d.id,
      fullName: d.fullName,
      vehiclePlate: d.vehiclePlate,
      vehicleModel: `${d.vehicleMake} ${d.vehicleModel} (${d.vehicleColor})`,
      currentLat: d.currentLat,
      currentLng: d.currentLng,
      distanceKm: d.distanceToPickupKm,
      etaMinutes: d.etaMinutes,
      rating: d.rating,
      subscriptionStatus: d.subscriptionStatus,
      isBusy: d.isBusy,
      activeRideId: d.activeRideId || null,
    })),
  });
});

/**
 * Partner Inbound Dispatch Ingestion API (Trojan Horse / Mobility Clearinghouse)
 * Allows third-party operators (RIDE, Feres, hotel concierges, corporate dispatchers)
 * to route unfulfilled passenger trip requests into Chebelew's active driver pool.
 */
providerRouter.post(['/inbound-ride', '/rides'], (req, res) => {
  const {
    partnerId = 'ride_partner',
    partnerOrderId,
    passengerName = 'Partner Passenger',
    passengerPhone = '+251911000000',
    pickup,
    destination,
    vehicleCategory = 'sedan',
    offeredFareEtb,
    partnerCommissionRate = 0.12,
    callbackWebhookUrl,
  } = req.body;

  if (!pickup?.lat || !pickup?.lng || !destination?.lat || !destination?.lng) {
    return res.status(400).json({ error: 'Valid pickup and destination coordinates are required' });
  }

  const metrics = estimateRoadMetrics(pickup.lat, pickup.lng, destination.lat, destination.lng);
  const fareTotal = offeredFareEtb || Math.round(metrics.distanceKm * 38 + 150);
  const commRate = typeof partnerCommissionRate === 'number' ? partnerCommissionRate : 0.12;
  const platformCommission = Math.round(fareTotal * commRate);
  const driverNetPayout = Math.max(0, fareTotal - platformCommission);
  const vatAmount = Math.round(((fareTotal * 0.15) / 1.15) * 100) / 100;

  const rideId = `ride_ext_${uuidv4().substring(0, 8)}`;
  const now = new Date().toISOString();
  const routeCoordinates = generateRouteCoordinates(pickup.lat, pickup.lng, destination.lat, destination.lng, 24);

  const fareObj = {
    baseFare: 150,
    distanceFare: fareTotal - 150,
    timeFare: 0,
    surgeMultiplier: 1.0,
    totalFare: fareTotal,
    platformCommission,
    driverNetPayout,
    vatAmount,
    currency: 'ETB',
  };

  try {
    const partnerUserId = `user_partner_${partnerId}`;
    db.prepare(`
      INSERT OR IGNORE INTO users (id, phone, name, role, is_verified, created_at)
      VALUES (?, ?, ?, 'rider', 1, ?)
    `).run(partnerUserId, passengerPhone, passengerName, now);

    db.prepare(`
      INSERT INTO rides (
        id, rider_id, rider_name, rider_phone, pickup_json, destination_json,
        vehicle_category, distance_km, duration_min, fare_json, payment_method,
        payment_status, status, route_coords_json, provider_id, partner_order_id,
        partner_callback_url, country_code, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, 'ET', ?, ?
      )
    `).run(
      rideId,
      partnerUserId,
      passengerName,
      passengerPhone,
      JSON.stringify(pickup),
      JSON.stringify(destination),
      vehicleCategory,
      metrics.distanceKm,
      metrics.durationMinutes,
      JSON.stringify(fareObj),
      'CASH',
      'PENDING',
      'REQUESTED',
      JSON.stringify(routeCoordinates),
      partnerId,
      partnerOrderId || `EXT_${uuidv4().substring(0, 6).toUpperCase()}`,
      callbackWebhookUrl || null,
      now,
      now
    );

    const ride = DispatchService.getRideById(rideId)!;

    // Broadcast to eligible, non-busy drivers
    const eligibleDrivers = DispatchService.findEligibleDrivers(
      pickup.lat,
      pickup.lng,
      vehicleCategory,
      10.0,
      destination.address,
      destination.lat,
      destination.lng
    );

    if (socketIO) {
      for (const d of eligibleDrivers) {
        socketIO.to(`driver:${d.id}`).emit('driver:incoming_ride', ride);
      }
      socketIO.emit('driver:ride_broadcast', ride);
      socketIO.to('admin:dispatch').emit('admin:new_trip', ride);
    }

    return res.status(201).json({
      success: true,
      rideId: ride.id,
      partnerOrderId: ride.partnerOrderId,
      status: ride.status,
      eligibleDriversCount: eligibleDrivers.length,
      fare: fareObj,
      message: `Partner ride ingested into Chebelew clearinghouse and broadcast to ${eligibleDrivers.length} nearby cabs.`,
    });
  } catch (err: any) {
    console.error('Inbound partner ride error:', err);
    return res.status(500).json({ error: err.message || 'Failed to ingest partner ride' });
  }
});

