import { describe, it, expect } from 'vitest';
import { ProviderAggregatorService } from '../services/providerAggregatorService.js';
import { SafetyService } from '../services/safetyService.js';
import { db } from '../db/database.js';
import request from 'supertest';
import { app } from '../index.js';

describe('CHEBELEW Version 1.0 Master Development Execution Order Verification', () => {
  const pickup = { lat: 8.9950, lng: 38.7880, address: 'Bole Medhanialem, Addis Ababa' };
  const destination = { lat: 9.0105, lng: 38.7615, address: 'Meskel Square, Addis Ababa' };

  describe('Section 3.1: Multi-Provider Offer Ranking & 4-Mode Comparison Engine', () => {
    it('should return normalized MarketplaceOffers with full scoring breakdown', () => {
      const offers = ProviderAggregatorService.searchAndRankOffers(pickup, destination, 'sedan', 'best_value');
      expect(offers.length).toBeGreaterThanOrEqual(3);

      const top = offers[0];
      expect(top.id).toBeDefined();
      expect(top.currency).toBe('ETB');
      expect(top.estimatedFare).toBeGreaterThan(0);
      expect(top.scoreBreakdown).toBeDefined();

      const breakdown = top.scoreBreakdown!;
      expect(breakdown.priceScore).toBeGreaterThanOrEqual(0);
      expect(breakdown.pickupEtaScore).toBeGreaterThanOrEqual(0);
      expect(breakdown.journeyTimeScore).toBeGreaterThanOrEqual(0);
      expect(breakdown.reliabilityScore).toBeGreaterThanOrEqual(0);
      expect(breakdown.qualityScore).toBeGreaterThanOrEqual(0);
      expect(breakdown.preferenceMatchScore).toBeGreaterThanOrEqual(0);
      expect(breakdown.totalOfferScore).toBeGreaterThanOrEqual(50);
    });

    it('should rank lowest fare first in "cheapest" mode', () => {
      const offers = ProviderAggregatorService.searchAndRankOffers(pickup, destination, 'sedan', 'cheapest');
      const available = offers.filter((o) => o.isAvailable);
      for (let i = 0; i < available.length - 1; i++) {
        expect(available[i].estimatedFare).toBeLessThanOrEqual(available[i + 1].estimatedFare);
      }
    });

    it('should rank shortest pickup ETA first in "fastest_pickup" mode', () => {
      const offers = ProviderAggregatorService.searchAndRankOffers(pickup, destination, 'sedan', 'fastest_pickup');
      const available = offers.filter((o) => o.isAvailable);
      for (let i = 0; i < available.length - 1; i++) {
        expect(available[i].estimatedPickupMinutes).toBeLessThanOrEqual(available[i + 1].estimatedPickupMinutes);
      }
    });

    it('should prioritize comfort quality score in "premium_comfort" mode', () => {
      const offers = ProviderAggregatorService.searchAndRankOffers(pickup, destination, 'sedan', 'premium_comfort');
      const available = offers.filter((o) => o.isAvailable);
      expect(available[0].scoreBreakdown?.qualityScore).toBeGreaterThanOrEqual(13);
    });

    it('should incorporate passenger comfort preferences in match score', () => {
      const prefs = {
        userId: 'user_test_rider',
        acRequired: true,
        quietRide: true,
        extraLuggage: true,
        temperaturePreference: 'cool' as const,
        femaleDriverPreference: false,
        accessibilityAssistance: false,
        petFriendly: false,
        childSeat: false,
        updatedAt: new Date().toISOString(),
      };

      const offers = ProviderAggregatorService.searchAndRankOffers(pickup, destination, 'sedan', 'best_value', prefs);
      const topOffer = offers.find((o) => o.providerId === 'chebelew');
      expect(topOffer?.scoreBreakdown?.preferenceMatchScore).toBeGreaterThanOrEqual(9.0);
    });
  });

  describe('Section 3.4 & Workstream 10: Route Deviation Anomaly Detection', () => {
    it('should detect route deviation when vehicle coordinate is > 600m away from route', () => {
      const plannedRoute: [number, number][] = [
        [8.9950, 38.7880], // Bole Medhanialem
        [9.0020, 38.7750], // Olympia
        [9.0105, 38.7615], // Meskel Square
      ];

      // Vehicle off-route by ~3km towards Sarbet
      const offRouteCoord: [number, number] = [8.9970, 38.7360];

      const alert = SafetyService.checkRouteDeviation({
        rideId: 'ride_dev_test_01',
        driverId: 'driver_ahmed_01',
        riderId: 'user_leila_rider',
        actualLat: offRouteCoord[0],
        actualLng: offRouteCoord[1],
        expectedCoords: plannedRoute,
        thresholdMeters: 600,
      });

      expect(alert).not.toBeNull();
      expect(alert?.status).toBe('FLAGGED');
      expect(alert?.deviationMeters).toBeGreaterThan(600);

      // Verify stored in DB
      const list = SafetyService.listRouteDeviations();
      expect(list.some((d) => d.rideId === 'ride_dev_test_01')).toBe(true);

      // Resolve alert
      const resolved = SafetyService.resolveRouteDeviation(
        alert!.id,
        'Traffic detour on Africa Avenue',
        'Senior Safety Officer',
        'RESOLVED_NORMAL_TRAFFIC'
      );
      expect(resolved?.status).toBe('RESOLVED_NORMAL_TRAFFIC');
    });

    it('should not trigger deviation alert when vehicle is along the planned route', () => {
      const plannedRoute: [number, number][] = [
        [8.9950, 38.7880],
        [9.0020, 38.7750],
        [9.0105, 38.7615],
      ];

      // Normal vehicle coordinate within 50 meters
      const normalCoord: [number, number] = [8.9952, 38.7881];

      const alert = SafetyService.checkRouteDeviation({
        rideId: 'ride_normal_01',
        driverId: 'driver_ahmed_01',
        riderId: 'user_leila_rider',
        actualLat: normalCoord[0],
        actualLng: normalCoord[1],
        expectedCoords: plannedRoute,
        thresholdMeters: 600,
      });

      expect(alert).toBeNull();
    });
  });

  describe('Workstream 5: Scheduled Rides & Passenger Preferences Endpoints', () => {
    it('should create and retrieve a scheduled ride with airport flight info', async () => {
      const res = await request(app)
        .post('/api/rides/schedule')
        .send({
          riderId: 'user_leila_rider',
          riderName: 'Leila Haile',
          riderPhone: '+251911223344',
          scheduledTime: '2026-11-20T08:30:00.000Z',
          pickup: { lat: 9.0105, lng: 38.7615, address: 'Meskel Square' },
          destination: { lat: 8.9778, lng: 38.7993, address: 'Bole Addis Ababa International Airport Terminal 2' },
          vehicleCategory: 'sedan',
          flightNumber: 'ET-500',
          airportTerminal: 'Terminal 2 International',
          recurrenceType: 'once',
          notes: 'Flight to Washington Dulles. Please arrive 10 mins early with trunk space.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.scheduledRide.flightNumber).toBe('ET-500');
      expect(res.body.scheduledRide.airportTerminal).toBe('Terminal 2 International');

      // List user's scheduled rides
      const listRes = await request(app).get('/api/rides/scheduled/user/user_leila_rider');
      expect(listRes.status).toBe(200);
      expect(listRes.body.scheduledRides.length).toBeGreaterThanOrEqual(1);

      // Cancel scheduled ride
      const cancelRes = await request(app).post(`/api/rides/scheduled/${res.body.scheduledRide.id}/cancel`);
      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.success).toBe(true);
    });

    it('should save and retrieve passenger comfort preferences', async () => {
      const putRes = await request(app)
        .put('/api/rides/preferences/user_leila_rider')
        .send({
          acRequired: true,
          quietRide: true,
          extraLuggage: false,
          temperaturePreference: 'cool',
          femaleDriverPreference: false,
          notes: 'Prefer low music and AC enabled',
        });

      expect(putRes.status).toBe(200);
      expect(putRes.body.preferences.acRequired).toBe(true);
      expect(putRes.body.preferences.quietRide).toBe(true);

      const getRes = await request(app).get('/api/rides/preferences/user_leila_rider');
      expect(getRes.status).toBe(200);
      expect(getRes.body.preferences.temperaturePreference).toBe('cool');
      expect(getRes.body.preferences.quietRide).toBe(true);
    });
  });

  describe('Workstream 8 & 9: Demand Heatmap & Driver Profitability Intelligence', () => {
    it('should return Addis Ababa demand heatmap zones with forecast metrics', async () => {
      const res = await request(app).get('/api/drivers/heatmap?forecast=next_30_mins');
      expect(res.status).toBe(200);
      expect(res.body.zones.length).toBeGreaterThanOrEqual(7);

      const boleZone = res.body.zones.find((z: any) => z.zoneId === 'zone_bole_medhanialem');
      expect(boleZone).toBeDefined();
      expect(boleZone.demandIntensity).toBeGreaterThan(1.5);
      expect(boleZone.potentialHourlyEarningsEtb).toBeGreaterThanOrEqual(400);
    });

    it('should calculate driver net profitability under 0% platform commission', async () => {
      const res = await request(app).get('/api/drivers/driver_ahmed_01/profitability');
      expect(res.status).toBe(200);
      expect(res.body.platformCommissionPercentage).toBe(0);
      expect(res.body.profitability).toBeDefined();

      const p = res.body.profitability;
      expect(p.grossEarningsTodayEtb).toBeGreaterThan(0);
      expect(p.estimatedFuelCostEtb).toBeGreaterThan(0);
      expect(p.allocatedMaintenanceEtb).toBeGreaterThan(0);
      expect(p.allocatedInsuranceEtb).toBeGreaterThan(0);
      expect(p.subscriptionCostTodayEtb).toBe(40.0);
      expect(p.netOperatingEarningsEtb).toBeDefined();
      expect(p.subscriptionBreakEvenTrips).toBeGreaterThanOrEqual(1);
    });

    it('should update and retrieve driver operating expenses', async () => {
      const updateRes = await request(app)
        .put('/api/drivers/driver_ahmed_01/expenses')
        .send({
          fuelCostPerKm: 4.5,
          dailyMaintenanceEtb: 90.0,
          dailyInsuranceEtb: 50.0,
          dailyMiscExpensesEtb: 40.0,
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.expenses.fuelCostPerKm).toBe(4.5);

      const getRes = await request(app).get('/api/drivers/driver_ahmed_01/expenses');
      expect(getRes.status).toBe(200);
      expect(getRes.body.expenses.fuelCostPerKm).toBe(4.5);
      expect(getRes.body.expenses.dailyMaintenanceEtb).toBe(90.0);
    });
  });
});
