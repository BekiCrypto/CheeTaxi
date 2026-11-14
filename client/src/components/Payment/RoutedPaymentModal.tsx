import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Smartphone,
  Building,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  QrCode,
  Wallet,
  CreditCard,
  Copy,
  Check,
  Receipt,
  Sparkles,
} from 'lucide-react';
import { Ride, PaymentMethod, PaymentAuditRecord } from '@shared/types';
import { sounds } from '../../utils/audio';

interface RoutedPaymentModalProps {
  ride: Ride;
  isOpen: boolean;
  userId: string;
  userPhone: string;
  onSuccess: (audit: PaymentAuditRecord) => void;
  onClose: () => void;
  onOpenWalletModal?: () => void;
}

export const RoutedPaymentModal: React.FC<RoutedPaymentModalProps> = ({
  ride,
  isOpen,
  userId,
  userPhone,
  onSuccess,
  onClose,
  onOpenWalletModal,
}) => {
  const [routedOrder, setRoutedOrder] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('TELEBIRR');
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [pin, setPin] = useState('1234');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [auditRecord, setAuditRecord] = useState<PaymentAuditRecord | null>(null);

  // Fetch routing order and passenger wallet
  useEffect(() => {
    if (!isOpen || !ride) return;

    // Fetch passenger wallet
    fetch(`/api/wallet/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.wallet) setWalletBalance(data.wallet.balanceEtb);
      })
      .catch(console.error);

    // Call route-order API
    fetch('/api/payment/route-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rideId: ride.id,
        payerPhone: userPhone,
        paymentMethod: ride.paymentMethod || 'TELEBIRR',
        amountEtb: ride.fare.totalFare,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.order) {
          setRoutedOrder(data.order);
          if (data.order.qrPayload) {
            QRCode.toDataURL(data.order.qrPayload, {
              width: 180,
              margin: 1,
              color: {
                dark: data.order.routingDestination === 'DRIVER_DIRECT' ? '#047857' : '#004c82',
                light: '#ffffff',
              },
            })
              .then(setQrDataUrl)
              .catch(console.error);
          }
        }
      })
      .catch((err) => setError(err.message));
  }, [isOpen, ride, userId, userPhone]);

  if (!isOpen || !ride) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleAuthorizePayment = async () => {
    if (!routedOrder) return;
    setIsProcessing(true);
    setError(null);

    try {
      if (selectedMethod === 'WALLET') {
        // Pay using passenger wallet
        const res = await fetch(`/api/wallet/${userId}/pay-ride`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rideId: ride.id,
            amountEtb: routedOrder.amountEtb,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Wallet payment failed');

        sounds.playPaymentSuccess();
        const settledAudit = data.auditRecord;
        setAuditRecord(settledAudit);
        onSuccess(settledAudit);
      } else {
        // Standard routed payment confirm
        const res = await fetch('/api/payment/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: routedOrder.orderId,
            success: true,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Payment authorization failed');

        sounds.playPaymentSuccess();
        setAuditRecord(data.auditRecord);
        onSuccess(data.auditRecord);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const isDriverDirect = routedOrder?.routingDestination === 'DRIVER_DIRECT';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Dynamic Header */}
        <div
          className={`p-5 text-white text-center relative ${
            isDriverDirect
              ? 'bg-gradient-to-r from-emerald-800 to-teal-900'
              : 'bg-gradient-to-r from-[#004c82] to-[#0070ba]'
          }`}
        >
          <div className="flex items-center justify-center gap-2 mb-1.5">
            <div className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-bold text-xs flex items-center gap-1 backdrop-blur-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
              <span>
                {isDriverDirect ? '100% Direct Driver Payment (0% Platform Fee)' : 'Chebelew Corporate Billing'}
              </span>
            </div>
          </div>

          <h2 className="text-xl font-black">
            {isDriverDirect ? 'Direct-to-Driver Checkout' : 'Platform Payment Gateway'}
          </h2>
          <p className="text-xs text-emerald-100/80">
            {isDriverDirect
              ? 'Your fare goes directly to the driver with Ethiopian tax compliance'
              : 'Corporate account billing with VAT settlement'}
          </p>

          {/* Amount Badge */}
          <div className="mt-3 bg-white/10 rounded-xl p-2.5 backdrop-blur-sm inline-block min-w-[200px]">
            <span className="text-[11px] text-white/80 block uppercase tracking-wider font-semibold">Total Fare to Pay</span>
            <span className="text-3xl font-extrabold text-white">
              {(routedOrder?.amountEtb || ride.fare.totalFare).toFixed(2)}{' '}
              <span className="text-sm font-semibold">ETB</span>
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="bg-rose-50 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2 border border-rose-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {auditRecord ? (
            /* Digital Compliance Receipt Screen */
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 space-y-4 animate-in zoom-in-95">
              <div className="text-center space-y-1">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h3 className="font-black text-emerald-900 text-base">Payment Settled Successfully!</h3>
                <span className="text-xs font-mono bg-white px-2.5 py-1 rounded-full text-emerald-700 border border-emerald-200 font-bold inline-block">
                  {auditRecord.complianceReference}
                </span>
              </div>

              <div className="bg-white rounded-xl p-3.5 space-y-2 text-xs border border-emerald-100">
                <div className="flex justify-between text-slate-600">
                  <span>Routing Channel:</span>
                  <strong className="text-slate-800">{auditRecord.routingDestination}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Fare Subtotal:</span>
                  <span className="font-mono">{auditRecord.fareSubtotalEtb.toFixed(2)} ETB</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>15% VAT (Reg. No. 570/2025):</span>
                  <span className="font-mono font-bold text-emerald-700">{auditRecord.vatAmountEtb.toFixed(2)} ETB</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax Settlement Mode:</span>
                  <span className="font-medium text-slate-800">{auditRecord.taxRoutingDestination}</span>
                </div>
                <div className="flex justify-between text-slate-600 pt-1 border-t">
                  <span className="font-bold text-slate-900">Total Settled:</span>
                  <span className="font-black text-slate-900 text-sm font-mono">{auditRecord.amountEtb.toFixed(2)} ETB</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition shadow"
              >
                Close & View Trip Summary
              </button>
            </div>
          ) : (
            <>
              {/* If Driver Direct: Showcase Driver's Verified Rails */}
              {isDriverDirect && routedOrder?.driverRails && (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Driver's Verified Payment Rails
                    </span>
                    <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                      {routedOrder.driverRails.primaryRail}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-semibold">Telebirr Number:</span>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="font-mono font-bold text-slate-800">{routedOrder.driverRails.telebirrPhone}</span>
                        <button
                          onClick={() => copyToClipboard(routedOrder.driverRails.telebirrPhone, 'tb')}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          {copiedKey === 'tb' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-semibold">CBE Account:</span>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="font-mono font-bold text-slate-800">{routedOrder.driverRails.cbeAccountNumber}</span>
                        <button
                          onClick={() => copyToClipboard(routedOrder.driverRails.cbeAccountNumber, 'cbe')}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          {copiedKey === 'cbe' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 flex justify-between items-center px-1">
                    <span>Payee: <strong className="text-slate-700">{routedOrder.receiverTitle}</strong></span>
                    <span>VAT (15%): <strong className="text-emerald-700 font-mono">{(routedOrder.vatAmountEtb || 0).toFixed(2)} ETB</strong></span>
                  </div>
                </div>
              )}

              {/* Payment Method Tabs */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">Select How You Want to Pay</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('TELEBIRR')}
                    className={`p-3 rounded-xl border text-left text-xs transition flex flex-col justify-between ${
                      selectedMethod === 'TELEBIRR'
                        ? 'border-[#0070ba] bg-blue-50/70 text-blue-900 font-bold'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Smartphone className="w-4 h-4 text-[#0070ba]" />
                      <span>Telebirr</span>
                    </div>
                    <span className="text-[10px] font-normal text-slate-500">Direct Push / QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('WALLET')}
                    className={`p-3 rounded-xl border text-left text-xs transition flex flex-col justify-between ${
                      selectedMethod === 'WALLET'
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 font-bold'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Wallet className="w-4 h-4 text-emerald-600" />
                      <span>Chebelew Wallet</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700">
                      {walletBalance !== null ? `${walletBalance.toFixed(2)} ETB` : 'Funded Wallet'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('CARD')}
                    className={`p-3 rounded-xl border text-left text-xs transition flex flex-col justify-between ${
                      selectedMethod === 'CARD'
                        ? 'border-purple-600 bg-purple-50/70 text-purple-900 font-bold'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <CreditCard className="w-4 h-4 text-purple-600" />
                      <span>Card / POS</span>
                    </div>
                    <span className="text-[10px] font-normal text-slate-500">Intl Card / POS Tap</span>
                  </button>
                </div>
              </div>

              {/* Method Detail View: Telebirr Direct USSD / QR */}
              {selectedMethod === 'TELEBIRR' && (
                <div className="space-y-3">
                  <div className="flex flex-col items-center justify-center bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 mb-1.5">
                      <QrCode className="w-4 h-4 text-emerald-700" />
                      <span>Scan with Telebirr / CBE SuperApp</span>
                    </div>
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="Direct QR" className="w-32 h-32 rounded-lg shadow-sm border border-slate-200" />
                    ) : (
                      <div className="w-32 h-32 bg-slate-200 animate-pulse rounded-lg" />
                    )}
                    <span className="text-[10px] text-slate-400 mt-1">Open SuperApp &gt; Scan &gt; Confirm Direct Transfer</span>
                  </div>

                  <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100 flex items-start gap-2.5">
                    <Smartphone className="w-4 h-4 text-emerald-700 mt-0.5 flex-shrink-0" />
                    <div className="text-xs">
                      <div className="font-bold text-emerald-900">Direct USSD Code</div>
                      <div className="text-emerald-700 font-mono text-[11px] font-bold mt-0.5">
                        {routedOrder?.ussdPushCode || `*127*1*${routedOrder?.payerPhone}#`}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Method Detail View: Wallet */}
              {selectedMethod === 'WALLET' && (
                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Available Wallet Balance:</span>
                    <span className="text-base font-black text-emerald-800 font-mono">
                      {(walletBalance || 0).toFixed(2)} ETB
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Fare Deduction:</span>
                    <span className="font-bold text-rose-600 font-mono">
                      -{(routedOrder?.amountEtb || ride.fare.totalFare).toFixed(2)} ETB
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t border-emerald-200 pt-2 font-bold">
                    <span className="text-slate-800">Remaining Balance:</span>
                    <span className="text-emerald-900 font-mono">
                      {((walletBalance || 0) - (routedOrder?.amountEtb || ride.fare.totalFare)).toFixed(2)} ETB
                    </span>
                  </div>

                  {(walletBalance || 0) < (routedOrder?.amountEtb || ride.fare.totalFare) && (
                    <div className="bg-amber-100/70 text-amber-900 p-2.5 rounded-lg text-[11px] flex items-center justify-between">
                      <span>Insufficient wallet balance.</span>
                      {onOpenWalletModal && (
                        <button
                          onClick={onOpenWalletModal}
                          className="font-bold text-amber-950 underline hover:text-amber-800"
                        >
                          Top Up Now
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Method Detail View: International Card / POS */}
              {selectedMethod === 'CARD' && (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5 text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <CreditCard className="w-4 h-4 text-purple-600" />
                    <span>In-Car POS / International Card</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Driver is equipped with a digital POS terminal accepting Visa, Mastercard, and Apple Pay contactless taps.
                  </p>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 font-mono text-[11px] flex justify-between items-center">
                    <span className="text-slate-500">USD Equivalent (@ 138.5):</span>
                    <span className="font-bold text-slate-900">
                      ${((routedOrder?.amountEtb || ride.fare.totalFare) / 138.5).toFixed(2)} USD
                    </span>
                  </div>
                </div>
              )}

              {/* Authorize Action Button */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAuthorizePayment}
                  disabled={
                    isProcessing ||
                    (selectedMethod === 'WALLET' && (walletBalance || 0) < (routedOrder?.amountEtb || ride.fare.totalFare))
                  }
                  className={`flex-1 py-3 px-4 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 shadow ${
                    isDriverDirect
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-[#0070ba] hover:bg-[#004c82]'
                  }`}
                >
                  {isProcessing ? (
                    <span>Authorizing Payment...</span>
                  ) : (
                    <>
                      <span>
                        Authorize Direct Payment ({(routedOrder?.amountEtb || ride.fare.totalFare).toFixed(2)} ETB)
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
