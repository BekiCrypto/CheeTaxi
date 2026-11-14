import React, { useState } from 'react';
import { Phone, KeyRound, User, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Globe } from 'lucide-react';
import { Language } from '../../i18n/translations';

interface MobileAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: 'rider' | 'driver';
  onAuthenticated: (user: { id: string; name: string; phone: string; role: string; language: Language }) => void;
  language: Language;
}

export const MobileAuthModal: React.FC<MobileAuthModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'rider',
  onAuthenticated,
  language,
}) => {
  const [step, setStep] = useState<'PHONE' | 'OTP' | 'PROFILE'>('PHONE');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'rider' | 'driver'>(defaultRole);
  const [selectedLang, setSelectedLang] = useState<Language>(language);
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const formatEthiopianPhone = (val: string) => {
    // Strip non-digits except leading +
    let cleaned = val.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('09') || cleaned.startsWith('07')) {
      return '+251' + cleaned.slice(1);
    }
    if (cleaned.startsWith('9') || cleaned.startsWith('7')) {
      return '+251' + cleaned;
    }
    return cleaned;
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const formatted = formatEthiopianPhone(phone);
    if (!formatted.startsWith('+251') || formatted.length < 12) {
      setError('Please enter a valid Ethiopian phone number (+251 9... or +251 7...)');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formatted }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP code');

      setPhone(formatted);
      if (data.demoCode) {
        setDemoCode(data.demoCode);
        setOtpCode(data.demoCode); // Pre-fill for friction-free verification
      }
      setStep('OTP');
    } catch (err: any) {
      setError(err.message || 'Error requesting SMS verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!otpCode || otpCode.length < 4) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          code: otpCode,
          role,
          name: name || (role === 'driver' ? 'Ahmed Mohammed' : 'Leila Haile'),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid or expired code.');

      const authUser = {
        id: data.user.id,
        name: data.user.name,
        phone: data.user.phone,
        role: data.user.role,
        language: selectedLang,
      };

      localStorage.setItem('chebelew_active_user', JSON.stringify(authUser));
      onAuthenticated(authUser);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500/20 via-slate-800 to-emerald-500/20 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-slate-950 font-black text-lg shadow-md">
              ቼ
            </div>
            <div>
              <h2 className="text-base font-black text-white">Chebelew Sign In / ምዝገባ</h2>
              <p className="text-xs text-slate-400">Ethiopian Telebirr & CBE Mobile Authentication</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {step === 'PHONE' && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Select Account Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('rider')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      role === 'rider'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    Passenger / ተሳፋሪ
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('driver')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      role === 'driver'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    Driver / አሽከርካሪ (0%)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Ethiopian Mobile Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4 text-amber-400" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0911 22 33 44 or +251 9..."
                    required
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  We support Ethio Telecom (09...) and Safaricom Ethiopia (07...)
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Your Full Name (Optional)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={role === 'driver' ? 'Ahmed Mohammed' : 'Leila Haile'}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition disabled:opacity-50"
              >
                {loading ? 'Sending OTP SMS...' : 'Continue with Phone / ቀጥል'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {step === 'OTP' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center space-y-1">
                <p className="text-xs text-slate-300">
                  Verification code sent to <strong className="text-amber-400 font-mono">{phone}</strong>
                </p>
                {demoCode && (
                  <p className="text-[11px] text-emerald-400 font-mono">
                    Instant Demo Passcode: <strong>{demoCode}</strong>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Enter 6-Digit Code</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4 text-amber-400" />
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    required
                    className="w-full pl-9 pr-3 py-3 bg-slate-800 border border-slate-700 rounded-xl text-center text-lg font-mono tracking-widest text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify & Enter Chebelew / አረጋግጥ'}
                <CheckCircle2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setStep('PHONE')}
                className="w-full py-2 text-xs font-bold text-slate-400 hover:text-white transition text-center"
              >
                Change Phone Number
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between px-5">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Encrypted Session
          </span>
          <span>FDRE Reg. 570/2025</span>
        </div>
      </div>
    </div>
  );
};
