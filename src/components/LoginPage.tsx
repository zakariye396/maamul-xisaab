import React, { useState } from 'react';
import { Lock, User, ShieldCheck, Eye, EyeOff, AlertCircle, ArrowRight, Shield } from 'lucide-react';
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
      setErrorMessage('Fadlan geli username-kaaga.');
      return;
    }

    if (!password) {
      setErrorMessage('Fadlan geli password-kaaga.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: cleanUser, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        // If rate limited (HTTP 429), preserve the lockout warning; otherwise use clean generic message
        if (res.status === 429) {
          setErrorMessage(data.error || 'Isku-dayo aad u badan. Fadlan sug wax yar.');
        } else {
          setErrorMessage('Username ama password-ka waa khaldan yahay.');
        }
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

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Subtle Ambient Lighting */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[32rem] h-[32rem] bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute -top-24 right-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand Card Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center mx-auto mb-3.5 shadow-xl shadow-blue-600/20 ring-4 ring-blue-500/10">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Phone Trading Hub
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-400 mt-1">
            Nidaamka Xisaabaadka & Maamulka Ganacsiga
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Si aad u gasho nidaamka, geli xogta akoonkaaga.
          </p>
        </div>

        {/* Session Expired Notice */}
        {sessionExpiredMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-3 text-xs animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p className="font-bold">Session Expired</p>
              <p className="text-amber-300/80 mt-0.5">{sessionExpiredMessage}</p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3 text-xs animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">Galitaanka waa la diiday</p>
              <p className="text-rose-300/90 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Production Login Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Username Input */}
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2"
              >
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck="false"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Geli username-kaaga"
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Geli password-kaaga"
                  disabled={isLoading}
                  className="w-full pl-10 pr-11 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] text-white font-extrabold text-sm rounded-xl shadow-lg shadow-blue-600/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Hubinta Xogta...</span>
                </>
              ) : (
                <>
                  <span>Gal Nidaamka</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Secure Production Authentication Note */}
          <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-500">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span>Secure Production Authentication</span>
          </div>
        </div>

        {/* Footer Branding */}
        <div className="text-center mt-6 text-xs text-slate-500 font-medium">
          Phone Trading Hub • Zakariye & Shariif
        </div>
      </div>
    </div>
  );
};
