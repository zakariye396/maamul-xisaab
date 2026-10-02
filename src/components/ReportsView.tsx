import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  FileSpreadsheet,
  TrendingUp,
  Download,
  Users,
  Smartphone,
  Wallet,
  Receipt,
  Scale,
  Wrench,
} from 'lucide-react';
import { AccountingSummary, ExpenseRecord, Partner, PhoneRecord } from '../types/accounting';

interface ReportsViewProps {
  summary: AccountingSummary;
  phones: PhoneRecord[];
  expenses: ExpenseRecord[];
  partners: Partner[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  summary,
  phones,
  expenses,
  partners,
}) => {
  const [reportTab, setReportTab] = useState<'profit' | 'daily' | 'monthly' | 'partner' | 'inventory'>('profit');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  // Helper for phone total cost
  const getPhoneTotalCost = (p: PhoneRecord) => p.totalCost ?? (Number(p.purchasePrice || 0) + Number(p.repairCost || 0));

  // Daily Report calculations
  const dailyPurchased = phones.filter((p) => p.purchaseDate === selectedDate);
  const dailySold = phones.filter((p) => p.saleDate === selectedDate);
  const dailySales = dailySold.reduce((sum, p) => sum + Number(p.salePrice || 0), 0);
  const dailyCost = dailySold.reduce((sum, p) => sum + getPhoneTotalCost(p), 0);
  const dailyGrossProfit = dailySales - dailyCost;
  const dailyExpenses = expenses
    .filter((e) => e.date === selectedDate)
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const dailyNetProfit = dailyGrossProfit - dailyExpenses;

  // Monthly Report calculations
  const monthlyPurchased = phones.filter((p) => p.purchaseDate.startsWith(selectedMonth));
  const monthlySold = phones.filter((p) => p.saleDate && p.saleDate.startsWith(selectedMonth));
  const monthlyPurchasesTotal = monthlyPurchased.reduce((sum, p) => sum + Number(p.purchasePrice || 0), 0);
  const monthlySales = monthlySold.reduce((sum, p) => sum + Number(p.salePrice || 0), 0);
  const monthlySoldCost = monthlySold.reduce((sum, p) => sum + getPhoneTotalCost(p), 0);
  const monthlyGrossProfit = monthlySales - monthlySoldCost;
  const monthlyExpenses = expenses
    .filter((e) => e.date.startsWith(selectedMonth))
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const monthlyNetProfit = monthlyGrossProfit - monthlyExpenses;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>Warbixinnada Maaliyadeed (Financial Reports)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dooro nooca warbixinta: Faa'iidada, Maalinle, Bishii, Shuraakada, ama Kaydka
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Daabac / PDF (Print Report)</span>
        </button>
      </div>

      {/* Report Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setReportTab('profit')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            reportTab === 'profit'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>1. Profit Report (Business Level)</span>
        </button>

        <button
          onClick={() => setReportTab('daily')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            reportTab === 'daily'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>2. Daily Report (Maalinle)</span>
        </button>

        <button
          onClick={() => setReportTab('monthly')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            reportTab === 'monthly'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>3. Monthly Report (Bile)</span>
        </button>

        <button
          onClick={() => setReportTab('partner')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            reportTab === 'partner'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>4. Partner Report (Zakariye vs Shariif)</span>
        </button>

        <button
          onClick={() => setReportTab('inventory')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            reportTab === 'inventory'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>5. Inventory Report</span>
        </button>
      </div>

      {/* 1. PROFIT & LOSS STATEMENT */}
      {reportTab === 'profit' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-black text-lg text-slate-900 tracking-tight">
                Bayaanka Faa'iidada & Qasaaraha (Profit & Loss Statement)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Warbixinta rasmiga ah ee dakhliga, kharashka lafaha iibsamay (COGS oo ay ku jiraan dayactirku), iyo faa'iidada saafiga ah.
              </p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full font-bold bg-slate-100 text-slate-700">
              GAAP / Accounting Standard
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="font-bold text-slate-700">1. Total Revenue (Wadarta Iibka):</span>
              <span className="font-black text-slate-900 text-sm">${summary.totalSales.toLocaleString()}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-100 text-slate-600">
              <span>2. Cost of Goods Sold (Lafaha Teleefannada Iibsamay [Gadasho + Dayactir]):</span>
              <span className="font-bold text-slate-800">-${summary.totalSoldCapital.toLocaleString()}</span>
            </div>

            <div className="flex justify-between py-2.5 border-b border-slate-200 bg-emerald-50/50 px-3 rounded-xl font-bold text-emerald-900">
              <span className="text-sm">3. Gross Profit (Faa'iidada Dhexe ee Teleefannada):</span>
              <span className="text-base font-black text-emerald-600">+${summary.grossProfit.toLocaleString()}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-100 text-rose-700">
              <span className="font-semibold">4. Operating Expenses (Kharashyada Shaqada Dukaanka):</span>
              <span className="font-bold">-${summary.totalExpenses.toLocaleString()}</span>
            </div>

            <div className="flex justify-between py-3 border-t-2 border-slate-900 bg-slate-900 text-white px-4 rounded-xl items-center">
              <div>
                <span className="font-black text-sm block">5. Net Profit (Faa'iidada Saafiga ah):</span>
                <span className="text-[10px] text-slate-400">Gross Profit - Operating Expenses</span>
              </div>
              <span className="text-xl font-black text-emerald-400">
                ${summary.netProfit.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. DAILY REPORT */}
      {reportTab === 'daily' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-black text-base text-slate-900">Daily Report (Maalinle)</h3>
              <p className="text-xs text-slate-500">Dooro maalin si aad u aragto dhaqdhaqaaqeeda</p>
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Teleefannada La Qabtay:</span>
              <span className="text-lg font-black text-slate-900">{dailyPurchased.length}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Teleefannada La Iibiyay:</span>
              <span className="text-lg font-black text-slate-900">{dailySold.length}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Wadarta Iibka Maanta:</span>
              <span className="text-lg font-black text-blue-700">${dailySales}</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-emerald-700 block text-[11px]">Net Profit Maanta:</span>
              <span className="text-lg font-black text-emerald-600">+${dailyNetProfit}</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. MONTHLY REPORT */}
      {reportTab === 'monthly' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-black text-base text-slate-900">Monthly Report (Bile)</h3>
              <p className="text-xs text-slate-500">Dooro bisha aad rabto xisaabteeda buuxda</p>
            </div>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Total Purchases (Lafaha Bisha):</span>
              <span className="text-lg font-black text-slate-900">${monthlyPurchasesTotal}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Total Sales (Iibka Bisha):</span>
              <span className="text-lg font-black text-blue-700">${monthlySales}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Total Expenses (Kharashka):</span>
              <span className="text-lg font-black text-rose-600">${monthlyExpenses}</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-emerald-700 block text-[11px]">Net Profit Bisha:</span>
              <span className="text-lg font-black text-emerald-600">+${monthlyNetProfit}</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. PARTNER REPORT (Section 6: Partner Reporting Specifications) */}
      {reportTab === 'partner' && (
        <div className="space-y-4">
          {/* Combined Total Summary Card */}
          <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">
                Combined Partners Capital Summary (Wadarta Guud ee Labada Shuraako)
              </span>
              <span className="text-xl font-black text-white">
                Total Capital: ${summary.totalCapital.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Purchase Capital:</span>
                <span className="font-bold text-white">${summary.totalPurchaseCapital}</span>
              </div>
              <span className="text-slate-500 font-bold">+</span>
              <div>
                <span className="text-amber-400 block text-[10px]">Repair Capital:</span>
                <span className="font-bold text-amber-400">${summary.totalRepairCapital}</span>
              </div>
              <span className="text-slate-500 font-bold">=</span>
              <div>
                <span className="text-emerald-400 block text-[10px]">Combined:</span>
                <span className="font-bold text-emerald-400">${summary.totalCapital}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Zakariye Report */}
            <div className="bg-white rounded-2xl p-5 border-2 border-blue-200 space-y-4">
              <h3 className="font-black text-base text-slate-900 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                  <span>Zakariye Report</span>
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                  Partner 1
                </span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600 font-medium">Purchase Capital Funded:</span>
                  <span className="font-bold text-slate-900">
                    ${summary.zakariyePurchaseCapital}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600 font-medium flex items-center gap-1">
                    <Wrench className="w-3.5 h-3.5 text-amber-600" />
                    <span>Repair Capital Funded:</span>
                  </span>
                  <span className="font-bold text-amber-700">
                    ${summary.zakariyeRepairCapital}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 bg-blue-50/50 px-2 rounded-lg font-bold">
                  <span className="text-blue-900">Total Capital Funded:</span>
                  <span className="text-blue-700 font-black">
                    ${summary.zakariyeTotalCapital}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600 font-medium">Phones Acquired (Keenay):</span>
                  <span className="font-bold text-slate-900">
                    {summary.zakariyePhonesAcquired} teleefan
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Phones Currently in Stock:</span>
                  <span className="font-bold text-blue-700">
                    {summary.zakariyeInStockCount} teleefan
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Phones Sold:</span>
                  <span className="font-bold text-emerald-700">
                    {summary.zakariyeSoldCount} teleefan
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Inventory Cost (Hadda Kaydka):</span>
                  <span className="font-bold text-slate-800">
                    ${summary.zakariyeInStockCapital}
                  </span>
                </div>
              </div>
            </div>

            {/* Shariif Report */}
            <div className="bg-white rounded-2xl p-5 border-2 border-emerald-200 space-y-4">
              <h3 className="font-black text-base text-slate-900 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
                  <span>Shariif Report</span>
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                  Partner 2
                </span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600 font-medium">Purchase Capital Funded:</span>
                  <span className="font-bold text-slate-900">
                    ${summary.shariifPurchaseCapital}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600 font-medium flex items-center gap-1">
                    <Wrench className="w-3.5 h-3.5 text-amber-600" />
                    <span>Repair Capital Funded:</span>
                  </span>
                  <span className="font-bold text-amber-700">
                    ${summary.shariifRepairCapital}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 bg-emerald-50/50 px-2 rounded-lg font-bold">
                  <span className="text-emerald-900">Total Capital Funded:</span>
                  <span className="text-emerald-700 font-black">
                    ${summary.shariifTotalCapital}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600 font-medium">Phones Acquired (Keenay):</span>
                  <span className="font-bold text-slate-900">
                    {summary.shariifPhonesAcquired} teleefan
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Phones Currently in Stock:</span>
                  <span className="font-bold text-emerald-700">
                    {summary.shariifInStockCount} teleefan
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Phones Sold:</span>
                  <span className="font-bold text-emerald-700">
                    {summary.shariifSoldCount} teleefan
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Inventory Cost (Hadda Kaydka):</span>
                  <span className="font-bold text-slate-800">
                    ${summary.shariifInStockCapital}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. INVENTORY REPORT */}
      {reportTab === 'inventory' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-black text-base text-slate-900">Inventory Valuation Report</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px]">All Phones Count:</span>
              <span className="text-xl font-black text-slate-900">{summary.totalPhones}</span>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
              <span className="text-blue-700 block text-[11px]">Phones In Stock:</span>
              <span className="text-xl font-black text-blue-700">{summary.phonesInStock}</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-emerald-700 block text-[11px]">Phones Sold:</span>
              <span className="text-xl font-black text-emerald-700">{summary.phonesSold}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 text-white">
              <span className="text-slate-400 block text-[11px]">Total Active Inventory Cost:</span>
              <span className="text-xl font-black text-emerald-400">${summary.totalInStockCapital}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
