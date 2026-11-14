import React, { useState } from 'react';
import {
  Car,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  X,
  User,
  Phone,
  FileText,
  CreditCard,
  DollarSign,
  Zap,
  Sparkles,
  Camera,
  Upload,
  AlertCircle,
  Truck,
} from 'lucide-react';
import { Language } from '../../i18n/translations';
import { VehicleCategory } from '@shared/types';
import { sounds } from '../../utils/audio';

interface DriverOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (driver: any) => void;
  language: Language;
}

export const DriverOnboardingModal: React.FC<DriverOnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  language,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1: Personal
  const [fullName, setFullName] = useState('Dawit Bekele');
  const [phone, setPhone] = useState('+251911445566');
  const [kebeleId, setKebeleId] = useState('ET-AA-BOL-99412');
  const [subcity, setSubcity] = useState('Bole Subcity, Addis Ababa');

  // Step 2: Vehicle
  const [vehicleCategory, setVehicleCategory] = useState<VehicleCategory>('sedan');
  const [vehicleMake, setVehicleMake] = useState('Toyota');
  const [vehicleModel, setVehicleModel] = useState('Corolla 2020');
  const [vehicleYear, setVehicleYear] = useState('2020');
  const [vehiclePlate, setVehiclePlate] = useState('ET-3-B44129');
  const [vehicleColor, setVehicleColor] = useState('Silver');

  // Step 3: KYC Documents Verification Status
  const [docLicenseVerified, setDocLicenseVerified] = useState(false);
  const [docLibriVerified, setDocLibriVerified] = useState(false);
  const [docInspectionVerified, setDocInspectionVerified] = useState(false);
  const [isVerifyingDocs, setIsVerifyingDocs] = useState(false);

  // Step 4: Subscription Plan
  const [selectedPlan, setSelectedPlan] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSimulateAiKyc = () => {
    setIsVerifyingDocs(true);
    sounds.playBeep(650, 'triangle', 0.2);
    setTimeout(() => {
      setDocLicenseVerified(true);
      setDocLibriVerified(true);
      setDocInspectionVerified(true);
      setIsVerifyingDocs(false);
      sounds.playPaymentSuccess();
    }, 1500);
  };

  const handleFinishDriverRegistration = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const driverId = `driver_reg_${Date.now()}`;
      const newDriver = {
        id: driverId,
        fullName,
        phone,
        vehicleMake,
        vehicleModel,
        vehicleYear: parseInt(vehicleYear, 10) || 2020,
        vehiclePlate,
        vehicleColor,
        vehicleCategory,
        licenseNumber: kebeleId,
        kycStatus: 'approved',
        isOnline: true,
        isBusy: false,
        currentLat: 8.995,
        currentLng: 38.788,
        heading: 90,
        rating: 5.0,
        totalRides: 0,
        walletBalanceEtb: 0,
        subscriptionStatus: 'active',
      };

      sounds.playPaymentSuccess();
      onComplete(newDriver);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col font-sans max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Car className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Driver Partner Onboarding</h3>
              <p className="text-[11px] text-slate-400">Step {step} of 5 • 0% Commission Subscription Registration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-slate-100 w-full flex">
          <div
            className="bg-amber-500 h-full transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          {/* STEP 1: Personal Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h4 className="font-bold text-sm text-slate-900">Personal & Identification Details</h4>
                <p className="text-slate-500 text-xs">
                  Enter your official legal name and contact phone number.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dawit Bekele"
                  className="w-full border border-slate-300 rounded-xl py-2 px-3 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ethiopian Mobile Number (Telebirr Linked)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+251 9..."
                  className="w-full border border-slate-300 rounded-xl py-2 px-3 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">National ID / Kebele Card Number</label>
                <input
                  type="text"
                  value={kebeleId}
                  onChange={(e) => setKebeleId(e.target.value)}
                  placeholder="ET-AA-..."
                  className="w-full border border-slate-300 rounded-xl py-2 px-3 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Operating City / Subcity</label>
                <input
                  type="text"
                  value={subcity}
                  onChange={(e) => setSubcity(e.target.value)}
                  placeholder="e.g. Bole Subcity, Addis Ababa"
                  className="w-full border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!fullName || !phone}
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <span>Continue to Vehicle Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: Vehicle Specs */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h4 className="font-bold text-sm text-slate-900">Vehicle Classification</h4>
                <p className="text-slate-500 text-xs">
                  Specify your vehicle category and plate registration number.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mobility Category</label>
                <select
                  value={vehicleCategory}
                  onChange={(e) => setVehicleCategory(e.target.value as VehicleCategory)}
                  className="w-full border border-slate-300 rounded-xl py-2 px-3 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="sedan">Standard Sedan (Corolla / Dzire / Vitz - 4 Seats)</option>
                  <option value="minivan">Minivan XL (Avanza / Noah - 7 Seats)</option>
                  <option value="comfort">Executive Comfort (Elantra / Camry / RAV4)</option>
                  <option value="delivery_moto">Express Motorcycle (Delivery Courier)</option>
                  <option value="delivery_van">Cargo Logistics Van (Heavy Bulk)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vehicle Make</label>
                  <input
                    type="text"
                    value={vehicleMake}
                    onChange={(e) => setVehicleMake(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl py-2 px-3 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Model & Year</label>
                  <input
                    type="text"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl py-2 px-3 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">License Plate No.</label>
                  <input
                    type="text"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    placeholder="ET-3-..."
                    className="w-full border border-slate-300 rounded-xl py-2 px-3 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vehicle Color</label>
                  <input
                    type="text"
                    value={vehicleColor}
                    onChange={(e) => setVehicleColor(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl py-2 px-3 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-50 transition"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span>Continue to Document KYC</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: AI Document Verification */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h4 className="font-bold text-sm text-slate-900">AI-Assisted Document KYC Verification</h4>
                <p className="text-slate-500 text-xs">
                  Automated OCR and hologram authenticity checking for Addis Ababa Transport compliance.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand-600" />
                    <div>
                      <div className="font-bold text-slate-800">Valid Driving License (Grade 3/Public)</div>
                      <div className="text-[10px] text-slate-500">Government issued driver permit</div>
                    </div>
                  </div>
                  {docLicenseVerified ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Verified
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded">Ready</span>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand-600" />
                    <div>
                      <div className="font-bold text-slate-800">Vehicle Libri (Ownership Certificate)</div>
                      <div className="text-[10px] text-slate-500">Matches registered plate number</div>
                    </div>
                  </div>
                  {docLibriVerified ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Verified
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded">Ready</span>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand-600" />
                    <div>
                      <div className="font-bold text-slate-800">Annual Technical Inspection (Bolo)</div>
                      <div className="text-[10px] text-slate-500">Roadworthiness certificate</div>
                    </div>
                  </div>
                  {docInspectionVerified ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Verified
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded">Ready</span>
                  )}
                </div>
              </div>

              {!docLicenseVerified ? (
                <button
                  type="button"
                  onClick={handleSimulateAiKyc}
                  disabled={isVerifyingDocs}
                  className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{isVerifyingDocs ? 'Scanning Holograms & Running OCR...' : 'Run Automated AI Verification'}</span>
                </button>
              ) : (
                <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-center font-bold text-xs flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>All documents scanned and verified compliant!</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-50 transition"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  disabled={!docLicenseVerified}
                  className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <span>Select Subscription Pass</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Subscription Plan Selection */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h4 className="font-bold text-sm text-slate-900">Choose 0% Commission Access Plan</h4>
                <p className="text-slate-500 text-xs">
                  Pay a predictable flat subscription. Keep 100% of every metered trip fare!
                </p>
              </div>

              <div className="space-y-2.5">
                {[
                  { id: 'daily', name: '24-Hour Pass', price: '50 ETB', desc: 'Flexible 24-hour unlimited dispatch' },
                  { id: 'weekly', name: '7-Day Flex Pass', price: '300 ETB', desc: '7 days unlimited trips • Most popular' },
                  { id: 'monthly', name: '30-Day Pro Pass', price: '1,000 ETB', desc: '30 days unlimited trips • Full-time career' },
                ].map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id as any)}
                    className={`p-3.5 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition ${
                      selectedPlan === plan.id
                        ? 'border-brand-500 bg-brand-50/50 text-slate-900'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs">{plan.name}</div>
                      <div className="text-[10px] text-slate-500">{plan.desc}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-sm text-brand-600">{plan.price}</div>
                      <div className="text-[9px] text-emerald-600 font-bold">0% Commission</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-50 transition"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span>Finalize & Activate</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Activation & Confirmation */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                </div>
                <h4 className="font-bold text-sm text-slate-900">Ready for Live Dispatch!</h4>
                <p className="text-slate-500 text-xs">
                  Review your summary before unlocking the in-cab driver console.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Driver:</span>
                  <strong className="text-slate-800">{fullName} ({phone})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Vehicle:</span>
                  <strong className="text-slate-800">{vehicleMake} {vehicleModel} • {vehiclePlate}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Selected Plan:</span>
                  <strong className="text-brand-600 uppercase">{selectedPlan} Pass (0% Comm)</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">KYC Status:</span>
                  <strong className="text-emerald-600">VERIFIED & APPROVED</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={handleFinishDriverRegistration}
                disabled={isLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{isLoading ? 'Activating Profile...' : 'Complete Registration & Go Online'}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
