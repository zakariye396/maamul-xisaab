import React from 'react';
import { X, Printer, CheckCircle, Smartphone } from 'lucide-react';
import { PhoneRecord } from '../types/accounting';

interface ReceiptModalProps {
  phone: PhoneRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ phone, isOpen, onClose }) => {
  if (!isOpen || !phone) return null;

  const handlePrint = () => {
    window.print();
  };

  const partnerName = phone.purchasedBy === 1 ? 'Zakariye' : 'Shariif';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between no-print">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Rasiidka Iibka Teleefanka
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-blue-700 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Daabac (Print)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Area */}
        <div id="receipt-area" className="p-6 space-y-6 text-slate-800">
          <div className="text-center pb-4 border-b border-dashed border-slate-300">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto mb-2">
              <Smartphone className="w-6 h-6" />
            </div>
            <h2 className="font-black text-base text-slate-900">
              DUKAANKA TELEEFANNADA GACAN-KU-GALKA
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Shuraakada: Zakariye & Shariif</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Mogadishu, Somalia • Tel: +252 61 500 0000</p>
            <div className="mt-3 inline-block px-3 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-bold">
              RASIID #{phone.id}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Macaamiilka:</span>
              <span className="font-bold text-slate-900">{phone.customerName || 'Macaamiil Guud'}</span>
              {phone.customerPhone && (
                <span className="text-slate-500 block text-[11px]">{phone.customerPhone}</span>
              )}
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Taariikhda Iibka:</span>
              <span className="font-bold text-slate-900">{phone.saleDate || phone.purchaseDate}</span>
              <span className="text-slate-500 block text-[11px]">
                Habka: {phone.paymentMethod || 'EVC Plus'}
              </span>
            </div>
          </div>

          <div className="border-t border-b border-slate-200 py-3 space-y-2 text-xs">
            <div className="flex justify-between font-bold text-slate-900 text-sm">
              <span>{phone.model}</span>
              <span>${phone.salePrice}</span>
            </div>

            <div className="text-[11px] text-slate-500 space-y-0.5 font-mono">
              <div className="flex justify-between">
                <span>IMEI:</span>
                <span className="font-medium text-slate-700">{phone.imei}</span>
              </div>
              <div className="flex justify-between">
                <span>Storage:</span>
                <span className="font-sans font-medium text-slate-700">{phone.storage}</span>
              </div>
              <div className="flex justify-between">
                <span>Xaaladda:</span>
                <span className="font-sans font-semibold text-slate-700">{phone.condition}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1 text-right">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Wadarta Guud:</span>
              <span className="font-bold">${phone.salePrice}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-100">
              <span>Lacagta La Bixiyay:</span>
              <span className="text-emerald-600">${phone.salePrice}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-500 space-y-1">
            <div className="font-bold text-slate-700 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Damaanad (Warranty) & Shuruudo:</span>
            </div>
            <p>1. Teleefankan wuxuu leeyahay 3 maalmood oo tijaabo ah (Check Warranty).</p>
            <p>2. Shaashadda jaban ama biyo galay damaanad ma laha.</p>
            <p>3. Mahadsanid, ku soo dhawoow dukaanka Zakariye & Shariif!</p>
          </div>
        </div>
      </div>
    </div>
  );
};
