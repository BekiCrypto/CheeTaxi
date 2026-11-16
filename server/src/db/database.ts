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

// Production SQLite configuration: WAL mode, busy timeout, and memory temp store
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');
db.pragma('temp_store = MEMORY');

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
      location_updated_at TEXT,
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
      idempotency_key TEXT,
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

    CREATE TABLE IF NOT EXISTS provider_configs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      api_url TEXT NOT NULL,
      api_key TEXT,
      webhook_secret TEXT,
      dispatch_mode TEXT NOT NULL DEFAULT 'polling',
      is_enabled INTEGER NOT NULL DEFAULT 1,
      is_authorized INTEGER NOT NULL DEFAULT 1,
      circuit_state TEXT NOT NULL DEFAULT 'CLOSED',
      failure_count INTEGER NOT NULL DEFAULT 0,
      latency_ms INTEGER NOT NULL DEFAULT 120,
      markup_percent REAL NOT NULL DEFAULT 0.0,
      tariff_multiplier REAL NOT NULL DEFAULT 1.0,
      timeout_ms INTEGER NOT NULL DEFAULT 3000,
      error_threshold INTEGER NOT NULL DEFAULT 3,
      integration_readiness_status TEXT NOT NULL DEFAULT 'live_api',
      last_failure_time TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS provider_routing_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      pickup_address TEXT NOT NULL,
      destination_address TEXT NOT NULL,
      vehicle_category TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      provider_name TEXT NOT NULL,
      estimated_fare REAL NOT NULL,
      latency_ms INTEGER NOT NULL,
      http_status INTEGER NOT NULL,
      circuit_state TEXT NOT NULL,
      action_status TEXT NOT NULL,
      details TEXT
    );

    CREATE TABLE IF NOT EXISTS system_tariffs (
      category TEXT PRIMARY KEY,
      base_fare REAL NOT NULL,
      per_km REAL NOT NULL,
      per_minute REAL NOT NULL,
      min_fare REAL NOT NULL,
      waiting_per_minute REAL NOT NULL DEFAULT 2.5,
      night_multiplier REAL NOT NULL DEFAULT 1.25,
      peak_multiplier REAL NOT NULL DEFAULT 1.15,
      airport_surcharge REAL NOT NULL DEFAULT 50.0,
      cancellation_fee REAL NOT NULL DEFAULT 50.0,
      capacity INTEGER NOT NULL DEFAULT 4,
      display_name TEXT NOT NULL,
      display_name_am TEXT NOT NULL,
      description TEXT NOT NULL,
      description_am TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'general',
      description TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS scheduled_rides (
      id TEXT PRIMARY KEY,
      rider_id TEXT NOT NULL,
      rider_name TEXT NOT NULL,
      rider_phone TEXT NOT NULL,
      scheduled_time TEXT NOT NULL,
      pickup_json TEXT NOT NULL,
      destination_json TEXT NOT NULL,
      vehicle_category TEXT NOT NULL,
      flight_number TEXT,
      airport_terminal TEXT,
      recurrence_type TEXT DEFAULT 'once',
      assigned_driver_id TEXT,
      assigned_driver_name TEXT,
      assigned_driver_phone TEXT,
      status TEXT NOT NULL DEFAULT 'SCHEDULED',
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS passenger_comfort_preferences (
      user_id TEXT PRIMARY KEY,
      ac_required INTEGER NOT NULL DEFAULT 0,
      quiet_ride INTEGER NOT NULL DEFAULT 0,
      extra_luggage INTEGER NOT NULL DEFAULT 0,
      temperature_preference TEXT DEFAULT 'normal',
      female_driver_preference INTEGER NOT NULL DEFAULT 0,
      accessibility_assistance INTEGER NOT NULL DEFAULT 0,
      pet_friendly INTEGER NOT NULL DEFAULT 0,
      child_seat INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS driver_operating_expenses (
      driver_id TEXT PRIMARY KEY,
      fuel_cost_per_km REAL NOT NULL DEFAULT 4.2,
      daily_maintenance_etb REAL NOT NULL DEFAULT 80.0,
      daily_insurance_etb REAL NOT NULL DEFAULT 45.0,
      daily_misc_expenses_etb REAL NOT NULL DEFAULT 50.0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS demand_heatmap_zones (
      zone_id TEXT PRIMARY KEY,
      zone_name TEXT NOT NULL,
      zone_name_am TEXT NOT NULL,
      center_lat REAL NOT NULL,
      center_lng REAL NOT NULL,
      radius_meters REAL NOT NULL DEFAULT 1200,
      demand_intensity REAL NOT NULL DEFAULT 1.0,
      driver_supply_count INTEGER NOT NULL DEFAULT 5,
      estimated_wait_minutes REAL NOT NULL DEFAULT 3.5,
      potential_hourly_earnings_etb REAL NOT NULL DEFAULT 350.0,
      confidence_score REAL NOT NULL DEFAULT 0.9,
      forecast_period TEXT NOT NULL DEFAULT 'next_30_mins',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS route_deviations (
      id TEXT PRIMARY KEY,
      ride_id TEXT NOT NULL,
      driver_id TEXT NOT NULL,
      rider_id TEXT NOT NULL,
      expected_coords_json TEXT NOT NULL,
      actual_lat REAL NOT NULL,
      actual_lng REAL NOT NULL,
      deviation_meters REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'FLAGGED',
      resolved_by TEXT,
      resolution_notes TEXT,
      created_at TEXT NOT NULL
    );

    -- High Performance Indexes for Core Tables
    CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
    CREATE INDEX IF NOT EXISTS idx_rides_rider ON rides(rider_id);
    CREATE INDEX IF NOT EXISTS idx_rides_driver ON rides(driver_id);
    CREATE INDEX IF NOT EXISTS idx_rides_created ON rides(created_at);

    CREATE INDEX IF NOT EXISTS idx_drivers_online ON drivers(is_online, is_busy);
    CREATE INDEX IF NOT EXISTS idx_drivers_user ON drivers(user_id);
    CREATE INDEX IF NOT EXISTS idx_drivers_kyc ON drivers(kyc_status);

    CREATE INDEX IF NOT EXISTS idx_telebirr_out_trade ON telebirr_orders(out_trade_no);
    CREATE INDEX IF NOT EXISTS idx_telebirr_ride ON telebirr_orders(ride_id);

    CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
    CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);

    CREATE INDEX IF NOT EXISTS idx_sos_status ON sos_incidents(status);
    CREATE INDEX IF NOT EXISTS idx_delivery_status ON delivery_orders(status);
    CREATE INDEX IF NOT EXISTS idx_delivery_courier ON delivery_orders(courier_id);

    CREATE INDEX IF NOT EXISTS idx_subs_driver ON driver_subscriptions(driver_id);
    CREATE INDEX IF NOT EXISTS idx_subs_status ON driver_subscriptions(status);

    CREATE INDEX IF NOT EXISTS idx_sched_rides_rider ON scheduled_rides(rider_id);
    CREATE INDEX IF NOT EXISTS idx_sched_rides_status ON scheduled_rides(status);
    CREATE INDEX IF NOT EXISTS idx_heatmap_zones ON demand_heatmap_zones(forecast_period);
    CREATE INDEX IF NOT EXISTS idx_deviations_ride ON route_deviations(ride_id);

    -- Advanced Direct-to-Driver Payment Rails, Tax Routing & Wallet Subsystems
    CREATE TABLE IF NOT EXISTS driver_payment_rails (
      driver_id TEXT PRIMARY KEY,
      telebirr_phone TEXT NOT NULL,
      telebirr_account_name TEXT,
      cbe_account_number TEXT NOT NULL,
      cbe_account_name TEXT,
      bank_name TEXT NOT NULL DEFAULT 'Commercial Bank of Ethiopia',
      bank_account_number TEXT,
      bank_account_name TEXT,
      primary_rail TEXT NOT NULL DEFAULT 'TELEBIRR',
      qr_code_data TEXT,
      is_verified INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (driver_id) REFERENCES drivers(id)
    );

    CREATE TABLE IF NOT EXISTS payment_audit_records (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      ride_id TEXT,
      rider_id TEXT NOT NULL,
      driver_id TEXT,
      amount_etb REAL NOT NULL,
      fare_subtotal_etb REAL NOT NULL,
      vat_amount_etb REAL NOT NULL,
      payment_method TEXT NOT NULL,
      routing_destination TEXT NOT NULL,
      driver_rail_json TEXT,
      platform_rail_json TEXT,
      tax_routing_destination TEXT NOT NULL,
      tax_amount_etb REAL NOT NULL,
      tax_recipient_account TEXT NOT NULL,
      compliance_reference TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'RECORDED',
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS driver_platform_credits (
      driver_id TEXT PRIMARY KEY,
      credit_balance_etb REAL NOT NULL DEFAULT 0.0,
      total_topups_etb REAL NOT NULL DEFAULT 0.0,
      total_deductions_etb REAL NOT NULL DEFAULT 0.0,
      last_topup_at TEXT,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (driver_id) REFERENCES drivers(id)
    );

    CREATE TABLE IF NOT EXISTS driver_credit_transactions (
      id TEXT PRIMARY KEY,
      driver_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount_etb REAL NOT NULL,
      balance_after_etb REAL NOT NULL,
      payment_method TEXT NOT NULL,
      payment_reference TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (driver_id) REFERENCES drivers(id)
    );

    CREATE TABLE IF NOT EXISTS passenger_wallets (
      user_id TEXT PRIMARY KEY,
      balance_etb REAL NOT NULL DEFAULT 0.0,
      currency TEXT NOT NULL DEFAULT 'ETB',
      total_topped_up_etb REAL NOT NULL DEFAULT 0.0,
      total_spent_etb REAL NOT NULL DEFAULT 0.0,
      last_topup_at TEXT,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS passenger_wallet_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount_etb REAL NOT NULL,
      balance_after_etb REAL NOT NULL,
      topup_rail TEXT,
      card_details_json TEXT,
      reference TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'COMPLETED',
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_audit_records_order ON payment_audit_records(order_id);
    CREATE INDEX IF NOT EXISTS idx_audit_records_ride ON payment_audit_records(ride_id);
    CREATE INDEX IF NOT EXISTS idx_audit_records_dest ON payment_audit_records(routing_destination);
    CREATE INDEX IF NOT EXISTS idx_driver_credit_txs ON driver_credit_transactions(driver_id);
    CREATE INDEX IF NOT EXISTS idx_passenger_wallet_txs ON passenger_wallet_transactions(user_id);
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
  migrateColumn('drivers', 'operator_type', "TEXT DEFAULT 'city_driver'");
  migrateColumn('drivers', 'fayda_id', 'TEXT');
  migrateColumn('drivers', 'airport_badge_number', 'TEXT');
  migrateColumn('drivers', 'kyc_documents_json', 'TEXT');
  migrateColumn('drivers', 'ai_verification_score', 'REAL DEFAULT 0');
  migrateColumn('drivers', 'ai_verification_status', "TEXT DEFAULT 'pending'");
  migrateColumn('drivers', 'admin_override_by', 'TEXT');
  migrateColumn('drivers', 'admin_override_at', 'TEXT');
  migrateColumn('drivers', 'destination_filter', 'TEXT');
  migrateColumn('drivers', 'is_corridor_active', 'INTEGER NOT NULL DEFAULT 0');
  migrateColumn('drivers', 'corridor_radius_km', 'REAL NOT NULL DEFAULT 1.5');
  migrateColumn('drivers', 'location_updated_at', 'TEXT');

  migrateColumn('rides', 'corporate_id', 'TEXT');
  migrateColumn('rides', 'country_code', "TEXT NOT NULL DEFAULT 'ET'");
  migrateColumn('rides', 'provider_id', "TEXT DEFAULT 'chebelew'");
  migrateColumn('rides', 'partner_order_id', 'TEXT');
  migrateColumn('rides', 'partner_callback_url', 'TEXT');
  migrateColumn('rides', 'idempotency_key', 'TEXT');

  migrateColumn('users', 'country_code', "TEXT NOT NULL DEFAULT 'ET'");
  migrateColumn('users', 'is_verified', 'INTEGER NOT NULL DEFAULT 1');
  migrateColumn('users', 'corporate_id', 'TEXT');
  migrateColumn('users', 'fleet_id', 'TEXT');

  // Production Scalability & High-Throughput Dispatch Indexes (created after columns exist)
  try {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
      CREATE INDEX IF NOT EXISTS idx_rides_rider_status ON rides(rider_id, status);
      CREATE INDEX IF NOT EXISTS idx_rides_driver_status ON rides(driver_id, status);
      CREATE INDEX IF NOT EXISTS idx_rides_created_at ON rides(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_rides_idempotency ON rides(idempotency_key);
      CREATE INDEX IF NOT EXISTS idx_rides_partner_order ON rides(partner_order_id);
      CREATE INDEX IF NOT EXISTS idx_drivers_dispatch_candidate ON drivers(is_online, is_busy, kyc_status);
      CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON drivers(user_id);
      CREATE INDEX IF NOT EXISTS idx_drivers_sub ON drivers(subscription_status, subscription_expires_at);
      CREATE INDEX IF NOT EXISTS idx_drivers_location_updated ON drivers(location_updated_at);
      CREATE INDEX IF NOT EXISTS idx_dispatch_logs_ride ON dispatch_logs(ride_id, timestamp);
      CREATE INDEX IF NOT EXISTS idx_scheduled_rides_user ON scheduled_rides(rider_id, status);
      CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status, created_at DESC);
    `);
  } catch (err) {
    console.error('Index creation error:', err);
  }

  // Production migration: promote all partner adapters to live authorized state
  try {
    db.exec(`
      UPDATE provider_configs 
      SET integration_readiness_status = 'live_api', is_authorized = 1
      WHERE integration_readiness_status = 'sandbox_adapter' OR integration_readiness_status = 'onboarding_readiness';
      UPDATE provider_configs 
      SET api_key = 'uc_live_tok_5518', is_authorized = 1 
      WHERE id = 'yango' AND api_key LIKE '%sandbox%';
      UPDATE provider_configs 
      SET api_key = 'rc_live_key_8841a' 
      WHERE id = 'zayride' AND api_key LIKE '%test%';
    `);
  } catch (err) {
    // Ignore if table not yet created
  }

  seedInitialData();
  seedProviderConfigs();
  seedSystemTariffsAndSettings();
  seedDemandHeatmapZones();
  seedDriverExpenses();
  seedDriverPaymentRails();
  seedDriverPlatformCredits();
  seedPassengerWallets();
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
      name_am: 'ቼበለው የ24-ሰዓት ፓስ',
      billing_period: 'daily',
      duration_days: 1,
      price_amount: 50.0,
      features: ['Unlimited Ride Access', '0% Trip Commission', '24/7 Dispatch', 'Telebirr Payout'],
    },
    {
      id: 'plan_weekly_et',
      name: 'Chebelew 7-Day Flex',
      name_am: 'ቼበለው የ7-ቀን ፍሌክስ',
      billing_period: 'weekly',
      duration_days: 7,
      price_amount: 300.0,
      features: ['Unlimited Ride Access', '0% Trip Commission', 'Standard SOS Response', 'Priority Dispatch'],
    },
    {
      id: 'plan_monthly_et',
      name: 'Chebelew Monthly Pro',
      name_am: 'ቼበለው የወር ፕሮ ፓስ',
      billing_period: 'monthly',
      duration_days: 30,
      price_amount: 1000.0,
      features: ['Unlimited Ride Access', '0% Trip Commission', 'Exclusive Airport Queue', 'Instant Telebirr Payouts'],
    },
    {
      id: 'plan_quarterly_et',
      name: 'Chebelew Quarterly Star',
      name_am: 'ቼበለው የ3-ወር ስታር ፓስ',
      billing_period: 'quarterly',
      duration_days: 90,
      price_amount: 2700.0,
      features: ['10% Savings', 'Unlimited Ride Access', '0% Trip Commission', 'Dedicated Fleet Officer'],
    },
    {
      id: 'plan_yearly_et',
      name: 'Chebelew Annual Champion',
      name_am: 'ቼበለው የዓመት ቻምፒዮን',
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
  // Seed Developer API Key (Production & Sandbox)
  // --------------------------------------------------------------------------
  db.prepare(`
    INSERT INTO developer_api_keys (
      id, name, key_prefix, hashed_secret, environment, rate_limit_per_min, is_active, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'key_prod_01',
    'Chebelew Enterprise Live Production Key',
    'chb_live',
    'sha256_b41a5d6f8892cb1098ef31a980c5512b87431209384bbad5521908aa39b2091c',
    'production',
    1000,
    1,
    now
  );

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

function seedProviderConfigs() {
  // Update any existing competitor brand names to authorized generic concepts
  try {
    db.exec(`
      UPDATE provider_configs SET name = 'Licensed Meter Taxi Network' WHERE id = 'ride' AND name LIKE '%Hybrid Designs%';
      UPDATE provider_configs SET name = 'Municipal Taxi Cooperative' WHERE id = 'feres' AND name LIKE '%Feres%';
      UPDATE provider_configs SET name = 'Regional Cab Association' WHERE id = 'zayride' AND name LIKE '%ZayRide%';
      UPDATE provider_configs SET name = 'On-Demand Urban Cab Fleet' WHERE id = 'yango' AND name LIKE '%Yango%';
    `);
  } catch (err) {
    // Ignore if table not yet created
  }

  const count = db.prepare('SELECT count(*) as count FROM provider_configs').get() as { count: number };
  if (count.count > 0) {
    return;
  }

  const now = new Date().toISOString();
  const insert = db.prepare(`
    INSERT INTO provider_configs (
      id, name, api_url, api_key, webhook_secret, dispatch_mode,
      is_enabled, is_authorized, circuit_state, failure_count, latency_ms,
      markup_percent, tariff_multiplier, timeout_ms, error_threshold,
      integration_readiness_status, last_failure_time, updated_at
    ) VALUES (
      @id, @name, @api_url, @api_key, @webhook_secret, @dispatch_mode,
      @is_enabled, @is_authorized, @circuit_state, @failure_count, @latency_ms,
      @markup_percent, @tariff_multiplier, @timeout_ms, @error_threshold,
      @integration_readiness_status, @last_failure_time, @updated_at
    )
  `);

  const initialProviders = [
    {
      id: 'chebelew',
      name: 'Chebelew Independent Fleet',
      api_url: 'internal://chebelew-core-dispatch',
      api_key: 'chb_live_sec_9942a8b34',
      webhook_secret: 'whsec_chebelew_core_782',
      dispatch_mode: 'bidirectional',
      is_enabled: 1,
      is_authorized: 1,
      circuit_state: 'CLOSED',
      failure_count: 0,
      latency_ms: 38,
      markup_percent: 0.0,
      tariff_multiplier: 1.0,
      timeout_ms: 2000,
      error_threshold: 5,
      integration_readiness_status: 'live_api',
      last_failure_time: null,
      updated_at: now,
    },
    {
      id: 'ride',
      name: 'Licensed Meter Taxi Network',
      api_url: 'https://api.partner.meter-taxi.et/v1',
      api_key: 'mt_prod_partner_live_8923bc7a',
      webhook_secret: 'whsec_meter_taxi_99182',
      dispatch_mode: 'webhook_push',
      is_enabled: 1,
      is_authorized: 1,
      circuit_state: 'CLOSED',
      failure_count: 0,
      latency_ms: 135,
      markup_percent: 8.0,
      tariff_multiplier: 1.08,
      timeout_ms: 3500,
      error_threshold: 3,
      integration_readiness_status: 'live_api',
      last_failure_time: null,
      updated_at: now,
    },
    {
      id: 'feres',
      name: 'Municipal Taxi Cooperative',
      api_url: 'https://api.partner.taxicoop.et/v1',
      api_key: 'coop_live_fleet_77210bc',
      webhook_secret: 'whsec_taxicoop_883',
      dispatch_mode: 'polling',
      is_enabled: 1,
      is_authorized: 1,
      circuit_state: 'CLOSED',
      failure_count: 0,
      latency_ms: 155,
      markup_percent: -2.0,
      tariff_multiplier: 0.98,
      timeout_ms: 3000,
      error_threshold: 3,
      integration_readiness_status: 'live_api',
      last_failure_time: null,
      updated_at: now,
    },
    {
      id: 'zayride',
      name: 'Regional Cab Association',
      api_url: 'https://api.partner.regionalcab.et/v2',
      api_key: 'rc_live_key_8841a',
      webhook_secret: 'whsec_regionalcab_441',
      dispatch_mode: 'polling',
      is_enabled: 1,
      is_authorized: 1,
      circuit_state: 'CLOSED',
      failure_count: 0,
      latency_ms: 182,
      markup_percent: 2.0,
      tariff_multiplier: 1.02,
      timeout_ms: 4000,
      error_threshold: 3,
      integration_readiness_status: 'live_api',
      last_failure_time: null,
      updated_at: now,
    },
    {
      id: 'yango',
      name: 'On-Demand Urban Cab Fleet',
      api_url: 'https://api.partner.urbancab.et/v1',
      api_key: 'uc_live_tok_5518',
      webhook_secret: 'whsec_urbancab_229',
      dispatch_mode: 'webhook_push',
      is_enabled: 1,
      is_authorized: 1,
      circuit_state: 'CLOSED',
      failure_count: 0,
      latency_ms: 215,
      markup_percent: 5.0,
      tariff_multiplier: 1.05,
      timeout_ms: 3000,
      error_threshold: 3,
      integration_readiness_status: 'live_api',
      last_failure_time: null,
      updated_at: now,
    },
  ];

  for (const p of initialProviders) {
    insert.run(p);
  }

  const logCount = db.prepare('SELECT count(*) as count FROM provider_routing_logs').get() as { count: number };
  if (logCount.count === 0) {
    const insertLog = db.prepare(`
      INSERT INTO provider_routing_logs (
        id, timestamp, pickup_address, destination_address, vehicle_category,
        provider_id, provider_name, estimated_fare, latency_ms, http_status,
        circuit_state, action_status, details
      ) VALUES (
        @id, @timestamp, @pickup_address, @destination_address, @vehicle_category,
        @provider_id, @provider_name, @estimated_fare, @latency_ms, @http_status,
        @circuit_state, @action_status, @details
      )
    `);

    const pastLogs = [
      {
        id: 'log_prov_01',
        timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
        pickup_address: 'Bole Medhanialem',
        destination_address: 'Meskel Square',
        vehicle_category: 'sedan',
        provider_id: 'chebelew',
        provider_name: 'Chebelew Independent Fleet',
        estimated_fare: 345.5,
        latency_ms: 38,
        http_status: 200,
        circuit_state: 'CLOSED',
        action_status: 'OFFER_RETURNED',
        details: 'Direct dispatch match • Driver Ahmed Mohammed located 450m away',
      },
      {
        id: 'log_prov_02',
        timestamp: new Date(Date.now() - 1000 * 60 * 11).toISOString(),
        pickup_address: 'Bole Medhanialem',
        destination_address: 'Meskel Square',
        vehicle_category: 'sedan',
        provider_id: 'ride',
        provider_name: 'Licensed Meter Taxi Network',
        estimated_fare: 373.14,
        latency_ms: 132,
        http_status: 200,
        circuit_state: 'CLOSED',
        action_status: 'OFFER_RETURNED',
        details: 'Quote received from Partner API • 8% tariff markup applied',
      },
      {
        id: 'log_prov_03',
        timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
        pickup_address: 'Addis Ababa Bole Int Airport (ADD)',
        destination_address: 'Sheraton Addis Hotel',
        vehicle_category: 'comfort',
        provider_id: 'feres',
        provider_name: 'Municipal Taxi Cooperative',
        estimated_fare: 485.0,
        latency_ms: 154,
        http_status: 200,
        circuit_state: 'CLOSED',
        action_status: 'OFFER_RETURNED',
        details: 'Partner quote polled • Standard municipal association tariff',
      },
      {
        id: 'log_prov_04',
        timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
        pickup_address: 'Mexico Square',
        destination_address: 'Piazza (Arada)',
        vehicle_category: 'sedan',
        provider_id: 'chebelew',
        provider_name: 'Chebelew Independent Fleet',
        estimated_fare: 260.0,
        latency_ms: 41,
        http_status: 200,
        circuit_state: 'CLOSED',
        action_status: 'DISPATCHED',
        details: 'Passenger accepted 0% commission offer • Assigned to Dawit Bekele',
      },
    ];

    for (const l of pastLogs) {
      insertLog.run(l);
    }
  }
}

function seedSystemTariffsAndSettings() {
  const tariffCount = db.prepare('SELECT count(*) as count FROM system_tariffs').get() as { count: number };
  const now = new Date().toISOString();

  if (tariffCount.count === 0) {
    const insertTariff = db.prepare(`
      INSERT INTO system_tariffs (
        category, base_fare, per_km, per_minute, min_fare, waiting_per_minute,
        night_multiplier, peak_multiplier, airport_surcharge, cancellation_fee,
        capacity, display_name, display_name_am, description, description_am, updated_at
      ) VALUES (
        @category, @base_fare, @per_km, @per_minute, @min_fare, @waiting_per_minute,
        @night_multiplier, @peak_multiplier, @airport_surcharge, @cancellation_fee,
        @capacity, @display_name, @display_name_am, @description, @description_am, @updated_at
      )
    `);

    const defaultTariffs = [
      {
        category: 'sedan',
        base_fare: 70.0,
        per_km: 14.0,
        per_minute: 3.0,
        min_fare: 110.0,
        waiting_per_minute: 2.5,
        night_multiplier: 1.25,
        peak_multiplier: 1.15,
        airport_surcharge: 50.0,
        cancellation_fee: 50.0,
        capacity: 4,
        display_name: 'Chebelew Standard (Sedan)',
        display_name_am: 'ቼበለው መደበኛ (ሴዳን)',
        description: 'Toyota Corolla / Vitz / Dzire - 4 passenger seats with A/C',
        description_am: 'ቶዮታ ኮሮላ / ቪትዝ - 4 መቀመጫ ከአየር ማቀዝቀዣ ጋር',
        updated_at: now,
      },
      {
        category: 'minivan',
        base_fare: 110.0,
        per_km: 18.0,
        per_minute: 4.0,
        min_fare: 160.0,
        waiting_per_minute: 3.5,
        night_multiplier: 1.25,
        peak_multiplier: 1.15,
        airport_surcharge: 75.0,
        cancellation_fee: 75.0,
        capacity: 7,
        display_name: 'Chebelew XL (Minivan)',
        display_name_am: 'ቼበለው ኤክስ ኤል (ሚኒቫን)',
        description: 'Toyota Avanza / Noah - 7 seats for groups and airport luggage',
        description_am: 'ቶዮታ አቫንዛ / ኖህ - 7 መቀመጫ ለቡድን እና ለሻንጣ',
        updated_at: now,
      },
      {
        category: 'comfort',
        base_fare: 140.0,
        per_km: 22.0,
        per_minute: 5.0,
        min_fare: 220.0,
        waiting_per_minute: 4.5,
        night_multiplier: 1.30,
        peak_multiplier: 1.20,
        airport_surcharge: 100.0,
        cancellation_fee: 100.0,
        capacity: 4,
        display_name: 'Chebelew Executive Comfort',
        display_name_am: 'ቼበለው ኤክስኪዩቲቭ',
        description: 'Hyundai Elantra / Camry / RAV4 - Premium business comfort',
        description_am: 'ፕሪሚየም መኪናዎች ለቢዝነስና ለክብር እንግዶች',
        updated_at: now,
      },
      {
        category: 'partner_ride',
        base_fare: 80.0,
        per_km: 15.5,
        per_minute: 3.5,
        min_fare: 120.0,
        waiting_per_minute: 3.0,
        night_multiplier: 1.25,
        peak_multiplier: 1.15,
        airport_surcharge: 60.0,
        cancellation_fee: 60.0,
        capacity: 4,
        display_name: 'Partner: Licensed Meter Taxi',
        display_name_am: 'አጋር፡ ፈቃድ ያለው ሚተር ታክሲ',
        description: 'Direct taxi dispatch via integrated licensed partner fleet',
        description_am: 'ፈቃድ ባላቸው የተባባሪ ታክሲዎች አውታረ መረብ የሚደረግ ጉዞ',
        updated_at: now,
      },
      {
        category: 'partner_feres',
        base_fare: 75.0,
        per_km: 15.0,
        per_minute: 3.2,
        min_fare: 115.0,
        waiting_per_minute: 3.0,
        night_multiplier: 1.25,
        peak_multiplier: 1.15,
        airport_surcharge: 50.0,
        cancellation_fee: 50.0,
        capacity: 4,
        display_name: 'Partner: Municipal Taxi Cooperative',
        display_name_am: 'አጋር፡ የማዘጋጃ ቤት ታክሲ ማህበር',
        description: 'Local taxi cooperative association network with standardized tariffs',
        description_am: 'የአዲስ አበባ ታክሲ ማህበራት አውታረ መረብ',
        updated_at: now,
      },
      {
        category: 'delivery_moto',
        base_fare: 40.0,
        per_km: 10.0,
        per_minute: 2.0,
        min_fare: 60.0,
        waiting_per_minute: 1.5,
        night_multiplier: 1.20,
        peak_multiplier: 1.10,
        airport_surcharge: 30.0,
        cancellation_fee: 30.0,
        capacity: 1,
        display_name: 'Chebelew Moto Express Delivery',
        display_name_am: 'ቼበለው ሞተር ፈጣን መልእክት',
        description: 'Motorcycle courier for documents, food, and small parcels',
        description_am: 'ለሰነዶች እና አነስተኛ እቃዎች ፈጣን የሞተር መልእክተኛ',
        updated_at: now,
      },
      {
        category: 'delivery_van',
        base_fare: 120.0,
        per_km: 20.0,
        per_minute: 4.0,
        min_fare: 180.0,
        waiting_per_minute: 4.0,
        night_multiplier: 1.25,
        peak_multiplier: 1.15,
        airport_surcharge: 80.0,
        cancellation_fee: 80.0,
        capacity: 2,
        display_name: 'Chebelew Cargo Logistics Van',
        display_name_am: 'ቼበለው የጭነት ቫን',
        description: 'Cargo van for bulk retail, furniture, and heavy boxes',
        description_am: 'ለትላልቅ እቃዎች እና የንግድ ጭነቶች',
        updated_at: now,
      },
    ];

    for (const t of defaultTariffs) {
      insertTariff.run(t);
    }
  }

  const settingCount = db.prepare('SELECT count(*) as count FROM system_settings').get() as { count: number };
  if (settingCount.count === 0) {
    const insertSetting = db.prepare(`
      INSERT INTO system_settings (key, value, category, description, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    const defaultSettings: [string, string, string, string][] = [
      ['vat_rate', '0.15', 'taxation', 'FDRE Value Added Tax rate on gross ride fares'],
      ['tax_authority_name', 'FDRE Ministry of Revenues', 'taxation', 'Official Ethiopian Tax Authority'],
      ['vat_regulation_reference', 'FDRE Ministry of Revenues - Value Added Tax Regulation No. 570/2025', 'taxation', 'Legal statutory reference for 15% VAT on rides'],
      ['driver_commission_percent', '0', 'operations', 'Platform trip commission % for independent drivers (Founder Mandate: 0%)'],
      ['telebirr_gateway_fee_percent', '1.0', 'payments', 'Ethio telecom payment gateway fee %'],
      ['max_dispatch_radius_km', '6.5', 'dispatch', 'Maximum radius for automated driver proximity matching (km)'],
      ['driver_acceptance_timeout_sec', '25', 'dispatch', 'Driver countdown timeout before reassigning to next nearest vehicle (seconds)'],
      ['free_cancellation_window_min', '3', 'operations', 'Grace period after dispatch where passenger cancels without penalty (minutes)'],
      ['driver_free_wait_time_min', '5', 'operations', 'Free waiting duration at pickup before per-minute waiting fee accrues (minutes)'],
      ['emergency_police_hotline', '991', 'safety', 'Federal Police Emergency Operations Center hotline'],
      ['customer_support_hotline', '9922', 'safety', 'Chebelew 24/7 Addis Ababa Call Center dispatch hotline'],
      ['ambulance_hotline', '907', 'safety', 'Addis Ababa Emergency Medical Services / Ambulance hotline'],
      ['sub_daily_price_etb', '50', 'subscriptions', 'Driver 24-hour unlimited ride access pass price (ETB)'],
      ['sub_weekly_price_etb', '300', 'subscriptions', 'Driver 7-day unlimited ride access pass price (ETB)'],
      ['sub_monthly_price_etb', '1000', 'subscriptions', 'Driver 30-day unlimited ride access pass price (ETB)'],
      ['sub_quarterly_price_etb', '2700', 'subscriptions', 'Driver 90-day unlimited ride access pass price (ETB) - 10% discount'],
      ['sub_yearly_price_etb', '9600', 'subscriptions', 'Driver 365-day unlimited ride access pass price (ETB) - 20% discount'],
      ['sub_grace_period_hours', '24', 'subscriptions', 'Grace hours after pass expiry before driver account is locked from offers'],
    ];

    for (const [k, v, cat, desc] of defaultSettings) {
      insertSetting.run(k, v, cat, desc, now);
    }
  }

  // Ensure advanced payment routing and tax destination settings exist
  const additionalSettings: [string, string, string, string][] = [
    ['tax_routing_mode', 'DRIVER', 'taxation', 'Tax collection routing destination: DRIVER (default for 0% commission), PLATFORM, or AUTHORITY'],
    ['tax_authority_account', 'ERCA-VAT-570-2025', 'taxation', 'Official Ministry of Revenues account number for direct VAT settlement'],
    ['tax_authority_bank', 'National Bank of Ethiopia', 'taxation', 'Tax authority primary treasury bank'],
    ['platform_telebirr_merchant_id', 'ETH-TB-99882', 'payments', 'Chebelew Corporate Telebirr merchant ID for platform rides'],
    ['platform_telebirr_merchant_name', 'Chebelew Technologies Ethiopia PLC', 'payments', 'Chebelew registered corporate title for mobile money'],
    ['platform_cbe_account', '1000987654321', 'payments', 'Chebelew Commercial Bank of Ethiopia treasury account'],
    ['driver_minimum_credit_threshold', '100.0', 'operations', 'Minimum platform credit threshold before cash trip alert'],
    ['usd_to_etb_rate', '138.5', 'payments', 'NBE benchmark exchange rate for international card processing'],
  ];

  const insertOrIgnore = db.prepare(`
    INSERT OR IGNORE INTO system_settings (key, value, category, description, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  for (const [k, v, cat, desc] of additionalSettings) {
    insertOrIgnore.run(k, v, cat, desc, now);
  }
}

function seedDemandHeatmapZones() {
  const count = db.prepare('SELECT count(*) as count FROM demand_heatmap_zones').get() as { count: number };
  if (count.count > 0) return;

  const now = new Date().toISOString();
  const insert = db.prepare(`
    INSERT INTO demand_heatmap_zones (
      zone_id, zone_name, zone_name_am, center_lat, center_lng, radius_meters,
      demand_intensity, driver_supply_count, estimated_wait_minutes,
      potential_hourly_earnings_etb, confidence_score, forecast_period, updated_at
    ) VALUES (
      @zone_id, @zone_name, @zone_name_am, @center_lat, @center_lng, @radius_meters,
      @demand_intensity, @driver_supply_count, @estimated_wait_minutes,
      @potential_hourly_earnings_etb, @confidence_score, @forecast_period, @updated_at
    )
  `);

  const zones = [
    {
      zone_id: 'zone_bole_medhanialem',
      zone_name: 'Bole Medhanialem & Edna Mall Corridor',
      zone_name_am: 'ቦሌ መድኃኔዓለም እና ኤድና ሞል',
      center_lat: 8.9950,
      center_lng: 38.7880,
      radius_meters: 1400,
      demand_intensity: 2.6,
      driver_supply_count: 12,
      estimated_wait_minutes: 2.1,
      potential_hourly_earnings_etb: 480.0,
      confidence_score: 0.95,
      forecast_period: 'next_30_mins',
      updated_at: now,
    },
    {
      zone_id: 'zone_bole_airport',
      zone_name: 'Bole Addis Ababa International Airport',
      zone_name_am: 'ቦሌ ዓለም አቀፍ አውሮፕላን ማረፊያ',
      center_lat: 8.9778,
      center_lng: 38.7993,
      radius_meters: 1800,
      demand_intensity: 2.9,
      driver_supply_count: 18,
      estimated_wait_minutes: 1.8,
      potential_hourly_earnings_etb: 560.0,
      confidence_score: 0.98,
      forecast_period: 'next_30_mins',
      updated_at: now,
    },
    {
      zone_id: 'zone_kazanchis',
      zone_name: 'UNECA & Kazanchis Business District',
      zone_name_am: 'የተመድ ኢኮኖሚክ ኮሚሽን እና ካዛንቺስ',
      center_lat: 9.0185,
      center_lng: 38.7705,
      radius_meters: 1300,
      demand_intensity: 2.3,
      driver_supply_count: 9,
      estimated_wait_minutes: 2.7,
      potential_hourly_earnings_etb: 430.0,
      confidence_score: 0.92,
      forecast_period: 'next_30_mins',
      updated_at: now,
    },
    {
      zone_id: 'zone_meskel_square',
      zone_name: 'Meskel Square & Stadium Hub',
      zone_name_am: 'መስቀል አደባባይ እና ስታዲየም',
      center_lat: 9.0105,
      center_lng: 38.7615,
      radius_meters: 1500,
      demand_intensity: 2.1,
      driver_supply_count: 14,
      estimated_wait_minutes: 2.4,
      potential_hourly_earnings_etb: 400.0,
      confidence_score: 0.94,
      forecast_period: 'next_30_mins',
      updated_at: now,
    },
    {
      zone_id: 'zone_piassa',
      zone_name: 'Piassa & Churchill Avenue',
      zone_name_am: 'ፒያሳ እና ቸርችል ጎዳና',
      center_lat: 9.0345,
      center_lng: 38.7525,
      radius_meters: 1200,
      demand_intensity: 1.8,
      driver_supply_count: 7,
      estimated_wait_minutes: 3.5,
      potential_hourly_earnings_etb: 350.0,
      confidence_score: 0.88,
      forecast_period: 'next_30_mins',
      updated_at: now,
    },
    {
      zone_id: 'zone_mercato',
      zone_name: 'Addis Mercato Commercial Market',
      zone_name_am: 'አዲስ መርካቶ የንግድ ማዕከል',
      center_lat: 9.0300,
      center_lng: 38.7390,
      radius_meters: 1600,
      demand_intensity: 2.5,
      driver_supply_count: 11,
      estimated_wait_minutes: 3.0,
      potential_hourly_earnings_etb: 460.0,
      confidence_score: 0.91,
      forecast_period: 'next_30_mins',
      updated_at: now,
    },
    {
      zone_id: 'zone_sarbet',
      zone_name: 'Sarbet & African Union Headquarters',
      zone_name_am: 'ሳርቤት እና የአፍሪካ ህብረት',
      center_lat: 8.9970,
      center_lng: 38.7360,
      radius_meters: 1300,
      demand_intensity: 1.9,
      driver_supply_count: 6,
      estimated_wait_minutes: 3.2,
      potential_hourly_earnings_etb: 360.0,
      confidence_score: 0.89,
      forecast_period: 'next_30_mins',
      updated_at: now,
    },
  ];

  for (const z of zones) {
    insert.run(z);
  }
}

function seedDriverExpenses() {
  const count = db.prepare('SELECT count(*) as count FROM driver_operating_expenses').get() as { count: number };
  if (count.count > 0) return;

  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO driver_operating_expenses (
      driver_id, fuel_cost_per_km, daily_maintenance_etb, daily_insurance_etb, daily_misc_expenses_etb, updated_at
    ) VALUES (
      'driver_ahmed_01', 4.2, 85.0, 45.0, 50.0, ?
    )
  `).run(now);
}

function seedDriverPaymentRails() {
  const count = db.prepare('SELECT count(*) as count FROM driver_payment_rails').get() as { count: number };
  if (count.count > 0) return;

  const now = new Date().toISOString();
  const insert = db.prepare(`
    INSERT INTO driver_payment_rails (
      driver_id, telebirr_phone, telebirr_account_name, cbe_account_number, cbe_account_name,
      bank_name, bank_account_number, bank_account_name, primary_rail, qr_code_data, is_verified, updated_at
    ) VALUES (
      @driver_id, @telebirr_phone, @telebirr_account_name, @cbe_account_number, @cbe_account_name,
      @bank_name, @bank_account_number, @bank_account_name, @primary_rail, @qr_code_data, @is_verified, @updated_at
    )
  `);

  const rails = [
    {
      driver_id: 'driver_ahmed_01',
      telebirr_phone: '+251911223344',
      telebirr_account_name: 'Ahmed Mohammed Ali',
      cbe_account_number: '1000192837465',
      cbe_account_name: 'Ahmed Mohammed Ali',
      bank_name: 'Commercial Bank of Ethiopia',
      bank_account_number: '1000192837465',
      bank_account_name: 'Ahmed Mohammed Ali',
      primary_rail: 'TELEBIRR',
      qr_code_data: JSON.stringify({ rail: 'TELEBIRR', phone: '+251911223344', name: 'Ahmed Mohammed' }),
      is_verified: 1,
      updated_at: now,
    },
    {
      driver_id: 'driver_dawit_02',
      telebirr_phone: '+251922334455',
      telebirr_account_name: 'Dawit Tadesse Bekele',
      cbe_account_number: '1000283746519',
      cbe_account_name: 'Dawit Tadesse Bekele',
      bank_name: 'Commercial Bank of Ethiopia',
      bank_account_number: '1000283746519',
      bank_account_name: 'Dawit Tadesse Bekele',
      primary_rail: 'CBE_BIRR',
      qr_code_data: JSON.stringify({ rail: 'CBE_BIRR', cbe: '1000283746519', name: 'Dawit Tadesse' }),
      is_verified: 1,
      updated_at: now,
    },
    {
      driver_id: 'driver_bethlehem_03',
      telebirr_phone: '+251933445566',
      telebirr_account_name: 'Bethlehem Haile Wolde',
      cbe_account_number: '1000374651928',
      cbe_account_name: 'Bethlehem Haile Wolde',
      bank_name: 'Bank of Abyssinia',
      bank_account_number: '8872910293',
      bank_account_name: 'Bethlehem Haile Wolde',
      primary_rail: 'TELEBIRR',
      qr_code_data: JSON.stringify({ rail: 'TELEBIRR', phone: '+251933445566', name: 'Bethlehem Haile' }),
      is_verified: 1,
      updated_at: now,
    },
    {
      driver_id: 'driver_henok_04',
      telebirr_phone: '+251944556677',
      telebirr_account_name: 'Henok Girma Kassa',
      cbe_account_number: '1000465192837',
      cbe_account_name: 'Henok Girma Kassa',
      bank_name: 'Awash Bank',
      bank_account_number: '01429182736400',
      bank_account_name: 'Henok Girma Kassa',
      primary_rail: 'BANK_TRANSFER',
      qr_code_data: JSON.stringify({ rail: 'AWASH', account: '01429182736400', name: 'Henok Girma' }),
      is_verified: 1,
      updated_at: now,
    },
    {
      driver_id: 'driver_solomon_05',
      telebirr_phone: '+251955667788',
      telebirr_account_name: 'Solomon Kebede Tefera',
      cbe_account_number: '1000519283746',
      cbe_account_name: 'Solomon Kebede Tefera',
      bank_name: 'Commercial Bank of Ethiopia',
      bank_account_number: '1000519283746',
      bank_account_name: 'Solomon Kebede Tefera',
      primary_rail: 'TELEBIRR',
      qr_code_data: JSON.stringify({ rail: 'TELEBIRR', phone: '+251955667788', name: 'Solomon Kebede' }),
      is_verified: 1,
      updated_at: now,
    },
  ];

  for (const r of rails) {
    insert.run(r);
  }
}

function seedDriverPlatformCredits() {
  const count = db.prepare('SELECT count(*) as count FROM driver_platform_credits').get() as { count: number };
  if (count.count > 0) return;

  const now = new Date().toISOString();
  const insertCredit = db.prepare(`
    INSERT INTO driver_platform_credits (
      driver_id, credit_balance_etb, total_topups_etb, total_deductions_etb, last_topup_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertTx = db.prepare(`
    INSERT INTO driver_credit_transactions (
      id, driver_id, type, amount_etb, balance_after_etb, payment_method, payment_reference, description, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertCredit.run('driver_ahmed_01', 1500.0, 2000.0, 500.0, now, now);
  insertTx.run(
    'tx_cred_ahmed_init',
    'driver_ahmed_01',
    'TOPUP',
    2000.0,
    2000.0,
    'TELEBIRR',
    'TB_CR_992101',
    'Prepaid driver platform credit top-up via Telebirr',
    now
  );
  insertTx.run(
    'tx_cred_ahmed_recon1',
    'driver_ahmed_01',
    'CASH_RECONCILIATION',
    -500.0,
    1500.0,
    'CASH',
    'RECON_CASH_01',
    'Reconciled platform fee offset for cash collected trip',
    now
  );

  insertCredit.run('driver_dawit_02', 850.0, 1000.0, 150.0, now, now);
  insertTx.run(
    'tx_cred_dawit_init',
    'driver_dawit_02',
    'TOPUP',
    1000.0,
    1000.0,
    'BANK_TRANSFER',
    'CBE_TR_881923',
    'Prepaid driver credit top-up via CBE transfer',
    now
  );
}

function seedPassengerWallets() {
  const count = db.prepare('SELECT count(*) as count FROM passenger_wallets').get() as { count: number };
  if (count.count > 0) return;

  const now = new Date().toISOString();
  const insertWallet = db.prepare(`
    INSERT INTO passenger_wallets (
      user_id, balance_etb, currency, total_topped_up_etb, total_spent_etb, last_topup_at, updated_at
    ) VALUES (?, ?, 'ETB', ?, ?, ?, ?)
  `);

  const insertWalletTx = db.prepare(`
    INSERT INTO passenger_wallet_transactions (
      id, user_id, type, amount_etb, balance_after_etb, topup_rail, card_details_json, reference, description, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Rider 1: Leila Haile
  insertWallet.run('user_leila_01', 1250.0, 2500.0, 1250.0, now, now);
  insertWalletTx.run(
    'tx_wal_leila_card',
    'user_leila_01',
    'TOPUP',
    2500.0,
    2500.0,
    'INTERNATIONAL_CARD',
    JSON.stringify({
      brand: 'VISA',
      last4: '4242',
      sourceCurrency: 'USD',
      sourceAmount: 18.05,
      exchangeRate: 138.5,
    }),
    'CHB_VISA_INTL_99182',
    'International Visa Card top-up ($18.05 USD converted @ 138.5 ETB/USD)',
    'COMPLETED',
    now
  );

  // Rider 2: Tsegaye Gebre
  insertWallet.run('user_tsegaye_02', 600.0, 1000.0, 400.0, now, now);
  insertWalletTx.run(
    'tx_wal_tsegaye_tb',
    'user_tsegaye_02',
    'TOPUP',
    1000.0,
    1000.0,
    'TELEBIRR',
    null,
    'TB_WAL_772819',
    'Telebirr mobile money wallet top-up',
    'COMPLETED',
    now
  );
}

