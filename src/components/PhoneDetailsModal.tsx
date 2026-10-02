import React, { useState } from 'react';
import {
  X,
  Smartphone,
  CheckCircle2,
  Clock,
  RotateCcw,
  DollarSign,
  User,
  Calendar,
  Hash,
  Shield,
  CreditCard,
  FileText,
  Edit2,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Wrench,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { Partner, PhoneRecord, TransactionRecord } from '../types/accounting';

interface PhoneDetailsModalProps {
  phone: PhoneRecord | null;
  isOpen: boolean;
  onClose: () => void;
  partners: Partner[];
  transactions: TransactionRecord[];
  onOpenSellModal?: (phone: PhoneRecord) => void;
  onOpenReceiptModal?: (phone: PhoneRecord) => void;
  onOpenEditModal?: (phone: PhoneRecord) => void;
  onDeletePhone?: (phoneId: string) => void;
  onAddRepair?: (
    phoneId: string,
    repair: {
      description: string;
      repairCost: number;
      repairDate: string;
      paidBy: 1 | 2;
      capitalOwner?: 1 | 2;
      notes?: string;
    }
  ) => Promise<void> | void;
  onDeleteRepair?: (repairId: string) => Promise<void> | void;
}

export const PhoneDetailsModal: React.FC<PhoneDetailsModalProps> = ({
  phone,
  isOpen,
  onClose,
  partners,
  transactions,
  onOpenSellModal,
  onOpenReceiptModal,
  onOpenEditModal,
  onDeletePhone,
  onAddRepair,
  onDeleteRepair,
}) => {
  const [showAddRepairForm, setShowAddRepairForm] = useState(false);
  const [repairDesc, setRepairDesc] = useState('Screen replacement / Shaashad');
  const [repairCostInput, setRepairCostInput] = useState('');
  const [repairDateInput, setRepairDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [repairPaidByInput, setRepairPaidByInput] = useState<1 | 2>(1);
  const [repairNotesInput, setRepairNotesInput] = useState('');
  const [repairError, setRepairError] = useState('');
  const [isSubmittingRepair, setIsSubmittingRepair] = useState(false);

  if (!isOpen || !phone) return null;

  // Resolve roles
  const funderId = phone.paidBy || phone.capitalOwner || phone.purchasedBy;
  const acquirerId = phone.acquiredBy || funderId;

  const funderPartner = partners.find((p) => p.id === funderId);
  const acquirerPartner = partners.find((p) => p.id === acquirerId);

  const funderName = funderPartner ? funderPartner.name : funderId === 1 ? 'Zakariye' : 'Shariif';
  const acquirerName = acquirerPartner ? acquirerPartner.name : acquirerId === 1 ? 'Zakariye' : 'Shariif';
  const capitalOwnerName = funderName;

  const isDifferent = acquirerId !== funderId;
  const isSold = phone.status === 'Sold';
  const isReturned = phone.status === 'Returned';

  // Cost calculations
  const purchaseCost = Number(phone.purchasePrice || 0);
  const repairsList = phone.repairs || [];
  const repairsCost = repairsList.length > 0
    ? repairsList.reduce((sum, r) => sum + Number(r.repairCost || 0), 0)
    : Number(phone.repairCost || 0);
  const totalCost = phone.totalCost ?? (purchaseCost + repairsCost);
  const salePrice = Number(phone.salePrice || 0);
  const profit = isSold ? salePrice - totalCost : 0;

  // Linked transactions for this specific phone
  const phoneTxns = transactions.filter(
    (t) => t.phoneId === phone.id || (t.reference && t.reference.includes(phone.id))
  );

  const handleCreateRepair = async (e: React.FormEvent) => {
    e.preventDefault();
    setRepairError('');
    const cost = parseFloat(repairCostInput);
    if (isNaN(cost) || cost <= 0) {
      setRepairError('Fadlan geli qarashka dayactirka oo sax ah (> $0)!');
      return;
    }
    if (!repairDesc.trim()) {
      setRepairError('Fadlan qor waxa la dayactiray!');
      return;
    }

    if (!onAddRepair) {
      setRepairError('Nidaamka dayactirka lama helin');
      return;
    }

    try {
      setIsSubmittingRepair(true);
      await onAddRepair(phone.id, {
        description: repairDesc.trim(),
        repairCost: cost,
        repairDate: repairDateInput,
        paidBy: repairPaidByInput,
        capitalOwner: repairPaidByInput,
        notes: repairNotesInput.trim() || undefined,
      });

      // Reset form
      setRepairCostInput('');
      setRepairNotesInput('');
      setShowAddRepairForm(false);
    } catch (err: any) {
      setRepairError(err.message || 'Khalad ayaa dhacay intii lagu jiray kaydinta dayactirka');
    } finally {
      setIsSubmittingRepair(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-slate-900">
                  {phone.brand} {phone.model}
                </h3>
                {/* Status Badge */}
                {isSold ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>SOLD</span>
                  </span>
                ) : isReturned ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <RotateCcw className="w-3 h-3" />
                    <span>RETURNED</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    <Clock className="w-3 h-3" />
                    <span>IN STOCK</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                IMEI: <strong className="text-slate-700">{phone.imei}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6">
          {/* TOTAL COST BREAKDOWN BANNER */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-md">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
              Cost & Profit Summary (Qiimaha Guud & Faa'iidada)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-700/60">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Purchase Cost:</span>
                <span className="text-lg font-black text-white">${purchaseCost}</span>
              </div>
              <div>
                <span className="text-[10px] text-amber-300 block font-semibold">Repair Cost:</span>
                <span className="text-lg font-black text-amber-400">
                  {repairsCost > 0 ? `+$${repairsCost}` : '$0'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-blue-300 block font-semibold">Total Cost:</span>
                <span className="text-lg font-black text-blue-400">${totalCost}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-300 block font-semibold">
                  {isSold ? 'Sale Profit:' : 'Status:'}
                </span>
                {isSold ? (
                  <span className={`text-lg font-black ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {profit >= 0 ? `+$${profit}` : `-$${Math.abs(profit)}`}
                  </span>
                ) : (
                  <span className="text-sm font-bold text-slate-300 mt-1 block">In Stock</span>
                )}
              </div>
            </div>
            {isSold && (
              <p className="text-[11px] text-slate-300 mt-2.5 pt-2 border-t border-slate-700/60 font-mono">
                Formula: Sale (${salePrice}) - Total Cost (${totalCost} [Purchase ${purchaseCost} + Repairs ${repairsCost}]) = Profit (${profit})
              </p>
            )}
          </div>

          {/* DEDICATED SECTION: PURCHASE & OWNERSHIP */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-blue-600" />
                <span>Purchase & Ownership (Lafaha & Soo Qabashada)</span>
              </h4>
              {isDifferent ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                  Different Partner Funded
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                  Self-Funded
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Acquired By */}
              <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Acquired By
                </span>
                <span className="font-black text-slate-900 text-base mt-0.5 block">
                  {acquirerName}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Helay / Heshiiska galay
                </span>
              </div>

              {/* Paid By */}
              <div className="p-3 rounded-xl bg-white border border-blue-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-blue-600 block tracking-wider">
                  Paid By / Funded By
                </span>
                <span className="font-black text-blue-900 text-base mt-0.5 block">
                  {funderName}
                </span>
                <span className="text-[10px] text-blue-600 block mt-0.5">
                  Lacagta bixiyay
                </span>
              </div>

              {/* Capital Owner */}
              <div className="p-3 rounded-xl bg-white border border-emerald-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-emerald-700 block tracking-wider">
                  Capital Owner
                </span>
                <span className="font-black text-emerald-900 text-base mt-0.5 block">
                  {capitalOwnerName}
                </span>
                <span className="text-[10px] text-emerald-700 block mt-0.5">
                  Lafaha: ${phone.purchasePrice}
                </span>
              </div>
            </div>

            {/* Explanatory sentence if acquired != paid */}
            {isDifferent && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <span className="font-bold shrink-0">ℹ️</span>
                <span>
                  <strong>{acquirerName}</strong> ayaa keenay teleefankan, laakiin <strong>{funderName}</strong> ayaa bixiyay ${phone.purchasePrice}. Sidaas darteed, lafaha waxaa iska leh <strong>{funderName}</strong> oo keliya.
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
              <div className="flex justify-between p-2 rounded-lg bg-white/70 border border-slate-200/80">
                <span className="text-slate-500">Purchase Price:</span>
                <span className="font-black text-slate-900">${phone.purchasePrice}</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-white/70 border border-slate-200/80">
                <span className="text-slate-500">Purchase Date:</span>
                <span className="font-bold text-slate-800">{phone.purchaseDate}</span>
              </div>
            </div>
          </div>

          {/* DEDICATED SECTION: REPAIR / MAINTENANCE COSTS */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/50 to-orange-50/40 border border-amber-200 space-y-3.5">
            <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Repair / Maintenance Costs (Qarashka Dayactirka)
                  </h4>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Wadarta Dayactirka: <strong className="text-amber-900">${repairsCost}</strong> ({repairsList.length} dayactir)
                  </span>
                </div>
              </div>

              {onAddRepair && (
                <button
                  onClick={() => setShowAddRepairForm(!showAddRepairForm)}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddRepairForm ? 'Xir Foomka' : '+ Ku Dar Dayactir'}</span>
                </button>
              )}
            </div>

            {/* Inline Add Repair Form */}
            {showAddRepairForm && (
              <form onSubmit={handleCreateRepair} className="p-3.5 rounded-xl bg-white border border-amber-300 shadow-sm space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-amber-600" />
                    <span>Diiwaangeli Dayactir Cusub</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Dayactirka wuxuu toos ugu biirayaa lafaha teleefanka</span>
                </div>

                {repairError && (
                  <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{repairError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">
                      Faahfaahinta Dayactirka *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Tusaale: Shaashad cusub, Battery, Camera..."
                      value={repairDesc}
                      onChange={(e) => setRepairDesc(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-bold block mb-1">
                      Qarashka Dayactirka ($) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="15"
                      value={repairCostInput}
                      onChange={(e) => setRepairCostInput(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">
                      Dayactirka Bixiyay (Paid By) *
                    </label>
                    <select
                      value={repairPaidByInput}
                      onChange={(e) => setRepairPaidByInput(Number(e.target.value) as 1 | 2)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-white"
                    >
                      <option value={1}>Zakariye (Partner 1)</option>
                      <option value={2}>Shariif (Partner 2)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-700 font-bold block mb-1">
                      Taariikhda Dayactirka
                    </label>
                    <input
                      type="date"
                      value={repairDateInput}
                      onChange={(e) => setRepairDateInput(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-bold block mb-1">
                      Xusuusin (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Faahfaahin dheeraad ah..."
                      value={repairNotesInput}
                      onChange={(e) => setRepairNotesInput(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddRepairForm(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Ka noqo
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingRepair}
                    className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs cursor-pointer active:scale-95"
                  >
                    {isSubmittingRepair ? 'Keydinayaa...' : 'Keydi Dayactirka'}
                  </button>
                </div>
              </form>
            )}

            {/* List of Repairs */}
            {repairsList.length === 0 ? (
              <div className="p-4 rounded-xl bg-white border border-dashed border-amber-300 text-center">
                <p className="text-xs text-slate-600 font-semibold">
                  Teleefankani ma laha wax dayactir ah weli (No repairs recorded).
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Haddii teleefanku u baahdo shaashad, battery ama farsamo, guji "+ Ku Dar Dayactir".
                </p>
              </div>
            ) : (
              <div className="divide-y divide-amber-100 rounded-xl border border-amber-200 bg-white overflow-hidden text-xs">
                {repairsList.map((r, idx) => {
                  const rPayerName = r.paidBy === 1 ? 'Zakariye' : 'Shariif';
                  return (
                    <div key={r.id || idx} className="p-3 flex items-center justify-between hover:bg-amber-50/50 transition">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{r.description}</span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              r.paidBy === 1
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            Paid by: {rPayerName}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>Taariikh: {r.repairDate}</span>
                          {r.notes && <span>· {r.notes}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-black text-amber-900 text-sm">
                          ${r.repairCost}
                        </span>
                        {onDeleteRepair && (
                          <button
                            onClick={() => onDeleteRepair(r.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Tirtir dayactirkan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Phone Specifications Grid */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
              Phone Specifications (Xogta Farsamada)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Brand</span>
                <span className="font-bold text-slate-900">{phone.brand}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Storage</span>
                <span className="font-bold text-slate-900">{phone.storage || '128GB'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Color</span>
                <span className="font-bold text-slate-900">{phone.color || 'Standard'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Condition</span>
                <span className="font-bold text-slate-900">{phone.condition}</span>
              </div>
            </div>
          </div>

          {/* Sale Information (If sold) */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
              Sale Information (Xogta Iibka)
            </h4>
            {isSold ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <span className="text-[11px] font-bold text-emerald-700 block uppercase tracking-wider">
                    Sale Price (Qiimaha Iibka)
                  </span>
                  <span className="font-black text-emerald-800 text-2xl mt-1 block">
                    ${phone.salePrice?.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-emerald-600 block mt-0.5">
                    Taariikhda: {phone.saleDate}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <span className="text-[11px] font-bold text-emerald-700 block uppercase tracking-wider">
                    Profit (Faa'iidada Dhabta ah)
                  </span>
                  <span
                    className={`font-black text-2xl mt-1 block ${
                      profit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {profit >= 0 ? `+$${profit}` : `-$${Math.abs(profit)}`}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Sale Price (${salePrice}) - Total Cost (${totalCost})
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
                    Customer & Payment
                  </span>
                  <span className="font-bold text-slate-800 text-sm mt-1.5 block">
                    {phone.customerName || 'Macaamiil Guud'}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    {phone.paymentMethod || 'EVC Plus'}{' '}
                    {phone.customerPhone && `· ${phone.customerPhone}`}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center">
                <p className="text-xs text-slate-600 font-semibold">
                  Teleefankani weli lama iibin — wuxuu ku jiraa kaydka (IN STOCK).
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Wadarta lafaha ku jira kaydka waa ${totalCost} (Gadasho: ${purchaseCost}, Dayactir: ${repairsCost}).
                </p>
              </div>
            )}
          </div>

          {/* Notes if any */}
          {phone.notes && (
            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-xs">
              <span className="font-bold text-amber-800 block text-[11px] mb-0.5">
                Xusuusin (Notes):
              </span>
              <p className="text-amber-900">{phone.notes}</p>
            </div>
          )}

          {/* Complete Transaction History for this phone */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
              Transaction History (Taariikhda Dhaqdhaqaaqa)
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
              {phoneTxns.length === 0 ? (
                <div className="p-3.5 text-center text-slate-400">
                  <span>Dhaqdhaqaaq gaar ah laguma helin xog-keydka</span>
                </div>
              ) : (
                phoneTxns.map((t) => (
                  <div key={t.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                          t.impact === 'INFLOW'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {t.impact === 'INFLOW' ? (
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block">{t.type}</span>
                        <span className="text-[11px] text-slate-500">{t.description}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-900 text-sm">${t.amount}</span>
                      <span className="text-[10px] text-slate-400 block">{t.date}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {onDeletePhone && (
              <button
                onClick={() => {
                  onDeletePhone(phone.id);
                  onClose();
                }}
                className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Tirtir</span>
              </button>
            )}

            {onOpenEditModal && (
              <button
                onClick={() => {
                  onOpenEditModal(phone);
                  onClose();
                }}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 border border-slate-200 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Wax ka beddel</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isSold && onOpenReceiptModal && (
              <button
                onClick={() => {
                  onOpenReceiptModal(phone);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Rasiidka Iibka</span>
              </button>
            )}

            {!isSold && !isReturned && onOpenSellModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSellModal(phone);
                }}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer active:scale-95"
              >
                <DollarSign className="w-4 h-4" />
                <span>Iibi Teleefankan</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Xir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
