import React, { useState, useEffect } from 'react';
import { X, Edit2, AlertCircle, User, Wallet } from 'lucide-react';
import { PhoneCondition, PhoneRecord, PhoneStatus } from '../types/accounting';

interface EditPhoneModalProps {
  phone: PhoneRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdatePhone: (updatedPhone: PhoneRecord) => void;
  existingPhones: PhoneRecord[];
}

export const EditPhoneModal: React.FC<EditPhoneModalProps> = ({
  phone,
  isOpen,
  onClose,
  onUpdatePhone,
  existingPhones,
}) => {
  const [model, setModel] = useState('');
  const [brand, setBrand] = useState('Apple');
  const [imei, setImei] = useState('');
  const [storage, setStorage] = useState('128GB');
  const [color, setColor] = useState('');
  const [condition, setCondition] = useState<PhoneCondition>('Grade A (Nadiif)');
  const [acquiredBy, setAcquiredBy] = useState<1 | 2>(1);
  const [paidBy, setPaidBy] = useState<1 | 2>(1);
  const [purchasePrice, setPurchasePrice] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState<string>('');
  const [status, setStatus] = useState<PhoneStatus>('In Stock');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (phone) {
      setModel(phone.model);
      setBrand(phone.brand);
      setImei(phone.imei);
      setStorage(phone.storage);
      setColor(phone.color || '');
      setCondition(phone.condition);
      setPaidBy(phone.paidBy || phone.capitalOwner || phone.purchasedBy || 1);
      setAcquiredBy(phone.acquiredBy || phone.purchasedBy || 1);
      setPurchasePrice(String(phone.purchasePrice));
      setPurchaseDate(phone.purchaseDate);
      setStatus(phone.status);
      setNotes(phone.notes || '');
      setError('');
    }
  }, [phone]);

  if (!isOpen || !phone) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(purchasePrice);
    if (!model.trim()) {
      setError('Fadlan geli magaca teleefanka!');
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Fadlan geli qiimaha lafaha oo sax ah!');
      return;
    }

    // Check IMEI conflict
    const cleanImei = imei.trim();
    if (cleanImei && cleanImei !== phone.imei) {
      const duplicate = existingPhones.find(
        (p) => p.id !== phone.id && p.imei.toLowerCase() === cleanImei.toLowerCase()
      );
      if (duplicate) {
        setError(`IMEI "${cleanImei}" horey ayaa loogu diiwaangeliyay (${duplicate.model})!`);
        return;
      }
    }

    onUpdatePhone({
      ...phone,
      model: model.trim(),
      brand,
      imei: cleanImei,
      storage,
      color: color.trim() || undefined,
      condition,
      acquiredBy,
      paidBy,
      capitalOwner: paidBy,
      purchasedBy: paidBy,
      purchasePrice: priceNum,
      purchaseDate,
      status,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100">
              <Edit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900">
                Wax ka beddel Teleefanka ({phone.model})
              </h3>
              <p className="text-xs text-slate-500">
                Cusboonaysii xogta teleefanka, lafaha, ama qofka soo qabtay
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

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Model & Brand */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Brand
              </label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
              >
                <option value="Apple">Apple</option>
                <option value="Samsung">Samsung</option>
                <option value="Xiaomi">Xiaomi</option>
                <option value="Google">Google</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Model *
              </label>
              <input
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900"
              />
            </div>
          </div>

          {/* IMEI & Storage */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                IMEI
              </label>
              <input
                type="text"
                value={imei}
                onChange={(e) => setImei(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Storage
              </label>
              <input
                type="text"
                value={storage}
                onChange={(e) => setStorage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>

          {/* Ownership Roles: Acquired By & Paid By */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Acquired By (Keenay)</span>
              </label>
              <select
                value={acquiredBy}
                onChange={(e) => setAcquiredBy(Number(e.target.value) as 1 | 2)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-white"
              >
                <option value={1}>Zakariye</option>
                <option value={2}>Shariif</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-blue-900 flex items-center gap-1 mb-1">
                <Wallet className="w-3.5 h-3.5 text-blue-700" />
                <span>Paid By (Lafaha Bixiyay)</span>
              </label>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(Number(e.target.value) as 1 | 2)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-blue-300 text-xs font-bold bg-white text-blue-900"
              >
                <option value={1}>Zakariye</option>
                <option value={2}>Shariif</option>
              </select>
            </div>
          </div>

          {/* Price, Date & Status */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Purchase Price ($) *
              </label>
              <input
                type="number"
                step="any"
                required
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Purchase Date
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PhoneStatus)}
                className="w-full px-2 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
              >
                <option value="In Stock">In Stock</option>
                <option value="Sold">Sold</option>
                <option value="Returned">Returned</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Xusuusin / Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Ka Noqo
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer active:scale-95"
            >
              Keydi Isbeddelka
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
