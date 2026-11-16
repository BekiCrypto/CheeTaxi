import { Server as SocketIOServer, Socket } from 'socket.io';
import { db } from '../db/database.js';
import { DispatchService } from '../services/dispatchService.js';
import { TelebirrService } from '../services/telebirrService.js';

export function setupSocketHandlers(io: SocketIOServer) {
  io.on('connection', (socket: Socket) => {
    // Join room for specific ride or role
    socket.on('join:ride', (rideId: string) => {
      socket.join(`ride:${rideId}`);
    });

    socket.on('join:driver', (driverId: string) => {
      socket.join(`driver:${driverId}`);
    });

    socket.on('join:rider', (riderId: string) => {
      socket.join(`rider:${riderId}`);
    });

    socket.on('driver:register', (data: { driverId: string }) => {
      if (data?.driverId) {
        socket.join(`driver:${data.driverId}`);
      }
    });

    socket.on('join:admin', () => {
      socket.join('admin:dispatch');
    });

    // Driver location update
    socket.on('driver:location_update', (data: { driverId: string; lat: number; lng: number; heading?: number }) => {
      const { driverId, lat, lng, heading = 0 } = data;

      db.prepare(`
        UPDATE drivers
        SET current_lat = ?, current_lng = ?, heading = ?
        WHERE id = ?
      `).run(lat, lng, heading, driverId);

      // Find if driver has an active ride
      const driver = db.prepare('SELECT active_ride_id FROM drivers WHERE id = ?').get(driverId) as any;
      if (driver && driver.active_ride_id) {
        db.prepare(`
          UPDATE rides
          SET current_driver_lat = ?, current_driver_lng = ?, updated_at = ?
          WHERE id = ?
        `).run(lat, lng, new Date().toISOString(), driver.active_ride_id);

        io.to(`ride:${driver.active_ride_id}`).emit('ride:location_tick', {
          rideId: driver.active_ride_id,
          driverLocation: [lat, lng],
          heading,
        });
      }

      // Broadcast to admin dispatch map
      io.to('admin:dispatch').emit('admin:driver_moved', {
        driverId,
        lat,
        lng,
        heading,
      });
    });

    // Driver accepts ride
    socket.on('ride:accept', (data: { rideId: string; driverId: string }) => {
      const { rideId, driverId } = data;
      try {
        const updatedRide = DispatchService.assignDriver(rideId, driverId);
        if (updatedRide) {
          io.to(`ride:${rideId}`).emit('ride:status_changed', updatedRide);
          io.to(`driver:${driverId}`).emit('driver:ride_assigned', updatedRide);
          io.emit('driver:ride_withdrawn', { rideId });
          io.to('admin:dispatch').emit('admin:trip_updated', updatedRide);
        }
      } catch (err: any) {
        console.warn(`[Socket] Driver ${driverId} failed to accept ride ${rideId}:`, err.message);
      }
    });

    // Driver arrived at pickup
    socket.on('ride:arrived', (data: { rideId: string }) => {
      const now = new Date().toISOString();
      db.prepare(`
        UPDATE rides
        SET status = 'ARRIVED', updated_at = ?
        WHERE id = ?
      `).run(now, data.rideId);

      const updatedRide = DispatchService.getRideById(data.rideId);
      io.to(`ride:${data.rideId}`).emit('ride:status_changed', updatedRide);
      io.to('admin:dispatch').emit('admin:trip_updated', updatedRide);
    });

    // Driver started trip
    socket.on('ride:start', (data: { rideId: string }) => {
      const now = new Date().toISOString();
      db.prepare(`
        UPDATE rides
        SET status = 'IN_PROGRESS', updated_at = ?
        WHERE id = ?
      `).run(now, data.rideId);

      const updatedRide = DispatchService.getRideById(data.rideId);
      io.to(`ride:${data.rideId}`).emit('ride:status_changed', updatedRide);
      io.to('admin:dispatch').emit('admin:trip_updated', updatedRide);
    });

    // Driver completed trip
    socket.on('ride:complete', (data: { rideId: string }) => {
      const now = new Date().toISOString();
      const ride = DispatchService.getRideById(data.rideId);

      if (ride && ride.driverId) {
        db.prepare(`
          UPDATE rides
          SET status = 'COMPLETED', updated_at = ?
          WHERE id = ?
        `).run(now, data.rideId);

        // Release driver
        db.prepare(`
          UPDATE drivers
          SET is_busy = 0, active_ride_id = NULL, total_rides = total_rides + 1
          WHERE id = ?
        `).run(ride.driverId);

        // If Cash payment, add net payout to driver balance immediately
        if (ride.paymentMethod === 'CASH') {
          db.prepare(`
            UPDATE rides SET payment_status = 'PAID' WHERE id = ?
          `).run(data.rideId);

          db.prepare(`
            UPDATE drivers
            SET wallet_balance_etb = wallet_balance_etb + ?
            WHERE id = ?
          `).run(ride.fare.driverNetPayout, ride.driverId);
        }

        const updatedRide = DispatchService.getRideById(data.rideId);
        io.to(`ride:${data.rideId}`).emit('ride:status_changed', updatedRide);
        io.to('admin:dispatch').emit('admin:trip_updated', updatedRide);
      }
    });

    // Cancel ride
    socket.on('ride:cancel', (data: { rideId: string; reason?: string; cancelledBy: 'rider' | 'driver' | 'admin' }) => {
      const now = new Date().toISOString();
      const ride = DispatchService.getRideById(data.rideId);

      if (ride) {
        db.prepare(`
          UPDATE rides
          SET status = 'CANCELLED', cancel_reason = ?, cancelled_by = ?, updated_at = ?
          WHERE id = ?
        `).run(data.reason || 'User requested cancellation', data.cancelledBy, now, data.rideId);

        if (ride.driverId) {
          db.prepare(`
            UPDATE drivers
            SET is_busy = 0, active_ride_id = NULL
            WHERE id = ?
          `).run(ride.driverId);
        }

        const updatedRide = DispatchService.getRideById(data.rideId);
        io.to(`ride:${data.rideId}`).emit('ride:status_changed', updatedRide);
        io.to('admin:dispatch').emit('admin:trip_updated', updatedRide);
      }
    });
  });
}
