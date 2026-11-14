import React, { useState, useEffect } from 'react';
import {
  Wallet,
  CreditCard,
  Smartphone,
  Building,
  ArrowUpRight,
  RefreshCw,
  PlusCircle,
  History,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Globe,
  Zap,
} from 'lucide-react';
import {
  PassengerWallet,
  PassengerWalletTransaction,
  PassengerTopupRail,
} from '@shared/types';
import { sounds } from '../../utils/audio';

interface PassengerWalletModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onBalanceUpdated?: (balance: number) => void;
}

export const PassengerWalletModal: React.FC<PassengerWalletModalProps> = ({
  userId,
  isOpen,
  onClose,
  onBalanceUpdated,
}) => {
  const [wallet, setWallet] = useState<PassengerWallet | null>(null);
  const [transactions, setTransactions] = useState<PassengerWalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'topup' | 'history'>('topup');
  const [selectedRail, setSelectedRail] = useState<PassengerTopupRail>('TELEBIRR');

  // Topup form states
  const [amountEtb, setAmountEtb] = useState('500');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // International card states
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');
  const [cardholderName, setCardholderName] = useState('Abebe Bikila');
  const [cardBrand, setCardBrand] = useState<'VISA' | 'MASTERCARD' | 'AMEX'>('VISA');
  const [usdExchangeRate, setUsdExchangeRate] = useState(138.5);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [walRes, txRes, rateRes] = await Promise.all([
        fetch(`/api/wallet/${userId}`),
        fetch(`/api/wallet/${userId}/transactions`),
        fetch(`/api/wallet-meta/exchange-rate`),
      ]);

      const walData = await walRes.json();
      const txData = await txRes.json();
      const rateData = await rateRes.json();

      if (walData.wallet) {
        setWallet(walData.wallet);
        if (onBalanceUpdated) onBalanceUpdated(walData.wallet.balanceEtb);
      }
      if (txData.transactions) setTransactions(txData.transactions);
      if (rateData.exchangeRate) setUsdExchangeRate(rateData.exchangeRate);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch wallet data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      fetchWalletData();
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);
    setSuccessMsg(null);

    const etb = parseFloat(amountEtb);
    if (!etb || etb <= 0) {
      setError('Please enter a valid amount');
      setIsProcessing(false);
      return;
    }

    try {
      const payload: any = {
        amountEtb: etb,
        rail: selectedRail,
      };

      if (selectedRail === 'INTERNATIONAL_CARD') {
        const usdAmount = Number((etb / usdExchangeRate).toFixed(2));
        payload.cardDetails = {
          brand: cardBrand,
          last4: cardNumber.replace(/\D/g, '').slice(-4) || '4242',
          sourceCurrency: 'USD',
          sourceAmount: usdAmount,
          exchangeRate: usdExchangeRate,
        };
      }

      const res = await fetch(`/api/wallet/${userId}/topup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Top-up failed');

      sounds.playPaymentSuccess();
      setWallet(data.wallet);
      if (onBalanceUpdated) onBalanceUpdated(data.wallet.balanceEtb);
      setSuccessMsg(`Successfully credited ${etb.toFixed(2)} ETB to your Chebelew Wallet!`);
      await fetchWalletData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const calculatedUsd = (parseFloat(amountEtb || '0') / usdExchangeRate).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Header: Passenger Wallet Banner */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 p-5 text-white relative">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <Wallet className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight">Chebelew Passenger Wallet</h2>
                <span className="text-[11px] text-emerald-200/80">Instant 1-Click Ride Checkout</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white text-xs font-bold px-2 py-1 bg-white/10 rounded-lg"
            >
              ✕ Close
            </button>
          </div>

          {/* Current Balance Display */}
          <div className="mt-3 bg-white/10 rounded-2xl p-3.5 backdrop-blur-sm flex justify-between items-center">
            <div>
              <span className="text-[11px] text-emerald-100/90 uppercase tracking-wider block font-semibold">Available Balance</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-3xl font-black text-white">
                  {(wallet?.balanceEtb || 0).toFixed(2)}
                </span>
                <span className="text-xs font-bold text-emerald-200">ETB</span>
              </div>
            </div>
            <div className="text-right text-[11px] text-emerald-100/80 space-y-0.5">
              <div>Total Loaded: <strong className="text-white">{(wallet?.totalToppedUpEtb || 0).toFixed(0)} ETB</strong></div>
              <div>Total Spent: <strong className="text-white">{(wallet?.totalSpentEtb || 0).toFixed(0)} ETB</strong></div>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('topup')}
            className={`flex-1 py-3 text-center border-b-2 transition flex items-center justify-center gap-1.5 ${
              activeTab === 'topup'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            <span>Top Up Balance</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 text-center border-b-2 transition flex items-center justify-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4 text-slate-500" />
            <span>Wallet History</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {activeTab === 'topup' && (
            <form onSubmit={handleTopup} className="space-y-4">
              {/* Rail Selection */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Choose Top-Up Rail</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRail('TELEBIRR')}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold flex flex-col justify-between transition ${
                      selectedRail === 'TELEBIRR'
                        ? 'border-[#0070ba] bg-blue-50 text-blue-900'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-[#0070ba] mb-1" />
                    <span>Telebirr</span>
                    <span className="text-[10px] font-normal text-slate-500">Mobile Push</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRail('CBE_BIRR')}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold flex flex-col justify-between transition ${
                      selectedRail === 'CBE_BIRR'
                        ? 'border-purple-600 bg-purple-50 text-purple-900'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Building className="w-4 h-4 text-purple-600 mb-1" />
                    <span>CBE Birr</span>
                    <span className="text-[10px] font-normal text-slate-500">Direct Bank</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRail('INTERNATIONAL_CARD')}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold flex flex-col justify-between transition ${
                      selectedRail === 'INTERNATIONAL_CARD'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Globe className="w-4 h-4 text-emerald-600 mb-1" />
                    <span>Intl Card</span>
                    <span className="text-[10px] font-normal text-slate-500">Visa / MC</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRail('APPLE_PAY')}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold flex flex-col justify-between transition ${
                      selectedRail === 'APPLE_PAY'
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Zap className="w-4 h-4 text-amber-400 mb-1" />
                    <span>Pay / POS</span>
                    <span className={`text-[10px] font-normal ${selectedRail === 'APPLE_PAY' ? 'text-slate-300' : 'text-slate-500'}`}>1-Touch Tap</span>
                  </button>
                </div>
              </div>

              {/* Amount Shortcuts */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Top-Up Amount (ETB)</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {['250', '500', '1000', '2500'].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmountEtb(amt)}
                      className={`py-2 text-xs font-bold rounded-lg border transition ${
                        amountEtb === amt
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {amt} ETB
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={amountEtb}
                    onChange={(e) => setAmountEtb(e.target.value)}
                    placeholder="Enter custom amount in ETB"
                    className="w-full text-sm font-bold border border-slate-300 rounded-xl p-3 pr-16 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    required
                  />
                  <span className="absolute right-3.5 top-3.5 text-xs font-bold text-slate-400">
                    ETB
                  </span>
                </div>
              </div>

              {/* International Card Form Details */}
              {selectedRail === 'INTERNATIONAL_CARD' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 animate-in fade-in text-xs">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      Global Card Processing (Stripe / Cybersource)
                    </span>
                    <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      1 USD = {usdExchangeRate} ETB
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {(['VISA', 'MASTERCARD', 'AMEX'] as const).map((brand) => (
                      <button
                        key={brand}
                        type="button"
                        onClick={() => setCardBrand(brand)}
                        className={`px-3 py-1 text-[11px] font-bold rounded-lg border transition ${
                          cardBrand === brand
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-slate-300 text-slate-600'
                        }`}
                      >
                        {brand}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 font-semibold block mb-1">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4242 •••• •••• 4242"
                      className="w-full font-mono text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-600 font-semibold block mb-1">Expires (MM/YY)</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="12/28"
                        className="w-full font-mono text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-600 font-semibold block mb-1">CVV</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="•••"
                        className="w-full font-mono text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Charged to Card:</span>
                    <span className="font-bold text-slate-900">${calculatedUsd} USD</span>
                  </div>
                </div>
              )}

              {/* Apple Pay Form View */}
              {selectedRail === 'APPLE_PAY' && (
                <div className="bg-slate-900 text-white rounded-2xl p-4 text-center space-y-2 animate-in fade-in">
                  <div className="text-sm font-bold">Apple Pay Instant Biometric Top-Up</div>
                  <p className="text-xs text-slate-300">
                    Authenticate via TouchID or FaceID on your device to instantly fund your Chebelew wallet.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isProcessing || !amountEtb}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 shadow"
              >
                {isProcessing ? 'Processing Top-Up...' : `Top Up ${amountEtb} ETB to Wallet`}
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              {transactions.length === 0 ? (
                <div className="text-center p-8 text-xs text-slate-400">
                  No wallet transactions recorded yet.
                </div>
              ) : (
                transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-800">{tx.description}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {tx.reference}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-black font-mono text-sm ${
                          tx.amountEtb >= 0 ? 'text-emerald-600' : 'text-slate-800'
                        }`}
                      >
                        {tx.amountEtb >= 0 ? `+${tx.amountEtb.toFixed(2)}` : tx.amountEtb.toFixed(2)} ETB
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400">
                        Balance: {tx.balanceAfterEtb.toFixed(2)} ETB
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
