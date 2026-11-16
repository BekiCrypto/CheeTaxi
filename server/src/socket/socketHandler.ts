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
      const updatedRide = DispatchService.updateRideStatus(data.rideId, 'ARRIVED');
      if (updatedRide) {
        io.to(`ride:${data.rideId}`).emit('ride:status_changed', updatedRide);
        io.to('admin:dispatch').emit('admin:trip_updated', updatedRide);
      }
    });

    // Driver started trip
    socket.on('ride:start', (data: { rideId: string }) => {
      const updatedRide = DispatchService.updateRideStatus(data.rideId, 'IN_PROGRESS');
      if (updatedRide) {
        io.to(`ride:${data.rideId}`).emit('ride:status_changed', updatedRide);
        io.to('admin:dispatch').emit('admin:trip_updated', updatedRide);
      }
    });

    // Driver completed trip
    socket.on('ride:complete', (data: { rideId: string }) => {
      const updatedRide = DispatchService.updateRideStatus(data.rideId, 'COMPLETED');
      if (updatedRide) {
        io.to(`ride:${data.rideId}`).emit('ride:status_changed', updatedRide);
        io.to('admin:dispatch').emit('admin:trip_updated', updatedRide);
      }
    });

    // Cancel ride
    socket.on('ride:cancel', (data: { rideId: string; reason?: string; cancelledBy: 'rider' | 'driver' | 'admin' }) => {
      const updatedRide = DispatchService.updateRideStatus(data.rideId, 'CANCELLED', {
        cancelReason: data.reason,
        cancelledBy: data.cancelledBy,
      });

      if (updatedRide) {
        if (updatedRide.driverId) {
          io.to(`driver:${updatedRide.driverId}`).emit('driver:ride_cancelled', { rideId: data.rideId });
        }
        io.emit('driver:ride_withdrawn', { rideId: data.rideId });
        io.to(`ride:${data.rideId}`).emit('ride:status_changed', updatedRide);
        io.to('admin:dispatch').emit('admin:trip_updated', updatedRide);
      }
    });
  });
}
