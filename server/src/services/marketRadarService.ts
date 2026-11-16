/**
 * Chebelew Autonomous Market Radar Service
 * 
 * Provides algorithmic price comparison across Addis Ababa mobility providers
 * WITHOUT requiring private operator B2B APIs.
 * 
 * Tariffs are computed from verified public market benchmarks in Addis Ababa,
 * accounting for peak hour corridors, distance, duration, and platform commissions.
 */

export interface MarketOperatorComparison {
  operatorId: 'chebelew' | 'feres' | 'ride' | 'yango' | 'traditional_meter';
  operatorName: string;
  operatorNameAm: string;
  badge: string;
  estimatedFareEtb: number;
  driverTakeHomeEtb: number;
  commissionCutEtb: number;
  commissionRatePercent: number;
  etaMinutes: number;
  savingsVsChebelewEtb: number; // 0 for Chebelew, negative means Chebelew is cheaper
  isDirectDispatch: boolean;
  deepLinkScheme?: string;
  notes: string;
  notesAm: string;
}

export interface MarketRadarResult {
  distanceKm: number;
  durationMinutes: number;
  isPeakHour: boolean;
  chebelewFareEtb: number;
  maxSavingsEtb: number;
  comparisons: MarketOperatorComparison[];
  timestamp: string;
}

/**
 * Checks whether current Addis Ababa local time is in peak rush hour
 * (07:30 - 09:30 or 17:00 - 19:30 EAT)
 */
export function isAddisPeakHour(date = new Date()): boolean {
  // Addis Ababa is UTC+3
  const utcHours = date.getUTCHours();
  const eatHours = (utcHours + 3) % 24;
  const eatMinutes = date.getUTCMinutes();
  const totalMin = eatHours * 60 + eatMinutes;

  // Morning rush: 7:30 (450m) to 9:30 (570m)
  const isMorning = totalMin >= 450 && totalMin <= 570;
  // Evening rush: 17:00 (1020m) to 19:30 (1170m)
  const isEvening = totalMin >= 1020 && totalMin <= 1170;

  return isMorning || isEvening;
}

/**
 * Compute real-time algorithmic fare comparison for a trip
 */
export function computeMarketRadar(distanceKm: number, durationMinutes: number): MarketRadarResult {
  const peak = isAddisPeakHour();
  const peakMultiplier = peak ? 1.2 : 1.0;

  // 1. Chebelew Direct (0% Driver Commission)
  // Base 70 ETB + 14 ETB/km + 3 ETB/min, 15% statutory VAT included
  const chebelewSubtotal = Math.max(110, 70 + distanceKm * 14 + durationMinutes * 3);
  const chebelewFare = Math.round(chebelewSubtotal * 1.15);
  const chebelewDriverTakeHome = chebelewSubtotal; // 0% commission!
  const chebelewCommission = 0;

  // 2. Feres Benchmark (~15% Commission)
  // Base 100 ETB + 18.5 ETB/km + 3.5 ETB/min, peak surge
  const feresSubtotal = Math.max(130, (100 + distanceKm * 18.5 + durationMinutes * 3.5) * (peak ? 1.15 : 1.0));
  const feresFare = Math.round(feresSubtotal * 1.15);
  const feresCommission = Math.round(feresSubtotal * 0.15);
  const feresDriverTakeHome = feresSubtotal - feresCommission;

  // 3. RIDE Benchmark (~18% Commission)
  // Base 120 ETB + 21 ETB/km + 4.0 ETB/min
  const rideSubtotal = Math.max(150, (120 + distanceKm * 21 + durationMinutes * 4.0) * (peak ? 1.20 : 1.0));
  const rideFare = Math.round(rideSubtotal * 1.15);
  const rideCommission = Math.round(rideSubtotal * 0.18);
  const rideDriverTakeHome = rideSubtotal - rideCommission;

  // 4. Yango Benchmark (Dynamic Pricing ~12% Commission)
  // Base 80 ETB + 16 ETB/km + 3.5 ETB/min, aggressive peak multiplier
  const yangoSubtotal = Math.max(120, (80 + distanceKm * 16 + durationMinutes * 3.5) * peakMultiplier);
  const yangoFare = Math.round(yangoSubtotal * 1.15);
  const yangoCommission = Math.round(yangoSubtotal * 0.12);
  const yangoDriverTakeHome = yangoSubtotal - yangoCommission;

  // 5. Traditional Blue & White Meter Taxi (Street cash negotiation benchmark)
  const meterFare = Math.round(Math.max(200, 150 + distanceKm * 25));
  const meterDriverTakeHome = meterFare;

  const comparisons: MarketOperatorComparison[] = [
    {
      operatorId: 'chebelew',
      operatorName: 'Chebelew Direct',
      operatorNameAm: 'ቼበለው ቀጥታ',
      badge: '0% COMMISSION • BEST VALUE',
      estimatedFareEtb: chebelewFare,
      driverTakeHomeEtb: chebelewDriverTakeHome,
      commissionCutEtb: chebelewCommission,
      commissionRatePercent: 0,
      etaMinutes: 3,
      savingsVsChebelewEtb: 0,
      isDirectDispatch: true,
      notes: 'Driver keeps 100% of trip fare under daily flat pass. Guaranteed fastest local dispatch.',
      notesAm: 'አሽከርካሪው የጉዞውን ሙሉ 100% ገቢ ይይዛል። ፈጣን እና አስተማማኝ ጉዞ።',
    },
    {
      operatorId: 'feres',
      operatorName: 'Feres (Estimated)',
      operatorNameAm: 'ፈረስ (የገበያ ግምት)',
      badge: '15% OPERATOR COMMISSION',
      estimatedFareEtb: feresFare,
      driverTakeHomeEtb: feresDriverTakeHome,
      commissionCutEtb: feresCommission,
      commissionRatePercent: 15,
      etaMinutes: 5,
      savingsVsChebelewEtb: feresFare - chebelewFare,
      isDirectDispatch: false,
      deepLinkScheme: 'feres://ride',
      notes: 'Third-party market rate. Operator deducts ~15% commission from driver.',
      notesAm: 'የሶስተኛ ወገን የታክሲ ዋጋ። 15% ኮሚሽን ከአሽከርካሪው ይቀነሳል።',
    },
    {
      operatorId: 'ride',
      operatorName: 'RIDE 8294 (Estimated)',
      operatorNameAm: 'ራይድ 8294 (የገበያ ግምት)',
      badge: '18% OPERATOR COMMISSION',
      estimatedFareEtb: rideFare,
      driverTakeHomeEtb: rideDriverTakeHome,
      commissionCutEtb: rideCommission,
      commissionRatePercent: 18,
      etaMinutes: 6,
      savingsVsChebelewEtb: rideFare - chebelewFare,
      isDirectDispatch: false,
      deepLinkScheme: 'tel:8294',
      notes: 'Traditional operator rate. Substantially higher per-km fee with ~18% operator commission.',
      notesAm: 'የባህላዊ ራይድ ዋጋ። ከፍተኛ የኪሎሜትር ተመን ከ18% ኮሚሽን ጋር።',
    },
    {
      operatorId: 'yango',
      operatorName: 'Yango (Estimated)',
      operatorNameAm: 'ያንጎ (የገበያ ግምት)',
      badge: peak ? 'SURGE SURCHARGE ACTIVE' : 'DYNAMIC PRICING',
      estimatedFareEtb: yangoFare,
      driverTakeHomeEtb: yangoDriverTakeHome,
      commissionCutEtb: yangoCommission,
      commissionRatePercent: 12,
      etaMinutes: 4,
      savingsVsChebelewEtb: yangoFare - chebelewFare,
      isDirectDispatch: false,
      deepLinkScheme: 'yango://order',
      notes: 'Dynamic algorithmic pricing. Subject to peak surge fluctuations.',
      notesAm: 'በተለዋዋጭ አልጎሪዝም የሚሰራ ተመን። በስራ መግቢያና መውጫ ሰዓት ይጨምራል።',
    },
    {
      operatorId: 'traditional_meter',
      operatorName: 'Street Meter Taxi',
      operatorNameAm: 'የመንገድ ላይ ሰማያዊ ታክሲ',
      badge: 'UNMETERED CASH NEGOTIATION',
      estimatedFareEtb: meterFare,
      driverTakeHomeEtb: meterDriverTakeHome,
      commissionCutEtb: 0,
      commissionRatePercent: 0,
      etaMinutes: 8,
      savingsVsChebelewEtb: meterFare - chebelewFare,
      isDirectDispatch: false,
      notes: 'Cash street hail. Requires verbal negotiation without fixed app guarantees.',
      notesAm: 'የመንገድ ላይ የዋጋ ድርድር ያለ የሞባይል መተግበሪያ ዋስትና።',
    },
  ];

  const maxSavings = Math.max(...comparisons.map((c) => c.savingsVsChebelewEtb));

  return {
    distanceKm,
    durationMinutes,
    isPeakHour: peak,
    chebelewFareEtb: chebelewFare,
    maxSavingsEtb: Math.max(0, maxSavings),
    comparisons,
    timestamp: new Date().toISOString(),
  };
}
