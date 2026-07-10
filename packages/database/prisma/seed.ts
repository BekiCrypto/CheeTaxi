import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding CheeTaxi database...');

  // ─── Pricing Tiers (Ethiopia — Addis Ababa) ────────────────────────────
  const pricingTiers = [
    { vehicleType: 'TAXI' as const, baseFare: 30, perKm: 15, perMinute: 2, minFare: 50 },
    { vehicleType: 'RIDE_SHARING' as const, baseFare: 25, perKm: 12, perMinute: 2, minFare: 40 },
    { vehicleType: 'MOTORCYCLE' as const, baseFare: 20, perKm: 8, perMinute: 1, minFare: 30 },
    { vehicleType: 'THREE_WHEELER' as const, baseFare: 20, perKm: 9, perMinute: 1, minFare: 30 },
    { vehicleType: 'COURIER' as const, baseFare: 50, perKm: 18, perMinute: 2, minFare: 80 },
    { vehicleType: 'FOOD_DELIVERY' as const, baseFare: 35, perKm: 12, perMinute: 1, minFare: 50 },
    { vehicleType: 'PARCEL' as const, baseFare: 40, perKm: 15, perMinute: 2, minFare: 70 },
    { vehicleType: 'TRUCK' as const, baseFare: 200, perKm: 45, perMinute: 5, minFare: 400 },
    { vehicleType: 'INTERCITY' as const, baseFare: 100, perKm: 8, perMinute: 0, minFare: 200 },
    { vehicleType: 'RENTAL' as const, baseFare: 500, perKm: 10, perMinute: 0, minFare: 500 },
  ];

  for (const tier of pricingTiers) {
    await prisma.pricingTier.upsert({
      where: {
        vehicleType_city_country_effectiveFrom: {
          vehicleType: tier.vehicleType,
          city: 'Addis Ababa',
          country: 'ETHIOPIA',
          effectiveFrom: new Date('2025-01-01'),
        },
      },
      update: {},
      create: {
        ...tier,
        city: 'Addis Ababa',
        country: 'ETHIOPIA',
        effectiveFrom: new Date('2025-01-01'),
      },
    });
  }

  // ─── Subscription Plans ────────────────────────────────────────────────
  const plans = [
    { code: 'DAILY', name: 'Daily Pass', tier: 'DAILY' as const, price: 100, durationDays: 1 },
    { code: 'WEEKLY', name: 'Weekly Pass', tier: 'WEEKLY' as const, price: 500, durationDays: 7 },
    { code: 'MONTHLY', name: 'Monthly Pass', tier: 'MONTHLY' as const, price: 1800, durationDays: 30 },
    { code: 'QUARTERLY', name: 'Quarterly Pass', tier: 'QUARTERLY' as const, price: 5000, durationDays: 90 },
    { code: 'YEARLY', name: 'Yearly Pass', tier: 'YEARLY' as const, price: 18000, durationDays: 365 },
    { code: 'CORPORATE_FLEET', name: 'Corporate Fleet (10 drivers)', tier: 'CORPORATE_FLEET' as const, price: 15000, durationDays: 30, maxDrivers: 10 },
    { code: 'ENTERPRISE', name: 'Enterprise Fleet (50 drivers)', tier: 'ENTERPRISE' as const, price: 65000, durationDays: 30, maxDrivers: 50 },
    { code: 'GOVERNMENT', name: 'Government Fleet', tier: 'GOVERNMENT' as const, price: 0, durationDays: 365, maxDrivers: 100 },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { code: plan.code },
      update: {},
      create: { ...plan, currency: 'ETB', description: `${plan.name} — unlimited rides` },
    });
  }

  // ─── Super Admin ───────────────────────────────────────────────────────
  const adminPasswordHash = await bcrypt.hash('ChangeMe!2025', 12);
  const admin = await prisma.user.upsert({
    where: { phone: '+251900000000' },
    update: {},
    create: {
      phone: '+251900000000',
      email: 'admin@cheetaxi.africa',
      phoneVerified: true,
      emailVerified: true,
      passwordHash: adminPasswordHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      preferredLanguage: 'en',
      country: 'ETHIOPIA',
      city: 'Addis Ababa',
      referralCode: `CHEE-${nanoid(8).toUpperCase()}`,
    },
  });
  await prisma.userRoleAssignment.upsert({
    where: {
      userId_role_scope: { userId: admin.id, role: 'SUPER_ADMIN', scope: null as any },
    },
    update: {},
    create: { userId: admin.id, role: 'SUPER_ADMIN', grantedBy: 'system' },
  });

  // ─── Sample Notification Templates ─────────────────────────────────────
  const templates = [
    {
      code: 'TRIP_REQUESTED',
      channel: 'PUSH' as const,
      title: 'Looking for your ride',
      body: 'We are finding a driver near {{pickup}}...',
    },
    {
      code: 'DRIVER_ASSIGNED',
      channel: 'PUSH' as const,
      title: 'Your driver is on the way',
      body: '{{driverName}} will arrive in {{eta}} minutes. Plate: {{plateNumber}}',
    },
    {
      code: 'DRIVER_ARRIVED',
      channel: 'PUSH' as const,
      title: 'Your driver has arrived',
      body: '{{driverName}} is waiting at the pickup location.',
    },
    {
      code: 'TRIP_COMPLETED',
      channel: 'PUSH' as const,
      title: 'You have arrived',
      body: 'Total fare: {{currency}} {{amount}}. Please rate your trip.',
    },
    {
      code: 'SUBSCRIPTION_EXPIRING',
      channel: 'PUSH' as const,
      title: 'Subscription expiring soon',
      body: 'Your {{planName}} expires in {{daysLeft}} days. Renew to keep driving.',
    },
    {
      code: 'WALLET_TOPUP',
      channel: 'SMS' as const,
      title: '',
      body: 'Your CheeTaxi wallet has been topped up by {{currency}} {{amount}}. New balance: {{currency}} {{balance}}',
    },
    {
      code: 'SOS_ACKNOWLEDGED',
      channel: 'PUSH' as const,
      title: 'SOS received',
      body: 'Our safety team has received your alert. Help is on the way.',
    },
  ];

  for (const t of templates) {
    await prisma.notificationTemplate.upsert({
      where: {
        code_channel_language: {
          code: t.code,
          channel: t.channel,
          language: 'en',
        },
      },
      update: { title: t.title, body: t.body },
      create: { ...t, language: 'en', variables: [] },
    });
  }

  // ─── Feature Flags ─────────────────────────────────────────────────────
  const flags = [
    { key: 'food_delivery', enabled: true, description: 'Enable food delivery module' },
    { key: 'parcel_delivery', enabled: true, description: 'Enable parcel delivery module' },
    { key: 'intercity', enabled: true, description: 'Enable intercity trips' },
    { key: 'rental', enabled: false, description: 'Enable hourly/daily rentals' },
    { key: 'autonomous_vehicles', enabled: false, description: 'Enable autonomous vehicle support' },
    { key: 'new_pricing_engine_v2', enabled: false, description: 'A/B test new pricing engine' },
  ];
  for (const f of flags) {
    await prisma.featureFlag.upsert({
      where: { key: f.key },
      update: {},
      create: f,
    });
  }

  // ─── Sample Geofences (Addis Ababa service area) ───────────────────────
  await prisma.geofence.upsert({
    where: { id: 'addis-service-area' },
    update: {},
    create: {
      id: 'addis-service-area',
      name: 'Addis Ababa Service Area',
      type: 'service_area',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [38.65, 9.00], [38.85, 9.00], [38.85, 9.10], [38.65, 9.10], [38.65, 9.00],
        ]],
      },
      country: 'ETHIOPIA',
      city: 'Addis Ababa',
    },
  });

  // ─── Sample Places (Addis Ababa landmarks) ─────────────────────────────
  const places = [
    { name: 'Bole International Airport', address: 'Bole, Addis Ababa', lat: 8.9779, lng: 38.7993, category: 'airport' },
    { name: 'Megenagna', address: 'Megenagna, Addis Ababa', lat: 9.0097, lng: 38.7643, category: 'landmark' },
    { name: 'Merkato', address: 'Merkato, Addis Ababa', lat: 9.0320, lng: 38.7420, category: 'market' },
    { name: 'Meskel Square', address: 'Meskel Square, Addis Ababa', lat: 9.0112, lng: 38.7623, category: 'landmark' },
    { name: 'Bole Medhanealem', address: 'Bole, Addis Ababa', lat: 8.9927, lng: 38.7857, category: 'landmark' },
  ];
  for (const p of places) {
    await prisma.place.upsert({
      where: { id: `place-${p.category}-${p.name.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: {
        id: `place-${p.category}-${p.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: p.name,
        address: p.address,
        latitude: p.lat,
        longitude: p.lng,
        geohash: 'scz', // simplified — production uses proper geohash
        category: p.category,
        country: 'ETHIOPIA',
        city: 'Addis Ababa',
      },
    });
  }

  console.log('✅ Seed complete.');
  console.log('   Super admin phone: +251900000000');
  console.log('   Super admin password: ChangeMe!2025');
  console.log('   ⚠️  Change this password immediately in production.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
