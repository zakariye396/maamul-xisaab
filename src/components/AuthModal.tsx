import React, { useState } from 'react';
import { X, Lock, CheckCircle2, ShieldCheck, KeyRound, AlertCircle } from 'lucide-react';
import { Partner } from '../types/accounting';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  partners: Partner[];
  activeUser: Partner | null;
  onLoginSuccess: (user: Partner | null, token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  partners,
  activeUser,
  onLoginSuccess,
}) => {
  const [selectedId, setSelectedId] = useState<number | 'admin'>(activeUser ? activeUser.id : 1);
  const [pin, setPin] = useState<string>('1234');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPartner = (id: number | 'admin') => {
    setSelectedId(id);
    setError(null);
    if (id === 1) setPin('1234');
    else if (id === 2) setPin('5678');
    else if (id === 'admin') setPin('9999');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId: selectedId, pin }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'PIN-ka aad gelisay ma saxna!');
        setLoading(false);
        return;
      }

      // Login success
      const user = selectedId === 'admin' ? null : partners.find((p) => p.id === selectedId) || null;
      onLoginSuccess(user, data.session?.token || '');
      onClose();
    } catch (err: any) {
      setError('Khalad ayaa ka dhacay xiriirka server-ka');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-black text-base text-slate-900">Galitaanka Nidaamka (Auth)</h3>
              <p className="text-[10px] text-slate-500 font-medium">Xaqiijinta dhabta ah ee server-ka</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700 font-bold">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-2.5">
          <label className="text-xs font-bold text-slate-700 block">Dooro Qofka Galaya:</label>

          {partners.map((partner) => {
            const isSelected = selectedId === partner.id;
            return (
              <div
                key={partner.id}
                onClick={() => handleSelectPartner(partner.id)}
                className={`p-3 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl text-white font-black text-sm flex items-center justify-center shadow-xs"
                    style={{ backgroundColor: partner.avatarColor }}
                  >
                    {partner.name[0]}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">{partner.name}</h4>
                    <span className="text-[11px] text-slate-500">PIN: {partner.id === 1 ? '1234' : '5678'}</span>
                  </div>
                </div>

                {isSelected && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
              </div>
            );
          })}

          {/* Admin All Access Option */}
          <div
            onClick={() => handleSelectPartner('admin')}
            className={`p-3 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition ${
              selectedId === 'admin'
                ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-800 text-white font-black text-sm flex items-center justify-center">
                A
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">Maamul Guud (Admin)</h4>
                <span className="text-[11px] text-slate-500">PIN: 9999 (Dhammaan xuquuqda)</span>
              </div>
            </div>

            {selectedId === 'admin' && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
          </div>
        </div>

        {/* PIN Input Form */}
        <form onSubmit={handleLogin} className="space-y-4 pt-1">
          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between mb-1.5">
              <span>Geli PIN-kaaga Sirta ah:</span>
              <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3" /> Secure Auth
              </span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Geli 4 lambar..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 tracking-widest focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Ka Noqo
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? 'Hubinayaa...' : 'Xaqiiji & Gal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
