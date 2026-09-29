import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Search,
  DollarSign,
  TrendingUp,
  FileText,
  Calendar,
  CheckCircle2,
  PlusCircle,
  Smartphone,
} from 'lucide-react';
import { Partner, PhoneRecord } from '../types/accounting';

interface SalesViewProps {
  phones: PhoneRecord[];
  partners: Partner[];
  onOpenSellModal: (phone: PhoneRecord) => void;
  onOpenReceiptModal: (phone: PhoneRecord) => void;
}

export const SalesView: React.FC<SalesViewProps> = ({
  phones,
  partners,
  onOpenSellModal,
  onOpenReceiptModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [partnerFilter, setPartnerFilter] = useState<'ALL' | '1' | '2'>('ALL');

  const soldPhones = useMemo(() => {
    return phones.filter((p) => p.status === 'Sold');
  }, [phones]);

  const inStockPhones = useMemo(() => {
    return phones.filter((p) => p.status === 'In Stock');
  }, [phones]);

  const filteredSales = useMemo(() => {
    return soldPhones.filter((p) => {
      if (partnerFilter !== 'ALL' && p.purchasedBy !== Number(partnerFilter)) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchesModel = p.model.toLowerCase().includes(q);
        const matchesImei = p.imei.toLowerCase().includes(q);
        const matchesCustomer = p.customerName ? p.customerName.toLowerCase().includes(q) : false;
        if (!matchesModel && !matchesImei && !matchesCustomer) return false;
      }
      return true;
    });
  }, [soldPhones, partnerFilter, searchTerm]);

  // Aggregate metrics
  const totalSalesRevenue = soldPhones.reduce((sum, p) => sum + Number(p.salePrice || 0), 0);
  const totalSoldCost = soldPhones.reduce((sum, p) => sum + Number(p.purchasePrice || 0), 0);
  const totalGrossProfit = totalSalesRevenue - totalSoldCost;
  const avgProfit = soldPhones.length > 0 ? Math.round(totalGrossProfit / soldPhones.length) : 0;

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
            Total Sales Revenue
          </span>
          <div className="text-2xl font-black text-slate-900">
            ${totalSalesRevenue.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 mt-1">{soldPhones.length} Teleefan oo la iibiyay</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
            Total Sold Phones Cost
          </span>
          <div className="text-2xl font-black text-slate-700">
            ${totalSoldCost.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 mt-1">Lafihii teleefannada la iibiyay</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-emerald-200 bg-emerald-50/30 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-emerald-700 block mb-1">
            Total Business Profit
          </span>
          <div className="text-2xl font-black text-emerald-600">
            +${totalGrossProfit.toLocaleString()}
          </div>
          <p className="text-xs text-emerald-800 mt-1">Faa'iidada guud (Wadaag)</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
            Avg Profit Per Phone
          </span>
          <div className="text-2xl font-black text-blue-700">+${avgProfit}</div>
          <p className="text-xs text-slate-500 mt-1">Celceliska faa'iidada teleefan kasta</p>
        </div>
      </div>

      {/* Quick Sell In-Stock Carousel if any in stock */}
      {inStockPhones.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-600" />
                <span>Diyaar u ah Iibka (Ready to Sell)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Dooro teleefan kaydka ku jira si aad hadda u iibiso
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-600 text-white">
              {inStockPhones.length} In Stock
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {inStockPhones.slice(0, 3).map((phone) => (
              <div
                key={phone.id}
                className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs"
              >
                <div>
                  <h4 className="font-black text-xs text-slate-900">{phone.model}</h4>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Lafaha {phone.purchasedBy === 1 ? 'Zakariye' : 'Shariif'}:{' '}
                    <strong className="text-slate-900">${phone.purchasePrice}</strong>
                  </div>
                </div>
                <button
                  onClick={() => onOpenSellModal(phone)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Iibi</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sales History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
              <span>Taariikhda Iibka Teleefannada</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                {filteredSales.length} Iib
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Xisaabinta tooska ah: Sale Price - Purchase Price = Profit
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Raadi iib..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>

            <select
              value={partnerFilter}
              onChange={(e) => setPartnerFilter(e.target.value as any)}
              className="py-1.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
            >
              <option value="ALL">Labadaba</option>
              <option value="1">Zakariye</option>
              <option value="2">Shariif</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Teleefanka & IMEI</th>
                <th className="py-3 px-4">Qofka Soo Qabtay</th>
                <th className="py-3 px-4">Qiimaha Lafaha (Cost)</th>
                <th className="py-3 px-4">Qiimaha Iibka (Sale)</th>
                <th className="py-3 px-4">Faa'iidada (Profit)</th>
                <th className="py-3 px-4">Macaamiilka & Taariikhda</th>
                <th className="py-3 px-4 text-right">Rasiid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Wax iib ah lama helin
                  </td>
                </tr>
              ) : (
                filteredSales.map((phone) => {
                  const profit = (phone.salePrice || 0) - phone.purchasePrice;
                  const partnerName = phone.purchasedBy === 1 ? 'Zakariye' : 'Shariif';

                  return (
                    <tr key={phone.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{phone.model}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{phone.imei}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold ${
                            phone.purchasedBy === 1
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {partnerName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-700 text-sm">
                        ${phone.purchasePrice}
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                        ${phone.salePrice}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-black text-sm ${
                            profit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {profit >= 0 ? `+$${profit}` : `-$${Math.abs(profit)}`}
                        </span>
                        <span className="text-[10px] text-slate-400 block">Business Profit</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">
                          {phone.customerName || 'Macaamiil Guud'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {phone.saleDate} • {phone.paymentMethod || 'EVC'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onOpenReceiptModal(phone)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center gap-1 cursor-pointer transition"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Rasiid</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
