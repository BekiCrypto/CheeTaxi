import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Mail,
  KeyRound,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  UserCheck,
} from 'lucide-react';

interface AdminAuthGateProps {
  children: (adminSession: {
    token: string;
    admin: {
      id: string;
      name: string;
      email: string;
      phone: string;
      role: string;
    };
    onLogout: () => void;
  }) => React.ReactNode;
}

export const AdminAuthGate: React.FC<AdminAuthGateProps> = ({ children }) => {
  const [adminToken, setAdminToken] = useState<string | null>(() =>
    localStorage.getItem('chebelew_admin_token')
  );
  const [adminUser, setAdminUser] = useState<any>(() => {
    const cached = localStorage.getItem('chebelew_admin_user');
    return cached ? JSON.parse(cached) : null;
  });

  const [emailOrPhone, setEmailOrPhone] = useState('dispatch@chebelew.et');
  const [passwordOrPin, setPasswordOrPin] = useState('9922');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Verify existing token on mount
  useEffect(() => {
    if (!adminToken) return;

    fetch('/api/auth/admin/verify', {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'x-admin-token': adminToken,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.valid && data.admin) {
          setAdminUser(data.admin);
          localStorage.setItem('chebelew_admin_user', JSON.stringify(data.admin));
        } else {
          // Token invalid, clear it
          handleLogout();
        }
      })
      .catch(() => {
        // Fallback keep session if network error
      });
  }, [adminToken]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone, passwordOrPin }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed. Please verify credentials.');
      }

      setAdminToken(data.token);
      setAdminUser(data.admin);
      localStorage.setItem('chebelew_admin_token', data.token);
      localStorage.setItem('chebelew_admin_user', JSON.stringify(data.admin));
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setAdminToken(null);
    setAdminUser(null);
    localStorage.removeItem('chebelew_admin_token');
    localStorage.removeItem('chebelew_admin_user');
  };

  const handleQuickPrefill = (email: string, pin: string) => {
    setEmailOrPhone(email);
    setPasswordOrPin(pin);
  };

  // If authenticated, render protected admin module
  if (adminToken && adminUser) {
    return (
      <>
        {children({
          token: adminToken,
          admin: adminUser,
          onLogout: handleLogout,
        })}
      </>
    );
  }

  // Otherwise, render dedicated security gate
  return (
    <div className="min-h-full flex items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 font-sans">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 text-white relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Security Badge Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-brand-500/10 border border-brand-500/30 text-brand-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-7 h-7 text-brand-400" />
          </div>
          <h2 className="text-xl font-black tracking-tight text-white">
            Chebelew Control Center
          </h2>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-semibold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Restricted: Authorized Personnel Only</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed pt-1">
            Access to live fleet tracking, 9922 call center dispatch, driver KYC compliance, and statutory VAT remittance is protected by administrative role policies.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1.5">
              Staff Email / Work Phone
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                placeholder="dispatch@chebelew.et"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1.5">
              Security Access PIN / Passcode
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={passwordOrPin}
                onChange={(e) => setPasswordOrPin(e.target.value)}
                placeholder="Enter 4-digit PIN or password"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-10 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-xs font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">Default emergency operations PIN: 9922</span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-brand-600 hover:bg-brand-500 active:scale-[0.99] text-white font-extrabold rounded-xl transition shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 text-xs disabled:opacity-50"
          >
            {isLoading ? (
              <span>Authenticating Session...</span>
            ) : (
              <>
                <span>Unlock Operations Console</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Pre-fills for Testing with Granular RBAC */}
        <div className="pt-4 border-t border-slate-800/80 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block text-center">
            Role-Based Demo Personnel (RBAC)
          </span>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => handleQuickPrefill('dispatch@chebelew.et', '9922')}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition flex items-center gap-2"
            >
              <UserCheck className="w-3.5 h-3.5 text-brand-400 shrink-0" />
              <div className="truncate">
                <div className="font-bold text-slate-200 truncate">Super Admin</div>
                <div className="text-[10px] text-slate-400 truncate">Almaz Tefera (Full Root)</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickPrefill('callcenter@chebelew.et', '9922')}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <div className="truncate">
                <div className="font-bold text-slate-200 truncate">Dispatcher</div>
                <div className="text-[10px] text-slate-400 truncate">Dawit Bekele (9922 Dispatch)</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickPrefill('kyc@chebelew.et', '9922')}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition flex items-center gap-2"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <div className="truncate">
                <div className="font-bold text-slate-200 truncate">KYC & Compliance</div>
                <div className="text-[10px] text-slate-400 truncate">Meron Tadesse</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickPrefill('finance@chebelew.et', '9922')}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition flex items-center gap-2"
            >
              <Lock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <div className="truncate">
                <div className="font-bold text-slate-200 truncate">Finance & Tax</div>
                <div className="text-[10px] text-slate-400 truncate">Henok Girma (VAT 570)</div>
              </div>
            </button>
          </div>
        </div>

        <div className="text-[10px] text-slate-500 text-center flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Encrypted with TLS 1.3 & Zero-Trust Session Token Security</span>
        </div>
      </div>
    </div>
  );
};
