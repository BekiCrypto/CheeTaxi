import { Router } from 'express';
import { db } from '../db/database.js';
import { TelebirrService } from '../services/telebirrService.js';
import { Server as SocketIOServer } from 'socket.io';

export function createDriverRouter(io: SocketIOServer) {
  const router = Router();

  /**
   * List all drivers
   */
  router.get('/', (req, res) => {
    const drivers = db.prepare('SELECT * FROM drivers ORDER BY full_name ASC').all() as any[];
    return res.json({
      drivers: drivers.map((d) => ({
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
        vehicleCategory: d.vehicle_category,
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
        activeRideId: d.active_ride_id,
      })),
    });
  });

  /**
   * Get single driver profile
   */
  router.get('/:id', (req, res) => {
    const d = db.prepare('SELECT * FROM drivers WHERE id = ? OR user_id = ?').get(
      req.params.id,
      req.params.id
    ) as any;

    if (!d) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    return res.json({
      driver: {
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
        vehicleCategory: d.vehicle_category,
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
        activeRideId: d.active_ride_id,
      },
    });
  });

  /**
   * Toggle online/offline status
   */
  router.post('/:id/status', (req, res) => {
    const { isOnline } = req.body;
    db.prepare('UPDATE drivers SET is_online = ? WHERE id = ? OR user_id = ?').run(
      isOnline ? 1 : 0,
      req.params.id,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM drivers WHERE id = ? OR user_id = ?').get(
      req.params.id,
      req.params.id
    ) as any;

    io.to('admin:dispatch').emit('admin:driver_status_changed', {
      driverId: updated.id,
      isOnline: Boolean(updated.is_online),
    });

    return res.json({ success: true, isOnline: Boolean(updated.is_online) });
  });

  /**
   * Update driver GPS coordinates
   */
  router.post('/:id/location', (req, res) => {
    const { lat, lng, heading = 0 } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }

    db.prepare(`
      UPDATE drivers
      SET current_lat = ?, current_lng = ?, heading = ?
      WHERE id = ? OR user_id = ?
    `).run(lat, lng, heading, req.params.id, req.params.id);

    return res.json({ success: true, lat, lng });
  });

  /**
   * Driver KYC Document Submission
   */
  router.post('/:id/kyc', (req, res) => {
    const { vehicleMake, vehicleModel, vehiclePlate, licenseNumber, vehicleCategory } = req.body;

    db.prepare(`
      UPDATE drivers
      SET vehicle_make = COALESCE(?, vehicle_make),
          vehicle_model = COALESCE(?, vehicle_model),
          vehicle_plate = COALESCE(?, vehicle_plate),
          license_number = COALESCE(?, license_number),
          vehicle_category = COALESCE(?, vehicle_category),
          kyc_status = 'pending'
      WHERE id = ? OR user_id = ?
    `).run(
      vehicleMake || null,
      vehicleModel || null,
      vehiclePlate || null,
      licenseNumber || null,
      vehicleCategory || null,
      req.params.id,
      req.params.id
    );

    return res.json({
      success: true,
      message: 'KYC documents submitted for Ministry of Transport and Chebelew compliance check.',
      status: 'pending',
    });
  });

  /**
   * Payout request to Telebirr wallet
   */
  router.post('/:id/payout', (req, res) => {
    const { amountEtb } = req.body;
    try {
      const driver = db.prepare('SELECT id FROM drivers WHERE id = ? OR user_id = ?').get(
        req.params.id,
        req.params.id
      ) as any;

      if (!driver) {
        return res.status(404).json({ error: 'Driver not found' });
      }

      const result = TelebirrService.requestDriverPayout(driver.id, Number(amountEtb));
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  return router;
}
