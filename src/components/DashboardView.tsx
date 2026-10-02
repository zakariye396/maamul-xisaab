import React, { useState, useMemo } from 'react';
import {
  Wallet,
  TrendingUp,
  Smartphone,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  Receipt,
  RotateCcw,
  Clock,
  Sparkles,
  Users,
  Eye,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { AccountingSummary, Partner, PhoneRecord, TransactionRecord } from '../types/accounting';
import { NavigationTab } from './Sidebar';
import { PhoneDetailsModal } from './PhoneDetailsModal';

interface DashboardViewProps {
  summary: AccountingSummary;
  partners: Partner[];
  phones: PhoneRecord[];
  transactions?: TransactionRecord[];
  onOpenAddPhone: () => void;
  onOpenSellModal: (phone: PhoneRecord) => void;
  setActiveTab: (tab: NavigationTab) => void;
  onLoadTestCase: () => void;
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

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  partners,
  phones,
  transactions = [],
  onOpenAddPhone,
  onOpenSellModal,
  setActiveTab,
  onLoadTestCase,
  onAddRepair,
  onDeleteRepair,
}) => {
  const [selectedPhone, setSelectedPhone] = useState<PhoneRecord | null>(null);

  const inStockPhones = phones.filter((p) => p.status === 'In Stock').slice(0, 5);
  const soldPhones = phones.filter((p) => p.status === 'Sold').slice(0, 5);

  const zakariyeTotal = summary.zakariyeTotalCapital;
  const zakariyeInStock = summary.zakariyeInStockCapital;
  const zakariyeSold = summary.zakariyeSoldCapital;
  const zakariyeCount = summary.zakariyePhonesCount;
  const zakariyeInStockCnt = summary.zakariyeInStockCount;
  const zakariyeSoldCnt = summary.zakariyeSoldCount;

  // Sync selected phone with phones state
  const activeSelectedPhone = useMemo(() => {
    if (!selectedPhone) return null;
    return phones.find((p) => p.id === selectedPhone.id) || selectedPhone;
  }, [phones, selectedPhone]);

  return (
    <div className="space-y-6">
      {/* 1. CLEAN EXECUTIVE ACTION HEADER */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Dulmarka Guud ee Ganacsiga
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Zakariye & Shariif
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Xisaabaadka rasmiga ah: Maamulka lafaha gaarka ah, dayactirka, iyo faa'iidada guud ee dukaanka.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onOpenAddPhone}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center gap-2 transition cursor-pointer active:scale-95"
          >
            <Smartphone className="w-4 h-4" />
            <span>+ Teleefan Qabo</span>
          </button>
          <button
            onClick={onLoadTestCase}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 flex items-center gap-1.5 transition cursor-pointer"
            title="Dib u celi tijaabada ($50 & $80)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
            <span>Xisaabta Tijaabada ($130 / $180 / $50)</span>
          </button>
        </div>
      </div>

      {/* 2. TOP KPI ROW - 4 CARDS: Total Capital, Total Sales, Gross Profit, Net Profit */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Capital */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Capital
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              ${summary.totalCapital.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 text-[11px] font-semibold mt-1.5 pt-1.5 border-t border-slate-100">
              <span className="text-blue-600 font-bold">Zakariye: ${zakariyeTotal}</span>
              <span className="text-slate-300">·</span>
              <span className="text-emerald-600 font-bold">Shariif: ${summary.shariifTotalCapital}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Purchase: ${summary.totalPurchaseCapital} · Repairs: ${summary.totalRepairCapital}
            </div>
          </div>
        </div>

        {/* 2. Total Sales */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Sales
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-indigo-700 tracking-tight">
              ${summary.totalSales.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1.5 pt-1.5 border-t border-slate-100">
              {summary.phonesSold} teleefan oo la iibiyay
            </div>
          </div>
        </div>

        {/* 3. Gross Profit */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-200 bg-emerald-50/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Gross Profit
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm">
              $
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
              +${summary.grossProfit.toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-800 font-semibold mt-1.5 pt-1.5 border-t border-emerald-100/60">
              Sales (${summary.totalSales}) - Cost (${summary.totalSoldCapital})
            </div>
          </div>
        </div>

        {/* 4. Net Profit */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Net Profit
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
              ${summary.netProfit.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-1.5 pt-1.5 border-t border-slate-800">
              Gross (${summary.grossProfit}) - Expenses (${summary.totalExpenses})
            </div>
          </div>
        </div>
      </div>

      {/* 3. SECOND ROW - 3 CARDS: Phones In Stock, Phones Sold, Business Expenses */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 5. Phones In Stock */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Phones In Stock
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {summary.phonesInStock} <span className="text-xs font-semibold text-slate-500">teleefan</span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
              Inventory Cost: <strong>${summary.totalInStockCapital}</strong>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* 6. Phones Sold */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Phones Sold
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {summary.phonesSold} <span className="text-xs font-semibold text-slate-500">teleefan</span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
              Returned Capital: <strong>${summary.totalSoldCapital}</strong>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* 7. Business Expenses */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Business Expenses
            </span>
            <div className="text-xl sm:text-2xl font-black text-rose-600">
              ${summary.totalExpenses.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
              Kira, koronto, internet, iyo hawlgal
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 4. PARTNER SUMMARY - CLEAN CARDS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Partner Summary (Lafaha Shuraakada: Gadasho + Dayactir)</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Total Capital: <strong>${summary.totalCapital}</strong> (Purchase: ${summary.totalPurchaseCapital} + Repairs: ${summary.totalRepairCapital})
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* ZAKARIYE CARD */}
          <div className="bg-white rounded-2xl border-2 border-blue-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center">
                    Z
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                      ZAKARIYE
                    </h3>
                    <span className="text-[11px] text-blue-600 font-bold">Partner 1</span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('partners')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>Faahfaahin</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Exact Metrics: Capital Owned, Purchase Cap, Repair Cap, Phones Acquired, In Stock, Sold */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3.5 rounded-xl bg-blue-50/50 border border-blue-100 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Capital</span>
                  <span className="font-black text-blue-900 text-base">
                    ${zakariyeTotal}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Purchase Capital</span>
                  <span className="font-bold text-slate-800 text-sm">
                    ${summary.zakariyePurchaseCapital}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Repair Capital</span>
                  <span className="font-bold text-amber-700 text-sm">
                    ${summary.zakariyeRepairCapital}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Phones Acquired</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {summary.zakariyePhonesAcquired}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">In Stock / Sold</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {zakariyeInStockCnt} / {zakariyeSoldCnt}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Inventory Cost</span>
                  <span className="font-bold text-slate-800 text-sm">
                    ${zakariyeInStock}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SHARIIF CARD */}
          <div className="bg-white rounded-2xl border-2 border-emerald-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center">
                    S
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                      SHARIIF
                    </h3>
                    <span className="text-[11px] text-emerald-600 font-bold">Partner 2</span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('partners')}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>Faahfaahin</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Exact Metrics: Capital Owned, Purchase Cap, Repair Cap, Phones Acquired, In Stock, Sold */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Capital</span>
                  <span className="font-black text-emerald-900 text-base">
                    ${summary.shariifTotalCapital}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Purchase Capital</span>
                  <span className="font-bold text-slate-800 text-sm">
                    ${summary.shariifPurchaseCapital}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Repair Capital</span>
                  <span className="font-bold text-amber-700 text-sm">
                    ${summary.shariifRepairCapital}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Phones Acquired</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {summary.shariifPhonesAcquired}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">In Stock / Sold</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {summary.shariifInStockCount} / {summary.shariifSoldCount}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Inventory Cost</span>
                  <span className="font-bold text-slate-800 text-sm">
                    ${summary.shariifInStockCapital}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. INVENTORY & RECENT SALES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Quick In-Stock Phones */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                  <span>Kaydka Teleefannada (In Stock)</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                    {summary.phonesInStock} yaalla
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Teleefannada hadda dukaanka yaalla ee iibka u diyaarka ah
                </p>
              </div>
              <button
                onClick={() => setActiveTab('phones')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                Dhammaan &rarr;
              </button>
            </div>

            <div className="space-y-2">
              {inStockPhones.length === 0 ? (
                <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                  <Smartphone className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-slate-600">
                    Wax teleefan ah kuma jiraan kaydka xilligan.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Guji "+ Teleefan Qabo" si aad teleefan cusub ugu darto.
                  </p>
                </div>
              ) : (
                inStockPhones.map((phone) => {
                  const repairCostNum = Number(phone.repairCost || 0);
                  const totalCostNum = phone.totalCost ?? (phone.purchasePrice + repairCostNum);
                  return (
                    <div
                      key={phone.id}
                      className="p-3 rounded-xl border border-slate-200 hover:border-blue-300 bg-slate-50/40 hover:bg-white transition flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                            phone.purchasedBy === 1
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {phone.purchasedBy === 1 ? 'Z' : 'S'}
                        </div>
                        <div className="min-w-0">
                          <button
                            onClick={() => setSelectedPhone(phone)}
                            className="font-bold text-slate-900 hover:text-blue-600 text-left truncate block"
                          >
                            {phone.brand} {phone.model}
                          </button>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="font-mono">{phone.imei.slice(-8)}</span>
                            <span>·</span>
                            <span>Gadasho: <strong>${phone.purchasePrice}</strong></span>
                            {repairCostNum > 0 && (
                              <>
                                <span>·</span>
                                <span className="text-amber-700 font-bold flex items-center gap-0.5">
                                  <Wrench className="w-3 h-3" />
                                  <span>Dayactir: ${repairCostNum}</span>
                                </span>
                              </>
                            )}
                            <span>·</span>
                            <span className="font-bold text-slate-900">Total: ${totalCostNum}</span>
                            <span>·</span>
                            <span className="font-semibold text-slate-700">
                              {phone.purchasedBy === 1 ? 'Zakariye' : 'Shariif'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setSelectedPhone(phone)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                          title="View details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenSellModal(phone)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1 cursor-pointer active:scale-95"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Iibi</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Quick Recent Sales */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                  <span>Iibkii Ugu Dambeeyay (Sold)</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    {summary.phonesSold} iibsamay
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Teleefannada la iibiyay iyo faa'iidada soo hoyatay
                </p>
              </div>
              <button
                onClick={() => setActiveTab('sales')}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
              >
                Dhammaan &rarr;
              </button>
            </div>

            <div className="space-y-2">
              {soldPhones.length === 0 ? (
                <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                  <CheckCircle2 className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-slate-600">
                    Weli wax teleefan ah lama iibin.
                  </p>
                </div>
              ) : (
                soldPhones.map((phone) => {
                  const repairCostNum = Number(phone.repairCost || 0);
                  const totalCostNum = phone.totalCost ?? (phone.purchasePrice + repairCostNum);
                  const profit = (phone.salePrice || 0) - totalCostNum;
                  return (
                    <div
                      key={phone.id}
                      className="p-3 rounded-xl border border-slate-200 hover:border-emerald-300 bg-slate-50/40 hover:bg-white transition flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xs shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <button
                            onClick={() => setSelectedPhone(phone)}
                            className="font-bold text-slate-900 hover:text-emerald-600 text-left truncate block"
                          >
                            {phone.brand} {phone.model}
                          </button>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span>Iib: <strong>${phone.salePrice}</strong></span>
                            <span>·</span>
                            <span>Total Cost: ${totalCostNum}</span>
                            <span>·</span>
                            <span className="font-bold text-emerald-600">Profit: +${profit}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setSelectedPhone(phone)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
                          title="View details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PHONE DETAILS MODAL */}
      <PhoneDetailsModal
        phone={activeSelectedPhone}
        isOpen={Boolean(selectedPhone)}
        onClose={() => setSelectedPhone(null)}
        partners={partners}
        transactions={transactions}
        onOpenSellModal={onOpenSellModal}
        onAddRepair={onAddRepair}
        onDeleteRepair={onDeleteRepair}
      />
    </div>
  );
};
