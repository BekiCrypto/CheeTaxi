import React from 'react';
import {
  Car,
  Shield,
  Smartphone,
  Globe,
  Zap,
  Users,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { Language, translations } from '../i18n/translations';
import { UserRole } from '@shared/types';

interface NavbarProps {
  currentRole: 'rider' | 'driver' | 'admin' | 'split' | 'website';
  onRoleChange: (role: 'rider' | 'driver' | 'admin' | 'split' | 'website') => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onRunFastDemo: () => void;
  activeUserName: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  language,
  onLanguageChange,
  onRunFastDemo,
  activeUserName,
}) => {
  const t = translations[language];

  return (
    <header className="h-[68px] bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between z-30 relative shadow-sm">
      {/* Brand & Ethiopian Flag Accent */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onRoleChange('rider')}>
          <img src="/chebelew-logo.svg" alt="Chebelew Logo" className="w-10 h-10 drop-shadow-sm" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-slate-900 font-sans">
                Chebelew
              </span>
              <span className="font-bold text-xs text-brand-600 font-sans">
                ቼበለው
              </span>
              <div className="flex h-3 w-4 rounded-sm overflow-hidden shadow-xs ml-1 border border-black/10">
                <div className="w-1/3 bg-[#078930]" />
                <div className="w-1/3 bg-[#fcdd09]" />
                <div className="w-1/3 bg-[#da121a]" />
              </div>
            </div>
            <span className="text-[10px] text-slate-500 block leading-tight font-medium">
              Ethiopia Ride-Hailing Aggregator
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Role Switcher Dropdown (< md) */}
      <div className="flex md:hidden items-center">
        <select
          value={currentRole}
          onChange={(e) => onRoleChange(e.target.value as any)}
          className="bg-slate-100 text-slate-800 text-xs font-bold py-1.5 px-2.5 rounded-lg border border-slate-200 outline-hidden focus:ring-2 focus:ring-brand-500"
        >
          <option value="rider">📱 {t.rider}</option>
          <option value="driver">🚕 {t.driver}</option>
          <option value="admin">🛡️ {t.admin}</option>
          <option value="split">⚡ {t.splitMode}</option>
          <option value="website">🌐 Public Portal</option>
        </select>
      </div>

      {/* Role / Mode Switcher Pills */}
      <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
        <button
          onClick={() => onRoleChange('rider')}
          className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
            currentRole === 'rider'
              ? 'bg-white text-brand-600 shadow-sm'
              : 'hover:text-slate-900'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>{t.rider}</span>
        </button>

        <button
          onClick={() => onRoleChange('driver')}
          className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
            currentRole === 'driver'
              ? 'bg-white text-brand-600 shadow-sm'
              : 'hover:text-slate-900'
          }`}
        >
          <Car className="w-3.5 h-3.5" />
          <span>{t.driver}</span>
        </button>

        <button
          onClick={() => onRoleChange('admin')}
          className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
            currentRole === 'admin'
              ? 'bg-white text-brand-600 shadow-sm'
              : 'hover:text-slate-900'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>{t.admin}</span>
        </button>

        <button
          onClick={() => onRoleChange('split')}
          className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
            currentRole === 'split'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{t.splitMode}</span>
        </button>

        <button
          onClick={() => onRoleChange('website')}
          className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
            currentRole === 'website'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'hover:text-slate-900 text-brand-700'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Public Portal</span>
        </button>
      </div>

      {/* Right Actions: Demo, Language, User */}
      <div className="flex items-center gap-3">
        {/* Fast 1-Click Demo */}
        <button
          onClick={onRunFastDemo}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-black py-1.5 px-3 rounded-lg shadow-sm flex items-center gap-1.5 transition transform active:scale-95"
          title="Autonomously triggers an end-to-end ride simulation"
        >
          <Zap className="w-3.5 h-3.5 fill-white" />
          <span className="hidden sm:inline">{t.fastDemo}</span>
        </button>

        {/* Multi-Language Regional Selector */}
        <div className="relative flex items-center">
          <Globe className="w-3.5 h-3.5 text-brand-600 absolute left-2 pointer-events-none" />
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value as Language)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-1.5 pl-7 pr-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer transition appearance-none"
            title="Select Regional Language"
          >
            <option value="en">English</option>
            <option value="am">አማርኛ (Amharic)</option>
            <option value="om">Afaan Oromoo</option>
            <option value="ti">ትግርኛ (Tigrinya)</option>
            <option value="so">Soomaali (Somali)</option>
            <option value="sw">Kiswahili (Swahili)</option>
          </select>
        </div>

        {/* User Badge */}
        <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-200 text-xs">
          <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-800 font-bold flex items-center justify-center text-[11px]">
            {activeUserName.charAt(0)}
          </div>
          <span className="font-semibold text-slate-700">{activeUserName}</span>
        </div>
      </div>
    </header>
  );
};
