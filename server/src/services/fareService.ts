import { FareCalculation, FareEstimate, VehicleCategory } from '../../../shared/types.js';

export interface TariffRate {
  baseFare: number;
  perKm: number;
  perMinute: number;
  minFare: number;
  capacity: number;
  displayName: string;
  displayNameAm: string;
  description: string;
  descriptionAm: string;
}

export const TARIFFS: Record<VehicleCategory, TariffRate> = {
  sedan: {
    baseFare: 70, // ETB
    perKm: 14, // ETB / km
    perMinute: 3, // ETB / min
    minFare: 110,
    capacity: 4,
    displayName: 'Chebelew Standard (Sedan)',
    displayNameAm: 'ከበለው መደበኛ (ሴዳን)',
    description: 'Toyota Corolla / Vitz / Dzire - 4 passenger seats with A/C',
    descriptionAm: 'ቶዮታ ኮሮላ / ቪትዝ - 4 መቀመጫ ከአየር ማቀዝቀዣ ጋር',
  },
  minivan: {
    baseFare: 110, // ETB
    perKm: 18, // ETB / km
    perMinute: 4, // ETB / min
    minFare: 160,
    capacity: 7,
    displayName: 'Chebelew XL (Minivan)',
    displayNameAm: 'ከበለው ኤክስ ኤል (ሚኒቫን)',
    description: 'Toyota Avanza / Noah - 7 seats for groups and airport luggage',
    descriptionAm: 'ቶዮታ አቫንዛ / ኖህ - 7 መቀመጫ ለቡድን እና ለሻንጣ',
  },
  comfort: {
    baseFare: 140, // ETB
    perKm: 22, // ETB / km
    perMinute: 5, // ETB / min
    minFare: 220,
    capacity: 4,
    displayName: 'Chebelew Executive Comfort',
    displayNameAm: 'ከበለው ኤክስኪዩቲቭ',
    description: 'Hyundai Elantra / Camry / RAV4 - Premium business comfort',
    descriptionAm: 'ፕሪሚየም መኪናዎች ለቢዝነስና ለክብር እንግዶች',
  },
  partner_ride: {
    baseFare: 80,
    perKm: 15.5,
    perMinute: 3.5,
    minFare: 120,
    capacity: 4,
    displayName: 'Partner: RIDE (Hybrid Designs)',
    displayNameAm: 'አጋር፡ ራይድ (RIDE)',
    description: 'Direct taxi dispatch via registered RIDE partner network',
    descriptionAm: 'በራይድ አውታረ መረብ በኩል የሚደረግ ጉዞ',
  },
  partner_feres: {
    baseFare: 75,
    perKm: 15.0,
    perMinute: 3.2,
    minFare: 115,
    capacity: 4,
    displayName: 'Partner: Feres (ፈረስ)',
    displayNameAm: 'አጋር፡ ፈረስ (Feres Miles)',
    description: 'Partner fleet with Feres Miles loyalty eligible dispatch',
    descriptionAm: 'ከፈረስ ማይልስ ጋር የተገናኘ የአጋር ታክሲ',
  },
  delivery_moto: {
    baseFare: 40,
    perKm: 10,
    perMinute: 2,
    minFare: 60,
    capacity: 1,
    displayName: 'Chebelew Moto Express Delivery',
    displayNameAm: 'ከበለው ሞተር ፈጣን መልእክት',
    description: 'Motorcycle courier for documents, food, and small parcels',
    descriptionAm: 'ለሰነዶች እና አነስተኛ እቃዎች ፈጣን የሞተር መልእክተኛ',
  },
  delivery_van: {
    baseFare: 120,
    perKm: 20,
    perMinute: 4,
    minFare: 180,
    capacity: 2,
    displayName: 'Chebelew Cargo Logistics Van',
    displayNameAm: 'ከበለው የጭነት ቫን',
    description: 'Cargo van for bulk retail, furniture, and heavy boxes',
    descriptionAm: 'ለትላልቅ እቃዎች እና የንግድ ጭነቶች',
  },
};

/**
 * Calculates complete transparent fare breakdown compliant with
 * Ethiopian Value Added Tax Regulation No. 570/2025.
 *
 * Rules:
 * - Subtotal = Base + (Distance * perKm) + (Duration * perMin)
 * - 15% VAT is applied to the gross ride fare and remitted to the Ministry of Revenues
 * - Platform take rate = 15% of gross fare
 * - Telebirr gateway fee = 1%
 * - Driver net payout = Total - VAT - Platform Commission - Telebirr Fee
 */
export function calculateFare(
  category: VehicleCategory,
  distanceKm: number,
  durationMinutes: number
): FareCalculation {
  const tariff = TARIFFS[category] || TARIFFS.sedan;

  const distanceFare = Number((distanceKm * tariff.perKm).toFixed(2));
  const timeFare = Number((durationMinutes * tariff.perMinute).toFixed(2));
  const rawSubtotal = tariff.baseFare + distanceFare + timeFare;
  const subtotal = Number(Math.max(tariff.minFare, rawSubtotal).toFixed(2));

  // May 2026 VAT Regulation No. 570/2025: 15% VAT on the gross fare
  const vatRate = 0.15;
  const vatAmount = Number((subtotal * vatRate).toFixed(2));
  const totalFare = Number((subtotal + vatAmount).toFixed(2));

  // Founder Mandate Version 2.0: DRIVER SUBSCRIPTION MODEL
  // 0% per-trip commission charged to subscribed independent drivers!
  const isPartner = category.startsWith('partner_');
  const platformTakeRate = isPartner ? 0.15 : 0.00;
  const platformCommission = isPartner ? Number((subtotal * platformTakeRate).toFixed(2)) : 0.00;

  // Telebirr digital payment handling fee (~1%)
  const telebirrFee = Number((totalFare * 0.01).toFixed(2));

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

  return categories.map((cat) => {
    const tariff = TARIFFS[cat];
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
      partnerName: isAggregated ? (cat === 'partner_ride' ? 'RIDE (Hybrid)' : 'Feres') : undefined,
    };
  });
}
