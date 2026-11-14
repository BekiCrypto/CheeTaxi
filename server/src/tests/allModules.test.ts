import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { initDatabase, db } from '../db/database.js';
import { DeliveryService } from '../services/deliveryService.js';
import { SubscriptionService } from '../services/subscriptionService.js';
import { SafetyService } from '../services/safetyService.js';
import { CorporateService } from '../services/corporateService.js';
import { ProviderAggregatorService } from '../services/providerAggregatorService.js';
import {
  calculateHaversineDistance,
  estimateRoadMetrics,
  generateRouteCoordinates,
  searchAddisPlaces,
  reverseGeocodeAddis,
} from '../services/geoService.js';
import { ROLE_PERMISSIONS, activeAdminTokens, ADMIN_SESSION_SECRET } from '../middleware/adminAuth.js';

describe('Chebelew End-to-End Enterprise Services', () => {
  beforeAll(() => {
    initDatabase();
  });

  beforeEach(() => {
    db.prepare('UPDATE drivers SET is_busy = 0, is_online = 1, active_ride_id = NULL, active_delivery_id = NULL').run();
  });

  // --------------------------------------------------------------------------
  // 1. Delivery & Logistics Subsystem (Dual OTP Verification)
  // --------------------------------------------------------------------------
  describe('Delivery & Logistics Service', () => {
    let testOrderId: string;
    let pickupOtp: string;
    let dropoffOtp: string;

    it('should create a delivery order with dual OTPs and calculate 15% VAT', () => {
      const order = DeliveryService.createOrder({
        senderId: 'user_leila_01',
        senderName: 'Leila Haile',
        senderPhone: '+251911223344',
        recipientName: 'Solomon Tefera',
        recipientPhone: '+251912993344',
        pickup: {
          address: 'Kazanchis UNECA HQ',
          lat: 9.0185,
          lng: 38.7705,
        },
        dropoff: {
          address: 'Bole Medhanialem Mall',
          lat: 8.9950,
          lng: 38.7880,
        },
        category: 'document',
        packageDescription: 'Confidential commercial contract documents',
        weightKg: 0.5,
        deliverySpeed: 'express',
        paymentMethod: 'TELEBIRR',
      });

      expect(order.id).toBeDefined();
      expect(order.status).toBe('ASSIGNED');
      expect(order.pickupOtp).toHaveLength(4);
      expect(order.dropoffOtp).toHaveLength(4);
      expect(order.priceEtb).toBeGreaterThan(0);
      expect(order.vatEtb).toBe(Number((order.priceEtb * 0.15).toFixed(2)));
      expect(order.totalEtb).toBe(Number((order.priceEtb + order.vatEtb).toFixed(2)));
      expect(order.courierId).toBeDefined();

      testOrderId = order.id;
      pickupOtp = order.pickupOtp;
      dropoffOtp = order.dropoffOtp;
    });

    it('should reject pickup with incorrect OTP', () => {
      expect(() => {
        DeliveryService.verifyPickup(testOrderId, '0000');
      }).toThrow('Invalid Pickup OTP');
    });

    it('should verify pickup using sender OTP and transition status to IN_TRANSIT', () => {
      const order = DeliveryService.verifyPickup(testOrderId, pickupOtp);
      expect(order.status).toBe('IN_TRANSIT');
    });

    it('should reject drop-off with incorrect OTP', () => {
      expect(() => {
        DeliveryService.completeDelivery(testOrderId, '0000');
      }).toThrow('Invalid Drop-off OTP');
    });

    it('should complete delivery with recipient OTP, store proof, and free courier', () => {
      const proofPhoto = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300';
      const order = DeliveryService.completeDelivery(testOrderId, dropoffOtp, proofPhoto);

      expect(order.status).toBe('DELIVERED');
      expect(order.proofOfDeliveryPhotoUrl).toBe(proofPhoto);

      // Check courier is freed and not busy
      const courier = db.prepare('SELECT is_busy, active_delivery_id FROM drivers WHERE id = ?').get(order.courierId!) as any;
      expect(courier.is_busy).toBe(0);
      expect(courier.active_delivery_id).toBeNull();
    });

    it('should list delivery orders for sender', () => {
      const orders = DeliveryService.listDeliveries('user_leila_01');
      expect(orders.length).toBeGreaterThan(0);
      expect(orders.some((o) => o.id === testOrderId)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 2. Driver Subscription Model (0% Commission Mandate)
  // --------------------------------------------------------------------------
  describe('Driver Subscription Service', () => {
    it('should retrieve available subscription plans for Addis Ababa / ET', () => {
      const plans = SubscriptionService.getPlans('ET', 'ADDIS_ABABA');
      expect(plans.length).toBeGreaterThanOrEqual(4);

      const daily = plans.find((p) => p.billingPeriod === 'daily');
      const monthly = plans.find((p) => p.billingPeriod === 'monthly');

      expect(daily).toBeDefined();
      expect(daily?.priceAmount).toBe(50.0);
      expect(monthly).toBeDefined();
      expect(monthly?.priceAmount).toBe(1000.0);
    });

    it('should verify driver entitlement and access status', () => {
      // Driver Ahmed has active monthly subscription
      const ent = SubscriptionService.checkDriverEntitlement('driver_ahmed_01');
      expect(ent.driverId).toBe('driver_ahmed_01');
      expect(ent.isEligibleToGoOnline).toBe(true);
      expect(ent.status).toBe('active');
    });

    it('should allow driver to purchase and activate subscription', () => {
      const sub = SubscriptionService.subscribe(
        'driver_solomon_05',
        'plan_monthly_et',
        'TELEBIRR',
        'TB_REF_SOLOMON_01'
      );

      expect(sub.id).toBeDefined();
      expect(sub.driverId).toBe('driver_solomon_05');
      expect(sub.status).toBe('active');
      expect(sub.amountPaid).toBe(1000.0);

      // Check driver record in database
      const driver = db.prepare('SELECT subscription_status, active_subscription_id FROM drivers WHERE id = ?').get('driver_solomon_05') as any;
      expect(driver.subscription_status).toBe('active');
      expect(driver.active_subscription_id).toBe(sub.id);
    });

    it('should grant admin-sponsored trial subscription', () => {
      const sub = SubscriptionService.grantTrialOrSponsored(
        'driver_solomon_05',
        14,
        'Introductory promotion for cooperative fleet onboarding'
      );

      expect(sub.status).toBe('active');
      expect(sub.amountPaid).toBe(0);
      expect(sub.paymentMethod).toBe('CASH');
    });
  });

  // --------------------------------------------------------------------------
  // 3. Safety, Emergency & SOS Incident System
  // --------------------------------------------------------------------------
  describe('Safety & Emergency SOS Service', () => {
    let incidentId: string;

    it('should trigger SOS emergency with live coordinates', () => {
      const incident = SafetyService.triggerSos({
        reporterUserId: 'user_leila_01',
        reporterName: 'Leila Haile',
        reporterPhone: '+251911223344',
        reporterRole: 'rider',
        currentLat: 9.0105,
        currentLng: 38.7615,
        safetyNotes: 'Felt unsafe near dark construction site on Churchill road',
      });

      expect(incident.id).toBeDefined();
      expect(incident.status).toBe('OPEN');
      expect(incident.currentLat).toBe(9.0105);
      expect(incident.currentLng).toBe(38.7615);

      incidentId = incident.id;
    });

    it('should escalate SOS incident to Ethiopian Police 991', () => {
      const escalated = SafetyService.escalateToPolice(
        incidentId,
        'Addis Ababa Police Commission Sector 4 notified; vehicle dispatch confirmed.'
      );

      expect(escalated.status).toBe('ESCALATED_POLICE');
      expect(escalated.safetyNotes).toContain('Police');
    });

    it('should resolve SOS incident with summary log', () => {
      const resolved = SafetyService.resolveSos(
        incidentId,
        'Police patrol arrived on scene. Passenger confirmed safe and escorted.'
      );

      expect(resolved.status).toBe('RESOLVED');
      expect(resolved.resolvedAt).toBeDefined();
    });

    it('should list all SOS incidents', () => {
      const incidents = SafetyService.listIncidents();
      expect(incidents.length).toBeGreaterThan(0);
      expect(incidents.some((i) => i.id === incidentId)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 4. Corporate Transportation & Fleet Management
  // --------------------------------------------------------------------------
  describe('Corporate Transportation & Fleet Management', () => {
    let corpId: string;

    it('should register a new corporate account with credit limit', () => {
      const corp = CorporateService.createCorporateAccount({
        companyName: 'Commercial Bank of Ethiopia (CBE HQ)',
        registrationNumber: 'REG-ET-CBE-2026',
        tinNumber: '0012398471',
        contactPerson: 'Dawit Mengistu',
        contactEmail: 'logistics@cbe.com.et',
        contactPhone: '+251911990088',
        creditLimitEtb: 500000.0,
      });

      expect(corp.id).toBeDefined();
      expect(corp.companyName).toBe('Commercial Bank of Ethiopia (CBE HQ)');
      expect(corp.creditLimitEtb).toBe(500000.0);
      expect(corp.status).toBe('active');

      corpId = corp.id;
    });

    it('should add employee with monthly allowance to corporate account', () => {
      const emp = CorporateService.addEmployee({
        corporateId: corpId,
        name: 'Sara Tesfaye',
        phone: '+251911448833',
        email: 'sara.t@cbe.com.et',
        department: 'Audit & Compliance',
        monthlyAllowanceEtb: 8000.0,
      });

      expect(emp.id).toBeDefined();
      expect(emp.corporateId).toBe(corpId);
      expect(emp.monthlyAllowanceEtb).toBe(8000.0);
      expect(emp.isActive).toBe(true);
    });

    it('should list corporate accounts and fleets', () => {
      const accounts = CorporateService.listCorporates();
      expect(accounts.length).toBeGreaterThanOrEqual(2);

      const fleets = CorporateService.listFleets();
      expect(fleets.length).toBeGreaterThanOrEqual(1);
      expect(fleets[0].fleetName).toBe('Addis Luxury Cab Cooperative');
    });
  });

  // --------------------------------------------------------------------------
  // 5. Multi-Provider Aggregator & Circuit Breaker Engine
  // --------------------------------------------------------------------------
  describe('Multi-Provider Aggregator & Circuit Breaker', () => {
    it('should return provider adapter statuses', () => {
      const statuses = ProviderAggregatorService.getProviderStatuses();
      expect(statuses.length).toBeGreaterThanOrEqual(4);

      const chebelew = statuses.find((s) => s.id === 'chebelew');
      expect(chebelew).toBeDefined();
      expect(chebelew?.circuitState).toBe('CLOSED');
      expect(chebelew?.isAuthorized).toBe(true);
    });

    it('should search and rank transport offers across Chebelew and partners', () => {
      const pickup = { lat: 8.9950, lng: 38.7880, address: 'Bole Medhanialem' };
      const destination = { lat: 9.0105, lng: 38.7615, address: 'Meskel Square' };

      const offers = ProviderAggregatorService.searchAndRankOffers(pickup, destination, 'sedan');
      expect(offers.length).toBeGreaterThanOrEqual(3);

      // Chebelew independent driver should be top ranked
      const topOffer = offers[0];
      expect(topOffer.providerId).toBe('chebelew');
      expect(topOffer.currency).toBe('ETB');
      expect(topOffer.estimatedFare).toBeGreaterThan(0);
      expect(topOffer.reliabilityScore).toBeGreaterThanOrEqual(95);
    });

    it('should trip circuit breaker to OPEN when provider failures occur', () => {
      // Record 3 consecutive failures for third-party partner
      ProviderAggregatorService.recordProviderFailure('ride');
      ProviderAggregatorService.recordProviderFailure('ride');
      ProviderAggregatorService.recordProviderFailure('ride');

      const statuses = ProviderAggregatorService.getProviderStatuses();
      const rideStatus = statuses.find((s) => s.id === 'ride');
      expect(rideStatus?.circuitState).toBe('OPEN');

      // Now searching offers should mark ride as unavailable
      const pickup = { lat: 8.9950, lng: 38.7880, address: 'Bole Medhanialem' };
      const destination = { lat: 9.0105, lng: 38.7615, address: 'Meskel Square' };
      const offers = ProviderAggregatorService.searchAndRankOffers(pickup, destination, 'sedan');
      const rideOffer = offers.find((o) => o.providerId === 'ride');
      expect(rideOffer?.isAvailable).toBe(false);
      expect(rideOffer?.circuitStatus).toBe('OPEN');
    });

    it('should reset circuit breaker to CLOSED', () => {
      ProviderAggregatorService.resetProviderCircuit('ride');
      const statuses = ProviderAggregatorService.getProviderStatuses();
      const rideStatus = statuses.find((s) => s.id === 'ride');
      expect(rideStatus?.circuitState).toBe('CLOSED');
      expect(rideStatus?.failureCount).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // 6. Geo & Navigation Services (Addis Ababa Landmark Search & Routing)
  // --------------------------------------------------------------------------
  describe('Addis Ababa Geo & Navigation Service', () => {
    it('should compute Haversine distance between Bole and Meskel Square', () => {
      // Bole Medhanialem to Meskel Square ~ 3.5 - 4.5 km straight line
      const dist = calculateHaversineDistance(8.9950, 38.7880, 9.0105, 38.7615);
      expect(dist).toBeGreaterThan(2.5);
      expect(dist).toBeLessThan(5.5);
    });

    it('should estimate road metrics factoring Addis traffic', () => {
      const metrics = estimateRoadMetrics(8.9950, 38.7880, 9.0105, 38.7615);
      expect(metrics.distanceKm).toBeGreaterThan(3.0);
      expect(metrics.durationMinutes).toBeGreaterThan(5);
    });

    it('should generate smooth route coordinates for map animation', () => {
      const waypoints = generateRouteCoordinates(8.9950, 38.7880, 9.0105, 38.7615, 20);
      expect(waypoints.length).toBeGreaterThanOrEqual(20);
      expect(waypoints[0][0]).toBe(8.9950);
      expect(waypoints[0][1]).toBe(38.7880);
      expect(waypoints[waypoints.length - 1][0]).toBe(9.0105);
      expect(waypoints[waypoints.length - 1][1]).toBe(38.7615);
    });

    it('should search landmarks in English and Amharic', () => {
      const boleEn = searchAddisPlaces('Bole');
      expect(boleEn.length).toBeGreaterThan(0);
      expect(boleEn[0].name).toContain('Bole');

      const meskelAm = searchAddisPlaces('መስቀል');
      expect(meskelAm.length).toBeGreaterThan(0);
      expect(meskelAm[0].nameAm).toContain('መስቀል');
    });

    it('should reverse geocode coordinates to nearest known landmark', () => {
      // Near Bole Airport coordinates (8.9778, 38.7993)
      const loc = reverseGeocodeAddis(8.9780, 38.7990);
      expect(loc.address).toContain('Bole');
    });
  });

  // --------------------------------------------------------------------------
  // 7. Granular RBAC & Access Separation
  // --------------------------------------------------------------------------
  describe('Granular Role-Based Access Control (RBAC)', () => {
    it('should have complete permission matrices for all admin roles', () => {
      expect(ROLE_PERMISSIONS.super_admin).toContain('manage_tariffs');
      expect(ROLE_PERMISSIONS.super_admin).toContain('view_financials');
      expect(ROLE_PERMISSIONS.super_admin).toContain('manage_dispatch');
      expect(ROLE_PERMISSIONS.super_admin).toContain('manage_kyc');

      // Dispatcher should have dispatch and SOS but NOT tariff management
      expect(ROLE_PERMISSIONS.dispatcher).toContain('manage_dispatch');
      expect(ROLE_PERMISSIONS.dispatcher).toContain('manage_sos');
      expect(ROLE_PERMISSIONS.dispatcher).not.toContain('manage_tariffs');

      // Compliance officer should have KYC but NOT dispatch or tariff editing
      expect(ROLE_PERMISSIONS.compliance_officer).toContain('manage_kyc');
      expect(ROLE_PERMISSIONS.compliance_officer).not.toContain('manage_tariffs');
      expect(ROLE_PERMISSIONS.compliance_officer).not.toContain('manage_dispatch');

      // Finance officer should have VAT reports and subscriptions but NOT live dispatch
      expect(ROLE_PERMISSIONS.finance_officer).toContain('export_vat_reports');
      expect(ROLE_PERMISSIONS.finance_officer).toContain('view_financials');
      expect(ROLE_PERMISSIONS.finance_officer).not.toContain('manage_dispatch');
      expect(ROLE_PERMISSIONS.finance_officer).not.toContain('manage_tariffs');
    });

    it('should configure verified tokens for all role personas', () => {
      const superAdmin = activeAdminTokens.get(ADMIN_SESSION_SECRET);
      expect(superAdmin?.role).toBe('super_admin');

      const disp = activeAdminTokens.get('chebelew_disp_token_9922');
      expect(disp?.role).toBe('dispatcher');

      const kyc = activeAdminTokens.get('chebelew_kyc_token_9922');
      expect(kyc?.role).toBe('compliance_officer');

      const fin = activeAdminTokens.get('chebelew_fin_token_9922');
      expect(fin?.role).toBe('finance_officer');
    });
  });
});
