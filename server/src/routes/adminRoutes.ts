import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database.js';
import { DispatchService } from '../services/dispatchService.js';
import {
  TARIFFS,
  getAllTariffs,
  updateTariffs,
  resetTariffsToDefaults,
  getSystemSettings,
  updateSystemSettings,
} from '../services/fareService.js';
import { Server as SocketIOServer } from 'socket.io';
import { SystemMetrics, VatReportSummary, SystemSettings } from '../../../shared/types.js';
import { requireAdminAuth, requirePermission } from '../middleware/adminAuth.js';

export function createAdminRouter(io: SocketIOServer) {
  const router = Router();

  // Protect all operations endpoints with Admin Authentication
  router.use(requireAdminAuth);

  /**
   * Operations Dashboard KPIs & Metrics
   */
  router.get('/metrics', (req, res) => {
    const totalDrivers = db.prepare('SELECT count(*) as count FROM drivers').get() as { count: number };
    const onlineDrivers = db.prepare('SELECT count(*) as count FROM drivers WHERE is_online = 1').get() as { count: number };
    const activeTrips = db.prepare(`
      SELECT count(*) as count FROM rides
      WHERE status IN ('REQUESTED', 'ASSIGNED', 'ARRIVED', 'IN_PROGRESS')
    `).get() as { count: number };

    const completedTrips = db.prepare(`
      SELECT * FROM rides WHERE status = 'COMPLETED'
    `).all() as any[];

    let todayGmv = 0;
    let todayVat = 0;

    for (const trip of completedTrips) {
      try {
        const fare = JSON.parse(trip.fare_json);
        todayGmv += fare.totalFare || 0;
        todayVat += fare.vatAmount || 0;
      } catch (e) {}
    }

    const subRev = db.prepare(`
      SELECT COALESCE(SUM(amount_paid), 0) as total FROM driver_subscriptions WHERE status = 'active'
    `).get() as { total: number };

    const activeDeliveries = db.prepare(`
      SELECT count(*) as count FROM delivery_orders WHERE status IN ('REQUESTED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT')
    `).get() as { count: number };

    const openSos = db.prepare(`
      SELECT count(*) as count FROM sos_incidents WHERE status IN ('OPEN', 'INVESTIGATING')
    `).get() as { count: number };

    const metrics: SystemMetrics = {
      activeDriversCount: totalDrivers.count,
      onlineDriversCount: onlineDrivers.count,
      activeTripsCount: activeTrips.count,
      todayCompletedTrips: completedTrips.length,
      todayGmvEtb: Number(todayGmv.toFixed(2)),
      todayVatCollectedEtb: Number(todayVat.toFixed(2)),
      todaySubscriptionRevenueEtb: Number(subRev.total.toFixed(2)),
      activeDeliveriesCount: activeDeliveries.count,
      openSosCount: openSos.count,
      averageEtaMinutes: 4.2,
      acceptanceRatePercent: 96.5,
    };

    return res.json({ metrics });
  });

  /**
   * Live Map Fleet & Trips
   */
  router.get('/live-map', (req, res) => {
    const drivers = db.prepare('SELECT * FROM drivers').all() as any[];
    const activeRides = db.prepare(`
      SELECT id FROM rides WHERE status IN ('REQUESTED', 'ASSIGNED', 'ARRIVED', 'IN_PROGRESS')
    `).all() as any[];

    const rides = activeRides.map((r) => DispatchService.getRideById(r.id)).filter(Boolean);

    return res.json({
      drivers: drivers.map((d) => ({
        id: d.id,
        fullName: d.full_name,
        phone: d.phone,
        vehiclePlate: d.vehicle_plate,
        vehicleCategory: d.vehicle_category,
        isOnline: Boolean(d.is_online),
        isBusy: Boolean(d.is_busy),
        currentLat: d.current_lat,
        currentLng: d.current_lng,
        heading: d.heading,
        rating: d.rating,
      })),
      activeRides: rides,
    });
  });

  /**
   * Call Center Manual Phone Booking Dispatch
   */
  router.post('/manual-dispatch', requirePermission('manage_dispatch'), (req, res) => {
    const {
      callerPhone,
      callerName,
      pickup,
      destination,
      vehicleCategory = 'sedan',
      assignedDriverId,
      operatorNotes,
    } = req.body;

    if (!callerPhone || !pickup || !destination) {
      return res.status(400).json({ error: 'Caller phone, pickup, and destination are required' });
    }

    // Find or create passenger profile for caller
    let user = db.prepare('SELECT id FROM users WHERE phone = ?').get(callerPhone) as any;
    let userId = user ? user.id : null;

    if (!userId) {
      userId = `user_callin_${Date.now()}`;
      db.prepare(`
        INSERT INTO users (id, phone, name, role, language, created_at)
        VALUES (?, ?, ?, 'rider', 'am', ?)
      `).run(userId, callerPhone, callerName || 'Phone Caller', new Date().toISOString());
    }

    const ride = DispatchService.createRide({
      riderId: userId,
      riderName: callerName || 'Phone Caller',
      riderPhone: callerPhone,
      pickup,
      destination,
      vehicleCategory,
      paymentMethod: 'CASH', // Call-in default is cash on arrival
      isManualDispatch: true,
      operatorNotes: operatorNotes || 'Dispatched via Addis Ababa Call Center 9922',
      driverId: assignedDriverId || undefined,
    });

    if (ride.driverId) {
      io.to(`driver:${ride.driverId}`).emit('driver:incoming_ride', ride);
    }
    io.to('admin:dispatch').emit('admin:new_trip', ride);

    return res.status(201).json({ success: true, ride });
  });

  /**
   * KYC Verification Queue & Flight Operator Compliance Review
   */
  router.get('/kyc-queue', (req, res) => {
    const rows = db.prepare(`
      SELECT * FROM drivers
      WHERE kyc_status IN ('pending', 'manual_review', 'rejected', 'suspended')
      ORDER BY created_at DESC
    `).all() as any[];

    const pendingDrivers = rows.map((d) => ({
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
      operatorType: d.operator_type || 'city_driver',
      faydaId: d.fayda_id,
      airportBadgeNumber: d.airport_badge_number,
      aiVerificationScore: d.ai_verification_score || 0,
      aiVerificationStatus: d.ai_verification_status || 'pending',
      adminOverrideBy: d.admin_override_by,
      adminOverrideAt: d.admin_override_at,
      kycDocuments: d.kyc_documents_json ? JSON.parse(d.kyc_documents_json) : null,
      createdAt: d.created_at,
    }));

    return res.json({
      pendingDrivers,
      summary: {
        totalPending: pendingDrivers.length,
        airportOperators: pendingDrivers.filter((p) => p.operatorType === 'airport_flight_operator').length,
        aiHighConfidence: pendingDrivers.filter((p) => (p.aiVerificationScore || 0) >= 90).length,
      },
    });
  });

  /**
   * KYC Decision & Administrative Override
   */
  router.post('/kyc/:driverId/decide', requirePermission('manage_kyc'), (req, res) => {
    const { approved, action, notes, adminName = 'Almaz Tefera (Super Admin)' } = req.body;
    
    let status = 'pending';
    let aiStatus = 'manual_override';

    if (action === 'override' || action === 'approve' || approved === true) {
      status = 'approved';
    } else if (action === 'grant_airport_pass') {
      status = 'approved';
    } else if (action === 'request_reupload') {
      status = 'manual_review';
    } else if (action === 'reject' || approved === false) {
      status = 'rejected';
      aiStatus = 'flagged';
    }

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE drivers
      SET kyc_status = ?,
          kyc_notes = ?,
          ai_verification_status = ?,
          admin_override_by = ?,
          admin_override_at = ?
      WHERE id = ?
    `).run(status, notes || null, aiStatus, adminName, now, req.params.driverId);

    // Live Socket Notification to Driver and Dispatch Center
    io.to(`driver:${req.params.driverId}`).emit('driver:kyc_updated', {
      driverId: req.params.driverId,
      kycStatus: status,
      notes,
    });
    io.to('admin:dispatch').emit('admin:kyc_decided', {
      driverId: req.params.driverId,
      status,
      overrideBy: adminName,
    });

    return res.json({
      success: true,
      status,
      adminOverrideBy: adminName,
      adminOverrideAt: now,
      message: `Driver / Operator credentials have been marked as ${status}${action === 'override' ? ' via Administrative Override' : ''}.`,
    });
  });

  /**
   * Ethiopian Value Added Tax Regulation No. 570/2025 Remittance Report
   */
  router.get('/vat-report', requirePermission('export_vat_reports'), (req, res) => {
    const completedTrips = db.prepare(`
      SELECT * FROM rides WHERE status = 'COMPLETED' ORDER BY created_at DESC
    `).all() as any[];

    let totalGmv = 0;
    let totalVat = 0;
    let totalCommission = 0;
    let totalDriverNet = 0;

    const items = completedTrips.map((trip) => {
      let fareObj: any = {};
      try {
        fareObj = JSON.parse(trip.fare_json);
      } catch (e) {}

      const gmv = fareObj.totalFare || 0;
      const vat = fareObj.vatAmount || 0;
      const commission = fareObj.platformCommission || 0;
      const driverNet = fareObj.driverNetPayout || 0;

      totalGmv += gmv;
      totalVat += vat;
      totalCommission += commission;
      totalDriverNet += driverNet;

      return {
        rideId: trip.id,
        createdAt: trip.created_at,
        riderName: trip.rider_name,
        paymentMethod: trip.payment_method,
        grossFareEtb: gmv,
        vat15PercentEtb: vat,
        platformCommission15PercentEtb: commission,
        driverNetPayoutEtb: driverNet,
        telebirrTxNo: trip.telebirr_tx_no || 'N/A (Cash)',
      };
    });

    const subRevAll = db.prepare(`
      SELECT COALESCE(SUM(amount_paid), 0) as total FROM driver_subscriptions
    `).get() as { total: number };

    const summary: VatReportSummary = {
      period: 'Fiscal Year 2026/2027 (Quarter 1)',
      totalTripsCompleted: completedTrips.length,
      totalGrossGmvEtb: Number(totalGmv.toFixed(2)),
      totalVatRemittableEtb: Number(totalVat.toFixed(2)),
      totalPlatformCommissionEtb: Number(totalCommission.toFixed(2)),
      totalDriverNetPayoutEtb: Number(totalDriverNet.toFixed(2)),
      totalSubscriptionRevenueEtb: Number(subRevAll.total.toFixed(2)),
      vatRegulationReference:
        'FDRE Ministry of Revenues - Value Added Tax Regulation No. 570/2025 (15% on Platform Ride Fares)',
    };

    return res.json({ summary, items });
  });

  /**
   * Support Tickets List
   */
  router.get('/tickets', (req, res) => {
    const tickets = db.prepare('SELECT * FROM support_tickets ORDER BY created_at DESC').all() as any[];
    return res.json({ tickets });
  });

  /**
   * Create Support / Incident Ticket
   */
  router.post('/tickets', (req, res) => {
    const { rideId, userId, userName, userPhone, userRole = 'rider', category, subject, message } = req.body;
    if (!userId || !subject || !message) {
      return res.status(400).json({ error: 'Missing ticket parameters' });
    }

    const ticketId = `tkt_${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO support_tickets (
        id, ride_id, user_id, user_name, user_phone, user_role,
        category, subject, message, status, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN', ?, ?
      )
    `).run(
      ticketId,
      rideId || null,
      userId,
      userName || 'Customer',
      userPhone || '+251...',
      userRole,
      category || 'app_issue',
      subject,
      message,
      now,
      now
    );

    const ticket = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(ticketId);
    return res.status(201).json({ success: true, ticket });
  });

  /**
   * Resolve Support Ticket
   */
  router.post('/tickets/:id/resolve', requirePermission('manage_tickets'), (req, res) => {
    const { notes } = req.body;
    db.prepare(`
      UPDATE support_tickets
      SET status = 'RESOLVED', resolution_notes = ?, updated_at = ?
      WHERE id = ?
    `).run(notes || 'Issue resolved by support officer', new Date().toISOString(), req.params.id);

    return res.json({ success: true, message: 'Ticket marked as resolved' });
  });

  /**
   * Dynamic Tariff Engine Endpoints
   */
  router.get('/tariffs', (req, res) => {
    return res.json({ tariffs: getAllTariffs() });
  });

  router.put('/tariffs', requirePermission('manage_tariffs'), (req, res) => {
    const { tariffs } = req.body;
    if (!tariffs || typeof tariffs !== 'object') {
      return res.status(400).json({ error: 'Tariffs payload object required' });
    }
    const updated = updateTariffs(tariffs);
    io.to('admin:dispatch').emit('admin:tariffs_updated', updated);
    return res.json({ success: true, tariffs: updated, message: 'Tariffs updated successfully' });
  });

  router.post('/tariffs/reset', requirePermission('manage_tariffs'), (req, res) => {
    const reset = resetTariffsToDefaults();
    io.to('admin:dispatch').emit('admin:tariffs_updated', reset);
    return res.json({ success: true, tariffs: reset, message: 'Tariffs restored to statutory defaults' });
  });

  /**
   * System & Regulatory Parameters
   */
  router.get('/settings', (req, res) => {
    return res.json({ settings: getSystemSettings() });
  });

  router.put('/settings', requirePermission('manage_tariffs'), (req, res) => {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Settings payload object required' });
    }
    const updated = updateSystemSettings(settings);
    io.to('admin:dispatch').emit('admin:settings_updated', updated);
    return res.json({ success: true, settings: updated, message: 'System settings updated successfully' });
  });

  return router;
}
