import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Users,
  Building2,
  DollarSign,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
  Phone,
  Mail,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { CorporateAccount, Fleet } from '@shared/types';
import { sounds } from '../../utils/audio';

export const AdminCorporateTab: React.FC = () => {
  const [accounts, setAccounts] = useState<CorporateAccount[]>([]);
  const [fleets, setFleets] = useState<Fleet[]>([]);
  const [subTab, setSubTab] = useState<'corporate' | 'fleets'>('corporate');

  // New Account Modal State
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [tinNumber, setTinNumber] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('+2519');
  const [creditLimitEtb, setCreditLimitEtb] = useState('50000');

  const loadData = async () => {
    try {
      const [accRes, fleetRes] = await Promise.all([
        fetch('/api/corporate/accounts'),
        fetch('/api/corporate/fleets'),
      ]);
      const accData = await accRes.json();
      if (accData.accounts) setAccounts(accData.accounts);

      const fleetData = await fleetRes.json();
      if (fleetData.fleets) setFleets(fleetData.fleets);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/corporate/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          tinNumber,
          contactPerson,
          contactEmail,
          contactPhone,
          creditLimitEtb: parseFloat(creditLimitEtb),
        }),
      });
      const data = await res.json();
      if (data.success) {
        sounds.playPaymentSuccess();
        setShowAddAccountModal(false);
        setCompanyName('');
        setTinNumber('');
        setContactPerson('');
        setContactEmail('');
        loadData();
      }
    } catch (err: any) {
      alert(err.message || 'Error creating corporate account');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 overflow-y-auto h-full text-xs">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              B2B & Fleet Subsystem
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900">Corporate Accounts & Fleet Management</h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Manage enterprise mobility clients, employee monthly transportation budgets, and fleet operator cooperatives.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl font-bold">
            <button
              onClick={() => setSubTab('corporate')}
              className={`px-3 py-1.5 rounded-lg transition ${
                subTab === 'corporate' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Corporate Accounts ({accounts.length})
            </button>
            <button
              onClick={() => setSubTab('fleets')}
              className={`px-3 py-1.5 rounded-lg transition ${
                subTab === 'fleets' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Fleet Cooperatives ({fleets.length})
            </button>
          </div>

          {subTab === 'corporate' && (
            <button
              onClick={() => setShowAddAccountModal(true)}
              className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Corporate Client</span>
            </button>
          )}
        </div>
      </div>

      {/* Subtab: Corporate Accounts */}
      {subTab === 'corporate' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((acc) => (
            <div key={acc.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-purple-50 text-purple-700 rounded-xl">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">{acc.companyName}</h3>
                    <span className="text-[10px] text-slate-400 font-mono">TIN: {acc.tinNumber}</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {acc.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px] bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block">Monthly Credit Limit</span>
                  <span className="font-black text-slate-900 text-sm">
                    {acc.creditLimitEtb.toLocaleString()} ETB
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Spent This Cycle</span>
                  <span className="font-black text-purple-700 text-sm">
                    {acc.spentThisMonthEtb.toLocaleString()} ETB
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Contact: <strong>{acc.contactPerson}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{acc.contactPhone}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{acc.contactEmail}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Billing: Monthly Postpaid (E-Invoice)</span>
                <button
                  onClick={() => alert(`Generating monthly statement for ${acc.companyName}...`)}
                  className="text-purple-700 hover:text-purple-900 font-bold text-[11px] flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View Statement</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Subtab: Fleets */}
      {subTab === 'fleets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fleets.map((fl) => (
            <div key={fl.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">{fl.fleetName}</h3>
                    <span className="text-[10px] text-slate-400 font-mono">Reg: {fl.registrationNumber}</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                  {fl.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px] bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block">Registered Vehicles</span>
                  <span className="font-black text-slate-900 text-sm">{fl.totalVehicles} Vehicles</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Active Drivers</span>
                  <span className="font-black text-blue-700 text-sm">{fl.totalDrivers} Drivers</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Contact Dispatch: <strong>{fl.contactPhone}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Account Modal */}
      {showAddAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-black text-base text-slate-900">Add Corporate Mobility Client</h3>
            <form onSubmit={handleCreateAccount} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Company Legal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ethiopian Airlines Group"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">TIN Number</label>
                  <input
                    type="text"
                    required
                    placeholder="0012345678"
                    value={tinNumber}
                    onChange={(e) => setTinNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Monthly Credit Limit (ETB)</label>
                  <input
                    type="number"
                    required
                    value={creditLimitEtb}
                    onChange={(e) => setCreditLimitEtb(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Contact Officer Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mesfin Tasew"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="corporate@ethiopian.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Phone</label>
                  <input
                    type="text"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddAccountModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  Register Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
