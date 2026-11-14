import React, { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  X,
  Phone,
  Mail,
  DollarSign,
  Users,
  FileText,
} from 'lucide-react';
import { Language } from '../../i18n/translations';
import { sounds } from '../../utils/audio';

interface CorporateOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (account: any) => void;
  language: Language;
}

export const CorporateOnboardingModal: React.FC<CorporateOnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  language,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [companyName, setCompanyName] = useState('Commercial Bank of Ethiopia (CBE)');
  const [tinNumber, setTinNumber] = useState('0011223344');
  const [sector, setSector] = useState('Banking & Financial Services');
  const [officerName, setOfficerName] = useState('Tadesse Gemechu');
  const [officerPhone, setOfficerPhone] = useState('+251911332211');
  const [officerEmail, setOfficerEmail] = useState('travel@cbe.com.et');
  const [monthlyLimit, setMonthlyLimit] = useState('150000');
  const [employeeCount, setEmployeeCount] = useState('120');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFinishOnboarding = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const payload = {
        companyName,
        tinNumber,
        contactPerson: officerName,
        contactPhone: officerPhone,
        contactEmail: officerEmail,
        creditLimitEtb: parseFloat(monthlyLimit) || 100000,
        billingCycle: 'monthly',
      };

      const res = await fetch('/api/corporate/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      sounds.playPaymentSuccess();
      onComplete(data.account || payload);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Corporate account onboarding failed');
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
              <Building2 className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Corporate Enterprise Onboarding</h3>
              <p className="text-[11px] text-slate-400">Step {step} of 3 • Post-Paid Travel & Employee Mobility</p>
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
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          {/* STEP 1: Company Profile */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h4 className="font-bold text-sm text-slate-900">Enterprise Company Details</h4>
                <p className="text-slate-500 text-xs">
                  Register your business for monthly billing and automated employee ride allowances.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Company Registered Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Commercial Bank of Ethiopia"
                  className="w-full border border-slate-300 rounded-xl py-2 px-3 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tax TIN Number</label>
                  <input
                    type="text"
                    value={tinNumber}
                    onChange={(e) => setTinNumber(e.target.value)}
                    placeholder="00..."
                    className="w-full border border-slate-300 rounded-xl py-2 px-3 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Industry Sector</label>
                  <select
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl py-2 px-3 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="Banking & Financial Services">Banking & Finance</option>
                    <option value="Aviation & Travel">Aviation & Travel</option>
                    <option value="Telecom & Technology">Telecom & Tech</option>
                    <option value="Healthcare & NGO">Healthcare & NGO</option>
                    <option value="Government & Diplomatic">Diplomatic Mission</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!companyName || !tinNumber}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <span>Continue to Authorized Officer</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: Authorized Officer */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h4 className="font-bold text-sm text-slate-900">Corporate Travel Administrator</h4>
                <p className="text-slate-500 text-xs">
                  Authorized representative responsible for employee allowance budgets and invoice approvals.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Officer Full Name</label>
                <input
                  type="text"
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl py-2 px-3 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Corporate Phone</label>
                  <input
                    type="tel"
                    value={officerPhone}
                    onChange={(e) => setOfficerPhone(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl py-2 px-3 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Corporate Email</label>
                  <input
                    type="email"
                    value={officerEmail}
                    onChange={(e) => setOfficerEmail(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
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
                  disabled={!officerName || !officerPhone}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <span>Continue to Credit Limits</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Credit Limits & Terms */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h4 className="font-bold text-sm text-slate-900">Monthly Credit Line & Billing Cycle</h4>
                <p className="text-slate-500 text-xs">
                  Configure post-paid corporate spending limits for automated VAT tax invoicing.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Requested Monthly Limit (ETB)</label>
                  <input
                    type="number"
                    value={monthlyLimit}
                    onChange={(e) => setMonthlyLimit(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl py-2 px-3 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Eligible Employees</label>
                  <input
                    type="number"
                    value={employeeCount}
                    onChange={(e) => setEmployeeCount(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl py-2 px-3 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1 text-amber-900 text-[11px]">
                <strong className="block font-bold">Post-Paid Settlement Terms:</strong>
                <p>• Invoices issued monthly with statutory 15% VAT breakdown (FDRE Regulation No. 570/2025).</p>
                <p>• Payment accepted via Telebirr Corporate or Bank Wire Transfer.</p>
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
                  onClick={handleFinishOnboarding}
                  disabled={isLoading}
                  className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-white font-extrabold rounded-xl text-xs transition shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>{isLoading ? 'Creating Account...' : 'Complete Corporate Onboarding'}</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
