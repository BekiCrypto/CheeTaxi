import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const dbPath = process.env.DATABASE_PATH || path.resolve(process.cwd(), 'chebelew.db');
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
      avatar_url TEXT,
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
      active_ride_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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

    CREATE TABLE IF NOT EXISTS configs (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

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
      rating, total_rides, wallet_balance_etb, created_at
    ) VALUES (
      @id, @user_id, @full_name, @phone, @avatar_url, @vehicle_make, @vehicle_model,
      @vehicle_year, @vehicle_plate, @vehicle_color, @vehicle_category, @license_number,
      @kyc_status, @is_online, @is_busy, @current_lat, @current_lng, @heading,
      @rating, @total_rides, @wallet_balance_etb, @created_at
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

  console.log('Database initialized and seeded successfully.');
}
