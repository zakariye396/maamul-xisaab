import React, { useState, useMemo } from 'react';
import {
  ArrowRightLeft,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  Smartphone,
  Receipt,
  Wallet,
  User,
} from 'lucide-react';
import { Partner, PhoneRecord, TransactionRecord, TransactionType } from '../types/accounting';

interface TransactionsViewProps {
  transactions: TransactionRecord[];
  partners: Partner[];
  phones?: PhoneRecord[];
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  partners,
  phones = [],
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | TransactionType>('ALL');
  const [partnerFilter, setPartnerFilter] = useState<'ALL' | '1' | '2'>('ALL');

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (typeFilter !== 'ALL' && t.type !== typeFilter) return false;
      if (partnerFilter !== 'ALL') {
        const pId = Number(partnerFilter);
        const matchesPartner =
          t.partnerId === pId || t.paidBy === pId || t.acquiredBy === pId;
        if (!matchesPartner) return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchesDesc = t.description.toLowerCase().includes(q);
        const matchesRef = t.reference ? t.reference.toLowerCase().includes(q) : false;
        if (!matchesDesc && !matchesRef) return false;
      }
      return true;
    });
  }, [transactions, typeFilter, partnerFilter, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Header & Filters */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
            <span>Dhaqdhaqaaqa Guud (Transaction Ledger)</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
              {filteredTransactions.length} Record
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Diiwaanka lacag bixinta, qabashada teleefannada (Acquired By & Paid By), iibka, iyo kharashaadka.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Raadi transaction, sharaxaad, teleefan, IMEI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50/50"
            />
          </div>

          <div className="md:col-span-4">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
            >
              <option value="ALL">Dhammaan Noocyada (All Types)</option>
              <option value="Phone Purchase">Phone Purchase (Qabasho)</option>
              <option value="Phone Sale">Phone Sale (Iib)</option>
              <option value="Expense">Expense (Kharash)</option>
              <option value="Capital Withdrawal">Capital Withdrawal</option>
              <option value="Partner Capital">Partner Capital</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={partnerFilter}
              onChange={(e) => setPartnerFilter(e.target.value as any)}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
            >
              <option value="ALL">Dhammaan Partners (Zakariye & Shariif)</option>
              <option value="1">Zakariye</option>
              <option value="2">Shariif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ledger Table with Explicit Acquired By & Paid By Columns */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Taariikhda</th>
                <th className="py-3 px-4">Nooca & Teleefanka</th>
                <th className="py-3 px-4">Acquired By</th>
                <th className="py-3 px-4">Paid By (Capital)</th>
                <th className="py-3 px-4">Sharaxaadda (Description)</th>
                <th className="py-3 px-4 text-right">Lacagta (Amount)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Wax dhaqdhaqaaq ah lama helin
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((txn) => {
                  const linkedPhone = phones.find(
                    (p) =>
                      p.id === txn.phoneId ||
                      (txn.reference && txn.reference.includes(p.id))
                  );

                  const acquirerId =
                    txn.acquiredBy ||
                    (linkedPhone ? linkedPhone.acquiredBy || linkedPhone.purchasedBy : undefined);
                  const funderId =
                    txn.paidBy ||
                    (linkedPhone
                      ? linkedPhone.paidBy || linkedPhone.capitalOwner || linkedPhone.purchasedBy
                      : txn.partnerId);

                  const acquirerName =
                    acquirerId === 1
                      ? 'Zakariye'
                      : acquirerId === 2
                      ? 'Shariif'
                      : undefined;
                  const funderName =
                    funderId === 1
                      ? 'Zakariye'
                      : funderId === 2
                      ? 'Shariif'
                      : undefined;

                  const isCross =
                    acquirerId !== undefined &&
                    funderId !== undefined &&
                    acquirerId !== funderId;

                  const phoneName = linkedPhone
                    ? `${linkedPhone.brand} ${linkedPhone.model}`
                    : undefined;

                  return (
                    <tr key={txn.id} className="hover:bg-slate-50/80 transition">
                      {/* Date */}
                      <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {txn.date}
                      </td>

                      {/* Type & Phone */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              txn.type === 'Phone Sale'
                                ? 'bg-emerald-100 text-emerald-800'
                                : txn.type === 'Phone Purchase'
                                ? 'bg-blue-100 text-blue-800'
                                : txn.type === 'Expense'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {txn.type}
                          </span>
                          {phoneName && (
                            <div className="font-bold text-slate-900 text-xs flex items-center gap-1">
                              <Smartphone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{phoneName}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Acquired By */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {acquirerName ? (
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
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </td>

                      {/* Paid By (Capital Owner) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {funderName ? (
                          <div>
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
                            {isCross && (
                              <span className="text-[10px] text-amber-700 font-bold block mt-0.5">
                                Cross-Funded
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Dukaan Guud</span>
                        )}
                      </td>

                      {/* Description & Reference */}
                      <td className="py-3.5 px-4 font-medium text-slate-800 max-w-sm">
                        <div>{txn.description}</div>
                        {txn.reference && (
                          <div className="font-mono text-slate-400 text-[10px] mt-0.5">
                            Ref: {txn.reference}
                          </div>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right font-black text-sm whitespace-nowrap">
                        <span
                          className={
                            txn.type === 'Phone Sale'
                              ? 'text-emerald-600'
                              : txn.type === 'Expense' || txn.type === 'Capital Withdrawal'
                              ? 'text-rose-600'
                              : 'text-slate-900'
                          }
                        >
                          {txn.type === 'Phone Sale' ? `+$${txn.amount}` : `$${txn.amount}`}
                        </span>
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
