import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverDir = path.resolve(__dirname, '../../');
const defaultDbPath = path.resolve(serverDir, 'chebelew.db');

const dbPath = process.env.DATABASE_PATH || defaultDbPath;
export const db = new Database(dbPath);

// Enable WAL mode for high-concurrency read/write performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      role TEXT NOT NULL DEFAULT 'rider',
      language TEXT NOT NULL DEFAULT 'am',
      country_code TEXT NOT NULL DEFAULT 'ET',
      avatar_url TEXT,
      is_verified INTEGER NOT NULL DEFAULT 1,
      corporate_id TEXT,
      fleet_id TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS drivers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      avatar_url TEXT,
      vehicle_make TEXT NOT NULL,
      vehicle_model TEXT NOT NULL,
      vehicle_year INTEGER NOT NULL,
      vehicle_plate TEXT NOT NULL,
      vehicle_color TEXT NOT NULL,
      vehicle_category TEXT NOT NULL,
      license_number TEXT NOT NULL,
      kyc_status TEXT NOT NULL DEFAULT 'pending',
      kyc_notes TEXT,
      is_online INTEGER NOT NULL DEFAULT 0,
      is_busy INTEGER NOT NULL DEFAULT 0,
      current_lat REAL NOT NULL,
      current_lng REAL NOT NULL,
      heading REAL DEFAULT 0,
      rating REAL NOT NULL DEFAULT 4.9,
      total_rides INTEGER NOT NULL DEFAULT 0,
      wallet_balance_etb REAL NOT NULL DEFAULT 0,
      subscription_status TEXT NOT NULL DEFAULT 'active',
      subscription_expires_at TEXT,
      active_subscription_id TEXT,
      active_ride_id TEXT,
      active_delivery_id TEXT,
      fleet_id TEXT,
      country_code TEXT NOT NULL DEFAULT 'ET',
      city_code TEXT NOT NULL DEFAULT 'ADDIS_ABABA',
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS subscription_plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_am TEXT NOT NULL,
      billing_period TEXT NOT NULL,
      duration_days INTEGER NOT NULL,
      price_amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'ETB',
      country_code TEXT NOT NULL DEFAULT 'ET',
      city_code TEXT NOT NULL DEFAULT 'ADDIS_ABABA',
      vehicle_category TEXT NOT NULL DEFAULT 'sedan',
      is_active INTEGER NOT NULL DEFAULT 1,
      features_json TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS driver_subscriptions (
      id TEXT PRIMARY KEY,
      driver_id TEXT NOT NULL,
      plan_id TEXT NOT NULL,
      plan_name TEXT NOT NULL,
      billing_period TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      grace_period_ends_at TEXT,
      auto_renew INTEGER NOT NULL DEFAULT 0,
      amount_paid REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'ETB',
      payment_method TEXT NOT NULL,
      payment_reference TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (driver_id) REFERENCES drivers(id),
      FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
    );

    CREATE TABLE IF NOT EXISTS delivery_orders (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      sender_phone TEXT NOT NULL,
      recipient_name TEXT NOT NULL,
      recipient_phone TEXT NOT NULL,
      pickup_json TEXT NOT NULL,
      dropoff_json TEXT NOT NULL,
      category TEXT NOT NULL,
      package_description TEXT NOT NULL,
      weight_kg REAL DEFAULT 1.0,
      delivery_speed TEXT NOT NULL DEFAULT 'standard',
      price_etb REAL NOT NULL,
      vat_etb REAL NOT NULL,
      total_etb REAL NOT NULL,
      payment_method TEXT NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'PENDING',
      courier_id TEXT,
      status TEXT NOT NULL DEFAULT 'REQUESTED',
      pickup_otp TEXT NOT NULL,
      dropoff_otp TEXT NOT NULL,
      proof_photo_url TEXT,
      recipient_signature_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS corporate_accounts (
      id TEXT PRIMARY KEY,
      company_name TEXT NOT NULL,
      registration_number TEXT NOT NULL,
      tin_number TEXT NOT NULL,
      contact_person TEXT NOT NULL,
      contact_email TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      credit_limit_etb REAL NOT NULL,
      spent_this_month_etb REAL NOT NULL DEFAULT 0,
      billing_cycle TEXT NOT NULL DEFAULT 'monthly',
      status TEXT NOT NULL DEFAULT 'active',
      country_code TEXT NOT NULL DEFAULT 'ET',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS corporate_employees (
      id TEXT PRIMARY KEY,
      corporate_id TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      department TEXT NOT NULL,
      monthly_allowance_etb REAL NOT NULL,
      spent_this_month_etb REAL NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (corporate_id) REFERENCES corporate_accounts(id)
    );

    CREATE TABLE IF NOT EXISTS fleets (
      id TEXT PRIMARY KEY,
      owner_user_id TEXT NOT NULL,
      fleet_name TEXT NOT NULL,
      registration_number TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      total_vehicles INTEGER NOT NULL DEFAULT 0,
      total_drivers INTEGER NOT NULL DEFAULT 0,
      country_code TEXT NOT NULL DEFAULT 'ET',
      city_code TEXT NOT NULL DEFAULT 'ADDIS_ABABA',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sos_incidents (
      id TEXT PRIMARY KEY,
      ride_id TEXT,
      delivery_id TEXT,
      reporter_user_id TEXT NOT NULL,
      reporter_name TEXT NOT NULL,
      reporter_phone TEXT NOT NULL,
      reporter_role TEXT NOT NULL,
      current_lat REAL NOT NULL,
      current_lng REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'OPEN',
      safety_notes TEXT,
      created_at TEXT NOT NULL,
      resolved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS developer_api_keys (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      key_prefix TEXT NOT NULL,
      hashed_secret TEXT NOT NULL,
      environment TEXT NOT NULL DEFAULT 'test',
      rate_limit_per_min INTEGER NOT NULL DEFAULT 60,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      last_used_at TEXT
    );

    CREATE TABLE IF NOT EXISTS country_configs (
      country_code TEXT PRIMARY KEY,
      country_name TEXT NOT NULL,
      currency TEXT NOT NULL,
      currency_symbol TEXT NOT NULL,
      phone_prefix TEXT NOT NULL,
      default_language TEXT NOT NULL,
      supported_languages_json TEXT NOT NULL,
      vat_rate REAL NOT NULL,
      tax_authority_name TEXT NOT NULL,
      emergency_police_number TEXT NOT NULL,
      emergency_support_number TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS rides (
      id TEXT PRIMARY KEY,
      rider_id TEXT NOT NULL,
      rider_name TEXT NOT NULL,
      rider_phone TEXT NOT NULL,
      driver_id TEXT,
      pickup_json TEXT NOT NULL,
      destination_json TEXT NOT NULL,
      vehicle_category TEXT NOT NULL,
      distance_km REAL NOT NULL,
      duration_min REAL NOT NULL,
      fare_json TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'PENDING',
      status TEXT NOT NULL DEFAULT 'REQUESTED',
      telebirr_order_id TEXT,
      telebirr_tx_no TEXT,
      cancel_reason TEXT,
      cancelled_by TEXT,
      rating INTEGER,
      review TEXT,
      tip_amount REAL DEFAULT 0,
      route_coords_json TEXT,
      current_driver_lat REAL,
      current_driver_lng REAL,
      is_manual_dispatch INTEGER NOT NULL DEFAULT 0,
      operator_notes TEXT,
      corporate_id TEXT,
      country_code TEXT NOT NULL DEFAULT 'ET',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (rider_id) REFERENCES users(id),
      FOREIGN KEY (driver_id) REFERENCES drivers(id)
    );

    CREATE TABLE IF NOT EXISTS telebirr_orders (
      order_id TEXT PRIMARY KEY,
      ride_id TEXT NOT NULL,
      amount_etb REAL NOT NULL,
      payer_phone TEXT NOT NULL,
      receiver_title TEXT NOT NULL,
      subject TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      out_trade_no TEXT UNIQUE NOT NULL,
      transaction_no TEXT,
      ussd_push_code TEXT,
      qr_payload TEXT,
      h5_payment_url TEXT,
      created_at TEXT NOT NULL,
      completed_at TEXT,
      FOREIGN KEY (ride_id) REFERENCES rides(id)
    );

    CREATE TABLE IF NOT EXISTS dispatch_logs (
      id TEXT PRIMARY KEY,
      ride_id TEXT NOT NULL,
      action TEXT NOT NULL,
      operator_name TEXT,
      details TEXT,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS support_tickets (
      id TEXT PRIMARY KEY,
      ride_id TEXT,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      user_phone TEXT NOT NULL,
      user_role TEXT NOT NULL DEFAULT 'rider',
      category TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'OPEN',
      resolution_notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS configs (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Run safe schema migrations for existing database columns
  const migrateColumn = (table: string, col: string, definition: string) => {
    try {
      const cols = (db.pragma(`table_info(${table})`) as any[]).map((c) => c.name);
      if (!cols.includes(col)) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${definition};`);
      }
    } catch (err) {
      console.error(`Migration error for ${table}.${col}:`, err);
    }
  };

  migrateColumn('drivers', 'active_delivery_id', 'TEXT');
  migrateColumn('drivers', 'fleet_id', 'TEXT');
  migrateColumn('drivers', 'country_code', "TEXT NOT NULL DEFAULT 'ET'");
  migrateColumn('drivers', 'city_code', "TEXT NOT NULL DEFAULT 'ADDIS_ABABA'");

  migrateColumn('rides', 'corporate_id', 'TEXT');
  migrateColumn('rides', 'country_code', "TEXT NOT NULL DEFAULT 'ET'");

  migrateColumn('users', 'country_code', "TEXT NOT NULL DEFAULT 'ET'");
  migrateColumn('users', 'is_verified', 'INTEGER NOT NULL DEFAULT 1');
  migrateColumn('users', 'corporate_id', 'TEXT');
  migrateColumn('users', 'fleet_id', 'TEXT');

  seedInitialData();
}

function seedInitialData() {
  const userCount = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) {
    return; // Already seeded
  }

  const now = new Date().toISOString();

  const insertUser = db.prepare(`
    INSERT INTO users (id, phone, name, email, role, language, avatar_url, created_at)
    VALUES (@id, @phone, @name, @email, @role, @language, @avatar_url, @created_at)
  `);

  const insertDriver = db.prepare(`
    INSERT INTO drivers (
      id, user_id, full_name, phone, avatar_url, vehicle_make, vehicle_model,
      vehicle_year, vehicle_plate, vehicle_color, vehicle_category, license_number,
      kyc_status, is_online, is_busy, current_lat, current_lng, heading,
      rating, total_rides, wallet_balance_etb, subscription_status, subscription_expires_at, active_subscription_id, created_at
    ) VALUES (
      @id, @user_id, @full_name, @phone, @avatar_url, @vehicle_make, @vehicle_model,
      @vehicle_year, @vehicle_plate, @vehicle_color, @vehicle_category, @license_number,
      @kyc_status, @is_online, @is_busy, @current_lat, @current_lng, @heading,
      @rating, @total_rides, @wallet_balance_etb, @subscription_status, @subscription_expires_at, @active_subscription_id, @created_at
    )
  `);

  // Riders
  insertUser.run({
    id: 'user_leila_01',
    phone: '+251911223344',
    name: 'Leila Haile',
    email: 'leila@chebelew.et',
    role: 'rider',
    language: 'en',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    created_at: now,
  });

  insertUser.run({
    id: 'user_tsegaye_02',
    phone: '+251915667788',
    name: 'Tsegaye Wolde (ፀጋዬ ወልዴ)',
    email: 'tsegaye@chebelew.et',
    role: 'rider',
    language: 'am',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    created_at: now,
  });

  // Dispatcher & Admin
  insertUser.run({
    id: 'user_almaz_admin',
    phone: '+251916778899',
    name: 'Almaz Tefera (አልማዝ ተፈራ - Dispatch Supervisor)',
    email: 'dispatch@chebelew.et',
    role: 'admin',
    language: 'am',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    created_at: now,
  });

  // Drivers
  // Driver 1: Ahmed - Bole area (Toyota Corolla Sedan)
  insertUser.run({
    id: 'user_ahmed_driver',
    phone: '+251912334455',
    name: 'Ahmed Mohammed (አህመድ መሀመድ)',
    email: 'ahmed.driver@chebelew.et',
    role: 'driver',
    language: 'am',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    created_at: now,
  });

  insertDriver.run({
    id: 'driver_ahmed_01',
    user_id: 'user_ahmed_driver',
    full_name: 'Ahmed Mohammed',
    phone: '+251912334455',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    vehicle_make: 'Toyota',
    vehicle_model: 'Corolla Exec',
    vehicle_year: 2018,
    vehicle_plate: 'ET-3-A78945',
    vehicle_color: 'Silver Gray',
    vehicle_category: 'sedan',
    license_number: 'AA-DL-98231',
    kyc_status: 'approved',
    is_online: 1,
    is_busy: 0,
    current_lat: 8.9850, // Near Bole Medhanialem
    current_lng: 38.7845,
    heading: 45,
    rating: 4.92,
    total_rides: 482,
    wallet_balance_etb: 3850.50,
    subscription_status: 'active',
    subscription_expires_at: '2027-11-13T00:00:00.000Z',
    active_subscription_id: 'sub_ahmed_01',
    created_at: now,
  });

  // Driver 2: Dawit - Kazanchis / Meskel Square (Toyota Avanza Minivan 7-seater)
  insertUser.run({
    id: 'user_dawit_driver',
    phone: '+251913445566',
    name: 'Dawit Bekele (ዳዊት በቀለ)',
    email: 'dawit.driver@chebelew.et',
    role: 'driver',
    language: 'am',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    created_at: now,
  });

  insertDriver.run({
    id: 'driver_dawit_02',
    user_id: 'user_dawit_driver',
    full_name: 'Dawit Bekele',
    phone: '+251913445566',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    vehicle_make: 'Toyota',
    vehicle_model: 'Avanza 7-Seater',
    vehicle_year: 2021,
    vehicle_plate: 'ET-3-B45210',
    vehicle_color: 'Metallic White',
    vehicle_category: 'minivan',
    license_number: 'AA-DL-77412',
    kyc_status: 'approved',
    is_online: 1,
    is_busy: 0,
    current_lat: 9.0160, // Near UNECA / Kazanchis
    current_lng: 38.7680,
    heading: 180,
    rating: 4.88,
    total_rides: 615,
    wallet_balance_etb: 5420.00,
    subscription_status: 'active',
    subscription_expires_at: '2027-11-13T00:00:00.000Z',
    active_subscription_id: 'sub_dawit_02',
    created_at: now,
  });

  // Driver 3: Bethlehem - Piassa / Churchill Ave (Toyota Vitz Sedan)
  insertUser.run({
    id: 'user_bethlehem_driver',
    phone: '+251914556677',
    name: 'Bethlehem Girma (ቤተልሔም ግርማ)',
    email: 'bethlehem.driver@chebelew.et',
    role: 'driver',
    language: 'am',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    created_at: now,
  });

  insertDriver.run({
    id: 'driver_bethlehem_03',
    user_id: 'user_bethlehem_driver',
    full_name: 'Bethlehem Girma',
    phone: '+251914556677',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    vehicle_make: 'Toyota',
    vehicle_model: 'Vitz Compact',
    vehicle_year: 2019,
    vehicle_plate: 'ET-3-C88190',
    vehicle_color: 'Deep Blue',
    vehicle_category: 'sedan',
    license_number: 'AA-DL-63109',
    kyc_status: 'approved',
    is_online: 1,
    is_busy: 0,
    current_lat: 9.0310, // Near Piassa / Churchill
    current_lng: 38.7510,
    heading: 90,
    rating: 4.96,
    total_rides: 340,
    wallet_balance_etb: 2910.00,
    subscription_status: 'active',
    subscription_expires_at: '2027-11-13T00:00:00.000Z',
    active_subscription_id: 'sub_bethlehem_03',
    created_at: now,
  });

  // Driver 4: Henok - Mexico Square / Sarbet (Hyundai Elantra Comfort)
  insertUser.run({
    id: 'user_henok_driver',
    phone: '+251917889900',
    name: 'Henok Tadesse (ሄኖክ ታደሰ)',
    email: 'henok.driver@chebelew.et',
    role: 'driver',
    language: 'am',
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
    created_at: now,
  });

  insertDriver.run({
    id: 'driver_henok_04',
    user_id: 'user_henok_driver',
    full_name: 'Henok Tadesse',
    phone: '+251917889900',
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
    vehicle_make: 'Hyundai',
    vehicle_model: 'Elantra Comfort VIP',
    vehicle_year: 2022,
    vehicle_plate: 'ET-3-V99021',
    vehicle_color: 'Phantom Black',
    vehicle_category: 'comfort',
    license_number: 'AA-DL-81203',
    kyc_status: 'approved',
    is_online: 1,
    is_busy: 0,
    current_lat: 9.0080, // Near Mexico Square
    current_lng: 38.7420,
    heading: 270,
    rating: 4.95,
    total_rides: 520,
    wallet_balance_etb: 6150.00,
    subscription_status: 'active',
    subscription_expires_at: '2027-11-13T00:00:00.000Z',
    active_subscription_id: 'sub_henok_04',
    created_at: now,
  });

  // Driver 5: Pending KYC applicant (for testing admin KYC approval workflow)
  insertUser.run({
    id: 'user_solomon_pending',
    phone: '+251918990011',
    name: 'Solomon Kassahun (ሰለሞን ካሳሁን)',
    email: 'solomon.k@chebelew.et',
    role: 'driver',
    language: 'am',
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
    created_at: now,
  });

  insertDriver.run({
    id: 'driver_solomon_05',
    user_id: 'user_solomon_pending',
    full_name: 'Solomon Kassahun',
    phone: '+251918990011',
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
    vehicle_make: 'Lifan',
    vehicle_model: '520 Sedan',
    vehicle_year: 2017,
    vehicle_plate: 'ET-3-P11234',
    vehicle_color: 'Yellow & Green Taxi',
    vehicle_category: 'sedan',
    license_number: 'AA-DL-44129',
    kyc_status: 'pending',
    is_online: 0,
    is_busy: 0,
    current_lat: 9.0200,
    current_lng: 38.8000,
    heading: 0,
    rating: 5.0,
    total_rides: 0,
    wallet_balance_etb: 0,
    subscription_status: 'expired',
    subscription_expires_at: null,
    active_subscription_id: null,
    created_at: now,
  });

  // Seed sample completed rides for analytics & VAT reports
  const sampleRideIds = ['ride_hist_01', 'ride_hist_02', 'ride_hist_03'];
  const insertRide = db.prepare(`
    INSERT INTO rides (
      id, rider_id, rider_name, rider_phone, driver_id, pickup_json, destination_json,
      vehicle_category, distance_km, duration_min, fare_json, payment_method, payment_status,
      status, telebirr_order_id, telebirr_tx_no, rating, review, tip_amount,
      is_manual_dispatch, created_at, updated_at
    ) VALUES (
      @id, @rider_id, @rider_name, @rider_phone, @driver_id, @pickup_json, @destination_json,
      @vehicle_category, @distance_km, @duration_min, @fare_json, @payment_method, @payment_status,
      @status, @telebirr_order_id, @telebirr_tx_no, @rating, @review, @tip_amount,
      @is_manual_dispatch, @created_at, @updated_at
    )
  `);

  insertRide.run({
    id: 'ride_hist_01',
    rider_id: 'user_leila_01',
    rider_name: 'Leila Haile',
    rider_phone: '+251911223344',
    driver_id: 'driver_ahmed_01',
    pickup_json: JSON.stringify({
      address: 'Bole Medhanialem Mall, Addis Ababa',
      addressAm: 'ቦሌ መድኃኔዓለም፣ አዲስ አበባ',
      lat: 8.9950,
      lng: 38.7880,
    }),
    destination_json: JSON.stringify({
      address: 'UNECA Conference Center, Kazanchis',
      addressAm: 'የተመድ ኢኮኖሚክ ኮሚሽን (ካዛንቺስ)',
      lat: 9.0185,
      lng: 38.7705,
    }),
    vehicle_category: 'sedan',
    distance_km: 4.8,
    duration_min: 16,
    fare_json: JSON.stringify({
      baseFare: 70,
      distanceKm: 4.8,
      distanceFare: 67.2,
      durationMinutes: 16,
      timeFare: 48,
      subtotal: 185.2,
      vatRate: 0.15,
      vatAmount: 27.78,
      totalFare: 212.98,
      platformTakeRate: 0.15,
      platformCommission: 31.95,
      telebirrFee: 2.13,
      driverNetPayout: 153.25,
    }),
    payment_method: 'TELEBIRR',
    payment_status: 'PAID',
    status: 'COMPLETED',
    telebirr_order_id: 'tb_ord_hist_01',
    telebirr_tx_no: 'TB202611130098231',
    rating: 5,
    review: 'Very professional, arrived promptly and clean car!',
    tip_amount: 20,
    is_manual_dispatch: 0,
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2.5).toISOString(),
  });

  insertRide.run({
    id: 'ride_hist_02',
    rider_id: 'user_tsegaye_02',
    rider_name: 'Tsegaye Wolde',
    rider_phone: '+251915667788',
    driver_id: 'driver_dawit_02',
    pickup_json: JSON.stringify({
      address: 'Meskel Square, Addis Ababa',
      addressAm: 'መስቀል አደባባይ፣ አዲስ አበባ',
      lat: 9.0105,
      lng: 38.7615,
    }),
    destination_json: JSON.stringify({
      address: 'Bole Addis Ababa International Airport',
      addressAm: 'ቦሌ ዓለም አቀፍ አውሮፕላን ማረፊያ',
      lat: 8.9778,
      lng: 38.7993,
    }),
    vehicle_category: 'minivan',
    distance_km: 7.2,
    duration_min: 22,
    fare_json: JSON.stringify({
      baseFare: 110,
      distanceKm: 7.2,
      distanceFare: 129.6,
      durationMinutes: 22,
      timeFare: 88,
      subtotal: 327.6,
      vatRate: 0.15,
      vatAmount: 49.14,
      totalFare: 376.74,
      platformTakeRate: 0.15,
      platformCommission: 56.51,
      telebirrFee: 3.77,
      driverNetPayout: 271.09,
    }),
    payment_method: 'CASH',
    payment_status: 'PAID',
    status: 'COMPLETED',
    telebirr_order_id: null,
    telebirr_tx_no: null,
    rating: 5,
    review: 'Spacious minivan, helped with luggage',
    tip_amount: 30,
    is_manual_dispatch: 1,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4.2).toISOString(),
  });

  // Seed sample support tickets for Call Center / Customer Support resolution
  const insertTicket = db.prepare(`
    INSERT INTO support_tickets (
      id, ride_id, user_id, user_name, user_phone, user_role,
      category, subject, message, status, resolution_notes, created_at, updated_at
    ) VALUES (
      @id, @ride_id, @user_id, @user_name, @user_phone, @user_role,
      @category, @subject, @message, @status, @resolution_notes, @created_at, @updated_at
    )
  `);

  insertTicket.run({
    id: 'tkt_01',
    ride_id: 'ride_hist_01',
    user_id: 'user_leila_01',
    user_name: 'Leila Haile',
    user_phone: '+251911223344',
    user_role: 'rider',
    category: 'lost_item',
    subject: 'Forgotten Umbrella in Back Seat',
    message: 'Left my black umbrella in Ahmed’s Toyota Corolla after arriving at UNECA.',
    status: 'RESOLVED',
    resolution_notes: 'Driver Ahmed contacted; umbrella handed back at Kazanchis security desk.',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 1).toISOString(),
  });

  insertTicket.run({
    id: 'tkt_02',
    ride_id: 'ride_hist_02',
    user_id: 'user_tsegaye_02',
    user_name: 'Tsegaye Wolde',
    user_phone: '+251915667788',
    user_role: 'rider',
    category: 'payment',
    subject: 'VAT Invoice Receipt Request for Corporate Expense',
    message: 'Require stamped Ethiopian Ministry of Revenues official VAT receipt for airport trip reimbursement.',
    status: 'OPEN',
    resolution_notes: null,
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  });

  // --------------------------------------------------------------------------
  // Seed Multi-Country Configurations (Ethiopia Primary, Kenya Expansion)
  // --------------------------------------------------------------------------
  const insertCountry = db.prepare(`
    INSERT INTO country_configs (
      country_code, country_name, currency, currency_symbol, phone_prefix,
      default_language, supported_languages_json, vat_rate, tax_authority_name,
      emergency_police_number, emergency_support_number, is_active
    ) VALUES (
      @country_code, @country_name, @currency, @currency_symbol, @phone_prefix,
      @default_language, @supported_languages_json, @vat_rate, @tax_authority_name,
      @emergency_police_number, @emergency_support_number, @is_active
    )
  `);

  insertCountry.run({
    country_code: 'ET',
    country_name: 'Ethiopia',
    currency: 'ETB',
    currency_symbol: 'Br',
    phone_prefix: '+251',
    default_language: 'am',
    supported_languages_json: JSON.stringify(['am', 'en', 'om', 'ti']),
    vat_rate: 0.15,
    tax_authority_name: 'FDRE Ministry of Revenues',
    emergency_police_number: '991',
    emergency_support_number: '9922',
    is_active: 1,
  });

  insertCountry.run({
    country_code: 'KE',
    country_name: 'Kenya (Expansion Ready)',
    currency: 'KES',
    currency_symbol: 'KSh',
    phone_prefix: '+254',
    default_language: 'en',
    supported_languages_json: JSON.stringify(['en', 'sw']),
    vat_rate: 0.16,
    tax_authority_name: 'Kenya Revenue Authority',
    emergency_police_number: '999',
    emergency_support_number: '0800722222',
    is_active: 1,
  });

  // --------------------------------------------------------------------------
  // Seed Subscription Plans (Founder Mandate: Driver Subscription Model)
  // --------------------------------------------------------------------------
  const insertPlan = db.prepare(`
    INSERT INTO subscription_plans (
      id, name, name_am, billing_period, duration_days, price_amount,
      currency, country_code, city_code, vehicle_category, is_active, features_json, created_at
    ) VALUES (
      @id, @name, @name_am, @billing_period, @duration_days, @price_amount,
      @currency, @country_code, @city_code, @vehicle_category, @is_active, @features_json, @created_at
    )
  `);

  const plans = [
    {
      id: 'plan_daily_et',
      name: 'Chebelew 24-Hour Pass',
      name_am: 'ከበለው የ24-ሰዓት ፓስ',
      billing_period: 'daily',
      duration_days: 1,
      price_amount: 50.0,
      features: ['Unlimited Ride Access', '0% Trip Commission', '24/7 Dispatch', 'Telebirr Payout'],
    },
    {
      id: 'plan_weekly_et',
      name: 'Chebelew 7-Day Flex',
      name_am: 'ከበለው የ7-ቀን ፍሌክስ',
      billing_period: 'weekly',
      duration_days: 7,
      price_amount: 300.0,
      features: ['Unlimited Ride Access', '0% Trip Commission', 'Standard SOS Response', 'Priority Dispatch'],
    },
    {
      id: 'plan_monthly_et',
      name: 'Chebelew Monthly Pro',
      name_am: 'ከበለው የወር ፕሮ ፓስ',
      billing_period: 'monthly',
      duration_days: 30,
      price_amount: 1000.0,
      features: ['Unlimited Ride Access', '0% Trip Commission', 'Exclusive Airport Queue', 'Instant Telebirr Payouts'],
    },
    {
      id: 'plan_quarterly_et',
      name: 'Chebelew Quarterly Star',
      name_am: 'ከበለው የ3-ወር ስታር ፓስ',
      billing_period: 'quarterly',
      duration_days: 90,
      price_amount: 2700.0,
      features: ['10% Savings', 'Unlimited Ride Access', '0% Trip Commission', 'Dedicated Fleet Officer'],
    },
    {
      id: 'plan_yearly_et',
      name: 'Chebelew Annual Champion',
      name_am: 'ከበለው የዓመት ቻምፒዮን',
      billing_period: 'yearly',
      duration_days: 365,
      price_amount: 9600.0,
      features: ['20% Savings', 'Unlimited Ride & Delivery Access', '0% Trip Commission', 'Free Vehicle Branding'],
    },
  ];

  for (const p of plans) {
    insertPlan.run({
      id: p.id,
      name: p.name,
      name_am: p.name_am,
      billing_period: p.billing_period,
      duration_days: p.duration_days,
      price_amount: p.price_amount,
      currency: 'ETB',
      country_code: 'ET',
      city_code: 'ADDIS_ABABA',
      vehicle_category: 'sedan',
      is_active: 1,
      features_json: JSON.stringify(p.features),
      created_at: now,
    });
  }

  // --------------------------------------------------------------------------
  // Seed Active Driver Subscriptions
  // --------------------------------------------------------------------------
  const insertSub = db.prepare(`
    INSERT INTO driver_subscriptions (
      id, driver_id, plan_id, plan_name, billing_period, status,
      start_date, end_date, auto_renew, amount_paid, currency, payment_method, payment_reference, created_at, updated_at
    ) VALUES (
      @id, @driver_id, @plan_id, @plan_name, @billing_period, @status,
      @start_date, @end_date, @auto_renew, @amount_paid, @currency, @payment_method, @payment_reference, @created_at, @updated_at
    )
  `);

  insertSub.run({
    id: 'sub_ahmed_01',
    driver_id: 'driver_ahmed_01',
    plan_id: 'plan_monthly_et',
    plan_name: 'Chebelew Monthly Pro',
    billing_period: 'monthly',
    status: 'active',
    start_date: new Date(Date.now() - 86400000 * 5).toISOString(),
    end_date: new Date(Date.now() + 86400000 * 25).toISOString(),
    auto_renew: 1,
    amount_paid: 1000.0,
    currency: 'ETB',
    payment_method: 'TELEBIRR',
    payment_reference: 'TB_SUB_99011',
    created_at: now,
    updated_at: now,
  });

  insertSub.run({
    id: 'sub_dawit_02',
    driver_id: 'driver_dawit_02',
    plan_id: 'plan_monthly_et',
    plan_name: 'Chebelew Monthly Pro',
    billing_period: 'monthly',
    status: 'active',
    start_date: new Date(Date.now() - 86400000 * 10).toISOString(),
    end_date: new Date(Date.now() + 86400000 * 20).toISOString(),
    auto_renew: 1,
    amount_paid: 1000.0,
    currency: 'ETB',
    payment_method: 'TELEBIRR',
    payment_reference: 'TB_SUB_99012',
    created_at: now,
    updated_at: now,
  });

  // --------------------------------------------------------------------------
  // Seed Corporate Platform & Fleet
  // --------------------------------------------------------------------------
  db.prepare(`
    INSERT INTO corporate_accounts (
      id, company_name, registration_number, tin_number, contact_person,
      contact_email, contact_phone, credit_limit_etb, spent_this_month_etb,
      billing_cycle, status, country_code, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'corp_ethio_air',
    'Ethiopian Airlines Commercial Group',
    'REG-ET-2024-991',
    '0098231299',
    'Yonas T. (Travel Manager)',
    'corporate@ethiopianairlines.com',
    '+251911440011',
    250000.0,
    18500.0,
    'monthly',
    'active',
    'ET',
    now
  );

  db.prepare(`
    INSERT INTO corporate_employees (
      id, corporate_id, name, phone, email, department,
      monthly_allowance_etb, spent_this_month_etb, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'emp_leila_01',
    'corp_ethio_air',
    'Leila Haile',
    '+251911223344',
    'leila@ethiopianairlines.com',
    'Flight Operations & Crew Transit',
    15000.0,
    212.98,
    1
  );

  db.prepare(`
    INSERT INTO fleets (
      id, owner_user_id, fleet_name, registration_number, contact_phone,
      total_vehicles, total_drivers, country_code, city_code, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'fleet_addis_ltd',
    'user_almaz_admin',
    'Addis Luxury Cab Cooperative',
    'FLT-AA-0982',
    '+251911880022',
    12,
    14,
    'ET',
    'ADDIS_ABABA',
    'active',
    now
  );

  // --------------------------------------------------------------------------
  // Seed Delivery & Logistics Platform Order
  // --------------------------------------------------------------------------
  db.prepare(`
    INSERT INTO delivery_orders (
      id, sender_id, sender_name, sender_phone, recipient_name, recipient_phone,
      pickup_json, dropoff_json, category, package_description, weight_kg,
      delivery_speed, price_etb, vat_etb, total_etb, payment_method, payment_status,
      courier_id, status, pickup_otp, dropoff_otp, proof_photo_url, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'del_sample_01',
    'user_leila_01',
    'Leila Haile',
    '+251911223344',
    'Solomon Tefera',
    '+251912993344',
    JSON.stringify({ address: 'Kazanchis UNECA HQ', lat: 9.0185, lng: 38.7705 }),
    JSON.stringify({ address: 'Bole Airport Cargo', lat: 8.9778, lng: 38.7993 }),
    'document',
    'Urgent Embassy Visa Documents & Contracts',
    0.5,
    'express',
    180.0,
    27.0,
    207.0,
    'TELEBIRR',
    'PAID',
    'driver_ahmed_01',
    'DELIVERED',
    '7741',
    '8892',
    'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300',
    now,
    now
  );

  // --------------------------------------------------------------------------
  // Seed Developer API Key
  // --------------------------------------------------------------------------
  db.prepare(`
    INSERT INTO developer_api_keys (
      id, name, key_prefix, hashed_secret, environment, rate_limit_per_min, is_active, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'key_sandbox_01',
    'Chebelew Public Sandbox API Key',
    'chb_test',
    'sha256_e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    'test',
    120,
    1,
    now
  );

  console.log('Database initialized and seeded successfully.');
}
