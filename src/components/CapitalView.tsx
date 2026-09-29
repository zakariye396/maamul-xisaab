import React, { useState } from 'react';
import {
  Wallet,
  ArrowUpRight,
  PlusCircle,
  PiggyBank,
  CheckCircle2,
  AlertCircle,
  Scale,
  ShieldCheck,
} from 'lucide-react';
import { AccountingSummary, Partner, PhoneRecord, WithdrawalRecord } from '../types/accounting';

interface CapitalViewProps {
  summary: AccountingSummary;
  partners: Partner[];
  phones: PhoneRecord[];
  withdrawals: WithdrawalRecord[];
  onAddWithdrawal: (wdr: Omit<WithdrawalRecord, 'id'>) => void;
}

export const CapitalView: React.FC<CapitalViewProps> = ({
  summary,
  partners,
  phones,
  withdrawals,
  onAddWithdrawal,
}) => {
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [wdrPartnerId, setWdrPartnerId] = useState<1 | 2>(1);
  const [wdrAmount, setWdrAmount] = useState('');
  const [wdrDate, setWdrDate] = useState(new Date().toISOString().split('T')[0]);
  const [wdrReason, setWdrReason] = useState('');
  const [wdrNotes, setWdrNotes] = useState('');
  const [error, setError] = useState('');

  const handleWithdrawalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(wdrAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Fadlan geli lacag sax ah!');
      return;
    }

    onAddWithdrawal({
      partnerId: wdrPartnerId,
      amount: amountNum,
      date: wdrDate,
      reason: wdrReason.trim() || `Kala bixidda lafaha ee ${wdrPartnerId === 1 ? 'Zakariye' : 'Shariif'}`,
      notes: wdrNotes.trim() || undefined,
    });

    setWdrAmount('');
    setWdrReason('');
    setWdrNotes('');
    setError('');
    setShowWithdrawModal(false);
  };

  const zakariyeTotal = summary.zakariyeTotalCapital;
  const zakariyeInStock = summary.zakariyeInStockCapital;
  const zakariyeSold = summary.zakariyeSoldCapital;
  const zakariyeWdr = summary.zakariyeWithdrawals;

  const zakariyeRatio =
    summary.totalCapital > 0
      ? Math.round((zakariyeTotal / summary.totalCapital) * 100)
      : 50;
  const shariifRatio = 100 - zakariyeRatio;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-blue-600" />
            <span>Nidaamka Lafaha & Raasamaalka (Capital Tracking)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Total Capital ma beddelayso ownership-ka. Zakariye wuxuu leeyahay lafihiisa, Shariif-na lafihiisa.
          </p>
        </div>

        <button
          onClick={() => setShowWithdrawModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition cursor-pointer"
        >
          <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          <span>+ Diiwaangeli Kala Bixid (Withdrawal)</span>
        </button>
      </div>

      {/* Main 3 Capital Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Zakariye Capital */}
        <div className="bg-white rounded-2xl p-6 border-2 border-blue-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center">
                Z
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-600 block">
                  Capital Owner
                </span>
                <h3 className="font-black text-base text-slate-900">Zakariye Capital</h3>
              </div>
            </div>
            <span className="text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              {zakariyeRatio}% Share
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-3xl font-black text-slate-900">
              ${zakariyeTotal.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500">
              Lacagtii uu ku qabtay teleefannada uu isagu leeyahay
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Lafaha Hadda Kaydka Yaal:</span>
              <span className="font-bold text-blue-700">${zakariyeInStock}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Lafaha Teleefannada Iibsamay:</span>
              <span className="font-bold text-slate-800">${zakariyeSold}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Lacagta uu la baxay (Withdrawn):</span>
              <span className="font-bold text-amber-600">-${zakariyeWdr}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Shariif Capital */}
        <div className="bg-white rounded-2xl p-6 border-2 border-emerald-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center">
                S
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-600 block">
                  Capital Owner
                </span>
                <h3 className="font-black text-base text-slate-900">Shariif Capital</h3>
              </div>
            </div>
            <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              {shariifRatio}% Share
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-3xl font-black text-slate-900">
              ${summary.shariifTotalCapital.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500">
              Lacagtii uu ku qabtay teleefannada uu isagu leeyahay
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Lafaha Hadda Kaydka Yaal:</span>
              <span className="font-bold text-emerald-700">${summary.shariifInStockCapital}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Lafaha Teleefannada Iibsamay:</span>
              <span className="font-bold text-slate-800">${summary.shariifSoldCapital}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Lacagta uu la baxay (Withdrawn):</span>
              <span className="font-bold text-amber-600">-${summary.shariifWithdrawals}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Capital (Zakariye + Shariif) */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-indigo-400 bg-white/10 px-2.5 py-1 rounded-md">
              Total Capital
            </span>
            <PiggyBank className="w-6 h-6 text-indigo-400" />
          </div>

          <div className="space-y-1">
            <div className="text-3xl font-black text-white">
              ${summary.totalCapital.toLocaleString()}
            </div>
            <p className="text-xs text-slate-400">
              Zakariye (${zakariyeTotal}) + Shariif (${summary.shariifTotalCapital})
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${zakariyeRatio}%` }}
                className="bg-blue-500 h-full"
                title={`Zakariye: ${zakariyeRatio}%`}
              ></div>
              <div
                style={{ width: `${shariifRatio}%` }}
                className="bg-emerald-500 h-full"
                title={`Shariif: ${shariifRatio}%`}
              ></div>
            </div>
            <div className="flex justify-between text-[11px] font-semibold text-slate-300">
              <span>Zakariye: {zakariyeRatio}%</span>
              <span>Shariif: {shariifRatio}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Withdrawals Table (Section 12 in Prompt) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-black text-base text-slate-900">
              Diiwaanka Kala Bixidda Lacagaha (Partner Withdrawals Ledger)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Lacagaha Zakariye ama Shariif ka qaateen ganacsiga (lama dhex geliyo profit-ka teleefannada)
            </p>
          </div>
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            + Geli Kala Bixid
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Partner</th>
                <th className="py-3 px-4">Lacagta (Amount)</th>
                <th className="py-3 px-4">Sababta (Reason)</th>
                <th className="py-3 px-4">Taariikhda</th>
                <th className="py-3 px-4">Xusuusin (Notes)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    Wax kala bixid ah lama diiwaangelin
                  </td>
                </tr>
              ) : (
                withdrawals.map((wdr) => (
                  <tr key={wdr.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                          wdr.partnerId === 1
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {wdr.partnerId === 1 ? 'Zakariye' : 'Shariif'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-rose-600 text-sm">
                      -${wdr.amount}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">{wdr.reason}</td>
                    <td className="py-3.5 px-4 text-slate-500">{wdr.date}</td>
                    <td className="py-3.5 px-4 text-slate-400">{wdr.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-black text-base text-slate-900">
              Diiwaangeli Kala Bixidda Lacagta ee Partner
            </h3>
            <p className="text-xs text-slate-500">
              Dooro qofka lacagta la baxay iyo sababta (lafihiisii hore ama mid gaar ah)
            </p>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200">
                {error}
              </div>
            )}

            <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Yaa lacagta la baxay?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWdrPartnerId(1)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                      wdrPartnerId === 1
                        ? 'border-blue-600 bg-blue-50 text-blue-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Zakariye
                  </button>
                  <button
                    type="button"
                    onClick={() => setWdrPartnerId(2)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                      wdrPartnerId === 2
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Shariif
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Lacagta ($ USD) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="50 ama 80"
                  value={wdrAmount}
                  onChange={(e) => setWdrAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Taariikhda
                </label>
                <input
                  type="date"
                  value={wdrDate}
                  onChange={(e) => setWdrDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Sababta (Reason) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Lafihii teleefanka oo soo baxay, iwm"
                  value={wdrReason}
                  onChange={(e) => setWdrReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Xusuusin / Notes
                </label>
                <input
                  type="text"
                  placeholder="Faahfaahin dheeraad ah..."
                  value={wdrNotes}
                  onChange={(e) => setWdrNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Ka Noqo
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
                >
                  Keydi Kala Bixidda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
