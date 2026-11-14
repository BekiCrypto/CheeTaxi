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
  Plane,
  Award,
  Lock,
  Eye,
  Check,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';
import { Language } from '../../i18n/translations';
import { VehicleCategory, OperatorType } from '@shared/types';
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

  // Step 1: Operator Classification & Personal Details
  const [operatorType, setOperatorType] = useState<OperatorType>('city_driver');
  const [fullName, setFullName] = useState('Dawit Bekele');
  const [phone, setPhone] = useState('+251911445566');
  const [faydaId, setFaydaId] = useState('ET-FIN-9921-4451-2290');
  const [subcity, setSubcity] = useState('Bole Subcity, Addis Ababa');

  // Step 2: Vehicle & Airport Badges
  const [vehicleCategory, setVehicleCategory] = useState<VehicleCategory>('sedan');
  const [vehicleMake, setVehicleMake] = useState('Toyota');
  const [vehicleModel, setVehicleModel] = useState('Corolla 2020');
  const [vehicleYear, setVehicleYear] = useState('2020');
  const [vehiclePlate, setVehiclePlate] = useState('ET-3-B44129');
  const [vehicleColor, setVehicleColor] = useState('Silver');
  const [airportBadgeNumber, setAirportBadgeNumber] = useState('ADD-BOLE-SEC-8841');

  // Step 3: Guardrailed AI Document Processing
  const [activeDocScanning, setActiveDocScanning] = useState<'license' | 'libri' | 'bolo' | 'airport_badge' | 'fayda'>('license');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStepName, setScanStepName] = useState<string>('');
  const [docLicenseVerified, setDocLicenseVerified] = useState(false);
  const [docLibriVerified, setDocLibriVerified] = useState(false);
  const [docBoloVerified, setDocBoloVerified] = useState(false);
  const [docAirportBadgeVerified, setDocAirportBadgeVerified] = useState(false);
  const [docFaydaVerified, setDocFaydaVerified] = useState(false);
  const [aiConfidenceScore, setAiConfidenceScore] = useState(0);

  // Step 4: 0% Commission Subscription Pass
  const [selectedPlan, setSelectedPlan] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Real-Time Self-Assisted AI Document Scanner Simulation
  const handleScanDocument = (docType: 'license' | 'libri' | 'bolo' | 'airport_badge' | 'fayda') => {
    setActiveDocScanning(docType);
    setIsScanning(true);
    setScanStepName('Aligning document corners and detecting INSA barcode...');
    sounds.playBeep(600, 'triangle', 0.15);

    setTimeout(() => {
      setScanStepName('Validating Federal Transport Authority seal & watermark...');
      sounds.playBeep(750, 'sine', 0.15);
    }, 700);

    setTimeout(() => {
      setScanStepName('Anti-tamper optical character recognition match: 98.6%...');
      sounds.playBeep(900, 'triangle', 0.15);
    }, 1400);

    setTimeout(() => {
      setIsScanning(false);
      setScanStepName('');
      sounds.playPaymentSuccess();

      if (docType === 'license') setDocLicenseVerified(true);
      if (docType === 'libri') setDocLibriVerified(true);
      if (docType === 'bolo') setDocBoloVerified(true);
      if (docType === 'airport_badge') setDocAirportBadgeVerified(true);
      if (docType === 'fayda') setDocFaydaVerified(true);

      setAiConfidenceScore((prev) => Math.min(prev + 24.5, 98.5));
    }, 2100);
  };

  const handleRunFullSelfAssistedScan = () => {
    setIsScanning(true);
    setScanStepName('Processing all 4 Ethiopian regulatory documents in batch...');
    sounds.playBeep(700, 'sine', 0.3);

    setTimeout(() => {
      setDocLicenseVerified(true);
      setDocLibriVerified(true);
      setDocBoloVerified(true);
      setDocFaydaVerified(true);
      if (operatorType === 'airport_flight_operator') {
        setDocAirportBadgeVerified(true);
      }
      setAiConfidenceScore(98.8);
      setIsScanning(false);
      setScanStepName('');
      sounds.playPaymentSuccess();
    }, 1800);
  };

  const handleFinishDriverRegistration = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const driverId = `driver_reg_${Date.now()}`;
      const isQualified = aiConfidenceScore >= 90;

      const newDriverPayload = {
        id: driverId,
        fullName,
        phone,
        operatorType,
        faydaId,
        airportBadgeNumber: operatorType === 'airport_flight_operator' ? airportBadgeNumber : undefined,
        vehicleMake,
        vehicleModel,
        vehicleYear: parseInt(vehicleYear, 10) || 2020,
        vehiclePlate,
        vehicleColor,
        vehicleCategory,
        licenseNumber: `AA-DL-${Math.floor(10000 + Math.random() * 90000)}`,
        kycStatus: isQualified ? 'approved' : 'pending',
        isOnline: isQualified,
        isBusy: false,
        currentLat: 8.995,
        currentLng: 38.788,
        heading: 90,
        rating: 5.0,
        totalRides: 0,
        walletBalanceEtb: 0,
        subscriptionStatus: 'active',
        aiVerificationScore: aiConfidenceScore || 96.5,
        aiVerificationStatus: isQualified ? 'verified' : 'pending',
      };

      sounds.playPaymentSuccess();
      onComplete(newDriverPayload);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in font-sans">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
              {operatorType === 'airport_flight_operator' ? (
                <Plane className="w-5 h-5 text-indigo-400" />
              ) : (
                <Car className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>
                  {operatorType === 'airport_flight_operator'
                    ? 'Bole Airport Flight Operator Onboarding'
                    : 'Driver Partner Onboarding & AI KYC'}
                </span>
                <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.2 rounded uppercase">
                  0% Commission
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Step {step} of 5 • Self-Assisted Ethiopian Compliance Verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Stepper */}
        <div className="h-1 bg-slate-100 w-full flex">
          <div
            className="bg-amber-500 h-full transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
              {errorMsg}
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 1: Operator Classification & Identity */}
          {/* ======================================================== */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h4 className="font-bold text-sm text-slate-900">Operator Classification &amp; Identity</h4>
                <p className="text-slate-500 text-xs">
                  Choose your transport service domain and enter your official government identification.
                </p>
              </div>

              {/* Operator Type Radio Selector */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">Select Operator Domain</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div
                    onClick={() => setOperatorType('city_driver')}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition flex items-start gap-2.5 ${
                      operatorType === 'city_driver'
                        ? 'border-brand-500 bg-brand-50/40 text-brand-950'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <Car className="w-5 h-5 text-brand-600 mt-0.5 shrink-0" />
                    <div>
                      <strong className="block text-xs text-slate-900">City Ride &amp; Taxi Driver</strong>
                      <span className="text-[10px] text-slate-500">
                        Metropolitan Addis Ababa ride hailing (Bole, Kazanchis, Piassa)
                      </span>
                    </div>
                  </div>

                  <div
                    onClick={() => {
                      setOperatorType('airport_flight_operator');
                      setVehicleCategory('comfort');
                    }}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition flex items-start gap-2.5 ${
                      operatorType === 'airport_flight_operator'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <Plane className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
                    <div>
                      <strong className="block text-xs text-slate-900">Bole Airport Flight Operator</strong>
                      <span className="text-[10px] text-slate-500">
                        ADD Bole International Airport Terminal 1 &amp; 2 VIP transfers
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Legal Name (as on Driving License)</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dawit Bekele (ዳዊት በቀለ)"
                  className="w-full border border-slate-300 rounded-xl py-2 px-3 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Ethiopian Mobile Number (Telebirr 0% Commission Account)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+251 9..."
                  className="w-full border border-slate-300 rounded-xl py-2 px-3 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Ethiopian National Digital ID (Fayda FIN) / Kebele Resident ID
                </label>
                <input
                  type="text"
                  value={faydaId}
                  onChange={(e) => setFaydaId(e.target.value)}
                  placeholder="ET-FIN-..."
                  className="w-full border border-slate-300 rounded-xl py-2 px-3 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!fullName || !phone}
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Continue to Vehicle &amp; Aviation Credentials</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 2: Vehicle Specs & Airport Passes */}
          {/* ======================================================== */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h4 className="font-bold text-sm text-slate-900">Vehicle Specifications &amp; Transport Badges</h4>
                <p className="text-slate-500 text-xs">
                  Register your registered transport vehicle and optional airport security badge.
                </p>
              </div>

              {operatorType === 'airport_flight_operator' && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs text-indigo-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold">
                    <Plane className="w-4 h-4 text-indigo-600" />
                    <span>Bole International Airport (ADD) Aviation Security Access</span>
                  </div>
                  <p className="text-[11px] text-indigo-700">
                    Aviation security regulations mandate a valid terminal access badge for pick-ups inside airport arrival lanes.
                  </p>
                  <div>
                    <label className="font-bold text-indigo-900 block text-[11px] mb-1">
                      Aviation Security Badge No. (የኤርፖርት መግቢያ ባጅ)
                    </label>
                    <input
                      type="text"
                      value={airportBadgeNumber}
                      onChange={(e) => setAirportBadgeNumber(e.target.value)}
                      placeholder="e.g. ADD-BOLE-SEC-8841"
                      className="w-full bg-white border border-indigo-300 rounded-xl py-2 px-3 text-xs font-mono font-bold text-indigo-950 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Vehicle Classification</label>
                <select
                  value={vehicleCategory}
                  onChange={(e) => setVehicleCategory(e.target.value as VehicleCategory)}
                  className="w-full border border-slate-300 rounded-xl py-2 px-3 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="sedan">Standard Sedan (Corolla / Dzire / Vitz - 4 Seats)</option>
                  <option value="minivan">Minivan XL (Avanza / Noah - 7 Seats)</option>
                  <option value="comfort">Executive Comfort / Airport VIP (Camry / Elantra / RAV4)</option>
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
                  <label className="font-bold text-slate-700 block mb-1">Model &amp; Year</label>
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
                    placeholder="ET-3-B44129"
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
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Continue to Guardrailed AI Document KYC</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 3: Guardrailed AI Document Processing & Scanning */}
          {/* ======================================================== */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h4 className="font-bold text-sm text-slate-900">Self-Assisted AI Document Scanner &amp; Guardrails</h4>
                <p className="text-slate-500 text-xs">
                  Automated OCR, anti-tamper verification, and INSA hologram checks.
                </p>
              </div>

              {/* Informative Guardrails Alert Box */}
              <div className="p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-2xl space-y-1.5 text-[11px] text-amber-900">
                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Document Capture Guardrails (FDRE Standards)</span>
                </div>
                <ul className="space-y-1 text-amber-800 list-disc list-inside">
                  <li>Ensure all 4 corners of the government document are visible in frame.</li>
                  <li>Avoid bright flash glare, reflections, or dark shadows over holograms.</li>
                  <li>Original physical documents only (photocopies or screens will be flagged).</li>
                </ul>
              </div>

              {/* Interactive Camera / Scanner Viewfinder Simulation */}
              <div className="relative bg-slate-900 rounded-2xl overflow-hidden p-6 border-2 border-slate-800 text-center text-white space-y-3">
                {/* 4 Corner Markers */}
                <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-amber-400" />
                <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-amber-400" />
                <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-amber-400" />
                <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-amber-400" />

                {isScanning ? (
                  <div className="py-6 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto animate-pulse">
                      <Sparkles className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="text-xs font-bold text-amber-400">{scanStepName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Neural OCR Engine • SHA-256 Checksum Validation Active
                    </div>
                  </div>
                ) : (
                  <div className="py-4 space-y-2">
                    <Camera className="w-8 h-8 text-slate-400 mx-auto" />
                    <div className="text-xs font-bold text-white">Smart AI Optical Camera Dropzone</div>
                    <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                      Place your document within the guidelines for automated AI reading.
                    </p>
                  </div>
                )}
              </div>

              {/* Document Checklist with Live Status */}
              <div className="space-y-2">
                {/* Doc 1: Driving License */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand-600" />
                    <div>
                      <div className="font-bold text-slate-900">FDRE Commercial Driving License</div>
                      <div className="text-[10px] text-slate-500">Grade 3 / Public Passenger Transport</div>
                    </div>
                  </div>
                  {docLicenseVerified ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> AI Validated
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleScanDocument('license')}
                      disabled={isScanning}
                      className="px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-lg text-[10px] font-bold transition cursor-pointer"
                    >
                      Scan License
                    </button>
                  )}
                </div>

                {/* Doc 2: Libri */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand-600" />
                    <div>
                      <div className="font-bold text-slate-900">Vehicle Title Certificate (ሊብሬ)</div>
                      <div className="text-[10px] text-slate-500">Addis Ababa Code 3 Commercial Plate Match</div>
                    </div>
                  </div>
                  {docLibriVerified ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> AI Validated
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleScanDocument('libri')}
                      disabled={isScanning}
                      className="px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-lg text-[10px] font-bold transition cursor-pointer"
                    >
                      Scan Libri
                    </button>
                  )}
                </div>

                {/* Doc 3: Annual Safety Inspection Bolo */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand-600" />
                    <div>
                      <div className="font-bold text-slate-900">Annual Safety Bolo (ዓመታዊ ቦሎ)</div>
                      <div className="text-[10px] text-slate-500">Technical Inspection &amp; Emissions Valid</div>
                    </div>
                  </div>
                  {docBoloVerified ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> AI Validated
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleScanDocument('bolo')}
                      disabled={isScanning}
                      className="px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-lg text-[10px] font-bold transition cursor-pointer"
                    >
                      Scan Bolo
                    </button>
                  )}
                </div>

                {/* Doc 4: Airport Access Badge (if Flight Operator) */}
                {operatorType === 'airport_flight_operator' && (
                  <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Plane className="w-4 h-4 text-indigo-600" />
                      <div>
                        <div className="font-bold text-indigo-950">Bole Airport Aviation Security Badge</div>
                        <div className="text-[10px] text-indigo-600">Terminal 1 &amp; 2 Access Authorization</div>
                      </div>
                    </div>
                    {docAirportBadgeVerified ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Cleared
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleScanDocument('airport_badge')}
                        disabled={isScanning}
                        className="px-2.5 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded-lg text-[10px] font-bold transition cursor-pointer"
                      >
                        Scan Badge
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Batch Scan & Confidence Score Pill */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleRunFullSelfAssistedScan}
                  disabled={isScanning}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>1-Click Self-Assisted Full Scan</span>
                </button>

                {aiConfidenceScore > 0 && (
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">AI Score</span>
                    <span className="text-sm font-black text-emerald-600">{aiConfidenceScore.toFixed(1)}%</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  disabled={!docLicenseVerified || !docLibriVerified}
                  className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Continue to 0% Subscription Plan</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 4: 0% Subscription Pass Selection */}
          {/* ======================================================== */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h4 className="font-bold text-sm text-slate-900">0% Commission Subscription Pass</h4>
                <p className="text-slate-500 text-xs">
                  Pay zero percent on every trip. Choose the fixed access pass that fits your schedule.
                </p>
              </div>

              <div className="space-y-3">
                <div
                  onClick={() => setSelectedPlan('daily')}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-center justify-between ${
                    selectedPlan === 'daily'
                      ? 'border-amber-500 bg-amber-50/40 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-900 text-xs">Daily Pass (24 Hours)</div>
                    <div className="text-[11px] text-slate-500">Flexible for weekend or part-time city driving</div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-slate-900">50 ETB</span>
                    <span className="text-[10px] text-slate-400 block">/ 24 hrs</span>
                  </div>
                </div>

                <div
                  onClick={() => setSelectedPlan('weekly')}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-center justify-between ${
                    selectedPlan === 'weekly'
                      ? 'border-brand-500 bg-brand-50/40 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span>Weekly Flex Pass (7 Days)</span>
                      <span className="text-[9px] bg-brand-500 text-white font-black px-1.5 py-0.2 rounded">
                        Most Popular
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">Standard for full-time drivers across Addis Ababa</div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-slate-900">300 ETB</span>
                    <span className="text-[10px] text-slate-400 block">/ 7 days</span>
                  </div>
                </div>

                <div
                  onClick={() => setSelectedPlan('monthly')}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-center justify-between ${
                    selectedPlan === 'monthly'
                      ? 'border-purple-600 bg-purple-50/40 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span>Monthly Pro Pass (30 Days)</span>
                      <span className="text-[9px] bg-purple-600 text-white font-black px-1.5 py-0.2 rounded">
                        Best Value
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Highest dispatch priority &amp; airport flight queue preference
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-slate-900">1,000 ETB</span>
                    <span className="text-[10px] text-slate-400 block">/ 30 days</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Review &amp; Telebirr Activation</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 5: Final Review & Activation */}
          {/* ======================================================== */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <h4 className="font-bold text-sm text-slate-900">Onboarding Summary &amp; Instant Activation</h4>
                <p className="text-slate-500 text-xs">
                  Review your verified credentials before completing your registration.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Operator Domain:</span>
                  <span className="font-bold text-slate-900">
                    {operatorType === 'airport_flight_operator' ? 'Bole Airport Flight Transfer' : 'City Fleet Driver'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Driver Name:</span>
                  <span className="font-bold text-slate-900">{fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vehicle:</span>
                  <span className="font-bold text-slate-900">
                    {vehicleMake} {vehicleModel} ({vehiclePlate})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">AI Confidence:</span>
                  <span className="font-bold text-emerald-600">
                    {(aiConfidenceScore || 98.4).toFixed(1)}% (INSA Verified)
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2">
                  <span className="text-slate-500">Subscription Plan:</span>
                  <span className="font-bold text-amber-600 uppercase">{selectedPlan} Pass (0% Comm)</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 font-bold">
                ✓ Self-assisted AI verification certified. Your account will be activated immediately with 0% trip commission.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleFinishDriverRegistration}
                  disabled={isLoading}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isLoading ? 'Activating Credentials...' : 'Complete Registration & Go Online'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
