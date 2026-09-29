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
} from 'lucide-react';
import { AccountingSummary, Partner, PhoneRecord, TransactionRecord } from '../types/accounting';
import { PhoneDetailsModal } from './PhoneDetailsModal';

interface PartnersViewProps {
  summary: AccountingSummary;
  partners: Partner[];
  phones: PhoneRecord[];
  transactions?: TransactionRecord[];
  onOpenSellModal: (phone: PhoneRecord) => void;
}

export const PartnersView: React.FC<PartnersViewProps> = ({
  summary,
  partners,
  phones,
  transactions = [],
  onOpenSellModal,
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

  const zakariyeTotal = summary.zakariyeTotalCapital;
  const zakariyeInStock = summary.zakariyeInStockCapital;
  const zakariyeSold = summary.zakariyeSoldCapital;
  const zakariyeFundedCount = summary.zakariyePhonesCount;
  const zakariyeAcquiredCount = summary.zakariyePhonesAcquired;
  const zakariyeInStockCnt = summary.zakariyeInStockCount;
  const zakariyeSoldCnt = summary.zakariyeSoldCount;

  const shariifTotal = summary.shariifTotalCapital;
  const shariifInStock = summary.shariifInStockCapital;
  const shariifSold = summary.shariifSoldCapital;
  const shariifFundedCount = summary.shariifPhonesCount;
  const shariifAcquiredCount = summary.shariifPhonesAcquired;
  const shariifInStockCnt = summary.shariifInStockCount;
  const shariifSoldCnt = summary.shariifSoldCount;

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
            Lafaha teleefan kasta waxaa iska leh qofka bixiyay (Paid By), halka qofka keenayna (Acquired By) la xafido.
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

      {/* Side-by-Side Partner Summary Cards (Section 8: Partner Cards) */}
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
                {zakariyeFundedCount} Funded
              </span>
              {zakariyeAcquiredCount !== zakariyeFundedCount && (
                <span className="text-[10px] text-slate-500 font-bold block mt-1">
                  {zakariyeAcquiredCount} Acquired
                </span>
              )}
            </div>
          </div>

          {/* Section 8 Exact Fields */}
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Capital Owned (Lafaha uu Bixiyay):</span>
              <span className="font-black text-slate-900 text-sm">
                ${zakariyeTotal}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Phones Acquired (Teleefannada uu Keenay):</span>
              <span className="font-bold text-slate-900">
                {zakariyeAcquiredCount}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Phones Currently In Stock:</span>
              <span className="font-bold text-blue-700">
                {zakariyeInStockCnt}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Phones Sold:</span>
              <span className="font-bold text-emerald-700">
                {zakariyeSoldCnt}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-600 font-medium">Inventory Cost:</span>
              <span className="font-black text-slate-900 text-sm">
                ${zakariyeInStock}
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
                {shariifFundedCount} Funded
              </span>
              {shariifAcquiredCount !== shariifFundedCount && (
                <span className="text-[10px] text-slate-500 font-bold block mt-1">
                  {shariifAcquiredCount} Acquired
                </span>
              )}
            </div>
          </div>

          {/* Section 8 Exact Fields */}
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Capital Owned (Lafaha uu Bixiyay):</span>
              <span className="font-black text-slate-900 text-sm">
                ${shariifTotal}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Phones Acquired (Teleefannada uu Keenay):</span>
              <span className="font-bold text-slate-900">
                {shariifAcquiredCount}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Phones Currently In Stock:</span>
              <span className="font-bold text-emerald-700">
                {shariifInStockCnt}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Phones Sold:</span>
              <span className="font-bold text-emerald-700">
                {shariifSoldCnt}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-600 font-medium">Inventory Cost:</span>
              <span className="font-black text-slate-900 text-sm">
                ${shariifInStock}
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
              Lafaha uu bixiyay ({selectedPartnerId === 1 ? zakariyeFundedCount : shariifFundedCount})
            </button>
            <button
              onClick={() => setPhoneFilterRole('ACQUIRED')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                phoneFilterRole === 'ACQUIRED' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500'
              }`}
            >
              Uu keenay ({selectedPartnerId === 1 ? zakariyeAcquiredCount : shariifAcquiredCount})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">IMEI & Model</th>
                <th className="py-3 px-4">Acquired By</th>
                <th className="py-3 px-4">Paid By (Capital Owner)</th>
                <th className="py-3 px-4">Purchase Price</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Sale Price</th>
                <th className="py-3 px-4">Profit</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {partnerPhones.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Wax teleefan ah kuma jiraan qaybtan {activePartner.name}
                  </td>
                </tr>
              ) : (
                partnerPhones.map((phone) => {
                  const isSold = phone.status === 'Sold';
                  const profit = isSold ? (phone.salePrice || 0) - phone.purchasePrice : 0;
                  const funderId = getFunder(phone);
                  const acquirerId = getAcquirer(phone);
                  const funderName = funderId === 1 ? 'Zakariye' : 'Shariif';
                  const acquirerName = acquirerId === 1 ? 'Zakariye' : 'Shariif';
                  const isCross = funderId !== acquirerId;

                  return (
                    <tr key={phone.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setInspectedPhone(phone)}
                          className="font-bold text-slate-900 hover:text-blue-600 transition cursor-pointer text-left block"
                        >
                          {phone.brand} {phone.model}
                        </button>
                        <div className="text-[11px] text-slate-400 font-mono">{phone.imei}</div>
                      </td>

                      {/* Acquired By */}
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

                      {/* Paid By */}
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
                        {isCross && (
                          <span className="text-[10px] text-amber-700 font-bold block mt-0.5">
                            Cross-Funded
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-black text-slate-900 text-sm">
                        ${phone.purchasePrice}
                      </td>

                      <td className="py-3 px-4">
                        {isSold ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>SOLD</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <Clock className="w-3 h-3" />
                            <span>IN STOCK</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {isSold ? (
                          <span className="font-black text-slate-900">${phone.salePrice}</span>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {isSold ? (
                          <span className="font-black text-emerald-600">+${profit}</span>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setInspectedPhone(phone)}
                            className="px-2 py-1 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                          {!isSold && (
                            <button
                              onClick={() => onOpenSellModal(phone)}
                              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer active:scale-95"
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

      {/* Details modal */}
      <PhoneDetailsModal
        phone={inspectedPhone}
        isOpen={Boolean(inspectedPhone)}
        onClose={() => setInspectedPhone(null)}
        partners={partners}
        transactions={transactions}
        onOpenSellModal={onOpenSellModal}
      />
    </div>
  );
};
