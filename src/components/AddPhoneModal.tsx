import React, { useState } from 'react';
import { X, Smartphone, DollarSign, AlertCircle, Sparkles, Hash, User, Wallet, CheckCircle2 } from 'lucide-react';
import { Partner, PhoneCondition, PhoneRecord } from '../types/accounting';

interface AddPhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  partners: Partner[];
  onAddPhone: (phone: Omit<PhoneRecord, 'id' | 'status'>) => void;
  existingPhones: PhoneRecord[];
}

export const AddPhoneModal: React.FC<AddPhoneModalProps> = ({
  isOpen,
  onClose,
  partners,
  onAddPhone,
  existingPhones,
}) => {
  // Ownership roles
  const [acquiredBy, setAcquiredBy] = useState<1 | 2>(1); // 1 = Zakariye, 2 = Shariif
  const [paidBy, setPaidBy] = useState<1 | 2>(1); // 1 = Zakariye, 2 = Shariif

  // Phone information
  const [imei, setImei] = useState('');
  const [brand, setBrand] = useState('Apple');
  const [model, setModel] = useState('');
  const [storage, setStorage] = useState('128GB');
  const [color, setColor] = useState('');
  const [condition, setCondition] = useState<PhoneCondition>('Grade A (Nadiif)');

  // Purchase information
  const [purchasePrice, setPurchasePrice] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const popularModels = [
    { name: 'iPhone 13', brand: 'Apple' },
    { name: 'iPhone 12', brand: 'Apple' },
    { name: 'iPhone 11', brand: 'Apple' },
    { name: 'iPhone X', brand: 'Apple' },
    { name: 'Samsung Galaxy S21', brand: 'Samsung' },
    { name: 'Samsung Galaxy A32', brand: 'Samsung' },
    { name: 'Redmi Note 12', brand: 'Xiaomi' },
    { name: 'Pixel 6', brand: 'Google' },
  ];

  const handleGenerateImei = () => {
    const randomImei = `35${Math.floor(1000000000000 + Math.random() * 9000000000000)}`;
    setImei(randomImei);
    setError('');
  };

  const capitalOwnerName = paidBy === 1 ? 'Zakariye' : 'Shariif';
  const acquiredByName = acquiredBy === 1 ? 'Zakariye' : 'Shariif';
  const paidByName = paidBy === 1 ? 'Zakariye' : 'Shariif';
  const isCrossFunded = acquiredBy !== paidBy;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!model.trim()) {
      setError('Fadlan qor model-ka teleefanka!');
      return;
    }

    const priceNum = parseFloat(purchasePrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Fadlan geli qiimaha lafaha oo sax ah (tusaale $50 ama $80)!');
      return;
    }

    const cleanImei = imei.trim();
    if (cleanImei) {
      const duplicate = existingPhones.find(
        (p) => p.imei.toLowerCase() === cleanImei.toLowerCase()
      );
      if (duplicate) {
        setError(`IMEI "${cleanImei}" horey ayaa loogu diiwaangeliyay (${duplicate.model})!`);
        return;
      }
    }

    const finalImei = cleanImei || `IMEI-${Math.floor(100000000000000 + Math.random() * 900000000000000)}`;

    onAddPhone({
      imei: finalImei,
      brand,
      model: model.trim(),
      storage,
      color: color.trim() || undefined,
      condition,
      purchasePrice: priceNum,
      acquiredBy,
      paidBy,
      capitalOwner: paidBy, // Capital Owner automatically = Paid By
      purchasedBy: paidBy, // keep legacy field synced
      purchaseDate,
      notes: notes.trim() || undefined,
    });

    // Reset & close
    setModel('');
    setPurchasePrice('');
    setImei('');
    setColor('');
    setNotes('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900">
                Qabashada Teleefan Cusub (Add Phone)
              </h3>
              <p className="text-xs text-slate-500">
                Diiwaangeli teleefanka, qofka keenay (Acquired By), iyo qofka lacagta bixiyay (Paid By)
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* SECTION 1: PHONE INFORMATION */}
          <div className="space-y-3">
            <div className="border-b border-slate-100 pb-1.5 flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-600">
                1. Phone Information (Xogta Teleefanka)
              </h4>
              <span className="text-[10px] text-slate-400">Model, IMEI, Storage</span>
            </div>

            {/* IMEI Input with quick generator */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700">
                  Lambarka IMEI (Serial)
                </label>
                <button
                  type="button"
                  onClick={handleGenerateImei}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  <Hash className="w-3 h-3" />
                  <span>Generate IMEI</span>
                </button>
              </div>
              <input
                type="text"
                placeholder="Tusaale: 354892019482701"
                value={imei}
                onChange={(e) => setImei(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
              />
            </div>

            {/* Brand & Model */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Brand *
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
                  <option value="OnePlus">OnePlus</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Model-ka Teleefanka *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Tusaale: iPhone 13, Galaxy S21..."
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900"
                />
              </div>
            </div>

            {/* Quick model chips */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {popularModels.map((item) => (
                <button
                  type="button"
                  key={item.name}
                  onClick={() => {
                    setModel(item.name);
                    setBrand(item.brand);
                  }}
                  className="px-2 py-0.5 text-[10px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition cursor-pointer"
                >
                  {item.name}
                </button>
              ))}
            </div>

            {/* Storage, Color & Condition */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Storage
                </label>
                <select
                  value={storage}
                  onChange={(e) => setStorage(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                >
                  <option value="64GB">64GB</option>
                  <option value="128GB">128GB</option>
                  <option value="256GB">256GB</option>
                  <option value="512GB">512GB</option>
                  <option value="1TB">1TB</option>
                  <option value="32GB">32GB</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Color (Midabka)
                </label>
                <input
                  type="text"
                  placeholder="Midnight Black"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Condition
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as PhoneCondition)}
                  className="w-full px-2 py-2 rounded-xl border border-slate-200 text-[11px] font-semibold bg-white truncate"
                >
                  <option value="Grade A (Nadiif)">Grade A (Nadiif)</option>
                  <option value="Grade B (Dhex-dhexaad)">Grade B (Dhex-dhexaad)</option>
                  <option value="Grade C (Cillad yar)">Grade C (Cillad yar)</option>
                  <option value="Brand New">Brand New</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: PURCHASE INFORMATION */}
          <div className="space-y-3">
            <div className="border-b border-slate-100 pb-1.5 flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-600">
                2. Purchase Information (Xogta Iibsashada)
              </h4>
              <span className="text-[10px] text-slate-400">Price & Date</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Purchase Price (Qiimaha Lafaha $) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="Tusaale: 50 ama 80"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Purchase Date (Taariikhda) *
                </label>
                <input
                  type="date"
                  required
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: OWNERSHIP / RESPONSIBILITY (Acquired By & Paid By) */}
          <div className="space-y-3">
            <div className="border-b border-slate-100 pb-1.5 flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-600">
                3. Ownership / Responsibility (Lafaha & Soo Qabashada)
              </h4>
              <span className="text-[10px] text-blue-600 font-bold">Two-Role Model</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Acquired By Dropdown */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Acquired By (Qofka Keenay) *</span>
                </label>
                <select
                  value={acquiredBy}
                  onChange={(e) => setAcquiredBy(Number(e.target.value) as 1 | 2)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                >
                  <option value={1}>Zakariye</option>
                  <option value={2}>Shariif</option>
                </select>
                <p className="text-[10px] text-slate-500">
                  Partner-ka helay, heshiiska soo galay, ama keenay teleefanka.
                </p>
              </div>

              {/* Paid By Dropdown */}
              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 space-y-1.5">
                <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-blue-700" />
                  <span>Paid By / Funded By (Lacag Bixiyaha) *</span>
                </label>
                <select
                  value={paidBy}
                  onChange={(e) => setPaidBy(Number(e.target.value) as 1 | 2)}
                  className="w-full px-3 py-2 rounded-xl border border-blue-300 text-xs font-bold bg-white text-blue-900"
                >
                  <option value={1}>Zakariye</option>
                  <option value={2}>Shariif</option>
                </select>
                <p className="text-[10px] text-blue-700">
                  Partner-ka lacagta bixiyay ee lafahiisa ay ka go'day.
                </p>
              </div>
            </div>

            {/* Dynamic Capital Owner Display */}
            <div className="p-3.5 rounded-xl bg-slate-900 text-white border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Capital Owner (Automatically = Paid By)
                </span>
                <span className="text-sm font-black text-emerald-400">
                  {capitalOwnerName}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  {isCrossFunded
                    ? `${acquiredByName} ayaa keenay, laakiin lafaha waxaa iska leh ${paidByName} oo lacagta bixiyay.`
                    : `${capitalOwnerName} ayaa keenay teleefanka isla markaana lacagtiisa ku iibiyay.`}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-400 block">Lafaha:</span>
                <span className="text-lg font-black text-white">
                  ${purchasePrice || '0'}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Xusuusin / Notes (Ikhtiyaari)
            </label>
            <input
              type="text"
              placeholder="Faahfaahin dheeri ah oo ku saabsan teleefankan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Ka Noqo
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer active:scale-95 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Diiwaangeli Teleefanka</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
