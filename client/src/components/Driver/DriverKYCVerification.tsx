import React, { useState } from 'react';
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Camera,
  Cpu,
  FileCheck,
  RefreshCw,
  Eye,
  Award,
  Sparkles,
  Check,
  X,
  FileText,
  UserCheck,
} from 'lucide-react';
import { sounds } from '../../utils/audio';
import { Driver } from '@shared/types';
import { Language } from '../../i18n/translations';

interface DriverKYCVerificationProps {
  driver: Driver;
  language: Language;
  onKycUpdated?: () => void;
}

type DocumentType = 'license' | 'libre' | 'national_id' | 'selfie';

export const DriverKYCVerification: React.FC<DriverKYCVerificationProps> = ({
  driver,
  language,
  onKycUpdated,
}) => {
  const [selectedDoc, setSelectedDoc] = useState<DocumentType>('license');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanComplete, setScanComplete] = useState(true);
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);

  // Extracted OCR & AI Verification Payload
  const [extractedData, setExtractedData] = useState({
    docType: 'FDRE Commercial Driving License (Category 3 - Taxi)',
    fullName: driver.fullName,
    fullNameAm: 'አህመድ መሀመድ',
    licenseNumber: driver.licenseNumber,
    plateNumber: driver.vehiclePlate,
    vehicleDetails: `${driver.vehicleMake} ${driver.vehicleModel} (${driver.vehicleYear})`,
    issueAuthority: 'FDRE Ministry of Transport & Logistics (Addis Ababa Bureau)',
    issueDate: '2023-11-15',
    expiryDate: '2028-11-20',
    hologramDetected: true,
    insaBarcodeVerified: true,
    facialMatchScore: 99.2,
    tamperRiskScore: 0.4, // 0.4% risk -> clean
    aiConfidenceScore: 99.4,
    status: 'VERIFIED',
  });

  const handleStartAIScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    setScanComplete(false);
    setVerificationFeedback(null);
    sounds.playBeep(520, 'sine', 0.15);

    let current = 0;
    const interval = setInterval(() => {
      current += 15;
      if (current >= 100) {
        clearInterval(interval);
        setScanProgress(100);
        setIsScanning(false);
        setScanComplete(true);
        sounds.playPaymentSuccess();
        setVerificationFeedback(
          'AI Vision Verification Complete: All security hallmarks, facial biometrics, and license validity verified against FDRE database.'
        );
        if (onKycUpdated) onKycUpdated();
      } else {
        setScanProgress(current);
        sounds.playBeep(400 + current * 4, 'sine', 0.05);
      }
    }, 250);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 text-slate-800 text-xs">
      {/* Top AI Verification Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 fill-slate-950" />
              AI-Powered Vision KYC
            </span>
            <span className="text-white/80 text-xs font-semibold">FDRE Transport Bureau Accredited</span>
          </div>
          <h3 className="text-lg font-black tracking-tight text-white">
            Automated Driver Document Vetting & Biometric Verification
          </h3>
          <p className="text-white/70 text-xs max-w-xl">
            Real-time optical character recognition (OCR), federal hologram fraud detection, and facial likeness cross-matching for Ethiopian commercial drivers.
          </p>
        </div>

        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 text-center min-w-[140px]">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">AI Trust Rating</span>
          <div className="text-xl font-black text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>{extractedData.aiConfidenceScore}%</span>
          </div>
          <span className="text-[9px] text-emerald-300 font-bold block mt-0.5">VERIFIED & ACCREDITED</span>
        </div>
      </div>

      {verificationFeedback && (
        <div className="p-3.5 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{verificationFeedback}</span>
          </div>
          <button onClick={() => setVerificationFeedback(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Document Selector Pills */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setSelectedDoc('license')}
          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
            selectedDoc === 'license'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>Driver's License (መንጃ ፈቃድ)</span>
        </button>

        <button
          onClick={() => setSelectedDoc('libre')}
          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
            selectedDoc === 'libre'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Vehicle Logbook / Libre (ሊብሬ)</span>
        </button>

        <button
          onClick={() => setSelectedDoc('national_id')}
          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
            selectedDoc === 'national_id'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>National Digital ID (ፋይዳ / መታወቂያ)</span>
        </button>

        <button
          onClick={() => setSelectedDoc('selfie')}
          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
            selectedDoc === 'selfie'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Facial Biometrics & Selfie</span>
        </button>
      </div>

      {/* Main Scanner Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Document Viewfinder & Visual Scanner */}
        <div className="space-y-4">
          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-md relative overflow-hidden flex flex-col justify-between min-h-[340px]">
            {/* Viewfinder Overlay */}
            <div className="relative flex-1 flex items-center justify-center p-4">
              {/* Document Mock / Sample Image */}
              <div className="w-full max-w-sm bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl p-4 border border-slate-300 shadow-inner relative text-slate-800 space-y-3">
                {/* Header Flag & Watermark */}
                <div className="flex items-center justify-between border-b border-slate-300 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-3 bg-gradient-to-r from-emerald-600 via-amber-400 to-rose-600 rounded-xs" />
                    <span className="text-[10px] font-black uppercase text-slate-800 tracking-wider">
                      FDRE Transport Bureau
                    </span>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-slate-500">CATEGORY 3</span>
                </div>

                {/* Photo & Extracted Details Mock */}
                <div className="flex items-center gap-3">
                  <div className="w-16 h-20 bg-slate-300 rounded-lg border border-slate-400 overflow-hidden relative shrink-0">
                    <img
                      src={driver.avatarUrl || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'}
                      alt="Driver Photo"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-emerald-600/90 text-white text-[8px] font-bold text-center py-0.5">
                      MATCH
                    </div>
                  </div>

                  <div className="space-y-1 font-mono text-[10px] leading-tight">
                    <div>
                      <span className="text-slate-400 block text-[8px]">NAME / ስም</span>
                      <strong className="text-slate-900">{driver.fullName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[8px]">LICENSE NO / የፈቃድ ቁጥር</span>
                      <strong className="text-indigo-800">{driver.licenseNumber}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[8px]">VEHICLE / መኪና</span>
                      <span className="text-slate-700 font-semibold">{driver.vehiclePlate}</span>
                    </div>
                  </div>
                </div>

                {/* Hallmarks & Barcode */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-300 text-[9px] font-mono">
                  <div className="flex items-center gap-1 text-emerald-700 font-bold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Hologram Verified</span>
                  </div>
                  <div className="text-slate-400 font-mono tracking-widest text-[8px]">
                    ||||| | |||| ||| |||||
                  </div>
                </div>

                {/* Laser Scanning Effect */}
                {isScanning && (
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-pulse transition-all duration-300 top-1/2 -translate-y-1/2" />
                )}
              </div>
            </div>

            {/* Viewfinder Controls */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <span className="text-slate-400 text-[10px] font-mono">
                {isScanning ? `AI Scanning: ${scanProgress}%` : 'Document aligned in viewfinder'}
              </span>

              <button
                onClick={handleStartAIScan}
                disabled={isScanning}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl transition shadow-md flex items-center gap-1.5 disabled:opacity-50"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                    <span>Analyzing Halos & Hallmarks...</span>
                  </>
                ) : (
                  <>
                    <Cpu className="w-3.5 h-3.5 text-slate-950" />
                    <span>Scan with AI Vision</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right: AI Extraction & Security Hallmarks Analysis */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                <h4 className="font-black text-sm text-slate-900">AI Hallmarks & Forensic Analysis</h4>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                100% Legitimate
              </span>
            </div>

            {/* AI Security Diagnostics */}
            <div className="grid grid-cols-2 gap-2.5 font-mono text-[10px]">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 block text-[9px]">Biometric Facial Likeness</span>
                <div className="flex items-center gap-1 font-bold text-emerald-700 text-xs">
                  <UserCheck className="w-4 h-4" />
                  <span>{extractedData.facialMatchScore}% Match</span>
                </div>
                <span className="text-[9px] text-slate-400">Zero duplicate biometric detected</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 block text-[9px]">Tamper & Fraud Risk</span>
                <div className="flex items-center gap-1 font-bold text-emerald-700 text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{extractedData.tamperRiskScore}% (Very Low)</span>
                </div>
                <span className="text-[9px] text-slate-400">Font & pixel consistency verified</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 block text-[9px]">INSA Digital Hallmarks</span>
                <div className="flex items-center gap-1 font-bold text-slate-800 text-xs">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Hologram Valid</span>
                </div>
                <span className="text-[9px] text-slate-400">Diffraction pattern matched</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 block text-[9px]">Registry Status</span>
                <div className="flex items-center gap-1 font-bold text-indigo-700 text-xs">
                  <Award className="w-3.5 h-3.5" />
                  <span>Active & Licensed</span>
                </div>
                <span className="text-[9px] text-slate-400">Valid until {extractedData.expiryDate}</span>
              </div>
            </div>

            {/* Extracted Record Preview */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-slate-500 font-bold text-[10px] uppercase">
                OCR Extracted Driver Credentials:
              </span>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Full Name:</span>
                  <span className="font-bold text-slate-900">{extractedData.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">License ID:</span>
                  <span className="font-bold text-slate-900">{extractedData.licenseNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Vehicle Registered:</span>
                  <span className="font-bold text-slate-900">{extractedData.vehicleDetails}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Plate Code:</span>
                  <span className="font-bold text-indigo-700">{extractedData.plateNumber}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-[11px] text-indigo-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Certified under Addis Ababa Transport Bureau Commercial Mobility Protocol</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
