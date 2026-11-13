import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { initDatabase, db } from '../db/database.js';
import { DispatchService } from '../services/dispatchService.js';
import { TelebirrService } from '../services/telebirrService.js';

describe('Chebelew End-to-End Dispatch and Telebirr Lifecycle', () => {
  beforeAll(() => {
    initDatabase();
  });

  beforeEach(() => {
    db.prepare('UPDATE drivers SET is_busy = 0, is_online = 1, active_ride_id = NULL').run();
  });

  it('should find eligible nearby drivers in Addis Ababa', () => {
    // Bole Medhanialem coordinates
    const drivers = DispatchService.findEligibleDrivers(8.9950, 38.7880, 'sedan', 10);
    expect(drivers.length).toBeGreaterThan(0);
    expect(drivers[0].isOnline).toBe(true);
    expect(drivers[0].distanceToPickupKm).toBeDefined();
  });

  it('should create a ride, match driver, and handle Telebirr payment', () => {
    const ride = DispatchService.createRide({
      riderId: 'user_leila_01',
      riderName: 'Leila Haile',
      riderPhone: '+251911223344',
      pickup: {
        address: 'Bole Medhanialem Mall',
        lat: 8.9950,
        lng: 38.7880,
      },
      destination: {
        address: 'Meskel Square',
        lat: 9.0105,
        lng: 38.7615,
      },
      vehicleCategory: 'sedan',
      paymentMethod: 'TELEBIRR',
    });

    expect(ride.id).toBeDefined();
    expect(ride.status).toBe('ASSIGNED');
    expect(ride.driverId).toBeDefined();
    expect(ride.fare.vatAmount).toBeGreaterThan(0);

    // Create Telebirr payment order
    const order = TelebirrService.createOrder({
      rideId: ride.id,
      amountEtb: ride.fare.totalFare,
      payerPhone: '+251911223344',
    });

    expect(order.orderId).toBeDefined();
    expect(order.ussdPushCode).toContain('*127*');
    expect(order.status).toBe('PENDING');

    // Simulate passenger confirming Telebirr payment
    const paidOrder = TelebirrService.processPayment(order.orderId, true);
    expect(paidOrder.status).toBe('SUCCESS');
    expect(paidOrder.transactionNo).toBeDefined();

    // Verify ride payment status updated to PAID
    const updatedRide = DispatchService.getRideById(ride.id);
    expect(updatedRide?.paymentStatus).toBe('PAID');
    expect(updatedRide?.telebirrOrderId).toBe(order.orderId);
  });
});
