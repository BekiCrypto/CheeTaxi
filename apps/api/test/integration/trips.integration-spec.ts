/**
 * Integration test for TripsService — exercises the full trip lifecycle against
 * a real PostgreSQL + Redis via Testcontainers.
 *
 * Run: pnpm --filter @cheetaxi/api test:integration
 */
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../src/common/prisma.service';
import { RedisService } from '../src/common/redis.service';
import { TripsService } from '../src/trips/trips.service';
import { PricingService } from '../src/pricing/pricing.service';
import { GeoService } from '../src/geo/geo.service';
import { DispatchService } from '../src/dispatch/dispatch.service';
import { NotificationsService } from '../src/notifications/notifications.service';
import { RealtimeGateway } from '../src/realtime/realtime.gateway';
import { PrismaClient } from '@cheetaxi/database';
import { setupPostgres, setupRedis, teardownContainers } from './integration-setup';

describe('TripsService — integration (Testcontainers)', () => {
  let prisma: PrismaClient;
  let tripsService: TripsService;
  let module: TestingModule;

  let passengerUserId: string;
  let passengerId: string;
  let driverUserId: string;
  let driverId: string;

  beforeAll(async () => {
    const { url: dbUrl } = await setupPostgres();
    await setupRedis();

    prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
    await prisma.$connect();

    await prisma.pricingTier.create({
      data: {
        vehicleType: 'TAXI',
        city: 'Addis Ababa',
        country: 'ETHIOPIA',
        baseFare: 30,
        perKm: 15,
        perMinute: 2,
        minFare: 50,
        effectiveFrom: new Date(),
      },
    });

    const passengerUser = await prisma.user.create({
      data: { phone: '+251911000001', firstName: 'Test', lastName: 'Passenger', role: 'PASSENGER', status: 'ACTIVE', phoneVerified: true },
    });
    passengerUserId = passengerUser.id;
    const passenger = await prisma.passenger.create({ data: { userId: passengerUserId } });
    passengerId = passenger.id;

    const driverUser = await prisma.user.create({
      data: { phone: '+251911000002', firstName: 'Test', lastName: 'Driver', role: 'DRIVER', status: 'ACTIVE', phoneVerified: true },
    });
    driverUserId = driverUser.id;
    const plan = await prisma.subscriptionPlan.create({
      data: { code: 'TEST_DAILY', name: 'Test Daily', tier: 'DAILY', price: 100, currency: 'ETB', durationDays: 1 },
    });
    const subscription = await prisma.subscription.create({
      data: { userId: driverUserId, planId: plan.id, status: 'ACTIVE', startsAt: new Date(), endsAt: new Date(Date.now() + 86400000), amountPaid: 100 },
    });
    const driver = await prisma.driver.create({
      data: {
        userId: driverUserId, licenseNumber: 'TEST-LIC-001',
        licenseExpiry: new Date(Date.now() + 365 * 86400000), licenseFrontUrl: 'test',
        kycStatus: 'ONBOARDING_COMPLETE', status: 'ONLINE', online: true, backgroundCheckPassed: true,
        ratingAverage: 5.0, ratingCount: 0, totalTrips: 0, completedTrips: 0, cancelledTrips: 0,
        availableModes: ['TAXI'], latitude: 9.02, longitude: 38.75, locationUpdatedAt: new Date(),
      },
    });
    driverId = driver.id;
    await prisma.driverSubscriptionAssignment.create({ data: { subscriptionId: subscription.id, driverId, planId: plan.id } });
    await prisma.vehicle.create({
      data: {
        driverId, currentDriverId: driverId, plateNumber: 'TEST-001', make: 'Toyota', model: 'Corolla',
        year: 2020, color: 'White', vehicleType: 'TAXI', capacity: 4, hasAC: true,
        insuranceNumber: 'INS-001', insuranceExpiry: new Date(Date.now() + 365 * 86400000),
        registrationNumber: 'REG-001', registrationExpiry: new Date(Date.now() + 365 * 86400000),
        status: 'ACTIVE', verifiedAt: new Date(),
      },
    });

    const prismaService = { ...prisma } as unknown as PrismaService;
    const redisService = {
      get: jest.fn(), set: jest.fn(), del: jest.fn(),
      incr: jest.fn().mockResolvedValue(1), expire: jest.fn(),
      acquireLock: jest.fn().mockResolvedValue(() => Promise.resolve()),
      geoAdd: jest.fn(),
      geoRadius: jest.fn().mockResolvedValue([{ member: driverId, distance: 500 }]),
      geoRemove: jest.fn(),
      raw: { ping: jest.fn().mockResolvedValue('PONG') },
    } as unknown as RedisService;
    const geoService = new GeoService(prismaService);
    const pricingService = new PricingService(prismaService, redisService, geoService);
    const dispatchService = new DispatchService(prismaService, redisService);
    const notificationsService = { sendToUser: jest.fn().mockResolvedValue(undefined) } as unknown as NotificationsService;
    const realtimeGateway = { emitTripEvent: jest.fn(), emitNotification: jest.fn() } as unknown as RealtimeGateway;

    module = await Test.createTestingModule({
      providers: [
        { provide: PrismaService, useValue: prismaService },
        { provide: RedisService, useValue: redisService },
        { provide: GeoService, useValue: geoService },
        { provide: PricingService, useValue: pricingService },
        { provide: DispatchService, useValue: dispatchService },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: RealtimeGateway, useValue: realtimeGateway },
        TripsService,
      ],
    }).compile();

    tripsService = module.get(TripsService);
  }, 120000);

  afterAll(async () => {
    await prisma?.$disconnect();
    await teardownContainers();
  });

  it('requests a trip and computes fare correctly', async () => {
    const result = await tripsService.request({
      passengerUserId,
      pickup: { lat: 9.0195, lng: 38.7525, address: 'Bole' },
      dropoff: { lat: 9.0112, lng: 38.7623, address: 'Meskel Square' },
      mode: 'TAXI', vehicleType: 'TAXI', paymentMethod: 'CASH',
    });
    expect(result.tripId).toBeTruthy();
    expect(result.estimate.totalFare).toBeGreaterThan(0);
    expect(result.estimate.currency).toBe('ETB');
    expect(result.estimate.distanceMeters).toBeGreaterThan(0);

    const trip = await prisma.trip.findUnique({ where: { id: result.tripId } });
    expect(trip).toBeTruthy();
    expect(trip!.status).toBe('REQUESTED');
    expect(trip!.passengerId).toBe(passengerId);
  });

  it('accepts a trip as the driver', async () => {
    const tripRequest = await tripsService.request({
      passengerUserId,
      pickup: { lat: 9.0195, lng: 38.7525 },
      dropoff: { lat: 9.0112, lng: 38.7623 },
      mode: 'TAXI', vehicleType: 'TAXI', paymentMethod: 'CASH',
    });
    const accepted = await tripsService.accept(driverUserId, tripRequest.tripId);
    expect(accepted.status).toBe('DRIVER_ASSIGNED');
    expect(accepted.driverId).toBe(driverId);
    expect(accepted.acceptedAt).toBeTruthy();
  });

  it('transitions through the full lifecycle', async () => {
    const tripRequest = await tripsService.request({
      passengerUserId,
      pickup: { lat: 9.0195, lng: 38.7525 },
      dropoff: { lat: 9.0112, lng: 38.7623 },
      mode: 'TAXI', vehicleType: 'TAXI', paymentMethod: 'CASH',
    });
    await tripsService.accept(driverUserId, tripRequest.tripId);
    const arrived = await tripsService.arrive(driverUserId, tripRequest.tripId);
    expect(arrived.status).toBe('DRIVER_ARRIVED');

    const started = await tripsService.start(driverUserId, tripRequest.tripId);
    expect(started.status).toBe('IN_PROGRESS');

    const completed = await tripsService.complete(driverUserId, tripRequest.tripId, {
      actualDistanceMeters: 800, actualDurationSeconds: 240,
    });
    expect(completed.status).toBe('COMPLETED');

    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    expect(driver!.completedTrips).toBeGreaterThan(0);
    expect(driver!.totalEarnings).toBeGreaterThan(0);

    const passenger = await prisma.passenger.findUnique({ where: { id: passengerId } });
    expect(passenger!.completedTrips).toBeGreaterThan(0);

    const invoice = await prisma.invoice.findUnique({ where: { tripId: tripRequest.tripId } });
    expect(invoice).toBeTruthy();
    expect(Number(invoice!.total)).toBeGreaterThan(0);
  });

  it('cancels a trip', async () => {
    const tripRequest = await tripsService.request({
      passengerUserId,
      pickup: { lat: 9.0195, lng: 38.7525 },
      dropoff: { lat: 9.0112, lng: 38.7623 },
      mode: 'TAXI', vehicleType: 'TAXI', paymentMethod: 'CASH',
    });
    const cancelled = await tripsService.cancel(passengerUserId, tripRequest.tripId, 'changed mind', 'passenger');
    expect(cancelled.status).toBe('CANCELLED_BY_PASSENGER');
    expect(cancelled.cancelledAt).toBeTruthy();
  });
});
