import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database.js';
import { Driver, LocationPoint, Ride, VehicleCategory } from '../../../shared/types.js';
import { calculateHaversineDistance, estimateRoadMetrics, generateRouteCoordinates } from './geoService.js';
import { calculateFare } from './fareService.js';

export interface CreateRideInput {
  riderId: string;
  riderName: string;
  riderPhone: string;
  pickup: LocationPoint;
  destination: LocationPoint;
  vehicleCategory: VehicleCategory;
  paymentMethod: 'CASH' | 'TELEBIRR';
  isManualDispatch?: boolean;
  operatorNotes?: string;
  driverId?: string; // Optional direct manual assignment
}

export class DispatchService {
  /**
   * Finds nearby eligible drivers ordered by proximity to pickup
   */
  static findEligibleDrivers(
    pickupLat: number,
    pickupLng: number,
    category: VehicleCategory,
    maxRadiusKm: number = 8.0
  ): (Driver & { distanceToPickupKm: number; etaMinutes: number })[] {
    // Select all online, non-busy, approved drivers with active or grace-period subscription
    const rows = db.prepare(`
      SELECT * FROM drivers
      WHERE is_online = 1 AND is_busy = 0 AND kyc_status = 'approved'
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

    // If no direct manual driver was supplied, check nearby drivers
    if (!assignedDriverId) {
      const candidates = this.findEligibleDrivers(
        input.pickup.lat,
        input.pickup.lng,
        input.vehicleCategory
      );
      if (candidates.length > 0) {
        assignedDriverId = candidates[0].id;
        initialStatus = 'ASSIGNED';
      }
    } else {
      initialStatus = 'ASSIGNED';
    }

    const insertStmt = db.prepare(`
      INSERT INTO rides (
        id, rider_id, rider_name, rider_phone, driver_id, pickup_json, destination_json,
        vehicle_category, distance_km, duration_min, fare_json, payment_method, payment_status,
        status, route_coords_json, is_manual_dispatch, operator_notes, created_at, updated_at
      ) VALUES (
        @id, @riderId, @riderName, @riderPhone, @driverId, @pickupJson, @destinationJson,
        @vehicleCategory, @distanceKm, @durationMin, @fareJson, @paymentMethod, 'PENDING',
        @status, @routeCoordsJson, @isManualDispatch, @operatorNotes, @createdAt, @updatedAt
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
      countryCode: row.country_code || 'ET',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
