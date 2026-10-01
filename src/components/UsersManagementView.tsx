import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  User,
  KeyRound,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  X,
  Lock,
} from 'lucide-react';
import { SafeUser } from '../types/accounting';

interface UsersManagementViewProps {
  currentUser: SafeUser;
  authToken: string;
}

export const UsersManagementView: React.FC<UsersManagementViewProps> = ({ currentUser, authToken }) => {
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [userToResetPassword, setUserToResetPassword] = useState<SafeUser | null>(null);

  // Create Form State
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newConfirmPassword, setNewConfirmPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'staff'>('staff');
  const [newPartnerId, setNewPartnerId] = useState<number | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset Password State
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resetConfirmValue, setResetConfirmValue] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/users', {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Qalad ayaa ka dhacay soo qaadashada isticmaalayaasha');
        return;
      }
      setUsers(data.data || []);
    } catch (e) {
      setErrorMessage('Xiriirka server-ka waa uu xumaaday');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [authToken]);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newFullName.trim() || !newPassword) {
      setErrorMessage('Fadlan buuxi dhammaan meelaha banaan!');
      return;
    }

    if (newPassword !== newConfirmPassword) {
      setErrorMessage('Furayaasha aad gelisay isma laha (Passwords do not match)!');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('Furaha sirta ah waa inuu ugu yaraan ka koobnaadaa 8 xaraf (Minimum 8 chars)!');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: newUsername.trim(),
          fullName: newFullName.trim(),
          password: newPassword,
          role: newRole,
          partnerId: newPartnerId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Abuurista isticmaalaha ma suurtagelin');
        setIsSubmitting(false);
        return;
      }

      setIsCreateModalOpen(false);
      setNewUsername('');
      setNewFullName('');
      setNewPassword('');
      setNewConfirmPassword('');
      setNewRole('staff');
      setNewPartnerId(undefined);
      showSuccess(`Isticmaalaha "${data.user.username}" si guul leh ayaa loo abuuray!`);
      await fetchUsers();
    } catch (e) {
      setErrorMessage('Khalad ayaa ka dhacay gudbinta xogta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: SafeUser) => {
    const newStatus = !user.isActive;
    const actionName = newStatus ? 'dib u furidda' : 'hakinitaanka';

    if (!confirm(`Ma hubtaa inaad doonaysid ${actionName} akoonka "${user.username}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: newStatus }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'Qalad ayaa dhacay!');
        return;
      }

      showSuccess(`Xaaladda akoonka "${user.username}" waa la beddelay!`);
      await fetchUsers();
    } catch (e) {
      alert('Khalad ayaa ka dhacay xiriirka server-ka');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToResetPassword) return;

    if (!resetPasswordValue || resetPasswordValue.length < 8) {
      setErrorMessage('Furaha cusub waa inuu ka koobnaadaa ugu yaraan 8 xaraf!');
      return;
    }

    if (resetPasswordValue !== resetConfirmValue) {
      setErrorMessage('Furayaashu isma laha (Passwords do not match)!');
      return;
    }

    setIsResetting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/users/${userToResetPassword.id}/reset-password`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword: resetPasswordValue }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Beddelka furaha ma suurtagelin');
        setIsResetting(false);
        return;
      }

      setUserToResetPassword(null);
      setResetPasswordValue('');
      setResetConfirmValue('');
      showSuccess(`Furaha akoonka "${userToResetPassword.username}" si guul leh ayaa loo beddelay!`);
    } catch (e) {
      setErrorMessage('Khalad xagga server-ka ah ayaa dhacay');
    } finally {
      setIsResetting(false);
    }
  };

  const handleDeleteUser = async (user: SafeUser) => {
    if (user.id === currentUser.id) {
      alert('Ma tirtiri kartid akoonkaaga aad hadda ku jirto!');
      return;
    }

    if (!confirm(`DIGNIIN: Ma hubtaa inaad tirtirto isticmaalaha "${user.username}"? Tallaabadan dib looma noqon karo.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'Tirtirista ma suurtagelin!');
        return;
      }

      showSuccess(`Isticmaalaha "${user.username}" waa laga tirtiray nidaamka.`);
      await fetchUsers();
    } catch (e) {
      alert('Khalad ayaa ka dhacay xiriirka server-ka');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900">Maamulka Isticmaalayaasha (Users)</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              Admin Only
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Abuur, maamul, kana ilaali nidaamka xisaabaadka isticmaalka aan la fasaxin.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={fetchUsers}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition cursor-pointer"
            title="Dib u cusboonaysii"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setErrorMessage(null);
              setIsCreateModalOpen(true);
            }}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Abuur Isticmaale Cusub</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 text-xs sm:text-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Qalad ayaa dhacay</p>
            <p className="text-rose-700 mt-0.5">{errorMessage}</p>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 text-xs sm:text-sm animate-in fade-in">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-500" />
          <span className="font-bold">{successMessage}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Isticmaalaha (User)</th>
                <th className="py-3 px-4">Doorka (Role)</th>
                <th className="py-3 px-4">Shuraakada (Partner)</th>
                <th className="py-3 px-4">Xaaladda (Status)</th>
                <th className="py-3 px-4">Galitaankii Ugu Dambeeyay</th>
                <th className="py-3 px-4 text-right">Ficilada (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {users.map((u) => {
                const isCurrent = u.id === currentUser.id;
                return (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white shadow-xs ${
                            u.role === 'admin' ? 'bg-indigo-600' : 'bg-slate-700'
                          }`}
                        >
                          {u.fullName[0] || u.username[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                            <span>{u.fullName}</span>
                            {isCurrent && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-bold">
                                Adiga (You)
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">@{u.username}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                          u.role === 'admin'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {u.role === 'admin' ? (
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-slate-500" />
                        )}
                        <span className="capitalize">{u.role}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {u.partnerId === 1 ? (
                        <span className="text-blue-600">Zakariye</span>
                      ) : u.partnerId === 2 ? (
                        <span className="text-emerald-600">Shariif</span>
                      ) : (
                        <span className="text-slate-400">Guud (General)</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          u.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        />
                        {u.isActive ? 'Active (Shaqaynaya)' : 'Disabled (Hakiyay)'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-500">
                      {u.lastLoginAt ? (
                        <span>{new Date(u.lastLoginAt).toLocaleString()}</span>
                      ) : (
                        <span className="text-slate-400 italic">Marna ma gelin</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Reset Password Button */}
                        <button
                          onClick={() => {
                            setErrorMessage(null);
                            setResetPasswordValue('');
                            setResetConfirmValue('');
                            setUserToResetPassword(u);
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition cursor-pointer"
                          title="Beddel Furaha Isticmaalahan"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>

                        {/* Toggle Active Status */}
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            u.isActive
                              ? 'border-amber-200 hover:bg-amber-50 text-amber-700'
                              : 'border-emerald-200 hover:bg-emerald-50 text-emerald-700'
                          }`}
                          title={u.isActive ? 'Haki Akoonka' : 'Dib u Fur Akoonka'}
                        >
                          {u.isActive ? (
                            <XCircle className="w-3.5 h-3.5" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Delete User */}
                        {!isCurrent && (
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 hover:text-rose-800 transition cursor-pointer"
                            title="Tirtir Isticmaalahan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-black text-slate-900 text-base">Abuur Isticmaale Cusub</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Magaca Buuxa (Full Name)</label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. Maxamed Cali"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Magaca Isticmaalaha (Username)</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  placeholder="e.g. mohamed or staff_ali"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Doorka (Role)</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as 'admin' | 'staff')}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="staff">Staff (Hawl-wadeen)</option>
                    <option value="admin">Admin (Maamule Guud)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Shuraakada (Partner Link)</label>
                  <select
                    value={newPartnerId || ''}
                    onChange={(e) => setNewPartnerId(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Lama Xiriirin (None)</option>
                    <option value="1">Zakariye</option>
                    <option value="2">Shariif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Furaha Sirta ah (Password)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ugu yaraan 8 xaraf"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Xaqiiji Furaha (Confirm Password)</label>
                <input
                  type="password"
                  value={newConfirmPassword}
                  onChange={(e) => setNewConfirmPassword(e.target.value)}
                  placeholder="Ku celi furaha sirta ah"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition cursor-pointer"
                >
                  Ka Noqo
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Kaydinayaa...' : 'Abuur Isticmaale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {userToResetPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="font-black text-slate-900 text-base">
                  Beddel Furaha: @{userToResetPassword.username}
                </h3>
              </div>
              <button
                onClick={() => setUserToResetPassword(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4 mt-4 text-xs">
              <p className="text-slate-500">
                Geli furaha cusub ee aad u qoondeynaysid isticmaalaha <strong>{userToResetPassword.fullName}</strong>.
              </p>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Furaha Cusub (New Password)</label>
                <input
                  type="password"
                  value={resetPasswordValue}
                  onChange={(e) => setResetPasswordValue(e.target.value)}
                  placeholder="Ugu yaraan 8 xaraf"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Xaqiiji Furaha (Confirm Password)</label>
                <input
                  type="password"
                  value={resetConfirmValue}
                  onChange={(e) => setResetConfirmValue(e.target.value)}
                  placeholder="Ku celi furaha cusub"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUserToResetPassword(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition cursor-pointer"
                >
                  Ka Noqo
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isResetting ? 'Beddelayaa...' : 'Xaqiiji Beddelka Furaha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
