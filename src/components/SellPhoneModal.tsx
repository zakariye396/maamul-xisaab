import React, { useState } from 'react';
import { X, DollarSign, CheckCircle2, AlertCircle, Sparkles, User, Phone, CreditCard, ArrowRight, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PaymentMethod, PhoneRecord } from '../types/accounting';

interface SellPhoneModalProps {
  phone: PhoneRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmSell: (
    phoneId: string,
    saleData: {
      salePrice: number;
      saleDate: string;
      customerName?: string;
      customerPhone?: string;
      paymentMethod?: PaymentMethod;
      notes?: string;
    }
  ) => void;
}

export const SellPhoneModal: React.FC<SellPhoneModalProps> = ({
  phone,
  isOpen,
  onClose,
  onConfirmSell,
}) => {
  if (!isOpen || !phone) return null;

  const partnerName = phone.purchasedBy === 1 ? 'Zakariye' : 'Shariif';
  const [salePrice, setSalePrice] = useState<string>('');
  const [saleDate, setSaleDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('EVC Plus');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'confirm'>('form');

  const salePriceNum = parseFloat(salePrice) || 0;
  const profit = salePriceNum - phone.purchasePrice;

  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (salePriceNum <= 0) {
      setError('Fadlan geli qiimaha iibka!');
      return;
    }
    setError('');
    setStep('confirm');
  };

  const handleFinalSubmit = () => {
    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }

    onConfirmSell(phone.id, {
      salePrice: salePriceNum,
      saleDate,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      paymentMethod,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900">
                {step === 'confirm' ? 'Xaqiijinta Iibka (Confirmation Summary)' : `Iibi Teleefanka (${phone.model})`}
              </h3>
              <p className="text-xs text-slate-500">
                {step === 'confirm'
                  ? 'Fadlan hubi xisaabta ka hor inta aadan dhameystirin'
                  : 'Geli qiimaha iibka si loo xisaabiyo faa\'iidada'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {step === 'form' ? (
          <form onSubmit={handleProceedToConfirm} className="p-5 sm:p-6 space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Original Phone Info Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block">Teleefanka & IMEI:</span>
                <h4 className="font-black text-slate-900 text-sm">{phone.brand} {phone.model}</h4>
                <span className="text-[11px] font-mono text-slate-500">{phone.imei}</span>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">Lafaha {partnerName}:</span>
                <span className="text-lg font-black text-blue-700">${phone.purchasePrice}</span>
              </div>
            </div>

            {/* Selling Price Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                Qiimaha Lagu Iibinayo (Sale Price $) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">
                  $
                </span>
                <input
                  type="number"
                  step="any"
                  required
                  autoFocus
                  placeholder="Tusaale: 70 ama 110"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 border-emerald-500/40 font-black text-xl text-slate-900 focus:outline-hidden focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-600 bg-emerald-50/20"
                />
              </div>
            </div>

            {/* Live calculation preview */}
            {salePriceNum > 0 && (
              <div className="p-3.5 rounded-xl bg-slate-900 text-white border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Purchase Price:</span>
                  <span className="font-bold text-blue-400">${phone.purchasePrice}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Sale Price:</span>
                  <span className="font-bold text-white">${salePriceNum}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-800 font-bold">
                  <span className="text-emerald-400">Profit:</span>
                  <span className={profit >= 0 ? 'text-emerald-400 text-sm' : 'text-rose-400 text-sm'}>
                    {profit >= 0 ? `+$${profit}` : `-$${Math.abs(profit)}`}
                  </span>
                </div>
              </div>
            )}

            {/* Sale Date & Payment Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Taariikhda Iibka
                </label>
                <input
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Habka Lacag Bixinta
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                >
                  <option value="EVC Plus">EVC Plus</option>
                  <option value="Zaad">Zaad</option>
                  <option value="Sahal">Sahal</option>
                  <option value="eDahab">eDahab</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Customer Info (Optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Magaca Macaamiilka (Ikhtiyaari)
                </label>
                <input
                  type="text"
                  placeholder="Axmed Cali"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Teleefanka Macaamiilka (Ikhtiyaari)
                </label>
                <input
                  type="text"
                  placeholder="+252 61..."
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Xusuusin / Notes
              </label>
              <input
                type="text"
                placeholder="Faahfaahin dheeri ah..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            {/* Form Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Ka Noqo
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                <span>Xaqiiji Iibka (Review)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          /* STEP 2: CONFIRMATION SUMMARY (Section 11) */
          <div className="p-5 sm:p-6 space-y-5">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Teleefanka La Iibinayo
              </span>
              <h4 className="font-black text-slate-900 text-base">
                {phone.brand} {phone.model}
              </h4>
              <p className="text-xs font-mono text-slate-500">IMEI: {phone.imei}</p>
              <p className="text-xs text-blue-700 font-semibold mt-1">
                Lafaha Qofka: <strong>{partnerName}</strong>
              </p>
            </div>

            {/* The exact confirmation summary required by Section 11 */}
            <div className="p-5 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-3.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Confirmation Summary</span>
              </div>

              <div className="space-y-2.5 text-sm pt-1 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Purchase Price:</span>
                  <span className="font-black text-blue-400 text-base">
                    ${phone.purchasePrice}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Sale Price:</span>
                  <span className="font-black text-white text-base">
                    ${salePriceNum}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-emerald-400 font-bold">Profit:</span>
                  <span
                    className={`font-black text-xl ${
                      profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {profit >= 0 ? `+$${profit}` : `-$${Math.abs(profit)}`}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                <span>Macaamiil: <strong>{customerName || 'Macaamiil Guud'}</strong></span>
                <span className="mx-1.5">·</span>
                <span>Habka: <strong>{paymentMethod}</strong></span>
              </div>
            </div>

            {/* Exactly: [Cancel] [Complete Sale] */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 flex items-center gap-1.5 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Dib ugu noqo</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/20 transition cursor-pointer active:scale-95 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Complete Sale</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
