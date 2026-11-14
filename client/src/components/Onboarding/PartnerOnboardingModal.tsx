import React, { useState } from 'react';
import {
  Layers,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  X,
  Building2,
  Phone,
  Mail,
  Car,
  Cpu,
  FileText,
  Sparkles,
} from 'lucide-react';
import { Language } from '../../i18n/translations';
import { sounds } from '../../utils/audio';

interface PartnerOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (fleet: any) => void;
  language: Language;
}

export const PartnerOnboardingModal: React.FC<PartnerOnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  language,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [coopName, setCoopName] = useState('Addis Blue & White Taxi Cooperative Union');
  const [licenseNumber, setLicenseNumber] = useState('ET-MOT-COOP-4491');
  const [tinNumber, setTinNumber] = useState('0088991122');
  const [managerName, setManagerName] = useState('Getachew Assefa');
  const [managerPhone, setManagerPhone] = useState('+251911887766');
  const [managerEmail, setManagerEmail] = useState('fleets@taxicoop.et');
  const [vehicleCount, setVehicleCount] = useState('45');
  const [dispatchMode, setDispatchMode] = useState<'polling' | 'webhook_push' | 'manual'>('polling');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFinishOnboarding = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const fleetId = `fleet_${Date.now()}`;
      const payload = {
        id: fleetId,
        fleetName: coopName,
        registrationNumber: licenseNumber,
        contactPhone: managerPhone,
        totalVehicles: parseInt(vehicleCount, 10) || 20,
        countryCode: 'ET',
        cityCode: 'ADDIS_ABABA',
      };

      sounds.playPaymentSuccess();
      onComplete(payload);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Onboarding submission failed');
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
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <Layers className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Taxi Fleet & Cooperative Onboarding</h3>
              <p className="text-[11px] text-slate-400">Step {step} of 4 • Multi-Fleet Aggregator Integration</p>
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
            className="bg-purple-600 h-full transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          {/* STEP 1: Organization Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h4 className="font-bold text-sm text-slate-900">Cooperative / Fleet Profile</h4>
                <p className="text-slate-500 text-xs">
                  Register your licensed metered cab company or municipal taxi association.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Cooperative or Fleet Name</label>
                <input
                  type="text"
                  value={coopName}
                  onChange={(e) => setCoopName(e.target.value)}
                  placeholder="e.g. Addis Blue & White Taxi Cooperative"
                  className="w-full border border-slate-300 rounded-xl py-2 px-3 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Transport Permit / License</label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="ET-MOT-..."
                    className="w-full border border-slate-300 rounded-xl py-2 px-3 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tax TIN Number</label>
                  <input
                    type="text"
                    value={tinNumber}
                    onChange={(e) => setTinNumber(e.target.value)}
                    placeholder="00..."
                    className="w-full border border-slate-300 rounded-xl py-2 px-3 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!coopName || !licenseNumber}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <span>Continue to Manager Contact</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: Manager Contact */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h4 className="font-bold text-sm text-slate-900">Fleet Administrator Contact</h4>
                <p className="text-slate-500 text-xs">
                  Primary liaison for dispatch agreements, settlement reports, and driver accounts.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Fleet Manager Full Name</label>
                <input
                  type="text"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl py-2 px-3 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Official Mobile Phone</label>
                <input
                  type="tel"
                  value={managerPhone}
                  onChange={(e) => setManagerPhone(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl py-2 px-3 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Corporate Email Address</label>
                <input
                  type="email"
                  value={managerEmail}
                  onChange={(e) => setManagerEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
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
                  disabled={!managerName || !managerPhone}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <span>Continue to Fleet Specs</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Fleet Composition & Dispatch Mode */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h4 className="font-bold text-sm text-slate-900">Fleet Volume & Integration Mode</h4>
                <p className="text-slate-500 text-xs">
                  How your vehicles will receive automated Chebelew ride orders.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Total Active Vehicles in Fleet</label>
                <input
                  type="number"
                  value={vehicleCount}
                  onChange={(e) => setVehicleCount(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full border border-slate-300 rounded-xl py-2 px-3 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">Dispatch Integration Architecture</label>
                <div
                  onClick={() => setDispatchMode('polling')}
                  className={`p-3 rounded-xl border-2 flex items-center justify-between cursor-pointer transition ${
                    dispatchMode === 'polling'
                      ? 'border-purple-600 bg-purple-50/50 text-purple-900'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-purple-600" />
                    <div>
                      <div className="font-bold">REST API Polling Adapter</div>
                      <div className="text-[10px] text-slate-500">Automated price quote polling with circuit breakers</div>
                    </div>
                  </div>
                  {dispatchMode === 'polling' && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
                </div>

                <div
                  onClick={() => setDispatchMode('webhook_push')}
                  className={`p-3 rounded-xl border-2 flex items-center justify-between cursor-pointer transition ${
                    dispatchMode === 'webhook_push'
                      ? 'border-purple-600 bg-purple-50/50 text-purple-900'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-purple-600" />
                    <div>
                      <div className="font-bold">Real-Time Webhook Push</div>
                      <div className="text-[10px] text-slate-500">Direct webhook callback to your cooperative server</div>
                    </div>
                  </div>
                  {dispatchMode === 'webhook_push' && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
                </div>

                <div
                  onClick={() => setDispatchMode('manual')}
                  className={`p-3 rounded-xl border-2 flex items-center justify-between cursor-pointer transition ${
                    dispatchMode === 'manual'
                      ? 'border-purple-600 bg-purple-50/50 text-purple-900'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-purple-600" />
                    <div>
                      <div className="font-bold">Manual Call-In Dispatch Terminal</div>
                      <div className="text-[10px] text-slate-500">Operated via Chebelew Call Center 9922</div>
                    </div>
                  </div>
                  {dispatchMode === 'manual' && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
                </div>
              </div>

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
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span>Review & Submit</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Review & Activation */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-bold text-sm text-slate-900">Cooperative Agreement Ready</h4>
                <p className="text-slate-500 text-xs">
                  Your fleet will be registered into the Chebelew multi-provider aggregation mesh.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Entity:</span>
                  <strong className="text-slate-800">{coopName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">License:</span>
                  <strong className="text-slate-800">{licenseNumber}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Vehicles:</span>
                  <strong className="text-slate-800">{vehicleCount} Cabs</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Mode:</span>
                  <strong className="text-purple-600 uppercase">{dispatchMode}</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={handleFinishOnboarding}
                disabled={isLoading}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-extrabold rounded-xl text-xs transition shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{isLoading ? 'Connecting Fleet...' : 'Submit Cooperative Onboarding'}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
