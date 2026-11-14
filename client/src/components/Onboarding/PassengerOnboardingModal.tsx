import React, { useState } from 'react';
import {
  Smartphone,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  X,
  User,
  Phone,
  Lock,
  Sparkles,
  Building2,
  DollarSign,
  HeartHandshake,
} from 'lucide-react';
import { Language } from '../../i18n/translations';
import { sounds } from '../../utils/audio';

interface PassengerOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (passenger: { id: string; name: string; phone: string }) => void;
  language: Language;
}

export const PassengerOnboardingModal: React.FC<PassengerOnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  language,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [phone, setPhone] = useState('+251911223344');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [fullName, setFullName] = useState('Leila Haile');
  const [emergencyPhone, setEmergencyPhone] = useState('+251911009988');
  const [preferredPayment, setPreferredPayment] = useState<'TELEBIRR' | 'CASH' | 'CORPORATE'>('TELEBIRR');
  const [corporateCode, setCorporateCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendOtp = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (data.success) {
        setIsOtpSent(true);
        setOtpCode(data.demoCode || '123456');
        sounds.playBeep(600, 'sine', 0.15);
      } else {
        throw new Error(data.error || 'Failed to request OTP');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: otpCode, role: 'rider', name: fullName }),
      });
      const data = await res.json();
      if (data.success) {
        setStep(2);
        sounds.playRideAccepted();
      } else {
        throw new Error(data.error || 'Invalid OTP code');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishOnboarding = () => {
    sounds.playPaymentSuccess();
    onComplete({
      id: `user_${Date.now()}`,
      name: fullName,
      phone,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col font-sans">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-brand-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Passenger Onboarding</h3>
              <p className="text-[11px] text-slate-400">Step {step} of 4 • Chebelew ቼበለው Profile Setup</p>
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
            className="bg-brand-500 h-full transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs text-slate-700">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          {/* STEP 1: Phone & SMS OTP */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h4 className="font-bold text-sm text-slate-900">Verify Mobile Phone</h4>
                <p className="text-slate-500 text-xs">
                  We will send a 6-digit confirmation code via Ethio Telecom SMS gateway.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ethiopian Mobile Number</label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+251 9..."
                    className="w-full border border-slate-300 rounded-xl py-2 pl-9 pr-3 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              {!isOtpSent ? (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isLoading || !phone}
                  className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs transition shadow-sm disabled:opacity-50"
                >
                  {isLoading ? 'Sending SMS Code...' : 'Send SMS Verification Code'}
                </button>
              ) : (
                <div className="space-y-3 pt-2">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-bold text-slate-700">Enter 6-Digit SMS Code</label>
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                        Demo Autofilled: {otpCode}
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="123456"
                      className="w-full border border-slate-300 rounded-xl py-2 px-3 text-center text-sm font-mono font-bold tracking-widest text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={isLoading || otpCode.length < 6}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <span>Confirm & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Profile Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h4 className="font-bold text-sm text-slate-900">Your Passenger Profile</h4>
                <p className="text-slate-500 text-xs">
                  Your name helps drivers confirm they are picking up the correct passenger.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Legal Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Leila Haile"
                    className="w-full border border-slate-300 rounded-xl py-2 pl-9 pr-3 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Emergency Contact Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder="+251 9..."
                    className="w-full border border-slate-300 rounded-xl py-2 pl-9 pr-3 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <span className="text-[10px] text-slate-400">Notified automatically when SOS Panic Button is pressed.</span>
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
                  disabled={!fullName}
                  className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <span>Continue to Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Payment Preferences */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h4 className="font-bold text-sm text-slate-900">Preferred Payment Option</h4>
                <p className="text-slate-500 text-xs">
                  Choose how you would normally like to settle your fares. You can always change per ride.
                </p>
              </div>

              <div className="space-y-2">
                <label
                  onClick={() => setPreferredPayment('TELEBIRR')}
                  className={`p-3 rounded-xl border-2 flex items-center justify-between cursor-pointer transition ${
                    preferredPayment === 'TELEBIRR'
                      ? 'border-[#0070ba] bg-blue-50/50 text-[#0070ba]'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Smartphone className="w-5 h-5 text-[#0070ba]" />
                    <div>
                      <div className="font-bold text-xs text-slate-900">Telebirr Digital Wallet</div>
                      <div className="text-[10px] text-slate-500">Contactless QR code or USSD Push to your phone</div>
                    </div>
                  </div>
                  {preferredPayment === 'TELEBIRR' && <CheckCircle2 className="w-4 h-4 text-[#0070ba]" />}
                </label>

                <label
                  onClick={() => setPreferredPayment('CASH')}
                  className={`p-3 rounded-xl border-2 flex items-center justify-between cursor-pointer transition ${
                    preferredPayment === 'CASH'
                      ? 'border-emerald-600 bg-emerald-50/50 text-emerald-800'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    <div>
                      <div className="font-bold text-xs text-slate-900">Cash on Arrival</div>
                      <div className="text-[10px] text-slate-500">Direct paper cash payment to driver with VAT invoice</div>
                    </div>
                  </div>
                  {preferredPayment === 'CASH' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </label>

                <label
                  onClick={() => setPreferredPayment('CORPORATE')}
                  className={`p-3 rounded-xl border-2 flex items-center justify-between cursor-pointer transition ${
                    preferredPayment === 'CORPORATE'
                      ? 'border-amber-600 bg-amber-50/50 text-amber-900'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-5 h-5 text-amber-600" />
                    <div>
                      <div className="font-bold text-xs text-slate-900">Corporate Employee Billing</div>
                      <div className="text-[10px] text-slate-500">Monthly corporate allowance subsidized by employer</div>
                    </div>
                  </div>
                  {preferredPayment === 'CORPORATE' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                </label>
              </div>

              {preferredPayment === 'CORPORATE' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Corporate Account Code / TIN</label>
                  <input
                    type="text"
                    value={corporateCode}
                    onChange={(e) => setCorporateCode(e.target.value)}
                    placeholder="e.g. CORP-ET-ETHIOAIR-01"
                    className="w-full border border-slate-300 rounded-xl py-2 px-3 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
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
                  className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span>Review & Complete</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Orientation & Pledges */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                </div>
                <h4 className="font-bold text-sm text-slate-900">You Are Ready to Ride!</h4>
                <p className="text-slate-500 text-xs">
                  Here are Chebelew's foundational guarantees for every passenger in Ethiopia:
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5 text-[11px] text-slate-600">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>0% Driver Commission:</strong> Drivers receive 100% of the metered fare subtotal, incentivizing prompt pickups and polite service.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>15% VAT Statutory Remittance:</strong> Automatic compliant tax invoices issued per FDRE Regulation No. 570/2025.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>24/7 Safety & SOS:</strong> Instant one-tap Police 991 and Operations 9922 escalation during any route anomaly.</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleFinishOnboarding}
                className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-extrabold rounded-xl text-xs transition shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2"
              >
                <span>Start Using Chebelew (ቼበለው)</span>
                <HeartHandshake className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
