import React, { useState } from 'react';
import { Lock, User, ShieldCheck, Eye, EyeOff, AlertCircle, ArrowRight, CheckCircle2, KeyRound } from 'lucide-react';
import { SafeUser } from '../types/accounting';

interface LoginPageProps {
  onLoginSuccess: (token: string, user: SafeUser) => void;
  sessionExpiredMessage?: string | null;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, sessionExpiredMessage }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUser = username.trim();
    if (!cleanUser) {
      setErrorMessage('Fadlan geli magaca isticmaalaha (Username is required)!');
      return;
    }

    if (!password) {
      setErrorMessage('Fadlan geli furahaaga sirta ah (Password is required)!');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Includes HTTP-only cookies
        body: JSON.stringify({ username: cleanUser, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Galitaanku ma suurtagelin. Fadlan hubi xogtaada!');
        setIsLoading(false);
        return;
      }

      // Successful authentication
      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setErrorMessage('Khalad ayaa ka dhacay xiriirka server-ka. Fadlan dib u tijaabi.');
      setIsLoading(false);
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100 select-none">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Card Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/20 ring-4 ring-blue-500/20">
            <ShieldCheck className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Phone Trading Hub
          </h1>
          <p className="text-sm font-medium text-slate-400 mt-1">
            Nidaamka Xisaabaadka & Maamulka Ganacsiga
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
              Secure Production Auth
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Zakariye & Shariif
            </span>
          </div>
        </div>

        {/* Session Expired Notice */}
        {sessionExpiredMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-3 text-xs sm:text-sm animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p className="font-bold">Session Expired / Waad ka baxday</p>
              <p className="text-amber-300/80 text-xs mt-0.5">{sessionExpiredMessage}</p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3 text-xs sm:text-sm animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">Qalad ayaa dhacay</p>
              <p className="text-rose-300/90 text-xs mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Login Box */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/50">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Magaca Isticmaalaha (Username)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin or staff"
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-sm font-semibold text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Furaha Sirta ah (Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Geli furahaaga sirta ah"
                  disabled={isLoading}
                  className="w-full pl-10 pr-11 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-sm font-semibold text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] text-white font-extrabold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Hubinta Xogta...</span>
                </>
              ) : (
                <>
                  <span>Gal Nidaamka (Sign In)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Setup Account Reference */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-blue-400" />
              <span>Akoonnada U Diyaarsan (System Defaults)</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'Admin1234!')}
                className="p-2 rounded-xl bg-slate-950/40 hover:bg-blue-950/40 border border-slate-800/80 hover:border-blue-500/40 text-left transition cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-400 group-hover:text-blue-300">Admin</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold">Full</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-mono">admin / Admin1234!</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('staff', 'Staff1234!')}
                className="p-2 rounded-xl bg-slate-950/40 hover:bg-emerald-950/40 border border-slate-800/80 hover:border-emerald-500/40 text-left transition cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400 group-hover:text-emerald-300">Staff</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">Limited</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-mono">staff / Staff1234!</div>
              </button>
            </div>
          </div>
        </div>

        {/* Security Footer Note */}
        <div className="text-center mt-6 text-xs text-slate-500 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Server-side Scrypt Hash & Bearer Session Tokens</span>
        </div>
      </div>
    </div>
  );
};
