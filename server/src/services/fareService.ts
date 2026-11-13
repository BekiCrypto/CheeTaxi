import { FareCalculation, FareEstimate, VehicleCategory, TariffRate, SystemSettings } from '../../../shared/types.js';
import { db } from '../db/database.js';

export { TariffRate };

export const DEFAULT_TARIFFS: Record<VehicleCategory, TariffRate> = {
  sedan: {
    category: 'sedan',
    baseFare: 70, // ETB
    perKm: 14, // ETB / km
    perMinute: 3, // ETB / min
    minFare: 110,
    waitingPerMinute: 2.5,
    nightMultiplier: 1.25,
    peakMultiplier: 1.15,
    airportSurcharge: 50,
    cancellationFee: 50,
    capacity: 4,
    displayName: 'Chebelew Standard (Sedan)',
    displayNameAm: 'ቼበለው መደበኛ (ሴዳን)',
    description: 'Toyota Corolla / Vitz / Dzire - 4 passenger seats with A/C',
    descriptionAm: 'ቶዮታ ኮሮላ / ቪትዝ - 4 መቀመጫ ከአየር ማቀዝቀዣ ጋር',
  },
  minivan: {
    category: 'minivan',
    baseFare: 110, // ETB
    perKm: 18, // ETB / km
    perMinute: 4, // ETB / min
    minFare: 160,
    waitingPerMinute: 3.5,
    nightMultiplier: 1.25,
    peakMultiplier: 1.15,
    airportSurcharge: 75,
    cancellationFee: 75,
    capacity: 7,
    displayName: 'Chebelew XL (Minivan)',
    displayNameAm: 'ቼበለው ኤክስ ኤል (ሚኒቫን)',
    description: 'Toyota Avanza / Noah - 7 seats for groups and airport luggage',
    descriptionAm: 'ቶዮታ አቫንዛ / ኖህ - 7 መቀመጫ ለቡድን እና ለሻንጣ',
  },
  comfort: {
    category: 'comfort',
    baseFare: 140, // ETB
    perKm: 22, // ETB / km
    perMinute: 5, // ETB / min
    minFare: 220,
    waitingPerMinute: 4.5,
    nightMultiplier: 1.30,
    peakMultiplier: 1.20,
    airportSurcharge: 100,
    cancellationFee: 100,
    capacity: 4,
    displayName: 'Chebelew Executive Comfort',
    displayNameAm: 'ቼበለው ኤክስኪዩቲቭ',
    description: 'Hyundai Elantra / Camry / RAV4 - Premium business comfort',
    descriptionAm: 'ፕሪሚየም መኪናዎች ለቢዝነስና ለክብር እንግዶች',
  },
  partner_ride: {
    category: 'partner_ride',
    baseFare: 80,
    perKm: 15.5,
    perMinute: 3.5,
    minFare: 120,
    waitingPerMinute: 3.0,
    nightMultiplier: 1.25,
    peakMultiplier: 1.15,
    airportSurcharge: 60,
    cancellationFee: 60,
    capacity: 4,
    displayName: 'Partner: Licensed Meter Taxi',
    displayNameAm: 'አጋር፡ ፈቃድ ያለው ሚተር ታክሲ',
    description: 'Direct taxi dispatch via integrated licensed partner fleet',
    descriptionAm: 'ፈቃድ ባላቸው የተባባሪ ታክሲዎች አውታረ መረብ የሚደረግ ጉዞ',
  },
  partner_feres: {
    category: 'partner_feres',
    baseFare: 75,
    perKm: 15.0,
    perMinute: 3.2,
    minFare: 115,
    waitingPerMinute: 3.0,
    nightMultiplier: 1.25,
    peakMultiplier: 1.15,
    airportSurcharge: 50,
    cancellationFee: 50,
    capacity: 4,
    displayName: 'Partner: Municipal Taxi Cooperative',
    displayNameAm: 'አጋር፡ የማዘጋጃ ቤት ታክሲ ማህበር',
    description: 'Local taxi cooperative association network with standardized tariffs',
    descriptionAm: 'የአዲስ አበባ ታክሲ ማህበራት አውታረ መረብ',
  },
  delivery_moto: {
    category: 'delivery_moto',
    baseFare: 40,
    perKm: 10,
    perMinute: 2,
    minFare: 60,
    waitingPerMinute: 1.5,
    nightMultiplier: 1.20,
    peakMultiplier: 1.10,
    airportSurcharge: 30,
    cancellationFee: 30,
    capacity: 1,
    displayName: 'Chebelew Moto Express Delivery',
    displayNameAm: 'ቼበለው ሞተር ፈጣን መልእክት',
    description: 'Motorcycle courier for documents, food, and small parcels',
    descriptionAm: 'ለሰነዶች እና አነስተኛ እቃዎች ፈጣን የሞተር መልእክተኛ',
  },
  delivery_van: {
    category: 'delivery_van',
    baseFare: 120,
    perKm: 20,
    perMinute: 4,
    minFare: 180,
    waitingPerMinute: 4.0,
    nightMultiplier: 1.25,
    peakMultiplier: 1.15,
    airportSurcharge: 80,
    cancellationFee: 80,
    capacity: 2,
    displayName: 'Chebelew Cargo Logistics Van',
    displayNameAm: 'ቼበለው የጭነት ቫን',
    description: 'Cargo van for bulk retail, furniture, and heavy boxes',
    descriptionAm: 'ለትላልቅ እቃዎች እና የንግድ ጭነቶች',
  },
};

/**
 * Retrieve all active tariffs from SQLite database, with automatic fallback
 */
export function getAllTariffs(): Record<VehicleCategory, TariffRate> {
  try {
    const rows = db.prepare('SELECT * FROM system_tariffs').all() as any[];
    if (!rows || rows.length === 0) {
      return { ...DEFAULT_TARIFFS };
    }

    const result: Partial<Record<VehicleCategory, TariffRate>> = {};
    for (const r of rows) {
      const cat = r.category as VehicleCategory;
      result[cat] = {
        category: cat,
        baseFare: Number(r.base_fare),
        perKm: Number(r.per_km),
        perMinute: Number(r.per_minute),
        minFare: Number(r.min_fare),
        waitingPerMinute: Number(r.waiting_per_minute ?? 2.5),
        nightMultiplier: Number(r.night_multiplier ?? 1.25),
        peakMultiplier: Number(r.peak_multiplier ?? 1.15),
        airportSurcharge: Number(r.airport_surcharge ?? 50),
        cancellationFee: Number(r.cancellation_fee ?? 50),
        capacity: Number(r.capacity ?? 4),
        displayName: r.display_name,
        displayNameAm: r.display_name_am,
        description: r.description,
        descriptionAm: r.description_am,
        updatedAt: r.updated_at,
      };
    }

    // Ensure all defined categories exist
    for (const cat of Object.keys(DEFAULT_TARIFFS) as VehicleCategory[]) {
      if (!result[cat]) {
        result[cat] = DEFAULT_TARIFFS[cat];
      }
    }

    return result as Record<VehicleCategory, TariffRate>;
  } catch (err: any) {
    if (!err?.message?.includes('no such table')) {
      console.error('Error fetching system_tariffs:', err);
    }
    return { ...DEFAULT_TARIFFS };
  }
}

/**
 * Update one or multiple tariff records in SQLite
 */
export function updateTariffs(
  updates: Record<string, Partial<TariffRate>>
): Record<VehicleCategory, TariffRate> {
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO system_tariffs (
      category, base_fare, per_km, per_minute, min_fare, waiting_per_minute,
      night_multiplier, peak_multiplier, airport_surcharge, cancellation_fee,
      capacity, display_name, display_name_am, description, description_am, updated_at
    ) VALUES (
      @category, @base_fare, @per_km, @per_minute, @min_fare, @waiting_per_minute,
      @night_multiplier, @peak_multiplier, @airport_surcharge, @cancellation_fee,
      @capacity, @display_name, @display_name_am, @description, @description_am, @updated_at
    )
    ON CONFLICT(category) DO UPDATE SET
      base_fare = excluded.base_fare,
      per_km = excluded.per_km,
      per_minute = excluded.per_minute,
      min_fare = excluded.min_fare,
      waiting_per_minute = excluded.waiting_per_minute,
      night_multiplier = excluded.night_multiplier,
      peak_multiplier = excluded.peak_multiplier,
      airport_surcharge = excluded.airport_surcharge,
      cancellation_fee = excluded.cancellation_fee,
      capacity = excluded.capacity,
      display_name = excluded.display_name,
      display_name_am = excluded.display_name_am,
      description = excluded.description,
      description_am = excluded.description_am,
      updated_at = excluded.updated_at
  `);

  const current = getAllTariffs();

  const tx = db.transaction(() => {
    for (const [cat, patch] of Object.entries(updates)) {
      const existing = current[cat as VehicleCategory] || DEFAULT_TARIFFS[cat as VehicleCategory];
      if (!existing) continue;

      const merged: TariffRate = {
        ...existing,
        ...patch,
        category: cat as VehicleCategory,
        updatedAt: now,
      };

      stmt.run({
        category: merged.category,
        base_fare: Number(merged.baseFare),
        per_km: Number(merged.perKm),
        per_minute: Number(merged.perMinute),
        min_fare: Number(merged.minFare),
        waiting_per_minute: Number(merged.waitingPerMinute ?? 2.5),
        night_multiplier: Number(merged.nightMultiplier ?? 1.25),
        peak_multiplier: Number(merged.peakMultiplier ?? 1.15),
        airport_surcharge: Number(merged.airportSurcharge ?? 50),
        cancellation_fee: Number(merged.cancellationFee ?? 50),
        capacity: Number(merged.capacity ?? 4),
        display_name: merged.displayName,
        display_name_am: merged.displayNameAm,
        description: merged.description,
        description_am: merged.descriptionAm,
        updated_at: now,
      });
    }
  });

  tx();
  return getAllTariffs();
}

/**
 * Reset all tariffs to statutory default baselines
 */
export function resetTariffsToDefaults(): Record<VehicleCategory, TariffRate> {
  db.prepare('DELETE FROM system_tariffs').run();
  return updateTariffs(DEFAULT_TARIFFS);
}

/**
 * Fetch dynamic system settings from SQLite
 */
export function getSystemSettings(): SystemSettings {
  try {
    const rows = db.prepare('SELECT key, value FROM system_settings').all() as { key: string; value: string }[];
    const map: Record<string, string> = {};
    for (const r of rows) {
      map[r.key] = r.value;
    }

    return {
      vatRate: parseFloat(map['vat_rate'] ?? '0.15'),
      taxAuthorityName: map['tax_authority_name'] ?? 'FDRE Ministry of Revenues',
      vatRegulationReference:
        map['vat_regulation_reference'] ??
        'FDRE Ministry of Revenues - Value Added Tax Regulation No. 570/2025',
      driverCommissionPercent: parseFloat(map['driver_commission_percent'] ?? '0'),
      telebirrGatewayFeePercent: parseFloat(map['telebirr_gateway_fee_percent'] ?? '1.0'),
      maxDispatchRadiusKm: parseFloat(map['max_dispatch_radius_km'] ?? '6.5'),
      driverAcceptanceTimeoutSec: parseInt(map['driver_acceptance_timeout_sec'] ?? '25', 10),
      freeCancellationWindowMin: parseInt(map['free_cancellation_window_min'] ?? '3', 10),
      driverFreeWaitTimeMin: parseInt(map['driver_free_wait_time_min'] ?? '5', 10),
      emergencyPoliceHotline: map['emergency_police_hotline'] ?? '991',
      customerSupportHotline: map['customer_support_hotline'] ?? '9922',
      ambulanceHotline: map['ambulance_hotline'] ?? '907',
      subDailyPriceEtb: parseFloat(map['sub_daily_price_etb'] ?? '50'),
      subWeeklyPriceEtb: parseFloat(map['sub_weekly_price_etb'] ?? '300'),
      subMonthlyPriceEtb: parseFloat(map['sub_monthly_price_etb'] ?? '1000'),
      subQuarterlyPriceEtb: parseFloat(map['sub_quarterly_price_etb'] ?? '2700'),
      subYearlyPriceEtb: parseFloat(map['sub_yearly_price_etb'] ?? '9600'),
      subGracePeriodHours: parseInt(map['sub_grace_period_hours'] ?? '24', 10),
    };
  } catch (err: any) {
    if (!err?.message?.includes('no such table')) {
      console.error('Error fetching system_settings:', err);
    }
    return {
      vatRate: 0.15,
      taxAuthorityName: 'FDRE Ministry of Revenues',
      vatRegulationReference: 'FDRE Ministry of Revenues - Value Added Tax Regulation No. 570/2025',
      driverCommissionPercent: 0,
      telebirrGatewayFeePercent: 1.0,
      maxDispatchRadiusKm: 6.5,
      driverAcceptanceTimeoutSec: 25,
      freeCancellationWindowMin: 3,
      driverFreeWaitTimeMin: 5,
      emergencyPoliceHotline: '991',
      customerSupportHotline: '9922',
      ambulanceHotline: '907',
      subDailyPriceEtb: 50,
      subWeeklyPriceEtb: 300,
      subMonthlyPriceEtb: 1000,
      subQuarterlyPriceEtb: 2700,
      subYearlyPriceEtb: 9600,
      subGracePeriodHours: 24,
    };
  }
}

/**
 * Persist system settings to SQLite and sync with subscription plans
 */
export function updateSystemSettings(updates: Partial<SystemSettings>): SystemSettings {
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO system_settings (key, value, category, description, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `);

  const mapping: Record<keyof SystemSettings, { dbKey: string; cat: string; desc: string }> = {
    vatRate: { dbKey: 'vat_rate', cat: 'taxation', desc: 'FDRE VAT rate on gross ride fares' },
    taxAuthorityName: { dbKey: 'tax_authority_name', cat: 'taxation', desc: 'Official Ethiopian Tax Authority' },
    vatRegulationReference: { dbKey: 'vat_regulation_reference', cat: 'taxation', desc: 'Legal statutory VAT reference' },
    driverCommissionPercent: { dbKey: 'driver_commission_percent', cat: 'operations', desc: 'Platform trip commission %' },
    telebirrGatewayFeePercent: { dbKey: 'telebirr_gateway_fee_percent', cat: 'payments', desc: 'Ethio telecom payment gateway fee %' },
    maxDispatchRadiusKm: { dbKey: 'max_dispatch_radius_km', cat: 'dispatch', desc: 'Max automated driver proximity search radius (km)' },
    driverAcceptanceTimeoutSec: { dbKey: 'driver_acceptance_timeout_sec', cat: 'dispatch', desc: 'Driver countdown timeout before reassigning (seconds)' },
    freeCancellationWindowMin: { dbKey: 'free_cancellation_window_min', cat: 'operations', desc: 'Passenger free cancellation window (minutes)' },
    driverFreeWaitTimeMin: { dbKey: 'driver_free_wait_time_min', cat: 'operations', desc: 'Free waiting time at pickup location (minutes)' },
    emergencyPoliceHotline: { dbKey: 'emergency_police_hotline', cat: 'safety', desc: 'Federal Police Emergency hotline' },
    customerSupportHotline: { dbKey: 'customer_support_hotline', cat: 'safety', desc: 'Chebelew 24/7 Call Center dispatch hotline' },
    ambulanceHotline: { dbKey: 'ambulance_hotline', cat: 'safety', desc: 'Addis Ababa Emergency Medical Services / Ambulance' },
    subDailyPriceEtb: { dbKey: 'sub_daily_price_etb', cat: 'subscriptions', desc: 'Driver 24-hour pass price (ETB)' },
    subWeeklyPriceEtb: { dbKey: 'sub_weekly_price_etb', cat: 'subscriptions', desc: 'Driver 7-day pass price (ETB)' },
    subMonthlyPriceEtb: { dbKey: 'sub_monthly_price_etb', cat: 'subscriptions', desc: 'Driver 30-day pass price (ETB)' },
    subQuarterlyPriceEtb: { dbKey: 'sub_quarterly_price_etb', cat: 'subscriptions', desc: 'Driver 90-day pass price (ETB)' },
    subYearlyPriceEtb: { dbKey: 'sub_yearly_price_etb', cat: 'subscriptions', desc: 'Driver 365-day pass price (ETB)' },
    subGracePeriodHours: { dbKey: 'sub_grace_period_hours', cat: 'subscriptions', desc: 'Grace hours after pass expiry before restriction' },
  };

  const tx = db.transaction(() => {
    for (const [key, val] of Object.entries(updates)) {
      const meta = mapping[key as keyof SystemSettings];
      if (meta && val !== undefined) {
        stmt.run(meta.dbKey, String(val), meta.cat, meta.desc, now);
      }
    }

    // Sync subscription plan prices if updated
    if (updates.subDailyPriceEtb !== undefined) {
      db.prepare(`UPDATE subscription_plans SET price_amount = ? WHERE billing_period = 'daily'`).run(updates.subDailyPriceEtb);
    }
    if (updates.subWeeklyPriceEtb !== undefined) {
      db.prepare(`UPDATE subscription_plans SET price_amount = ? WHERE billing_period = 'weekly'`).run(updates.subWeeklyPriceEtb);
    }
    if (updates.subMonthlyPriceEtb !== undefined) {
      db.prepare(`UPDATE subscription_plans SET price_amount = ? WHERE billing_period = 'monthly'`).run(updates.subMonthlyPriceEtb);
    }
    if (updates.subQuarterlyPriceEtb !== undefined) {
      db.prepare(`UPDATE subscription_plans SET price_amount = ? WHERE billing_period = 'quarterly'`).run(updates.subQuarterlyPriceEtb);
    }
    if (updates.subYearlyPriceEtb !== undefined) {
      db.prepare(`UPDATE subscription_plans SET price_amount = ? WHERE billing_period = 'yearly'`).run(updates.subYearlyPriceEtb);
    }
  });

  tx();
  return getSystemSettings();
}

/**
 * Transparent proxy for TARIFFS so legacy references dynamically read from database
 */
export const TARIFFS: Record<VehicleCategory, TariffRate> = new Proxy({} as any, {
  get(_target, prop: string) {
    const all = getAllTariffs();
    return (all as any)[prop];
  },
  ownKeys() {
    return Reflect.ownKeys(getAllTariffs());
  },
  getOwnPropertyDescriptor(target, prop) {
    const all = getAllTariffs();
    if (prop in all) {
      return {
        configurable: true,
        enumerable: true,
        value: (all as any)[prop],
      };
    }
    return undefined;
  },
});

/**
 * Calculates complete transparent fare breakdown compliant with
 * Ethiopian Value Added Tax Regulation No. 570/2025 and active system settings.
 */
export function calculateFare(
  category: VehicleCategory,
  distanceKm: number,
  durationMinutes: number
): FareCalculation {
  const tariffs = getAllTariffs();
  const tariff = tariffs[category] || tariffs.sedan || DEFAULT_TARIFFS.sedan;
  const settings = getSystemSettings();

  const distanceFare = Number((distanceKm * tariff.perKm).toFixed(2));
  const timeFare = Number((durationMinutes * tariff.perMinute).toFixed(2));
  const rawSubtotal = tariff.baseFare + distanceFare + timeFare;
  const subtotal = Number(Math.max(tariff.minFare, rawSubtotal).toFixed(2));

  // Value Added Tax (VAT) rate from live system settings (default 0.15)
  const vatRate = settings.vatRate;
  const vatAmount = Number((subtotal * vatRate).toFixed(2));
  const totalFare = Number((subtotal + vatAmount).toFixed(2));

  // Founder Mandate Version 2.0: DRIVER SUBSCRIPTION MODEL
  // 0% per-trip commission charged to subscribed independent drivers!
  const isPartner = category.startsWith('partner_');
  const platformTakeRate = isPartner ? 0.15 : (settings.driverCommissionPercent / 100);
  const platformCommission = Number((subtotal * platformTakeRate).toFixed(2));

  // Telebirr digital payment handling fee (~1%)
  const telebirrFee = Number((totalFare * (settings.telebirrGatewayFeePercent / 100)).toFixed(2));

  // Driver net earnings: 100% of ride fare goes to subscribed driver!
  const driverNetPayout = isPartner
    ? Number((subtotal - platformCommission).toFixed(2))
    : subtotal;

  return {
    baseFare: tariff.baseFare,
    distanceKm,
    distanceFare,
    durationMinutes,
    timeFare,
    subtotal,
    vatRate,
    vatAmount,
    totalFare,
    platformTakeRate,
    platformCommission,
    telebirrFee,
    driverNetPayout,
  };
}

/**
 * Generates all fare estimates across Chebelew tiers and aggregated partner fleets
 */
export function getFareEstimates(
  distanceKm: number,
  durationMinutes: number
): FareEstimate[] {
  const categories: VehicleCategory[] = ['sedan', 'minivan', 'comfort', 'partner_ride', 'partner_feres'];
  const tariffs = getAllTariffs();

  return categories.map((cat) => {
    const tariff = tariffs[cat] || DEFAULT_TARIFFS[cat];
    const fare = calculateFare(cat, distanceKm, durationMinutes);

    // Approximate arrival ETAs based on vehicle category
    let etaMinutes = 4;
    if (cat === 'minivan') etaMinutes = 7;
    if (cat === 'comfort') etaMinutes = 6;
    if (cat === 'partner_ride') etaMinutes = 3;
    if (cat === 'partner_feres') etaMinutes = 5;

    const isAggregated = cat.startsWith('partner_');

    return {
      category: cat,
      displayName: tariff.displayName,
      displayNameAm: tariff.displayNameAm,
      description: tariff.description,
      descriptionAm: tariff.descriptionAm,
      capacity: tariff.capacity,
      fare,
      etaMinutes,
      isAggregatedPartner: isAggregated,
      partnerName: isAggregated
        ? (cat === 'partner_ride' ? 'Licensed Meter Taxi Network' : 'Municipal Taxi Cooperative')
        : undefined,
    };
  });
}
