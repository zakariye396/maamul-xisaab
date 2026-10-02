import React, { useState, useMemo } from 'react';
import {
  Users,
  Smartphone,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  Eye,
  Filter,
  Wallet,
  Wrench,
  RotateCcw,
} from 'lucide-react';
import { AccountingSummary, Partner, PhoneRecord, TransactionRecord } from '../types/accounting';
import { PhoneDetailsModal } from './PhoneDetailsModal';

interface PartnersViewProps {
  summary: AccountingSummary;
  partners: Partner[];
  phones: PhoneRecord[];
  transactions?: TransactionRecord[];
  onOpenSellModal: (phone: PhoneRecord) => void;
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

export const PartnersView: React.FC<PartnersViewProps> = ({
  summary,
  partners,
  phones,
  transactions = [],
  onOpenSellModal,
  onAddRepair,
  onDeleteRepair,
}) => {
  const [selectedPartnerId, setSelectedPartnerId] = useState<1 | 2>(1);
  const [phoneFilterRole, setPhoneFilterRole] = useState<'ALL' | 'FUNDED' | 'ACQUIRED'>('ALL');
  const [inspectedPhone, setInspectedPhone] = useState<PhoneRecord | null>(null);

  const activePartner = partners.find((p) => p.id === selectedPartnerId) || partners[0];

  // Helper to determine funder and acquirer
  const getFunder = (p: PhoneRecord): number => p.paidBy || p.capitalOwner || p.purchasedBy;
  const getAcquirer = (p: PhoneRecord): number => p.acquiredBy || p.purchasedBy;

  // Partner phones based on selected filter
  const partnerPhones = useMemo(() => {
    return phones.filter((p) => {
      const isFunder = getFunder(p) === selectedPartnerId;
      const isAcquirer = getAcquirer(p) === selectedPartnerId;

      if (phoneFilterRole === 'FUNDED') return isFunder;
      if (phoneFilterRole === 'ACQUIRED') return isAcquirer;
      return isFunder || isAcquirer;
    });
  }, [phones, selectedPartnerId, phoneFilterRole]);

  // Keep details modal synchronized with live phones list
  const activeInspectedPhone = useMemo(() => {
    if (!inspectedPhone) return null;
    return phones.find((p) => p.id === inspectedPhone.id) || inspectedPhone;
  }, [phones, inspectedPhone]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Xisaabta Partners-ka (Zakariye & Shariif)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Lafaha teleefanka (Purchase + Repairs) waxaa iska leh qofka dhab ahaan u bixiyay (Funded By).
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setSelectedPartnerId(1)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              selectedPartnerId === 1
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center font-black text-[10px]">
              Z
            </div>
            <span>Zakariye</span>
          </button>

          <button
            onClick={() => setSelectedPartnerId(2)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              selectedPartnerId === 2
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center font-black text-[10px]">
              S
            </div>
            <span>Shariif</span>
          </button>
        </div>
      </div>

      {/* COMBINED TOTAL CAPITAL BANNER (Section 6 Example) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-4.5 text-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 text-indigo-300 flex items-center justify-center font-black">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider block">
              Combined Capital Attribution (Wadarta Lafaha Labada Shuraako)
            </span>
            <span className="text-xl sm:text-2xl font-black text-white">
              ${summary.totalCapital.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs border-t sm:border-t-0 sm:border-l border-white/10 pt-2 sm:pt-0 sm:pl-4">
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">Purchase Capital:</span>
            <span className="font-bold text-white">${summary.totalPurchaseCapital}</span>
          </div>
          <span className="text-slate-500 font-bold">+</span>
          <div>
            <span className="text-[10px] text-amber-300 block font-semibold">Repair Capital:</span>
            <span className="font-bold text-amber-300">${summary.totalRepairCapital}</span>
          </div>
          <span className="text-slate-500 font-bold">=</span>
          <div>
            <span className="text-[10px] text-emerald-300 block font-semibold">Total Capital:</span>
            <span className="font-black text-emerald-400">${summary.totalCapital}</span>
          </div>
        </div>
      </div>

      {/* Side-by-Side Partner Summary Cards (Section 6: Partner Reporting) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* ZAKARIYE CARD */}
        <div
          onClick={() => setSelectedPartnerId(1)}
          className={`bg-white rounded-2xl p-6 border-2 transition-all cursor-pointer ${
            selectedPartnerId === 1
              ? 'border-blue-600 shadow-md ring-2 ring-blue-500/20'
              : 'border-slate-200 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-base flex items-center justify-center shadow-md shadow-blue-500/20">
                Z
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900">ZAKARIYE</h3>
                <span className="text-xs text-blue-600 font-bold">Partner 1</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                Total: ${summary.zakariyeTotalCapital}
              </span>
            </div>
          </div>

          {/* Section 6 Exact Fields: Purchase Capital, Repair Capital, Total Capital, Acquired, In Stock, Sold */}
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Purchase Capital Funded (Lafaha Gadashada):</span>
              <span className="font-bold text-slate-900 text-sm">
                ${summary.zakariyePurchaseCapital}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600 font-medium flex items-center gap-1">
                <Wrench className="w-3.5 h-3.5 text-amber-600" />
                <span>Repair Capital Funded (Lafaha Dayactirka):</span>
              </span>
              <span className="font-bold text-amber-700 text-sm">
                ${summary.zakariyeRepairCapital}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 bg-blue-50/50 px-2 rounded-lg">
              <span className="text-blue-900 font-bold">Total Capital Funded (Wadarta Lafaha):</span>
              <span className="font-black text-blue-700 text-sm">
                ${summary.zakariyeTotalCapital}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Phones Acquired (Teleefannada uu keenay):</span>
              <span className="font-bold text-slate-900">
                {summary.zakariyePhonesAcquired}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Phones Currently In Stock:</span>
              <span className="font-bold text-blue-700">
                {summary.zakariyeInStockCount}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Phones Sold:</span>
              <span className="font-bold text-emerald-700">
                {summary.zakariyeSoldCount}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-600 font-medium">Inventory Cost (Hadda Kaydka ku jira):</span>
              <span className="font-black text-slate-900 text-sm">
                ${summary.zakariyeInStockCapital}
              </span>
            </div>
          </div>
        </div>

        {/* SHARIIF CARD */}
        <div
          onClick={() => setSelectedPartnerId(2)}
          className={`bg-white rounded-2xl p-6 border-2 transition-all cursor-pointer ${
            selectedPartnerId === 2
              ? 'border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
              : 'border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-base flex items-center justify-center shadow-md shadow-emerald-500/20">
                S
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900">SHARIIF</h3>
                <span className="text-xs text-emerald-600 font-bold">Partner 2</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                Total: ${summary.shariifTotalCapital}
              </span>
            </div>
          </div>

          {/* Section 6 Exact Fields: Purchase Capital, Repair Capital, Total Capital, Acquired, In Stock, Sold */}
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Purchase Capital Funded (Lafaha Gadashada):</span>
              <span className="font-bold text-slate-900 text-sm">
                ${summary.shariifPurchaseCapital}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600 font-medium flex items-center gap-1">
                <Wrench className="w-3.5 h-3.5 text-amber-600" />
                <span>Repair Capital Funded (Lafaha Dayactirka):</span>
              </span>
              <span className="font-bold text-amber-700 text-sm">
                ${summary.shariifRepairCapital}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 bg-emerald-50/50 px-2 rounded-lg">
              <span className="text-emerald-900 font-bold">Total Capital Funded (Wadarta Lafaha):</span>
              <span className="font-black text-emerald-700 text-sm">
                ${summary.shariifTotalCapital}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Phones Acquired (Teleefannada uu keenay):</span>
              <span className="font-bold text-slate-900">
                {summary.shariifPhonesAcquired}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Phones Currently In Stock:</span>
              <span className="font-bold text-emerald-700">
                {summary.shariifInStockCount}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Phones Sold:</span>
              <span className="font-bold text-emerald-700">
                {summary.shariifSoldCount}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-600 font-medium">Inventory Cost (Hadda Kaydka ku jira):</span>
              <span className="font-black text-slate-900 text-sm">
                ${summary.shariifInStockCapital}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Partner's Detailed Phones Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-base text-slate-900">
              Teleefannada Ku Xiran: {activePartner.name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Liiska teleefannada uu {activePartner.name} lacagtiisa ku bixiyay (Funded) ama uu gacanta ku soo qabtay (Acquired)
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setPhoneFilterRole('ALL')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                phoneFilterRole === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              Dhammaan ({partnerPhones.length})
            </button>
            <button
              onClick={() => setPhoneFilterRole('FUNDED')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                phoneFilterRole === 'FUNDED' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500'
              }`}
            >
              Lafaha uu bixiyay ({selectedPartnerId === 1 ? summary.zakariyePhonesCount : summary.shariifPhonesCount})
            </button>
            <button
              onClick={() => setPhoneFilterRole('ACQUIRED')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                phoneFilterRole === 'ACQUIRED' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500'
              }`}
            >
              Uu soo qabtay ({selectedPartnerId === 1 ? summary.zakariyePhonesAcquired : summary.shariifPhonesAcquired})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Teleefanka</th>
                <th className="py-3 px-4">IMEI</th>
                <th className="py-3 px-4">Acquired By</th>
                <th className="py-3 px-4">Paid By (Capital)</th>
                <th className="py-3 px-4">Purchase Cost</th>
                <th className="py-3 px-4">Repair Cost</th>
                <th className="py-3 px-4">Total Cost</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {partnerPhones.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Wax teleefan ah laguma helin qaybtaan.
                  </td>
                </tr>
              ) : (
                partnerPhones.map((phone) => {
                  const isFunder = getFunder(phone) === selectedPartnerId;
                  const isAcquirer = getAcquirer(phone) === selectedPartnerId;
                  const funderId = phone.paidBy || phone.capitalOwner || phone.purchasedBy;
                  const acquirerId = phone.acquiredBy || funderId;
                  const funderName = funderId === 1 ? 'Zakariye' : 'Shariif';
                  const acquirerName = acquirerId === 1 ? 'Zakariye' : 'Shariif';

                  const purchaseCost = Number(phone.purchasePrice || 0);
                  const repairCost = Number(phone.repairCost || 0);
                  const totalCost = phone.totalCost ?? (purchaseCost + repairCost);

                  return (
                    <tr key={phone.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setInspectedPhone(phone)}
                          className="font-bold text-slate-900 hover:text-blue-600 transition cursor-pointer text-left block"
                        >
                          {phone.brand} {phone.model}
                        </button>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {phone.storage}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-600 font-semibold text-xs">
                        {phone.imei}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            acquirerId === 1
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {acquirerName}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            funderId === 1
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {funderName}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-800">
                        ${purchaseCost}
                      </td>

                      <td className="py-3 px-4">
                        {repairCost > 0 ? (
                          <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            ${repairCost}
                          </span>
                        ) : (
                          <span className="text-slate-400">$0</span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-black text-slate-900 text-sm">
                        ${totalCost}
                      </td>

                      <td className="py-3 px-4">
                        {phone.status === 'Sold' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>SOLD</span>
                          </span>
                        ) : phone.status === 'Returned' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                            <RotateCcw className="w-3 h-3" />
                            <span>RETURNED</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                            <Clock className="w-3 h-3" />
                            <span>IN STOCK</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setInspectedPhone(phone)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                            title="Xogta buuxda & Dayactirka"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {phone.status === 'In Stock' && (
                            <button
                              onClick={() => onOpenSellModal(phone)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                            >
                              Iibi
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Phone Details Modal */}
      <PhoneDetailsModal
        phone={activeInspectedPhone}
        isOpen={!!inspectedPhone}
        onClose={() => setInspectedPhone(null)}
        partners={partners}
        transactions={transactions}
        onOpenSellModal={onOpenSellModal}
        onAddRepair={onAddRepair}
        onDeleteRepair={onDeleteRepair}
      />
    </div>
  );
};
