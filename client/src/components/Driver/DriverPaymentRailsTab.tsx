import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  CreditCard,
  Smartphone,
  Building,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  ArrowUpRight,
  RefreshCw,
  PlusCircle,
  Copy,
  Check,
  ShieldCheck,
} from 'lucide-react';
import {
  DriverPaymentRails,
  DriverPlatformCredit,
  DriverCreditTransaction,
  DriverCashReconciliationSummary,
  PrimaryPaymentRail,
} from '@shared/types';

interface DriverPaymentRailsTabProps {
  driverId: string;
}

export const DriverPaymentRailsTab: React.FC<DriverPaymentRailsTabProps> = ({ driverId }) => {
  const [rails, setRails] = useState<DriverPaymentRails | null>(null);
  const [credit, setCredit] = useState<DriverPlatformCredit | null>(null);
  const [summary, setSummary] = useState<DriverCashReconciliationSummary | null>(null);
  const [transactions, setTransactions] = useState<DriverCreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingRails, setSavingRails] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [telebirrPhone, setTelebirrPhone] = useState('');
  const [telebirrAccountName, setTelebirrAccountName] = useState('');
  const [cbeAccountNumber, setCbeAccountNumber] = useState('');
  const [cbeAccountName, setCbeAccountName] = useState('');
  const [bankName, setBankName] = useState('Commercial Bank of Ethiopia');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [primaryRail, setPrimaryRail] = useState<PrimaryPaymentRail>('TELEBIRR');

  // QR Modal
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Topup Modal
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState('500');
  const [topupMethod, setTopupMethod] = useState<'TELEBIRR' | 'CBE_BIRR' | 'BANK_TRANSFER'>('TELEBIRR');
  const [isTopupProcessing, setIsTopupProcessing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [railsRes, creditRes, txRes] = await Promise.all([
        fetch(`/api/drivers/${driverId}/payment-rails`),
        fetch(`/api/drivers/${driverId}/credits`),
        fetch(`/api/drivers/${driverId}/credits/transactions`),
      ]);

      const railsData = await railsRes.json();
      const creditData = await creditRes.json();
      const txData = await txRes.json();

      if (railsData.rails) {
        setRails(railsData.rails);
        setTelebirrPhone(railsData.rails.telebirrPhone || '');
        setTelebirrAccountName(railsData.rails.telebirrAccountName || '');
        setCbeAccountNumber(railsData.rails.cbeAccountNumber || '');
        setCbeAccountName(railsData.rails.cbeAccountName || '');
        setBankName(railsData.rails.bankName || 'Commercial Bank of Ethiopia');
        setBankAccountNumber(railsData.rails.bankAccountNumber || '');
        setBankAccountName(railsData.rails.bankAccountName || '');
        setPrimaryRail(railsData.rails.primaryRail || 'TELEBIRR');
      }

      if (creditData.credit) setCredit(creditData.credit);
      if (creditData.summary) setSummary(creditData.summary);
      if (txData.transactions) setTransactions(txData.transactions);
    } catch (err: any) {
      setError(err.message || 'Failed to load driver payment rails');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (driverId) {
      fetchData();
    }
  }, [driverId]);

  // Generate QR code for driver to present to passengers
  const handleOpenQrModal = async () => {
    const payload = JSON.stringify({
      chebelew_driver_id: driverId,
      primary_rail: primaryRail,
      telebirr_phone: telebirrPhone,
      cbe_account: cbeAccountNumber,
      bank: `${bankName}: ${bankAccountNumber}`,
      payee_name: primaryRail === 'TELEBIRR' ? telebirrAccountName : cbeAccountName,
    });

    try {
      const url = await QRCode.toDataURL(payload, {
        width: 240,
        margin: 2,
        color: { dark: '#047857', light: '#ffffff' },
      });
      setQrDataUrl(url);
      setShowQrModal(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveRails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingRails(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/drivers/${driverId}/payment-rails`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telebirrPhone,
          telebirrAccountName,
          cbeAccountNumber,
          cbeAccountName,
          bankName,
          bankAccountNumber,
          bankAccountName,
          primaryRail,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update rails');

      setRails(data.rails);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingRails(false);
    }
  };

  const handleTopup = async () => {
    setIsTopupProcessing(true);
    setError(null);

    try {
      const res = await fetch(`/api/drivers/${driverId}/credits/topup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountEtb: parseFloat(topupAmount),
          paymentMethod: topupMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Topup failed');

      setShowTopupModal(false);
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsTopupProcessing(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center gap-3 text-slate-500">
        <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
        <span className="text-sm">Loading driver payout rails & credit balances...</span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header Banner: 0% Platform Commission Direct Payment Guarantee */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-bold border border-emerald-400/30 mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>0% Platform Commission • 100% Direct Driver Earnings</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">Direct Payout Rails & Platform Credit</h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1">
              Riders pay directly to your Telebirr, CBE Birr or Bank account with zero platform commission deductions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenQrModal}
              className="px-4 py-2.5 rounded-xl bg-white text-emerald-900 font-bold text-xs hover:bg-emerald-50 transition flex items-center gap-2 shadow"
            >
              <QrCode className="w-4 h-4 text-emerald-700" />
              <span>Show In-Car QR</span>
            </button>
            <button
              onClick={() => setShowTopupModal(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs transition flex items-center gap-1.5 shadow"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Top Up Credit</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>Payout rails saved successfully! Riders will now pay directly to your updated setup.</span>
        </div>
      )}

      {/* Grid: Platform Credit Balance + Reconciliation Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Platform Credit Balance */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Prepaid Platform Credits</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {(credit?.creditBalanceEtb || 0).toFixed(2)}
            </span>
            <span className="text-xs font-bold text-slate-500">ETB</span>
          </div>
          <div className="pt-2">
            {summary?.status === 'IN_GOOD_STANDING' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" /> In Good Standing
              </span>
            )}
            {summary?.status === 'LOW_CREDIT_ALERT' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                <AlertTriangle className="w-3 h-3" /> Low Balance (&lt;100 ETB)
              </span>
            )}
            {summary?.status === 'TOPUP_REQUIRED' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                <AlertTriangle className="w-3 h-3" /> Topup Required
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Cash Collected & Reconciled */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Cash Collected</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {(summary?.totalCashCollectedEtb || 0).toFixed(2)}
            </span>
            <span className="text-xs font-bold text-slate-500">ETB</span>
          </div>
          <span className="text-[11px] text-slate-500 block pt-1">
            Reconciled against platform credit balance
          </span>
        </div>

        {/* Card 3: Active Payout Rail */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Active Customer Rail</span>
          <div className="flex items-center gap-2 pt-1">
            {primaryRail === 'TELEBIRR' && (
              <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
                <Smartphone className="w-5 h-5 text-[#0070ba]" />
                <span>Telebirr ({telebirrPhone})</span>
              </div>
            )}
            {primaryRail === 'CBE_BIRR' && (
              <div className="flex items-center gap-2 text-purple-700 font-bold text-sm">
                <Building className="w-5 h-5 text-purple-600" />
                <span>CBE ({cbeAccountNumber})</span>
              </div>
            )}
            {primaryRail === 'BANK_TRANSFER' && (
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <CreditCard className="w-5 h-5 text-slate-600" />
                <span>{bankName}</span>
              </div>
            )}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium block pt-1">
            ✓ Verified for direct in-trip payments
          </span>
        </div>
      </div>

      {/* Driver Payout Rails Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Configure Your Direct Payment Rails</h3>
            <p className="text-xs text-slate-500">
              Select which account receives passenger payments during 0% commission trips.
            </p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-mono font-medium">
            FDRE Tax Compliant
          </span>
        </div>

        <form onSubmit={handleSaveRails} className="space-y-6">
          {/* Primary Rail Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">Preferred Receiving Rail</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label
                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition ${
                  primaryRail === 'TELEBIRR'
                    ? 'border-[#0070ba] bg-blue-50/50 text-blue-900'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="primaryRail"
                  value="TELEBIRR"
                  checked={primaryRail === 'TELEBIRR'}
                  onChange={() => setPrimaryRail('TELEBIRR')}
                  className="text-[#0070ba]"
                />
                <div className="text-xs">
                  <div className="font-bold flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-[#0070ba] text-white flex items-center justify-center text-[10px] font-black">tb</span>
                    Telebirr
                  </div>
                  <span className="text-[11px] text-slate-500">Direct mobile push</span>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition ${
                  primaryRail === 'CBE_BIRR'
                    ? 'border-purple-600 bg-purple-50/50 text-purple-900'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="primaryRail"
                  value="CBE_BIRR"
                  checked={primaryRail === 'CBE_BIRR'}
                  onChange={() => setPrimaryRail('CBE_BIRR')}
                  className="text-purple-600"
                />
                <div className="text-xs">
                  <div className="font-bold flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-purple-600" />
                    CBE Birr / CBE
                  </div>
                  <span className="text-[11px] text-slate-500">Commercial Bank</span>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition ${
                  primaryRail === 'BANK_TRANSFER'
                    ? 'border-slate-800 bg-slate-50 text-slate-900'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="primaryRail"
                  value="BANK_TRANSFER"
                  checked={primaryRail === 'BANK_TRANSFER'}
                  onChange={() => setPrimaryRail('BANK_TRANSFER')}
                  className="text-slate-800"
                />
                <div className="text-xs">
                  <div className="font-bold flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-slate-700" />
                    Other Bank
                  </div>
                  <span className="text-[11px] text-slate-500">Abyssinia, Awash, etc.</span>
                </div>
              </label>
            </div>
          </div>

          {/* Rail 1: Telebirr Setup */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Smartphone className="w-4 h-4 text-[#0070ba]" />
              <span>Telebirr Account Setup</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Telebirr Mobile Phone</label>
                <input
                  type="text"
                  value={telebirrPhone}
                  onChange={(e) => setTelebirrPhone(e.target.value)}
                  placeholder="+251 9XX XXX XXX"
                  className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-[#0070ba] focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Telebirr Registered Name</label>
                <input
                  type="text"
                  value={telebirrAccountName}
                  onChange={(e) => setTelebirrAccountName(e.target.value)}
                  placeholder="e.g. Ahmed Mohammed Ali"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-[#0070ba] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Rail 2: Commercial Bank of Ethiopia (CBE) */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Building className="w-4 h-4 text-purple-600" />
              <span>Commercial Bank of Ethiopia (CBE / CBE Birr)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">CBE Account Number</label>
                <input
                  type="text"
                  value={cbeAccountNumber}
                  onChange={(e) => setCbeAccountNumber(e.target.value)}
                  placeholder="1000XXXXXXXXX"
                  className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">CBE Account Holder Name</label>
                <input
                  type="text"
                  value={cbeAccountName}
                  onChange={(e) => setCbeAccountName(e.target.value)}
                  placeholder="e.g. Ahmed Mohammed Ali"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Rail 3: Other Commercial Banks */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <CreditCard className="w-4 h-4 text-slate-700" />
              <span>Other Commercial Banks (Optional)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Bank Name</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-slate-700 focus:outline-none"
                >
                  <option value="Commercial Bank of Ethiopia">Commercial Bank of Ethiopia</option>
                  <option value="Bank of Abyssinia">Bank of Abyssinia</option>
                  <option value="Awash Bank">Awash Bank</option>
                  <option value="Dashen Bank">Dashen Bank</option>
                  <option value="Cooperative Bank of Oromia">Cooperative Bank of Oromia</option>
                  <option value="Nib International Bank">Nib International Bank</option>
                  <option value="Wegagen Bank">Wegagen Bank</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Account Number</label>
                <input
                  type="text"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  placeholder="Account Number"
                  className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-slate-700 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Account Holder Name</label>
                <input
                  type="text"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                  placeholder="Account Holder"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-slate-700 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingRails}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition disabled:opacity-50 shadow"
            >
              {savingRails ? 'Saving Payout Rails...' : 'Save Payout Rails'}
            </button>
          </div>
        </form>
      </div>

      {/* Credit Transactions & Cash Reconciliation Ledger */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Reconciliation & Credit Ledger</h3>
            <p className="text-xs text-slate-500">
              Audit log of credit top-ups, cash ride offsets, and subscription renewals.
            </p>
          </div>
          <button
            onClick={fetchData}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No credit transactions recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Description / Ref</th>
                  <th className="pb-2 text-right">Amount</th>
                  <th className="pb-2 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50">
                    <td className="py-2.5 font-mono text-[11px] text-slate-500">
                      {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.type === 'TOPUP'
                            ? 'bg-emerald-100 text-emerald-800'
                            : tx.type === 'CASH_RECONCILIATION'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-2.5 max-w-xs truncate">
                      <div className="font-medium text-slate-800">{tx.description}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{tx.paymentReference}</div>
                    </td>
                    <td
                      className={`py-2.5 text-right font-bold ${
                        tx.amountEtb >= 0 ? 'text-emerald-600' : 'text-slate-700'
                      }`}
                    >
                      {tx.amountEtb >= 0 ? `+${tx.amountEtb.toFixed(2)}` : tx.amountEtb.toFixed(2)} ETB
                    </td>
                    <td className="py-2.5 text-right font-mono font-semibold text-slate-900">
                      {tx.balanceAfterEtb.toFixed(2)} ETB
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: In-Car Driver Direct QR */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-xs font-bold text-slate-800">In-Car Driver Payment QR</span>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl inline-block border border-emerald-100">
              <span className="text-xs font-bold text-emerald-800 block">
                0% Platform Fee • 100% Direct Payout
              </span>
            </div>

            <div className="flex flex-col items-center justify-center py-2">
              {qrDataUrl && (
                <img src={qrDataUrl} alt="In-Car Driver QR" className="w-52 h-52 rounded-xl shadow border border-slate-200" />
              )}
            </div>

            <div className="space-y-1.5 text-xs text-left bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Telebirr:</span>
                <div className="flex items-center gap-1 font-mono font-bold text-slate-800">
                  <span>{telebirrPhone}</span>
                  <button onClick={() => copyToClipboard(telebirrPhone, 'tb')} className="text-slate-400 hover:text-slate-600">
                    {copiedKey === 'tb' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">CBE Account:</span>
                <div className="flex items-center gap-1 font-mono font-bold text-slate-800">
                  <span>{cbeAccountNumber}</span>
                  <button onClick={() => copyToClipboard(cbeAccountNumber, 'cbe')} className="text-slate-400 hover:text-slate-600">
                    {copiedKey === 'cbe' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Payee:</span>
                <span className="font-semibold text-slate-800">{telebirrAccountName || cbeAccountName}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Ask your passenger to scan with Telebirr or CBE Birr SuperApp to pay immediately.
            </p>
          </div>
        </div>
      )}

      {/* Modal: Top Up Platform Credit */}
      {showTopupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b pb-2">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Top Up Platform Credit</h3>
              </div>
              <button
                onClick={() => setShowTopupModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <div className="text-xs text-slate-600">
              Prepaid platform credits ensure smooth reconciliation when collecting cash from riders or renewing your pass.
            </div>

            {/* Quick Amount Buttons */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1.5">Select Amount (ETB)</label>
              <div className="grid grid-cols-4 gap-2">
                {['500', '1000', '2500', '5000'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTopupAmount(amt)}
                    className={`py-2 text-xs font-bold rounded-lg border transition ${
                      topupAmount === amt
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    {amt} ETB
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1.5">Top-up Channel</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTopupMethod('TELEBIRR')}
                  className={`p-3 rounded-xl border text-left text-xs font-bold flex items-center gap-2 transition ${
                    topupMethod === 'TELEBIRR'
                      ? 'border-[#0070ba] bg-blue-50 text-blue-900'
                      : 'border-slate-200 text-slate-700'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-[#0070ba]" />
                  <span>Telebirr Push</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTopupMethod('CBE_BIRR')}
                  className={`p-3 rounded-xl border text-left text-xs font-bold flex items-center gap-2 transition ${
                    topupMethod === 'CBE_BIRR'
                      ? 'border-purple-600 bg-purple-50 text-purple-900'
                      : 'border-slate-200 text-slate-700'
                  }`}
                >
                  <Building className="w-4 h-4 text-purple-600" />
                  <span>CBE Transfer</span>
                </button>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-600 border border-slate-200">
              <div className="flex justify-between">
                <span>Topup Amount:</span>
                <span className="font-bold text-slate-900">{parseFloat(topupAmount || '0').toFixed(2)} ETB</span>
              </div>
              <div className="flex justify-between">
                <span>New Balance:</span>
                <span className="font-bold text-emerald-700">
                  {((credit?.creditBalanceEtb || 0) + parseFloat(topupAmount || '0')).toFixed(2)} ETB
                </span>
              </div>
            </div>

            <button
              onClick={handleTopup}
              disabled={isTopupProcessing || !topupAmount}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 shadow"
            >
              {isTopupProcessing ? 'Authorizing Top-up...' : `Authorize ${topupAmount} ETB Top-up`}
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
