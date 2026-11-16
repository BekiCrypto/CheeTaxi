import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database.js';
import { Driver, LocationPoint, Ride, VehicleCategory, PaymentMethod, AggregatorProviderId } from '../../../shared/types.js';
import { calculateHaversineDistance, estimateRoadMetrics, generateRouteCoordinates } from './geoService.js';
import { calculateFare } from './fareService.js';

export interface CreateRideInput {
  riderId: string;
  riderName: string;
  riderPhone: string;
  pickup: LocationPoint;
  destination: LocationPoint;
  vehicleCategory: VehicleCategory;
  paymentMethod: PaymentMethod;
  isManualDispatch?: boolean;
  operatorNotes?: string;
  driverId?: string; // Optional direct manual assignment
  providerId?: AggregatorProviderId;
  partnerOrderId?: string;
  providerOfferId?: string;
  autoAssign?: boolean;
}

export class DispatchService {
  /**
   * Finds nearby eligible drivers ordered by proximity to pickup.
   * Filters out drivers whose "On-My-Way" destination corridor does not match the trip destination.
   */
  static findEligibleDrivers(
    pickupLat: number,
    pickupLng: number,
    category: VehicleCategory,
    maxRadiusKm: number = 8.0,
    destinationAddress?: string,
    _destinationLat?: number,
    _destinationLng?: number
  ): (Driver & { distanceToPickupKm: number; etaMinutes: number })[] {
    // Select all online, non-busy, approved drivers not on an active trip
    const rows = db.prepare(`
      SELECT * FROM drivers
      WHERE is_online = 1 AND is_busy = 0 AND (active_ride_id IS NULL OR active_ride_id = '') AND kyc_status = 'approved'
        AND (subscription_status IN ('active', 'grace_period') OR subscription_status IS NULL)
    `).all() as any[];

    const matches: (Driver & { distanceToPickupKm: number; etaMinutes: number })[] = [];

    for (const row of rows) {
      // Filter by vehicle category if specific category is requested
      // For partner_ride or partner_feres, sedan can handle
      const targetCategory = category.startsWith('partner_') ? 'sedan' : category;
      if (row.vehicle_category !== targetCategory && category !== 'sedan') {
        continue;
      }

      // Check On-My-Way Destination Corridor Filter
      if (
        row.is_corridor_active === 1 &&
        row.destination_filter &&
        row.destination_filter.trim() !== '' &&
        row.destination_filter !== 'All Addis Ababa'
      ) {
        if (destinationAddress) {
          const filterTokens = row.destination_filter
            .toLowerCase()
            .replace(/[^a-z0-9]/g, ' ')
            .split(/\s+/)
            .filter((tok: string) => tok.length > 2);
          const destLower = destinationAddress.toLowerCase();
          const matchesCorridor =
            filterTokens.length === 0 ||
            filterTokens.some((tok: string) => destLower.includes(tok));
          if (!matchesCorridor) {
            // Driver is heading to a specific neighborhood and this trip doesn't align
            continue;
          }
        }
      }

      const dist = calculateHaversineDistance(pickupLat, pickupLng, row.current_lat, row.current_lng);
      if (dist <= maxRadiusKm) {
        const eta = Math.max(2, Math.round(dist * 2.2 + 2));
        matches.push({
          id: row.id,
          userId: row.user_id,
          fullName: row.full_name,
          phone: row.phone,
          avatarUrl: row.avatar_url,
          vehicleMake: row.vehicle_make,
          vehicleModel: row.vehicle_model,
          vehicleYear: row.vehicle_year,
          vehiclePlate: row.vehicle_plate,
          vehicleColor: row.vehicle_color,
          vehicleCategory: row.vehicle_category as VehicleCategory,
          licenseNumber: row.license_number,
          kycStatus: row.kyc_status,
          kycNotes: row.kyc_notes,
          isOnline: Boolean(row.is_online),
          isBusy: Boolean(row.is_busy),
          currentLat: row.current_lat,
          currentLng: row.current_lng,
          heading: row.heading,
          rating: row.rating,
          totalRides: row.total_rides,
          walletBalanceEtb: row.wallet_balance_etb,
          subscriptionStatus: row.subscription_status || 'active',
          activeSubscriptionId: row.active_subscription_id || undefined,
          subscriptionExpiresAt: row.subscription_expires_at || undefined,
          activeRideId: row.active_ride_id || undefined,
          activeDeliveryId: row.active_delivery_id || undefined,
          fleetId: row.fleet_id || undefined,
          countryCode: row.country_code || 'ET',
          cityCode: row.city_code || 'ADDIS_ABABA',
          distanceToPickupKm: Number(dist.toFixed(2)),
          etaMinutes: eta,
        });
      }
    }

    return matches.sort((a, b) => a.distanceToPickupKm - b.distanceToPickupKm);
  }

  /**
   * Creates a ride request and runs matching
   */
  static createRide(input: CreateRideInput): Ride {
    const rideId = `ride_${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();

    const roadMetrics = estimateRoadMetrics(
      input.pickup.lat,
      input.pickup.lng,
      input.destination.lat,
      input.destination.lng
    );

    const fare = calculateFare(
      input.vehicleCategory,
      roadMetrics.distanceKm,
      roadMetrics.durationMinutes
    );

    const routeCoordinates = generateRouteCoordinates(
      input.pickup.lat,
      input.pickup.lng,
      input.destination.lat,
      input.destination.lng
    );

    let assignedDriverId = input.driverId;
    let initialStatus = 'REQUESTED';

    if (assignedDriverId) {
      // Guardrail: Validate that manual/direct driver is actually available and not on an active trip
      const target = db.prepare('SELECT is_online, is_busy, active_ride_id FROM drivers WHERE id = ?').get(assignedDriverId) as any;
      if (target && (target.is_busy === 1 || Boolean(target.active_ride_id) || target.is_online === 0)) {
        // Driver is currently on an active trip or offline - block assignment to avoid failed ride requests
        assignedDriverId = undefined;
        initialStatus = 'REQUESTED';
      } else {
        initialStatus = 'ASSIGNED';
      }
    } else if (input.autoAssign !== false) {
      // Auto-assign candidate when autoAssign is true or defaulted (preserving backward compatibility)
      const candidates = this.findEligibleDrivers(
        input.pickup.lat,
        input.pickup.lng,
        input.vehicleCategory,
        8.0,
        input.destination.address,
        input.destination.lat,
        input.destination.lng
      );
      if (candidates.length > 0) {
        assignedDriverId = candidates[0].id;
        initialStatus = 'ASSIGNED';
      }
    }

    const insertStmt = db.prepare(`
      INSERT INTO rides (
        id, rider_id, rider_name, rider_phone, driver_id, pickup_json, destination_json,
        vehicle_category, distance_km, duration_min, fare_json, payment_method, payment_status,
        status, route_coords_json, is_manual_dispatch, operator_notes, provider_id, partner_order_id, created_at, updated_at
      ) VALUES (
        @id, @riderId, @riderName, @riderPhone, @driverId, @pickupJson, @destinationJson,
        @vehicleCategory, @distanceKm, @durationMin, @fareJson, @paymentMethod, 'PENDING',
        @status, @routeCoordsJson, @isManualDispatch, @operatorNotes, @providerId, @partnerOrderId, @createdAt, @updatedAt
      )
    `);

    insertStmt.run({
      id: rideId,
      riderId: input.riderId,
      riderName: input.riderName,
      riderPhone: input.riderPhone,
      driverId: assignedDriverId || null,
      pickupJson: JSON.stringify(input.pickup),
      destinationJson: JSON.stringify(input.destination),
      vehicleCategory: input.vehicleCategory,
      distanceKm: roadMetrics.distanceKm,
      durationMin: roadMetrics.durationMinutes,
      fareJson: JSON.stringify(fare),
      paymentMethod: input.paymentMethod,
      status: initialStatus,
      routeCoordsJson: JSON.stringify(routeCoordinates),
      isManualDispatch: input.isManualDispatch ? 1 : 0,
      operatorNotes: input.operatorNotes || null,
      providerId: input.providerId || 'chebelew',
      partnerOrderId: input.partnerOrderId || null,
      createdAt: now,
      updatedAt: now,
    });

    if (assignedDriverId) {
      db.prepare('UPDATE drivers SET is_busy = 1, active_ride_id = ? WHERE id = ?').run(
        rideId,
        assignedDriverId
      );
    }

    // Log dispatch event
    db.prepare(`
      INSERT INTO dispatch_logs (id, ride_id, action, operator_name, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      rideId,
      input.isManualDispatch ? 'MANUAL_DISPATCH' : 'AUTO_DISPATCH',
      input.isManualDispatch ? 'CallCenter Operator' : 'System Matcher',
      `Assigned to driver ${assignedDriverId || 'None (searching)'}`,
      now
    );

    return this.getRideById(rideId)!;
  }

  /**
   * Assigns a driver to a requested ride, locking the driver in-flight
   */
  static assignDriver(rideId: string, driverId: string): Ride | null {
    const ride = db.prepare('SELECT * FROM rides WHERE id = ?').get(rideId) as any;
    if (!ride) return null;
    if (ride.status !== 'REQUESTED' && ride.status !== 'ASSIGNED') {
      return null;
    }

    const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(driverId) as any;
    if (!driver) return null;
    if (driver.is_busy === 1 || Boolean(driver.active_ride_id)) {
      throw new Error('DRIVER_ALREADY_BUSY');
    }

    const now = new Date().toISOString();
    db.prepare("UPDATE rides SET driver_id = ?, status = 'ASSIGNED', updated_at = ? WHERE id = ?").run(
      driverId,
      now,
      rideId
    );

    db.prepare('UPDATE drivers SET is_busy = 1, active_ride_id = ? WHERE id = ?').run(
      rideId,
      driverId
    );

    db.prepare(`
      INSERT INTO dispatch_logs (id, ride_id, action, operator_name, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      rideId,
      'DRIVER_ACCEPT',
      'System Matcher',
      `Assigned to driver ${driverId} (${driver.full_name})`,
      now
    );

    const updatedRide = this.getRideById(rideId);
    if (updatedRide?.partnerCallbackUrl) {
      try {
        fetch(updatedRide.partnerCallbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'ride:assigned',
            partnerOrderId: updatedRide.partnerOrderId,
            rideId: updatedRide.id,
            driverId: updatedRide.driverId,
            driverName: driver.full_name,
            driverPhone: driver.phone,
            vehiclePlate: driver.vehicle_plate,
            status: 'ASSIGNED',
            timestamp: now,
          }),
        }).catch(() => {});
      } catch (e) {}
    }

    return updatedRide;
  }

  /**
   * Transition ride status with in-flight lock updates, cash reconciliation, and audit logging
   */
  static updateRideStatus(
    rideId: string,
    status: 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
    extra?: { cancelReason?: string; cancelledBy?: string }
  ): Ride | null {
    const existing = this.getRideById(rideId);
    if (!existing) return null;

    const now = new Date().toISOString();

    if (status === 'ARRIVED') {
      db.prepare(`UPDATE rides SET status = 'ARRIVED', updated_at = ? WHERE id = ?`).run(now, rideId);
      db.prepare(`
        INSERT INTO dispatch_logs (id, ride_id, action, operator_name, details, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), rideId, 'DRIVER_ARRIVED', 'Driver', `Driver arrived at pickup point`, now);
    } else if (status === 'IN_PROGRESS') {
      db.prepare(`UPDATE rides SET status = 'IN_PROGRESS', updated_at = ? WHERE id = ?`).run(now, rideId);
      db.prepare(`
        INSERT INTO dispatch_logs (id, ride_id, action, operator_name, details, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), rideId, 'TRIP_STARTED', 'Driver', `Trip started towards destination`, now);
    } else if (status === 'COMPLETED') {
      db.prepare(`UPDATE rides SET status = 'COMPLETED', updated_at = ? WHERE id = ?`).run(now, rideId);

      if (existing.driverId) {
        // Release driver active trip in-flight lock
        db.prepare(`
          UPDATE drivers
          SET is_busy = 0, active_ride_id = NULL, total_rides = total_rides + 1
          WHERE id = ?
        `).run(existing.driverId);

        // Immediate cash reconciliation & driver wallet credit
        if (existing.paymentMethod === 'CASH') {
          db.prepare(`UPDATE rides SET payment_status = 'PAID' WHERE id = ?`).run(rideId);
          db.prepare(`
            UPDATE drivers
            SET wallet_balance_etb = wallet_balance_etb + ?
            WHERE id = ?
          `).run(existing.fare?.driverNetPayout || 0, existing.driverId);
        }
      }

      db.prepare(`
        INSERT INTO dispatch_logs (id, ride_id, action, operator_name, details, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), rideId, 'TRIP_COMPLETED', 'Driver', `Trip completed successfully`, now);
    } else if (status === 'CANCELLED') {
      db.prepare(`
        UPDATE rides
        SET status = 'CANCELLED', cancel_reason = ?, cancelled_by = ?, updated_at = ?
        WHERE id = ?
      `).run(extra?.cancelReason || 'Trip cancelled', extra?.cancelledBy || 'system', now, rideId);

      if (existing.driverId) {
        // Release driver in-flight lock
        db.prepare(`
          UPDATE drivers
          SET is_busy = 0, active_ride_id = NULL
          WHERE id = ?
        `).run(existing.driverId);
      }

      db.prepare(`
        INSERT INTO dispatch_logs (id, ride_id, action, operator_name, details, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(),
        rideId,
        'TRIP_CANCELLED',
        extra?.cancelledBy || 'system',
        `Trip cancelled: ${extra?.cancelReason || 'No reason specified'}`,
        now
      );
    }

    const updatedRide = this.getRideById(rideId);
    if (updatedRide?.partnerCallbackUrl) {
      try {
        fetch(updatedRide.partnerCallbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: `ride:${status.toLowerCase()}`,
            partnerOrderId: updatedRide.partnerOrderId,
            rideId: updatedRide.id,
            driverId: updatedRide.driverId,
            status,
            timestamp: now,
          }),
        }).catch(() => {});
      } catch (e) {}
    }

    return updatedRide;
  }

  /**
   * Get active in-flight ride for a passenger or driver
   */
  static getActiveRideForUser(userId: string): Ride | null {
    // 1. Check if user is passenger with active ride
    const riderRow = db.prepare(`
      SELECT id FROM rides
      WHERE rider_id = ? AND status IN ('REQUESTED', 'ASSIGNED', 'ARRIVED', 'IN_PROGRESS')
      ORDER BY created_at DESC
      LIMIT 1
    `).get(userId) as any;

    if (riderRow) {
      return this.getRideById(riderRow.id);
    }

    // 2. Check if user is driver with active ride
    const driverRow = db.prepare(`
      SELECT id FROM rides
      WHERE driver_id IN (SELECT id FROM drivers WHERE user_id = ? OR id = ?)
        AND status IN ('ASSIGNED', 'ARRIVED', 'IN_PROGRESS')
      ORDER BY created_at DESC
      LIMIT 1
    `).get(userId, userId) as any;

    if (driverRow) {
      return this.getRideById(driverRow.id);
    }

    return null;
  }

  /**
   * Retrieves full Ride object with driver details
   */
  static getRideById(rideId: string): Ride | null {
    const row = db.prepare('SELECT * FROM rides WHERE id = ?').get(rideId) as any;
    if (!row) return null;

    let driverObj: Driver | undefined;
    if (row.driver_id) {
      const d = db.prepare('SELECT * FROM drivers WHERE id = ?').get(row.driver_id) as any;
      if (d) {
        driverObj = {
          id: d.id,
          userId: d.user_id,
          fullName: d.full_name,
          phone: d.phone,
          avatarUrl: d.avatar_url,
          vehicleMake: d.vehicle_make,
          vehicleModel: d.vehicle_model,
          vehicleYear: d.vehicle_year,
          vehiclePlate: d.vehicle_plate,
          vehicleColor: d.vehicle_color,
          vehicleCategory: d.vehicle_category as VehicleCategory,
          licenseNumber: d.license_number,
          kycStatus: d.kyc_status,
          kycNotes: d.kyc_notes,
          isOnline: Boolean(d.is_online),
          isBusy: Boolean(d.is_busy),
          currentLat: d.current_lat,
          currentLng: d.current_lng,
          heading: d.heading,
          rating: d.rating,
          totalRides: d.total_rides,
          walletBalanceEtb: d.wallet_balance_etb,
          subscriptionStatus: d.subscription_status || 'active',
          activeSubscriptionId: d.active_subscription_id || undefined,
          subscriptionExpiresAt: d.subscription_expires_at || undefined,
          activeRideId: d.active_ride_id || undefined,
          activeDeliveryId: d.active_delivery_id || undefined,
          fleetId: d.fleet_id || undefined,
          countryCode: d.country_code || 'ET',
          cityCode: d.city_code || 'ADDIS_ABABA',
        };
      }
    }

    return {
      id: row.id,
      riderId: row.rider_id,
      riderName: row.rider_name,
      riderPhone: row.rider_phone,
      driverId: row.driver_id || undefined,
      driver: driverObj,
      pickup: JSON.parse(row.pickup_json),
      destination: JSON.parse(row.destination_json),
      vehicleCategory: row.vehicle_category,
      distanceKm: row.distance_km,
      durationMinutes: row.duration_min,
      fare: JSON.parse(row.fare_json),
      paymentMethod: row.payment_method,
      paymentStatus: row.payment_status,
      status: row.status,
      telebirrOrderId: row.telebirr_order_id,
      telebirrTransactionNo: row.telebirr_tx_no,
      cancelReason: row.cancel_reason,
      cancelledBy: row.cancelled_by,
      rating: row.rating,
      review: row.review,
      tipAmount: row.tip_amount,
      routeCoordinates: row.route_coords_json ? JSON.parse(row.route_coords_json) : undefined,
      currentDriverLocation:
        row.current_driver_lat && row.current_driver_lng
          ? [row.current_driver_lat, row.current_driver_lng]
          : undefined,
      isManualDispatch: Boolean(row.is_manual_dispatch),
      operatorNotes: row.operator_notes,
      providerId: row.provider_id || 'chebelew',
      partnerOrderId: row.partner_order_id || undefined,
      partnerCallbackUrl: row.partner_callback_url || undefined,
      countryCode: row.country_code || 'ET',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
