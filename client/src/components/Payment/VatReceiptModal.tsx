import React from 'react';
import { CheckCircle, Printer, X, ShieldCheck } from 'lucide-react';
import { Ride } from '@shared/types';

interface VatReceiptModalProps {
  ride: Ride;
  isOpen: boolean;
  onClose: () => void;
}

export const VatReceiptModal: React.FC<VatReceiptModalProps> = ({ ride, isOpen, onClose }) => {
  if (!isOpen) return null;

  const fare = ride.fare;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        {/* Receipt Header */}
        <div className="bg-slate-900 text-white p-5 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="inline-block p-1.5 bg-emerald-500/20 rounded-full mb-2">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-lg font-bold">Official Electronic VAT Tax Receipt</h2>
          <p className="text-xs text-slate-400 font-mono">
            FDRE Ministry of Revenues Reg. No. 570/2025
          </p>
        </div>

        {/* Receipt Details */}
        <div className="p-6 text-xs text-slate-600 space-y-4">
          <div className="text-center pb-3 border-b border-dashed border-slate-200">
            <div className="font-bold text-slate-800 text-sm">CHEBELEW TECHNOLOGIES ETHIOPIA PLC</div>
            <div>Bole Sub-City, Woreda 03, Addis Ababa, Ethiopia</div>
            <div className="font-mono text-[11px] text-slate-500 mt-1">
              TIN: 0089234199 | VAT Reg: 889102-VAT | Permit: MOT-71113
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-400 block">Trip Reference:</span>
              <span className="font-mono font-bold text-slate-700">{ride.id}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Date & Time:</span>
              <span className="font-semibold text-slate-700">
                {new Date(ride.createdAt).toLocaleString('en-US', { timeZone: 'Africa/Addis_Ababa' })}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Passenger:</span>
              <span className="font-semibold text-slate-700">{ride.riderName} ({ride.riderPhone})</span>
            </div>
            <div>
              <span className="text-slate-400 block">Driver & Taxi:</span>
              <span className="font-semibold text-slate-700">
                {ride.driver?.fullName || 'Assigned Driver'} ({ride.driver?.vehiclePlate || 'Taxi'})
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg space-y-1.5 border border-slate-100">
            <div className="flex justify-between">
              <span className="text-slate-500">Pickup:</span>
              <span className="font-medium text-slate-700 text-right truncate max-w-[200px]">
                {ride.pickup.address}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Destination:</span>
              <span className="font-medium text-slate-700 text-right truncate max-w-[200px]">
                {ride.destination.address}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200 text-slate-500">
              <span>Distance & Duration:</span>
              <span className="font-medium text-slate-700">
                {ride.distanceKm} km (~{ride.durationMinutes} mins)
              </span>
            </div>
          </div>

          {/* Itemized Fare Table */}
          <div className="border-t border-b border-slate-200 py-2.5 space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between">
              <span>Base Tariff:</span>
              <span>{fare.baseFare.toFixed(2)} ETB</span>
            </div>
            <div className="flex justify-between">
              <span>Distance Fee ({fare.distanceKm} km):</span>
              <span>{fare.distanceFare.toFixed(2)} ETB</span>
            </div>
            <div className="flex justify-between">
              <span>Time Fee ({fare.durationMinutes} min):</span>
              <span>{fare.timeFare.toFixed(2)} ETB</span>
            </div>
            <div className="flex justify-between font-semibold text-slate-800 pt-1 border-t border-slate-100">
              <span>Net Ride Subtotal:</span>
              <span>{fare.subtotal.toFixed(2)} ETB</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded">
              <span>15% VAT (Reg. No. 570/2025):</span>
              <span>+{fare.vatAmount.toFixed(2)} ETB</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-slate-900 pt-1.5 border-t border-dashed border-slate-300">
              <span className="font-sans">Total Amount Paid:</span>
              <span>{fare.totalFare.toFixed(2)} ETB</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <div>
              <span>Payment Mode: </span>
              <strong className="text-slate-800 uppercase">{ride.paymentMethod}</strong>
              {ride.telebirrTransactionNo && (
                <div className="text-[10px] font-mono text-blue-600">
                  Ref: {ride.telebirrTransactionNo}
                </div>
              )}
            </div>
            <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              PAID & REMITTED
            </span>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex gap-3">
            <button
              onClick={() => window.print()}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition"
            >
              <Printer className="w-4 h-4" />
              Print Receipt
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-bold py-2 px-3 rounded-lg text-xs transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
