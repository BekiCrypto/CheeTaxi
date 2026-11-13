import { describe, it, expect } from 'vitest';
import { calculateFare, getFareEstimates } from '../services/fareService.js';

describe('Chebelew Fare Calculation Engine & VAT Regulation 570/2025', () => {
  it('should calculate accurate Sedan fare with 15% VAT and 0% platform commission (Founder Subscription Mandate)', () => {
    // 5 km ride, 15 minutes duration
    // Sedan tariff: base 70, perKm 14, perMin 3
    // Subtotal = 70 + (5 * 14) + (15 * 3) = 70 + 70 + 45 = 185 ETB
    // VAT (15% per Reg 570/2025) = 185 * 0.15 = 27.75 ETB
    // Total fare = 185 + 27.75 = 212.75 ETB
    // Platform commission (0% per subscription model) = 0.00 ETB
    // Driver net payout = 185.00 ETB (100% of ride fare retained by subscribed driver!)
    const fare = calculateFare('sedan', 5, 15);

    expect(fare.baseFare).toBe(70);
    expect(fare.distanceKm).toBe(5);
    expect(fare.durationMinutes).toBe(15);
    expect(fare.subtotal).toBe(185);
    expect(fare.vatRate).toBe(0.15);
    expect(fare.vatAmount).toBe(27.75);
    expect(fare.totalFare).toBe(212.75);
    expect(fare.platformCommission).toBe(0.00);
    expect(fare.driverNetPayout).toBe(185.00);
  });

  it('should enforce minimum fare for very short trips', () => {
    // 0.2 km ride, 2 minutes
    // Sedan minimum fare is 110 ETB
    const fare = calculateFare('sedan', 0.2, 2);
    expect(fare.subtotal).toBe(110);
    expect(fare.vatAmount).toBe(16.5);
    expect(fare.totalFare).toBe(126.5);
  });

  it('should generate aggregator comparison across Chebelew, RIDE, and Feres', () => {
    const estimates = getFareEstimates(8, 20);
    expect(estimates.length).toBeGreaterThanOrEqual(4);

    const sedan = estimates.find((e) => e.category === 'sedan');
    const ridePartner = estimates.find((e) => e.category === 'partner_ride');
    const feresPartner = estimates.find((e) => e.category === 'partner_feres');

    expect(sedan).toBeDefined();
    expect(ridePartner).toBeDefined();
    expect(feresPartner).toBeDefined();
    expect(ridePartner?.isAggregatedPartner).toBe(true);
    expect(feresPartner?.isAggregatedPartner).toBe(true);
  });
});
