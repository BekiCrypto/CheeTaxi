/**
 * Integration test for DispatchService — exercises Redis GEO search and
 * driver offering flow against real PostgreSQL + Redis via Testcontainers.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../src/common/prisma.service';
import { RedisService } from '../src/common/redis.service';
import { DispatchService } from '../src/dispatch/dispatch.service';
import { PrismaClient } from '@cheetaxi/database';
import Redis from 'ioredis';
import { setupPostgres, setupRedis, teardownContainers } from '../integration-setup';

describe('DispatchService — integration (Testcontainers)', () => {
  let prisma: PrismaClient;
  let redis: Redis;
  let dispatchService: DispatchService;
  let redisService: RedisService;
  let passengerUserId: string;
  let driverUserId: string;
  let driverId: string;

  beforeAll(async () => {
    const { url: dbUrl } = await setupPostgres();
    const { url: redisUrl } = await setupRedis();

    prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
    await prisma.$connect();
    redis = new Redis(redisUrl);

    const passengerUser = await prisma.user.create({
      data: { phone: '+251911000020', firstName: 'Dispatch', lastName: 'Passenger', role: 'PASSENGER', status: 'ACTIVE' },
    });
    passengerUserId = passengerUser.id;
    const passenger = await prisma.passenger.create({ data: { userId: passengerUserId } });

    const driverUser = await prisma.user.create({
      data: { phone: '+251911000021', firstName: 'Dispatch', lastName: 'Driver', role: 'DRIVER', status: 'ACTIVE' },
    });
    driverUserId = driverUser.id;
    const plan = await prisma.subscriptionPlan.create({
      data: { code: 'TEST_DAILY2', name: 'Test Daily 2', tier: 'DAILY', price: 100, currency: 'ETB', durationDays: 1 },
    });
    const subscription = await prisma.subscription.create({
      data: { userId: driverUserId, planId: plan.id, status: 'ACTIVE', startsAt: new Date(), endsAt: new Date(Date.now() + 86400000), amountPaid: 100 },
    });
    const driver = await prisma.driver.create({
      data: {
        userId: driverUserId, licenseNumber: 'TEST-LIC-002',
        licenseExpiry: new Date(Date.now() + 365 * 86400000), licenseFrontUrl: 'test',
        kycStatus: 'ONBOARDING_COMPLETE', status: 'ONLINE', online: true,
        backgroundCheckPassed: true, ratingAverage: 5.0, ratingCount: 0,
        totalTrips: 0, completedTrips: 0, cancelledTrips: 0, availableModes: ['TAXI'],
      },
    });
    driverId = driver.id;
    await prisma.driverSubscriptionAssignment.create({ data: { subscriptionId: subscription.id, driverId, planId: plan.id } });

    // Put driver in Redis GEO set at a known location
    await redis.geoadd('geo:drivers:online', 38.7525, 9.0195, driverId);

    const prismaService = { ...prisma } as unknown as PrismaService;
    redisService = new RedisService();
    (redisService as any).client = redis;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: PrismaService, useValue: prismaService },
        { provide: RedisService, useValue: redisService },
        DispatchService,
      ],
    }).compile();
    dispatchService = module.get(DispatchService);
  }, 120000);

  afterAll(async () => {
    await redis?.quit();
    await prisma?.$disconnect();
    await teardownContainers();
  });

  it('finds nearby drivers via Redis GEO', async () => {
    const prismaService = (dispatchService as any).prisma as PrismaService;
    const nearby = await redisService.geoRadius('geo:drivers:online', 38.7525, 9.0195, 3000);
    expect(nearby.length).toBeGreaterThan(0);
    expect(nearby.find((n) => n.member === driverId)).toBeTruthy();
  });

  it('creates a dispatch queue entry and processes a trip', async () => {
    const trip = await prisma.trip.create({
      data: {
        passengerId: (await prisma.passenger.findUnique({ where: { userId: passengerUserId } }))!.id,
        passengerUserId,
        mode: 'TAXI', status: 'REQUESTED',
        pickupAddress: 'Test', pickupLatitude: 9.0195, pickupLongitude: 38.7525, pickupGeohash: 'scz',
        dropoffAddress: 'Test', dropoffLatitude: 9.0112, dropoffLongitude: 38.7623, dropoffGeohash: 'scz',
        baseFare: 30, distanceFare: 50, timeFare: 10, surgeMultiplier: 1.0,
        promoDiscount: 0, taxAmount: 13.5, totalFare: 103.5, currency: 'ETB',
        paymentMethod: 'CASH',
      },
    });

    await dispatchService.enqueue(trip.id, 'scz', 'TAXI');

    // Give dispatch a moment to process
    await new Promise((r) => setTimeout(r, 500));

    const offers = await prisma.driverOffer.findMany({ where: { tripId: trip.id } });
    expect(offers.length).toBeGreaterThan(0);
    expect(offers[0].driverId).toBe(driverId);
    expect(offers[0].accepted).toBe(false);
    expect(offers[0].expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('marks a queue entry as assigned', async () => {
    const trip = await prisma.trip.create({
      data: {
        passengerId: (await prisma.passenger.findUnique({ where: { userId: passengerUserId } }))!.id,
        passengerUserId, mode: 'TAXI', status: 'REQUESTED',
        pickupAddress: 'T', pickupLatitude: 9.0195, pickupLongitude: 38.7525, pickupGeohash: 'scz',
        dropoffAddress: 'T', dropoffLatitude: 9.0112, dropoffLongitude: 38.7623, dropoffGeohash: 'scz',
        baseFare: 30, distanceFare: 50, timeFare: 10, surgeMultiplier: 1.0,
        promoDiscount: 0, taxAmount: 13.5, totalFare: 103.5, currency: 'ETB',
        paymentMethod: 'CASH',
      },
    });
    await dispatchService.enqueue(trip.id, 'scz', 'TAXI');
    await dispatchService.markAssigned(trip.id);
    const queue = await prisma.dispatchQueue.findUnique({ where: { tripId: trip.id } });
    expect(queue?.status).toBe('assigned');
  });
});
