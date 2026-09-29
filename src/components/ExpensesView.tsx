import React, { useState } from 'react';
import { Receipt, Plus, Trash2, AlertCircle, TrendingDown, DollarSign } from 'lucide-react';
import { ExpenseCategory, ExpenseRecord } from '../types/accounting';

interface ExpensesViewProps {
  expenses: ExpenseRecord[];
  onAddExpense: (exp: Omit<ExpenseRecord, 'id'>) => void;
  onDeleteExpense: (id: string) => void;
  grossProfit: number;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  onAddExpense,
  onDeleteExpense,
  grossProfit,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [category, setCategory] = useState<ExpenseCategory>('Kirada (Rent)');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const netProfit = grossProfit - totalExpenses;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Fadlan geli qiime sax ah!');
      return;
    }

    onAddExpense({
      category,
      amount: amountNum,
      date,
      description: description.trim() || category,
      recordedBy: 'Wadaag',
    });

    setAmount('');
    setDescription('');
    setError('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-rose-600" />
            <span>Kharashaadka Dukaanka (Business Expenses)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            <strong>Formula:</strong> Net Profit = Total Sales - Total Sold Cost - Business Expenses
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Geli Kharash Cusub</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
            Wadarta Kharashaadka (Total Expenses)
          </span>
          <div className="text-2xl font-black text-rose-600">
            ${totalExpenses.toLocaleString()}
          </div>
          <p className="text-xs text-slate-400 mt-1">{expenses.length} Kharash oo la diiwaangeliyay</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-emerald-700 block mb-1">
            Gross Profit (Faa'iidada Teleefannada)
          </span>
          <div className="text-2xl font-black text-emerald-600">
            +${grossProfit.toLocaleString()}
          </div>
          <p className="text-xs text-emerald-700 mt-1">Total Sales - Total Sold Cost</p>
        </div>

        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-emerald-400 block mb-1">
            Net Business Profit
          </span>
          <div className="text-2xl font-black text-emerald-400">
            ${netProfit.toLocaleString()}
          </div>
          <p className="text-xs text-slate-400 mt-1">Gross Profit - Business Expenses</p>
        </div>
      </div>

      {/* Expenses List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-black text-sm text-slate-900">
            Diiwaanka Kharashaadka Ganacsiga
          </h3>
          <span className="text-xs font-bold text-slate-500">
            Wadarta: ${totalExpenses}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Qaybta (Category)</th>
                <th className="py-3 px-4">Sharaxaadda (Description)</th>
                <th className="py-3 px-4">Taariikhda</th>
                <th className="py-3 px-4 text-right">Lacagta (Amount)</th>
                <th className="py-3 px-4 text-right">Tirtir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Wax kharash ah lama diiwaangelin
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-800">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{exp.description}</td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono">{exp.date}</td>
                    <td className="py-3.5 px-4 text-right font-black text-rose-600 text-sm">
                      -${exp.amount}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onDeleteExpense(exp.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Tirtir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-black text-base text-slate-900">
              Diiwaangeli Kharash Cusub
            </h3>
            <p className="text-xs text-slate-500">
              Kharashkani wuxuu ka go'ayaa faa'iidada guud ee ganacsiga (Net Profit)
            </p>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Qaybta Kharashka (Category)
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                >
                  <option value="Kirada (Rent)">Kirada (Rent)</option>
                  <option value="Koronto (Electricity)">Koronto (Electricity)</option>
                  <option value="Internet & Wi-Fi">Internet & Wi-Fi</option>
                  <option value="Gaadiid / Delivery">Gaadiid / Delivery</option>
                  <option value="Repairs / Dayactir">Repairs / Dayactir</option>
                  <option value="Shaqaale / Mushaar">Shaqaale / Mushaar</option>
                  <option value="Other Expenses">Kharash Kale</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Lacagta ($ USD) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="Tusaale 15"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Taariikhda
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Sharaxaadda (Description)
                </label>
                <input
                  type="text"
                  placeholder="Qaybta kirada dukaanka, baaldi nadiifin..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Ka Noqo
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                >
                  Keydi Kharashka
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
