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

  // Daily Report calculations
  const dailyPurchased = phones.filter((p) => p.purchaseDate === selectedDate);
  const dailySold = phones.filter((p) => p.saleDate === selectedDate);
  const dailySales = dailySold.reduce((sum, p) => sum + Number(p.salePrice || 0), 0);
  const dailyCost = dailySold.reduce((sum, p) => sum + Number(p.purchasePrice || 0), 0);
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
  const monthlySoldCost = monthlySold.reduce((sum, p) => sum + Number(p.purchasePrice || 0), 0);
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

      {/* 1. PROFIT & LOSS STATEMENT (Section 12 in prompt) */}
      {reportTab === 'profit' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-black text-lg text-slate-900 tracking-tight">
                Bayaanka Faa'iidada & Qasaaraha (Profit & Loss Statement)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Warbixinta rasmiga ah ee dakhliga, kharashka lafaha iibsamay (COGS), iyo faa'iidada saafiga ah.
              </p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full font-bold bg-slate-100 text-slate-700">
              GAAP / Accounting Standard
            </span>
          </div>

          {/* Section 12 KPI Row: Revenue, Cost of Goods Sold, Gross Profit, Operating Expenses, Net Profit */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
                Revenue
              </span>
              <span className="text-2xl font-black text-slate-900">
                ${summary.totalSales.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Wadarta Iibka
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
                Cost of Goods Sold
              </span>
              <span className="text-2xl font-black text-slate-700">
                ${summary.totalSoldCapital.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                COGS (Lafaha Iibsamay)
              </span>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[11px] font-bold uppercase text-emerald-800 block mb-1">
                Gross Profit
              </span>
              <span className="text-2xl font-black text-emerald-600">
                ${summary.grossProfit.toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-700 block mt-0.5">
                Revenue - COGS
              </span>
            </div>

            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
              <span className="text-[11px] font-bold uppercase text-rose-700 block mb-1">
                Operating Expenses
              </span>
              <span className="text-2xl font-black text-rose-600">
                ${summary.totalExpenses.toLocaleString()}
              </span>
              <span className="text-[10px] text-rose-500 block mt-0.5">
                Kharashaadka Hawlgalka
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold uppercase text-emerald-400 block mb-1">
                Net Profit
              </span>
              <span className="text-2xl font-black text-emerald-400">
                ${summary.netProfit.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Faa'iidada Saafiga ah
              </span>
            </div>
          </div>

          {/* Formal Accounting Income Statement Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider flex justify-between">
              <span>Account Description (Qaybta Xisaabta)</span>
              <span>Amount (USD)</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="px-4 py-3 flex justify-between items-center hover:bg-slate-50/50">
                <div>
                  <span className="font-bold text-slate-900 text-sm">Operating Revenue (Wadarta Iibka Guud)</span>
                  <p className="text-[11px] text-slate-500">Iibka dhammaan teleefannada ganacsiga ({summary.phonesSold} xabo)</p>
                </div>
                <span className="font-black text-slate-900 text-sm">${summary.totalSales.toLocaleString()}</span>
              </div>

              <div className="px-4 py-3 flex justify-between items-center hover:bg-slate-50/50 bg-slate-50/20">
                <div className="pl-4">
                  <span className="font-medium text-slate-700">Cost of Goods Sold / COGS (Lafihii Teleefannada Iibsamay)</span>
                  <p className="text-[11px] text-slate-400">Lafaha Zakariye (${summary.zakariyeSoldCapital}) + Lafaha Shariif (${summary.shariifSoldCapital})</p>
                </div>
                <span className="font-bold text-slate-700">(${summary.totalSoldCapital.toLocaleString()})</span>
              </div>

              <div className="px-4 py-3 flex justify-between items-center bg-emerald-50/50 font-bold border-t border-b border-emerald-200">
                <div>
                  <span className="text-emerald-900 font-extrabold text-sm">GROSS PROFIT (Faa'iidada Guud ee Iibka)</span>
                  <p className="text-[11px] text-emerald-700">Wadaagga Guud ee Ganacsiga — laguma jaro wax lafo ah</p>
                </div>
                <span className="font-black text-emerald-700 text-base">+${summary.grossProfit.toLocaleString()}</span>
              </div>

              <div className="px-4 py-3 flex justify-between items-center hover:bg-slate-50/50">
                <div className="pl-4">
                  <span className="font-medium text-slate-700">Operating Expenses (Kharashaadka Hawlgalka Guud)</span>
                  <p className="text-[11px] text-slate-400">Kira, koronto, internet, iyo kharashaadka maalinlaha ah</p>
                </div>
                <span className="font-bold text-rose-600">(${summary.totalExpenses.toLocaleString()})</span>
              </div>

              <div className="px-4 py-3.5 flex justify-between items-center bg-slate-900 text-white">
                <div>
                  <span className="text-emerald-400 font-black text-base">NET PROFIT (Faa'iidada Saafiga ah ee Ganacsiga)</span>
                  <p className="text-[11px] text-slate-400">Gross Profit (${summary.grossProfit}) - Expenses (${summary.totalExpenses})</p>
                </div>
                <div className="text-right">
                  <span className="font-black text-emerald-400 text-2xl">${summary.netProfit.toLocaleString()}</span>
                  <span className="block text-[10px] text-slate-400">Net Business Earnings</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. DAILY REPORT (Section 14 in prompt) */}
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

      {/* 3. MONTHLY REPORT (Section 14 in prompt) */}
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

      {/* 4. PARTNER REPORT (Section 14 & Partner Reports requirement) */}
      {reportTab === 'partner' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                <span className="text-slate-600 font-medium">Phones Acquired (Teleefannada uu keenay/helay):</span>
                <span className="font-bold text-slate-900">
                  {summary.zakariyePhonesAcquired} teleefan
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Capital Funded (Lafaha uu bixiyay):</span>
                <span className="font-black text-blue-700">
                  ${summary.zakariyeTotalCapital}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Phones Funded (Teleefannada uu lacagtooda bixiyay):</span>
                <span className="font-bold text-slate-800">
                  {summary.zakariyePhonesCount} teleefan
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Inventory Value (Hadda Kaydka ku jira):</span>
                <span className="font-bold text-slate-800">
                  ${summary.zakariyeInStockCapital}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Phones Sold (Iibsamay):</span>
                <span className="font-bold text-emerald-700">
                  {summary.zakariyeSoldCount} teleefan
                </span>
              </div>
            </div>
          </div>

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
                <span className="text-slate-600 font-medium">Phones Acquired (Teleefannada uu keenay/helay):</span>
                <span className="font-bold text-slate-900">
                  {summary.shariifPhonesAcquired} teleefan
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Capital Funded (Lafaha uu bixiyay):</span>
                <span className="font-black text-emerald-700">
                  ${summary.shariifTotalCapital}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Phones Funded (Teleefannada uu lacagtooda bixiyay):</span>
                <span className="font-bold text-slate-800">
                  {summary.shariifPhonesCount} teleefan
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Inventory Value (Hadda Kaydka ku jira):</span>
                <span className="font-bold text-slate-800">
                  ${summary.shariifInStockCapital}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Phones Sold (Iibsamay):</span>
                <span className="font-bold text-emerald-700">
                  {summary.shariifSoldCount} teleefan
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. INVENTORY REPORT (Section 14 in prompt) */}
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
