import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  DollarSign,
  FileText,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  RotateCcw,
  Smartphone,
  Eye,
  Wrench,
} from 'lucide-react';
import { Partner, PhoneRecord, TransactionRecord } from '../types/accounting';
import { PhoneDetailsModal } from './PhoneDetailsModal';

interface PhoneTableViewProps {
  phones: PhoneRecord[];
  partners: Partner[];
  transactions?: TransactionRecord[];
  onOpenSellModal: (phone: PhoneRecord) => void;
  onOpenReceiptModal: (phone: PhoneRecord) => void;
  onOpenEditModal: (phone: PhoneRecord) => void;
  onDeletePhone: (phoneId: string) => void;
  onOpenAddPhone: () => void;
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

export const PhoneTableView: React.FC<PhoneTableViewProps> = ({
  phones,
  partners,
  transactions = [],
  onOpenSellModal,
  onOpenReceiptModal,
  onOpenEditModal,
  onDeletePhone,
  onOpenAddPhone,
  onAddRepair,
  onDeleteRepair,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'In Stock' | 'Sold' | 'Returned'>('ALL');
  const [partnerFilter, setPartnerFilter] = useState<'ALL' | '1' | '2'>('ALL');
  const [sortBy, setSortBy] = useState<'DATE_DESC' | 'PROFIT_DESC' | 'PRICE_DESC' | 'NAME_ASC'>('DATE_DESC');
  const [selectedPhoneForDetails, setSelectedPhoneForDetails] = useState<PhoneRecord | null>(null);

  const filteredPhones = useMemo(() => {
    return phones
      .filter((p) => {
        if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
        if (partnerFilter !== 'ALL') {
          const pId = Number(partnerFilter);
          const funder = p.paidBy || p.capitalOwner || p.purchasedBy;
          const acquirer = p.acquiredBy || p.purchasedBy;
          if (funder !== pId && acquirer !== pId) return false;
        }
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase().trim();
          const matchesModel = p.model.toLowerCase().includes(q);
          const matchesBrand = p.brand.toLowerCase().includes(q);
          const matchesImei = p.imei.toLowerCase().includes(q);
          const matchesCustomer = p.customerName ? p.customerName.toLowerCase().includes(q) : false;
          const matchesNotes = p.notes ? p.notes.toLowerCase().includes(q) : false;
          if (!matchesModel && !matchesBrand && !matchesImei && !matchesCustomer && !matchesNotes) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'DATE_DESC') {
          return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
        }
        if (sortBy === 'PROFIT_DESC') {
          const costA = a.totalCost ?? (a.purchasePrice + (a.repairCost || 0));
          const costB = b.totalCost ?? (b.purchasePrice + (b.repairCost || 0));
          const profitA = (a.salePrice || 0) - costA;
          const profitB = (b.salePrice || 0) - costB;
          return profitB - profitA;
        }
        if (sortBy === 'PRICE_DESC') {
          const costA = a.totalCost ?? (a.purchasePrice + (a.repairCost || 0));
          const costB = b.totalCost ?? (b.purchasePrice + (b.repairCost || 0));
          return costB - costA;
        }
        if (sortBy === 'NAME_ASC') {
          return a.model.localeCompare(b.model);
        }
        return 0;
      });
  }, [phones, statusFilter, partnerFilter, searchTerm, sortBy]);

  // Keep details modal in sync with phones state (e.g. after adding a repair)
  const activeDetailsPhone = useMemo(() => {
    if (!selectedPhoneForDetails) return null;
    return phones.find((p) => p.id === selectedPhoneForDetails.id) || selectedPhoneForDetails;
  }, [phones, selectedPhoneForDetails]);

  return (
    <div className="space-y-4">
      {/* Top Controls Box */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <span>Inventory-ga Teleefannada</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                {filteredPhones.length} Teleefan
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Diiwaanka teleefannada ganacsiga: Gadashada, Dayactirka, Wadarta Lafaha, Iibka, iyo Faa'iidada
            </p>
          </div>

          <button
            onClick={onOpenAddPhone}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Teleefan Cusub Qabo</span>
          </button>
        </div>

        {/* Search & Filter Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search bar */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Raadi IMEI, Model, Brand, Macaamiil..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50"
            />
          </div>

          {/* Status selector */}
          <div className="md:col-span-3 flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Dhammaan
            </button>
            <button
              onClick={() => setStatusFilter('In Stock')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === 'In Stock' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              In Stock
            </button>
            <button
              onClick={() => setStatusFilter('Sold')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === 'Sold' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Sold
            </button>
          </div>

          {/* Partner selector */}
          <div className="md:col-span-3 flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setPartnerFilter('ALL')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                partnerFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Labadaba
            </button>
            <button
              onClick={() => setPartnerFilter('1')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                partnerFilter === '1' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Zakariye
            </button>
            <button
              onClick={() => setPartnerFilter('2')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                partnerFilter === '2' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Shariif
            </button>
          </div>

          {/* Sort selector */}
          <div className="md:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
            >
              <option value="DATE_DESC">Ugu Dambeeyay</option>
              <option value="PROFIT_DESC">Faa'iidada (Sare)</option>
              <option value="PRICE_DESC">Wadarta Qiimaha (Sare)</option>
              <option value="NAME_ASC">Model-ka (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Box - FULL BREAKDOWN: Purchase Cost, Repair Cost, Total Cost, Sale Price, Profit */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1140px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-3">Phone</th>
                <th className="py-3 px-3">IMEI</th>
                <th className="py-3 px-3">Acquired By</th>
                <th className="py-3 px-3">Paid By (Capital)</th>
                <th className="py-3 px-3">Purchase Cost</th>
                <th className="py-3 px-3">Repair Cost</th>
                <th className="py-3 px-3">Total Cost</th>
                <th className="py-3 px-3">Sale Price</th>
                <th className="py-3 px-3">Profit</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredPhones.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <Smartphone className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-semibold">Wax teleefan ah lama helin</p>
                    <p className="text-xs text-slate-400 mt-1">Beddel ereyada raadinta ama shaandhada</p>
                  </td>
                </tr>
              ) : (
                filteredPhones.map((phone) => {
                  const isSold = phone.status === 'Sold';
                  const isReturned = phone.status === 'Returned';

                  const purchaseCost = Number(phone.purchasePrice || 0);
                  const repairCost = Number(phone.repairCost || 0);
                  const totalCost = phone.totalCost ?? (purchaseCost + repairCost);
                  const profit = isSold ? (phone.salePrice || 0) - totalCost : 0;

                  const funderId = phone.paidBy || phone.capitalOwner || phone.purchasedBy;
                  const acquirerId = phone.acquiredBy || funderId;
                  const funderName = funderId === 1 ? 'Zakariye' : 'Shariif';
                  const acquirerName = acquirerId === 1 ? 'Zakariye' : 'Shariif';

                  return (
                    <tr key={phone.id} className="hover:bg-slate-50/80 transition group">
                      {/* 1. Phone (Model & Brand) */}
                      <td className="py-3 px-3">
                        <button
                          onClick={() => setSelectedPhoneForDetails(phone)}
                          className="font-bold text-slate-900 hover:text-blue-600 transition cursor-pointer text-left block"
                        >
                          {phone.brand} {phone.model}
                        </button>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {phone.storage} {phone.color && `· ${phone.color}`}
                        </span>
                      </td>

                      {/* 2. IMEI */}
                      <td className="py-3 px-3">
                        <span className="font-mono text-xs text-slate-700 font-semibold">
                          {phone.imei}
                        </span>
                      </td>

                      {/* 3. Acquired By */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            acquirerId === 1
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              acquirerId === 1 ? 'bg-blue-600' : 'bg-emerald-600'
                            }`}
                          ></span>
                          <span>{acquirerName}</span>
                        </span>
                      </td>

                      {/* 4. Paid By (Capital Owner) */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            funderId === 1
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              funderId === 1 ? 'bg-blue-600' : 'bg-emerald-600'
                            }`}
                          ></span>
                          <span>{funderName}</span>
                        </span>
                        {acquirerId !== funderId && (
                          <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">
                            Cross-Funded
                          </span>
                        )}
                      </td>

                      {/* 5. Purchase Cost */}
                      <td className="py-3 px-3 font-bold text-slate-800 text-xs">
                        ${purchaseCost}
                      </td>

                      {/* 6. Repair Cost */}
                      <td className="py-3 px-3 font-semibold text-xs">
                        {repairCost > 0 ? (
                          <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            <Wrench className="w-3 h-3" />
                            <span>${repairCost}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">$0</span>
                        )}
                      </td>

                      {/* 7. Total Cost */}
                      <td className="py-3 px-3 font-black text-slate-900 text-sm">
                        ${totalCost}
                      </td>

                      {/* 8. Sale Price */}
                      <td className="py-3 px-3">
                        {isSold ? (
                          <span className="font-black text-slate-900 text-sm">
                            ${phone.salePrice}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </td>

                      {/* 9. Profit */}
                      <td className="py-3 px-3">
                        {isSold ? (
                          <span
                            className={`font-black text-sm ${
                              profit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {profit >= 0 ? `+$${profit}` : `-$${Math.abs(profit)}`}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </td>

                      {/* 10. Status */}
                      <td className="py-3 px-3">
                        {isSold ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>SOLD</span>
                          </span>
                        ) : isReturned ? (
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

                      {/* 11. Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedPhoneForDetails(phone)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                            title="Xogta buuxda & Dayactirka"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {isSold && (
                            <button
                              onClick={() => onOpenReceiptModal(phone)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                              title="Rasiidka iibka"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}

                          {!isSold && !isReturned && (
                            <button
                              onClick={() => onOpenSellModal(phone)}
                              className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer font-bold"
                              title="Iibi teleefankan"
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => onOpenEditModal(phone)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                            title="Wax ka beddel"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onDeletePhone(phone.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Tirtir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
        phone={activeDetailsPhone}
        isOpen={!!selectedPhoneForDetails}
        onClose={() => setSelectedPhoneForDetails(null)}
        partners={partners}
        transactions={transactions}
        onOpenSellModal={onOpenSellModal}
        onOpenReceiptModal={onOpenReceiptModal}
        onOpenEditModal={onOpenEditModal}
        onDeletePhone={onDeletePhone}
        onAddRepair={onAddRepair}
        onDeleteRepair={onDeleteRepair}
      />
    </div>
  );
};
