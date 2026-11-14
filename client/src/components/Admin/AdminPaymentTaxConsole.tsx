import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building,
  CreditCard,
  Smartphone,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileText,
  ArrowRight,
  Receipt,
  Download,
} from 'lucide-react';
import { TaxRoutingConfig, TaxRoutingMode, PaymentAuditRecord } from '@shared/types';

export const AdminPaymentTaxConsole: React.FC = () => {
  const [config, setConfig] = useState<TaxRoutingConfig | null>(null);
  const [auditRecords, setAuditRecords] = useState<PaymentAuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [taxRoutingMode, setTaxRoutingMode] = useState<TaxRoutingMode>('DRIVER');
  const [authorityAccountName, setAuthorityAccountName] = useState('FDRE Ministry of Revenues');
  const [authorityAccountNumber, setAuthorityAccountNumber] = useState('ERCA-VAT-570-2025');
  const [authorityBank, setAuthorityBank] = useState('National Bank of Ethiopia');
  const [platformMerchantId, setPlatformMerchantId] = useState('ETH-TB-99882');
  const [platformCbeAccount, setPlatformCbeAccount] = useState('1000987654321');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [cfgRes, auditRes] = await Promise.all([
        fetch('/api/admin/tax-routing'),
        fetch('/api/payment/audit-logs?limit=50'),
      ]);

      const cfgData = await cfgRes.json();
      const auditData = await auditRes.json();

      if (cfgData.config) {
        setConfig(cfgData.config);
        setTaxRoutingMode(cfgData.config.taxRoutingMode);
        setAuthorityAccountName(cfgData.config.authorityAccountName || 'FDRE Ministry of Revenues');
        setAuthorityAccountNumber(cfgData.config.authorityAccountNumber || 'ERCA-VAT-570-2025');
        setAuthorityBank(cfgData.config.authorityBank || 'National Bank of Ethiopia');
        setPlatformMerchantId(cfgData.config.platformTelebirrMerchantId || 'ETH-TB-99882');
        setPlatformCbeAccount(cfgData.config.platformCbeAccount || '1000987654321');
      }

      if (auditData.records) {
        setAuditRecords(auditData.records);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tax routing configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/admin/tax-routing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taxRoutingMode,
          authorityAccountName,
          authorityAccountNumber,
          authorityBank,
          platformTelebirrMerchantId: platformMerchantId,
          platformCbeAccount,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update config');

      setConfig(data.config);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center gap-2 text-slate-500">
        <RefreshCw className="w-5 h-5 animate-spin text-brand-600" />
        <span className="text-sm">Loading Tax & Payment Routing Configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configuration Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>FDRE Council of Ministers Regulation No. 570/2025</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Tax & Revenue Routing Destination Controller
            </h3>
            <p className="text-xs text-slate-500">
              Configure whether the 15% VAT portion of ride fares is routed to Drivers, Platform Escrow, or the Tax Authority.
            </p>
          </div>

          <button
            onClick={fetchData}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {saveSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>Tax routing destination updated successfully! Future rides will adhere to this policy.</span>
          </div>
        )}

        <form onSubmit={handleSaveConfig} className="space-y-5">
          {/* 3-Way Mode Switch */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              Tax Routing Policy
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Option 1: DRIVER */}
              <label
                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${
                  taxRoutingMode === 'DRIVER'
                    ? 'border-emerald-600 bg-emerald-50/60 text-emerald-950'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="taxRoutingMode"
                  value="DRIVER"
                  checked={taxRoutingMode === 'DRIVER'}
                  onChange={() => setTaxRoutingMode('DRIVER')}
                  className="mt-0.5 text-emerald-600"
                />
                <div className="text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Driver Direct (Default)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Under 0% platform commission, the 15% VAT is passed to the driver who is responsible for their own quarterly/annual tax filing.
                  </p>
                </div>
              </label>

              {/* Option 2: PLATFORM */}
              <label
                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${
                  taxRoutingMode === 'PLATFORM'
                    ? 'border-blue-600 bg-blue-50/60 text-blue-950'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="taxRoutingMode"
                  value="PLATFORM"
                  checked={taxRoutingMode === 'PLATFORM'}
                  onChange={() => setTaxRoutingMode('PLATFORM')}
                  className="mt-0.5 text-blue-600"
                />
                <div className="text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-blue-600" />
                    <span>Platform Escrow Pool</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Chebelew retains the 15% VAT in a designated tax escrow account and remits bulk VAT directly to ERCA periodically.
                  </p>
                </div>
              </label>

              {/* Option 3: AUTHORITY */}
              <label
                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${
                  taxRoutingMode === 'AUTHORITY'
                    ? 'border-purple-600 bg-purple-50/60 text-purple-950'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="taxRoutingMode"
                  value="AUTHORITY"
                  checked={taxRoutingMode === 'AUTHORITY'}
                  onChange={() => setTaxRoutingMode('AUTHORITY')}
                  className="mt-0.5 text-purple-600"
                />
                <div className="text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span>Tax Authority Direct</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Tax amount is instantly split and routed directly to the Ministry of Revenues supplied bank account.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Authority & Platform Account Configurations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            {/* Authority Fields */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-800 block border-b pb-1">
                Designated Tax Authority Account
              </span>
              <div>
                <label className="text-[11px] text-slate-600 font-semibold block mb-1">Authority Name</label>
                <input
                  type="text"
                  value={authorityAccountName}
                  onChange={(e) => setAuthorityAccountName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-600 font-semibold block mb-1">Authority Account Number</label>
                <input
                  type="text"
                  value={authorityAccountNumber}
                  onChange={(e) => setAuthorityAccountNumber(e.target.value)}
                  className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2 bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-600 font-semibold block mb-1">Authority Treasury Bank</label>
                <input
                  type="text"
                  value={authorityBank}
                  onChange={(e) => setAuthorityBank(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Platform Merchant Fields */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-800 block border-b pb-1">
                Platform Corporate Rails (Corporate & Commission Trips)
              </span>
              <div>
                <label className="text-[11px] text-slate-600 font-semibold block mb-1">Platform Telebirr Merchant ID</label>
                <input
                  type="text"
                  value={platformMerchantId}
                  onChange={(e) => setPlatformMerchantId(e.target.value)}
                  className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2 bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-600 font-semibold block mb-1">Platform CBE Treasury Account</label>
                <input
                  type="text"
                  value={platformCbeAccount}
                  onChange={(e) => setPlatformCbeAccount(e.target.value)}
                  className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2 bg-white focus:outline-none"
                />
              </div>
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-900">
                Corporate billing rides and commission-based rides are credited directly to these platform treasury accounts.
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition shadow disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Updating Configuration...' : 'Save Tax Routing Configuration'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Compliance & Audit Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Payment Routing & Tax Compliance Ledger
            </h3>
            <p className="text-xs text-slate-500">
              Immutable audit log of all routed payments, destinations, and Ethiopian statutory tax receipt references.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {auditRecords.length} Records Logged
          </span>
        </div>

        {auditRecords.length === 0 ? (
          <div className="text-center p-8 text-xs text-slate-400">
            No payment audit records logged yet.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b uppercase text-[10px]">
                <tr>
                  <th className="p-3">Compliance Ref</th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Routing Destination</th>
                  <th className="p-3">Tax Mode</th>
                  <th className="p-3 text-right">Fare Subtotal</th>
                  <th className="p-3 text-right text-amber-700">15% VAT</th>
                  <th className="p-3 text-right font-bold">Total Settled</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {auditRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-emerald-800">
                      {r.complianceReference}
                    </td>
                    <td className="p-3 text-slate-500 font-sans">
                      {new Date(r.timestamp).toLocaleDateString()} {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3 font-sans">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.routingDestination === 'DRIVER_DIRECT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {r.routingDestination}
                      </span>
                    </td>
                    <td className="p-3 font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-medium">
                        {r.taxRoutingDestination}
                      </span>
                    </td>
                    <td className="p-3 text-right text-slate-600">
                      {r.fareSubtotalEtb.toFixed(2)} ETB
                    </td>
                    <td className="p-3 text-right text-amber-700 font-bold bg-amber-50/40">
                      {r.vatAmountEtb.toFixed(2)} ETB
                    </td>
                    <td className="p-3 text-right font-bold text-slate-900">
                      {r.amountEtb.toFixed(2)} ETB
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
