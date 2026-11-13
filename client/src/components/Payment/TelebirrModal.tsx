import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Smartphone, CheckCircle, AlertCircle, ArrowRight, ShieldCheck, QrCode } from 'lucide-react';
import { TelebirrOrder } from '@shared/types';
import { sounds } from '../../utils/audio';

interface TelebirrModalProps {
  order: TelebirrOrder;
  isOpen: boolean;
  onSuccess: (order: TelebirrOrder) => void;
  onClose: () => void;
}

export const TelebirrModal: React.FC<TelebirrModalProps> = ({
  order,
  isOpen,
  onSuccess,
  onClose,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [pin, setPin] = useState('1234');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (order.qrPayload) {
      QRCode.toDataURL(order.qrPayload, {
        width: 200,
        margin: 2,
        color: {
          dark: '#004c82',
          light: '#ffffff',
        },
      })
        .then(setQrDataUrl)
        .catch(console.error);
    }
  }, [order]);

  if (!isOpen) return null;

  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const res = await fetch('/api/telebirr/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.orderId, success: true }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Payment failed');
      }

      sounds.playPaymentSuccess();
      onSuccess(data.order);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
        {/* Telebirr Official Header */}
        <div className="bg-gradient-to-r from-[#004c82] to-[#0070ba] text-white p-5 text-center relative">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-white text-[#0070ba] font-black flex items-center justify-center text-sm shadow">
              tb
            </div>
            <h2 className="text-xl font-bold tracking-tight">telebirr (ቴሌብር)</h2>
          </div>
          <p className="text-xs text-blue-100">Ethio Telecom Mobile Money Gateway</p>
          <div className="mt-3 bg-white/10 rounded-lg p-2.5 backdrop-blur-sm">
            <span className="text-xs text-blue-100 block">Amount to Pay</span>
            <span className="text-2xl font-extrabold text-white">
              {order.amountEtb.toFixed(2)} <span className="text-sm font-semibold">ETB</span>
            </span>
          </div>
        </div>

        {/* Payment Body */}
        <div className="p-6 space-y-5">
          <div className="text-xs text-slate-500 flex justify-between items-center border-b pb-2">
            <span>Merchant: <strong className="text-slate-700">Chebelew Technologies PLC</strong></span>
            <span>Trade No: <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">{order.outTradeNo}</code></span>
          </div>

          {/* QR Code Scan Option */}
          <div className="flex flex-col items-center justify-center bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
              <QrCode className="w-4 h-4 text-[#0070ba]" />
              Scan QR in Telebirr SuperApp
            </div>
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Telebirr Payment QR" className="w-36 h-36 rounded-lg shadow-sm" />
            ) : (
              <div className="w-36 h-36 bg-slate-200 animate-pulse rounded-lg" />
            )}
            <span className="text-[11px] text-slate-400 mt-2">Open Telebirr &gt; Scan &gt; Confirm</span>
          </div>

          {/* USSD Push Option */}
          <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-100 flex items-start gap-3">
            <Smartphone className="w-5 h-5 text-[#0070ba] mt-0.5 flex-shrink-0" />
            <div className="text-xs">
              <div className="font-semibold text-blue-900">Direct USSD Push</div>
              <div className="text-blue-700 mt-0.5 font-mono text-[11px]">
                {order.ussdPushCode}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                A prompt will appear on phone <strong>{order.payerPhone}</strong>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 text-rose-700 p-2.5 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Simulate User Authorization */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Telebirr PIN"
                className="w-28 text-center tracking-widest font-bold border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#0070ba] focus:outline-none"
              />
              <button
                onClick={handleSimulatePayment}
                disabled={isProcessing}
                className="flex-1 bg-[#0070ba] hover:bg-[#004c82] text-white font-bold py-2.5 px-4 rounded-lg text-sm flex items-center justify-center gap-2 transition disabled:opacity-60 shadow"
              >
                {isProcessing ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <span>Authorize Payment</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                256-Bit INSA Verified Gateway
              </span>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-500 hover:text-slate-800 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
