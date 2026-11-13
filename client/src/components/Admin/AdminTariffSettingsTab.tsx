import React, { useState, useEffect } from 'react';
import {
  Sliders,
  DollarSign,
  ShieldCheck,
  Radio,
  Clock,
  Car,
  Truck,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Calculator,
  Percent,
  PhoneCall,
  Sparkles,
  Zap,
} from 'lucide-react';
import { TariffRate, SystemSettings, VehicleCategory } from '@shared/types';

export const AdminTariffSettingsTab: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'tariffs' | 'regulatory' | 'dispatch' | 'safety' | 'subscriptions'>('tariffs');
  const [selectedCategory, setSelectedCategory] = useState<VehicleCategory>('sedan');

  const [tariffs, setTariffs] = useState<Record<string, TariffRate>>({});
  const [settings, setSettings] = useState<SystemSettings>({
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
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Live Simulator State
  const [simDistanceKm, setSimDistanceKm] = useState(8.5);
  const [simDurationMin, setSimDurationMin] = useState(22);
  const [simApplySurge, setSimApplySurge] = useState<'none' | 'night' | 'peak'>('none');
  const [simIsAirport, setSimIsAirport] = useState(false);

  // Load tariffs and settings
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [tRes, sRes] = await Promise.all([
        fetch('/api/admin/tariffs').then((r) => r.json()),
        fetch('/api/admin/settings').then((r) => r.json()),
      ]);

      if (tRes.tariffs) setTariffs(tRes.tariffs);
      if (sRes.settings) setSettings(sRes.settings);
    } catch (err) {
      console.error('Failed to load admin tariff data:', err);
      setStatusMessage({ type: 'error', text: 'Failed to load live settings from server.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTariffChange = (cat: VehicleCategory, field: keyof TariffRate, value: any) => {
    setTariffs((prev) => {
      const curr = prev[cat] || ({} as TariffRate);
      return {
        ...prev,
        [cat]: {
          ...curr,
          [field]: value,
        },
      };
    });
  };

  const handleSettingChange = (field: keyof SystemSettings, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const [tRes, sRes] = await Promise.all([
        fetch('/api/admin/tariffs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tariffs }),
        }).then((r) => r.json()),
        fetch('/api/admin/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ settings }),
        }).then((r) => r.json()),
      ]);

      if (tRes.tariffs) setTariffs(tRes.tariffs);
      if (sRes.settings) setSettings(sRes.settings);

      setStatusMessage({
        type: 'success',
        text: 'All tariff matrices, regulatory rules, and operational parameters saved successfully to SQLite!',
      });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Error saving settings to server.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    setIsSaving(true);
    setShowResetConfirm(false);
    try {
      const res = await fetch('/api/admin/tariffs/reset', { method: 'POST' }).then((r) => r.json());
      if (res.tariffs) setTariffs(res.tariffs);
      setStatusMessage({
        type: 'success',
        text: 'Tariffs successfully restored to statutory baseline defaults.',
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Error resetting tariffs to defaults.' });
    } finally {
      setIsSaving(false);
    }
  };

  const currentTariff = tariffs[selectedCategory] || {
    baseFare: 70,
    perKm: 14,
    perMinute: 3,
    minFare: 110,
    waitingPerMinute: 2.5,
    nightMultiplier: 1.25,
    peakMultiplier: 1.15,
    airportSurcharge: 50,
    cancellationFee: 50,
    capacity: 4,
    displayName: 'Sedan Standard',
    displayNameAm: 'ሴዳን መደበኛ',
    description: 'Toyota Corolla / Vitz',
    descriptionAm: 'ቶዮታ ኮሮላ / ቪትዝ',
  };

  // Live Simulator Calculation
  const distanceCost = simDistanceKm * (currentTariff.perKm || 0);
  const timeCost = simDurationMin * (currentTariff.perMinute || 0);
  let rawSubtotal = (currentTariff.baseFare || 0) + distanceCost + timeCost;

  if (simApplySurge === 'night') {
    rawSubtotal *= currentTariff.nightMultiplier || 1.25;
  } else if (simApplySurge === 'peak') {
    rawSubtotal *= currentTariff.peakMultiplier || 1.15;
  }

  if (simIsAirport) {
    rawSubtotal += currentTariff.airportSurcharge || 50;
  }

  const subtotal = Math.max(currentTariff.minFare || 0, rawSubtotal);
  const vatRate = settings.vatRate || 0.15;
  const vatAmount = subtotal * vatRate;
  const totalFare = subtotal + vatAmount;

  const isPartner = selectedCategory.startsWith('partner_');
  const platformTakeRate = isPartner ? 0.15 : (settings.driverCommissionPercent || 0) / 100;
  const platformCommission = subtotal * platformTakeRate;
  const telebirrFee = totalFare * ((settings.telebirrGatewayFeePercent || 1.0) / 100);
  const driverNetEarnings = subtotal - platformCommission;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-brand-50 text-brand-600 rounded-xl">
              <Sliders className="w-5 h-5 text-brand-600" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Dynamic Tariff Engine & Flexible Operations</h2>
              <p className="text-xs text-slate-500">
                Live configuration of fleet tariffs, regulatory VAT parameters, dispatch search radius, and driver subscription plans.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            Reset Defaults
          </button>
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving Changes...' : 'Save All Parameters'}
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span className="font-semibold">{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-600 text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Pills */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveSection('tariffs')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition ${
            activeSection === 'tariffs'
              ? 'bg-brand-500 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Car className="w-4 h-4" />
          Vehicle Class Tariffs
        </button>
        <button
          onClick={() => setActiveSection('regulatory')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition ${
            activeSection === 'regulatory'
              ? 'bg-brand-500 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Percent className="w-4 h-4" />
          Tax, VAT & 0% Mandate
        </button>
        <button
          onClick={() => setActiveSection('dispatch')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition ${
            activeSection === 'dispatch'
              ? 'bg-brand-500 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Radio className="w-4 h-4" />
          Dispatch & Proximity
        </button>
        <button
          onClick={() => setActiveSection('subscriptions')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition ${
            activeSection === 'subscriptions'
              ? 'bg-brand-500 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Driver Subscription Passes
        </button>
        <button
          onClick={() => setActiveSection('safety')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition ${
            activeSection === 'safety'
              ? 'bg-brand-500 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <PhoneCall className="w-4 h-4" />
          Emergency & Hotlines
        </button>
      </div>

      {/* SECTION 1: VEHICLE TARIFF MATRICES & SIMULATOR */}
      {activeSection === 'tariffs' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form & Category Tabs */}
          <div className="lg:col-span-7 space-y-6">
            {/* Category Selector */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-3">
              <label className="text-xs font-bold text-slate-700 block">Select Mobility / Delivery Tier:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'sedan', label: 'Sedan Standard', icon: Car },
                  { id: 'minivan', label: 'Minivan (XL)', icon: Car },
                  { id: 'comfort', label: 'Comfort Executive', icon: Sparkles },
                  { id: 'delivery_moto', label: 'Moto Express', icon: Zap },
                  { id: 'delivery_van', label: 'Cargo Van', icon: Truck },
                  { id: 'partner_ride', label: 'Partner: Meter Taxi', icon: ShieldCheck },
                  { id: 'partner_feres', label: 'Partner: Taxi Coop', icon: ShieldCheck },
                ].map((tier) => {
                  const Icon = tier.icon;
                  return (
                    <button
                      key={tier.id}
                      onClick={() => setSelectedCategory(tier.id as VehicleCategory)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-semibold transition ${
                        selectedCategory === tier.id
                          ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-100'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${selectedCategory === tier.id ? 'text-brand-600' : 'text-slate-400'}`} />
                      <span className="truncate">{tier.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rate Tuning Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
              <div className="border-b pb-3 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Tariff Parameters: {currentTariff.displayName}
                  </h3>
                  <p className="text-xs text-slate-500">{currentTariff.description}</p>
                </div>
                <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
                  Tier: {selectedCategory}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Base Flagdrop Fare (ETB)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      value={currentTariff.baseFare}
                      onChange={(e) => handleTariffChange(selectedCategory, 'baseFare', parseFloat(e.target.value) || 0)}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 pr-12 text-slate-800 font-mono font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                    <span className="absolute right-3 top-2 text-slate-400 font-mono">ETB</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Charged immediately upon dispatch arrival</span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Per-Kilometer Distance Rate (ETB/km)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      value={currentTariff.perKm}
                      onChange={(e) => handleTariffChange(selectedCategory, 'perKm', parseFloat(e.target.value) || 0)}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 pr-16 text-slate-800 font-mono font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                    <span className="absolute right-3 top-2 text-slate-400 font-mono">ETB/km</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Road distance traveled</span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Per-Minute Time Rate (ETB/min)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={currentTariff.perMinute}
                      onChange={(e) => handleTariffChange(selectedCategory, 'perMinute', parseFloat(e.target.value) || 0)}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 pr-16 text-slate-800 font-mono font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                    <span className="absolute right-3 top-2 text-slate-400 font-mono">ETB/min</span>
                  </div>
                  <span className="text-[10px] text-slate-400">In-transit trip duration rate</span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Minimum Floor Fare (ETB)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      value={currentTariff.minFare}
                      onChange={(e) => handleTariffChange(selectedCategory, 'minFare', parseFloat(e.target.value) || 0)}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 pr-12 text-slate-800 font-mono font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                    <span className="absolute right-3 top-2 text-slate-400 font-mono">ETB</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Absolute minimum charge even for short trips</span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pickup Waiting Rate (ETB/min)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      value={currentTariff.waitingPerMinute ?? 2.5}
                      onChange={(e) => handleTariffChange(selectedCategory, 'waitingPerMinute', parseFloat(e.target.value) || 0)}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 pr-16 text-slate-800 font-mono font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                    <span className="absolute right-3 top-2 text-slate-400 font-mono">ETB/min</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Applies after free grace waiting time</span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Passenger / Seat Capacity</label>
                  <input
                    type="number"
                    value={currentTariff.capacity || 4}
                    onChange={(e) => handleTariffChange(selectedCategory, 'capacity', parseInt(e.target.value, 10) || 1)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Max passengers allowed in vehicle</span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Night Multiplier (x)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={currentTariff.nightMultiplier ?? 1.25}
                    onChange={(e) => handleTariffChange(selectedCategory, 'nightMultiplier', parseFloat(e.target.value) || 1)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Applies 10:00 PM – 5:30 AM (e.g. 1.25 = +25%)</span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Peak Hour Traffic Multiplier (x)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={currentTariff.peakMultiplier ?? 1.15}
                    onChange={(e) => handleTariffChange(selectedCategory, 'peakMultiplier', parseFloat(e.target.value) || 1)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Applies during morning & evening rush hours</span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Airport Surcharge (ETB)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="5"
                      value={currentTariff.airportSurcharge ?? 50}
                      onChange={(e) => handleTariffChange(selectedCategory, 'airportSurcharge', parseFloat(e.target.value) || 0)}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 pr-12 text-slate-800 font-mono font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                    <span className="absolute right-3 top-2 text-slate-400 font-mono">ETB</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Bole Int'l Airport (ADD) parking & security fee</span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Passenger Cancellation Fee (ETB)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="5"
                      value={currentTariff.cancellationFee ?? 50}
                      onChange={(e) => handleTariffChange(selectedCategory, 'cancellationFee', parseFloat(e.target.value) || 0)}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 pr-12 text-slate-800 font-mono font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                    <span className="absolute right-3 top-2 text-slate-400 font-mono">ETB</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Compensates driver for deadhead miles</span>
                </div>
              </div>

              {/* Localization Labels */}
              <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Display Label (English)</label>
                  <input
                    type="text"
                    value={currentTariff.displayName}
                    onChange={(e) => handleTariffChange(selectedCategory, 'displayName', e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Display Label (Amharic ቼበለው)</label>
                  <input
                    type="text"
                    value={currentTariff.displayNameAm}
                    onChange={(e) => handleTariffChange(selectedCategory, 'displayNameAm', e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none font-sans"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Fare Preview Calculator Sandbox */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-lg p-6 space-y-5 border border-slate-700">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-brand-400" />
                  <h3 className="font-bold text-sm text-white">Live Fare Formula Sandbox</h3>
                </div>
                <span className="text-[10px] bg-brand-500/20 text-brand-300 border border-brand-500/30 px-2 py-0.5 rounded font-mono">
                  Live Preview
                </span>
              </div>

              <div className="space-y-4 text-xs">
                {/* Distance Slider */}
                <div>
                  <div className="flex justify-between font-mono mb-1 text-slate-300">
                    <span>Trip Distance:</span>
                    <strong className="text-white text-sm">{simDistanceKm} km</strong>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="45"
                    step="0.5"
                    value={simDistanceKm}
                    onChange={(e) => setSimDistanceKm(parseFloat(e.target.value))}
                    className="w-full accent-brand-400"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>1 km (Piazza)</span>
                    <span>20 km (Bole)</span>
                    <span>45 km (Bishoftu Rd)</span>
                  </div>
                </div>

                {/* Duration Slider */}
                <div>
                  <div className="flex justify-between font-mono mb-1 text-slate-300">
                    <span>Estimated Duration:</span>
                    <strong className="text-white text-sm">{simDurationMin} mins</strong>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="90"
                    step="1"
                    value={simDurationMin}
                    onChange={(e) => setSimDurationMin(parseInt(e.target.value, 10))}
                    className="w-full accent-brand-400"
                  />
                </div>

                {/* Surge & Airport Toggles */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Surge Multiplier</label>
                    <select
                      value={simApplySurge}
                      onChange={(e) => setSimApplySurge(e.target.value as any)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    >
                      <option value="none">Normal (1.0x)</option>
                      <option value="night">Night Time ({currentTariff.nightMultiplier}x)</option>
                      <option value="peak">Peak Traffic ({currentTariff.peakMultiplier}x)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Terminal Route</label>
                    <button
                      onClick={() => setSimIsAirport(!simIsAirport)}
                      className={`w-full py-1.5 px-2 rounded-xl text-xs font-semibold border transition ${
                        simIsAirport
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {simIsAirport ? 'Airport (+50 ETB)' : 'Standard City'}
                    </button>
                  </div>
                </div>

                {/* Transparent Financial Calculation Breakdown */}
                <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between text-slate-400">
                    <span>Base Flagdrop:</span>
                    <span>{currentTariff.baseFare} ETB</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Distance ({simDistanceKm} km × {currentTariff.perKm} ETB):</span>
                    <span>{distanceCost.toFixed(2)} ETB</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Time ({simDurationMin} min × {currentTariff.perMinute} ETB):</span>
                    <span>{timeCost.toFixed(2)} ETB</span>
                  </div>
                  {simIsAirport && (
                    <div className="flex justify-between text-amber-400">
                      <span>Airport Surcharge:</span>
                      <span>+{currentTariff.airportSurcharge} ETB</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-800 pt-1 text-slate-300 font-bold">
                    <span>Subtotal Fare:</span>
                    <span>{subtotal.toFixed(2)} ETB</span>
                  </div>
                  <div className="flex justify-between text-sky-400">
                    <span>FDRE VAT ({(vatRate * 100).toFixed(0)}% Reg. 570/2025):</span>
                    <span>+{vatAmount.toFixed(2)} ETB</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-700 pt-2 text-sm text-emerald-400 font-bold">
                    <span>Passenger Total Payable:</span>
                    <span>{totalFare.toFixed(2)} ETB</span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-dashed border-slate-800 space-y-1 text-[10px]">
                    <div className="flex justify-between text-emerald-300">
                      <span>Subscribed Driver Payout:</span>
                      <strong className="font-bold">{driverNetEarnings.toFixed(2)} ETB (100% of ride!)</strong>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Platform Trip Commission:</span>
                      <span>{platformCommission.toFixed(2)} ETB (0% Mandate)</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Telebirr 1% Gateway Fee:</span>
                      <span>{telebirrFee.toFixed(2)} ETB</span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Compliant with Addis Ababa Transport Bureau & May 2026 VAT Reg 570/2025.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: TAX, REGULATORY & 0% COMMISSION MANDATE */}
      {activeSection === 'regulatory' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
            <div className="border-b pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Percent className="w-5 h-5 text-brand-500" />
                Value Added Tax & Platform Commission Policy
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Statutory taxation compliance with FDRE Ministry of Revenues and Chebelew's zero-commission mandate.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Statutory VAT Rate (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={(settings.vatRate * 100).toFixed(1)}
                    onChange={(e) => handleSettingChange('vatRate', (parseFloat(e.target.value) || 0) / 100)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 pr-10 text-slate-800 font-mono font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 font-mono">%</span>
                </div>
                <span className="text-[10px] text-slate-400">15.0% standard Ethiopian VAT rate</span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Driver Trip Commission Take Rate (%) (Founder Mandate)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    value={settings.driverCommissionPercent}
                    onChange={(e) => handleSettingChange('driverCommissionPercent', parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 pr-10 text-slate-800 font-mono font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 font-mono">%</span>
                </div>
                <span className="text-[10px] text-emerald-600 font-semibold">
                  Default 0%: Drivers keep 100% of ride revenue under daily/weekly subscription model!
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tax Authority Official Name</label>
                <input
                  type="text"
                  value={settings.taxAuthorityName}
                  onChange={(e) => handleSettingChange('taxAuthorityName', e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Telebirr Gateway Processing Fee (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={settings.telebirrGatewayFeePercent}
                    onChange={(e) => handleSettingChange('telebirrGatewayFeePercent', parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 pr-10 text-slate-800 font-mono font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 font-mono">%</span>
                </div>
                <span className="text-[10px] text-slate-400">Ethio telecom gateway settlement deduction</span>
              </div>

              <div className="md:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">VAT Statutory Regulation Reference</label>
                <input
                  type="text"
                  value={settings.vatRegulationReference}
                  onChange={(e) => handleSettingChange('vatRegulationReference', e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400">
                  Printed on passenger electronic fiscal receipts and Ministry of Revenues audit exports.
                </span>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Chebelew 0% Per-Trip Commission Guarantee
              </div>
              <p>
                Unlike traditional ride-hailing aggregators that extract 15% to 25% of every single trip, Chebelew's
                monetization is strictly based on flat periodic driver subscription access passes. Setting driver
                commission to 0% ensures 100% of the calculated trip subtotal is remitted directly to the driver's
                Telebirr wallet.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: DISPATCH & PROXIMITY OPERATIONAL PARAMETERS */}
      {activeSection === 'dispatch' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
            <div className="border-b pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Radio className="w-5 h-5 text-brand-500" />
                Automated Dispatch & Proximity Radius Tuning
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure auto-matching algorithms, radius boundaries, acceptance timeouts, and grace periods.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Max Auto-Dispatch Search Radius (km)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    value={settings.maxDispatchRadiusKm}
                    onChange={(e) => handleSettingChange('maxDispatchRadiusKm', parseFloat(e.target.value) || 1)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 pr-12 text-slate-800 font-mono font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 font-mono">km</span>
                </div>
                <span className="text-[10px] text-slate-400">Search window for nearby available drivers</span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Driver Acceptance Countdown Timeout (sec)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={settings.driverAcceptanceTimeoutSec}
                    onChange={(e) => handleSettingChange('driverAcceptanceTimeoutSec', parseInt(e.target.value, 10) || 15)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 pr-12 text-slate-800 font-mono font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 font-mono">sec</span>
                </div>
                <span className="text-[10px] text-slate-400">Seconds before offer expires and passes to next driver</span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Passenger Free Cancellation Window (min)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={settings.freeCancellationWindowMin}
                    onChange={(e) => handleSettingChange('freeCancellationWindowMin', parseInt(e.target.value, 10) || 1)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 pr-12 text-slate-800 font-mono font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 font-mono">min</span>
                </div>
                <span className="text-[10px] text-slate-400">Minutes after driver dispatch before cancellation fee applies</span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Free Pickup Waiting Time (min)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={settings.driverFreeWaitTimeMin}
                    onChange={(e) => handleSettingChange('driverFreeWaitTimeMin', parseInt(e.target.value, 10) || 2)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 pr-12 text-slate-800 font-mono font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 font-mono">min</span>
                </div>
                <span className="text-[10px] text-slate-400">Driver waits at pickup before per-minute wait fee starts</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: DRIVER SUBSCRIPTION PRICING */}
      {activeSection === 'subscriptions' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
            <div className="border-b pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-brand-500" />
                Driver Subscription Access Pass Pricing
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Periodic subscription fees for independent drivers to access unlimited ride offers with 0% trip commission.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800">24-Hour Daily Pass</div>
                <div className="relative">
                  <input
                    type="number"
                    value={settings.subDailyPriceEtb}
                    onChange={(e) => handleSettingChange('subDailyPriceEtb', parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded-lg p-2 pr-12 font-mono font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <span className="absolute right-2.5 top-2 text-slate-400 font-mono text-[11px]">ETB</span>
                </div>
                <span className="text-[10px] text-slate-400 block">Single-day flexible access</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800">7-Day Weekly Flex Pass</div>
                <div className="relative">
                  <input
                    type="number"
                    value={settings.subWeeklyPriceEtb}
                    onChange={(e) => handleSettingChange('subWeeklyPriceEtb', parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded-lg p-2 pr-12 font-mono font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <span className="absolute right-2.5 top-2 text-slate-400 font-mono text-[11px]">ETB</span>
                </div>
                <span className="text-[10px] text-slate-400 block">Weekly auto-renewal tier</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800">30-Day Monthly Pro Pass</div>
                <div className="relative">
                  <input
                    type="number"
                    value={settings.subMonthlyPriceEtb}
                    onChange={(e) => handleSettingChange('subMonthlyPriceEtb', parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded-lg p-2 pr-12 font-mono font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <span className="absolute right-2.5 top-2 text-slate-400 font-mono text-[11px]">ETB</span>
                </div>
                <span className="text-[10px] text-slate-400 block">Most popular full-time driver tier</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800">90-Day Quarterly Elite</div>
                <div className="relative">
                  <input
                    type="number"
                    value={settings.subQuarterlyPriceEtb}
                    onChange={(e) => handleSettingChange('subQuarterlyPriceEtb', parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded-lg p-2 pr-12 font-mono font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <span className="absolute right-2.5 top-2 text-slate-400 font-mono text-[11px]">ETB</span>
                </div>
                <span className="text-[10px] text-slate-400 block">10% discount bundled quarter</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800">365-Day Annual VIP</div>
                <div className="relative">
                  <input
                    type="number"
                    value={settings.subYearlyPriceEtb}
                    onChange={(e) => handleSettingChange('subYearlyPriceEtb', parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded-lg p-2 pr-12 font-mono font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <span className="absolute right-2.5 top-2 text-slate-400 font-mono text-[11px]">ETB</span>
                </div>
                <span className="text-[10px] text-slate-400 block">20% discount annual fleet loyalty</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800">Expiry Grace Period</div>
                <div className="relative">
                  <input
                    type="number"
                    value={settings.subGracePeriodHours}
                    onChange={(e) => handleSettingChange('subGracePeriodHours', parseInt(e.target.value, 10) || 12)}
                    className="w-full border border-slate-300 rounded-lg p-2 pr-14 font-mono font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <span className="absolute right-2.5 top-2 text-slate-400 font-mono text-[11px]">Hours</span>
                </div>
                <span className="text-[10px] text-slate-400 block">Hours allowed to complete trips after expiry</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: SAFETY & EMERGENCY HOTLINES */}
      {activeSection === 'safety' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
            <div className="border-b pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-brand-500" />
                Emergency Services & Support Hotlines
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Dialing numbers triggered during in-app SOS incidents and rider support escalation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Federal Police Emergency Hotline</label>
                <input
                  type="text"
                  value={settings.emergencyPoliceHotline}
                  onChange={(e) => handleSettingChange('emergencyPoliceHotline', e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400">Default: 991 (Federal Police)</span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Chebelew 24/7 Call Center Dispatch</label>
                <input
                  type="text"
                  value={settings.customerSupportHotline}
                  onChange={(e) => handleSettingChange('customerSupportHotline', e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400">Default: 9922 (Chebelew Dispatch)</span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Emergency Medical / Ambulance</label>
                <input
                  type="text"
                  value={settings.ambulanceHotline}
                  onChange={(e) => handleSettingChange('ambulanceHotline', e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400">Default: 907 (Addis Ababa Ambulance)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertCircle className="w-6 h-6" />
              <h4 className="font-bold text-base text-slate-800">Reset Tariffs to Defaults?</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will overwrite all custom rates for Sedan, Minivan, Comfort, Motorcycle, Cargo, and Partner Fleets
              with the statutory Addis Ababa Transport Bureau baseline rates. This action takes effect immediately.
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl border text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleResetDefaults}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
