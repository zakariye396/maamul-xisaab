import React from 'react';
import {
  LayoutDashboard,
  Smartphone,
  PlusCircle,
  ShoppingBag,
  Users,
  Wallet,
  Receipt,
  BarChart3,
  Database,
  ArrowRightLeft,
  ShieldCheck,
  FileText,
  KeyRound,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { Partner, SafeUser } from '../types/accounting';

export type NavigationTab =
  | 'dashboard'
  | 'phones'
  | 'add-phone'
  | 'sales'
  | 'partners'
  | 'capital'
  | 'transactions'
  | 'expenses'
  | 'reports'
  | 'users'
  | 'audit'
  | 'settings';

interface SidebarProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  activeUser: Partner | null;
  currentUser: SafeUser | null;
  onOpenAuth: () => void;
  onOpenChangePassword: () => void;
  onLogout: () => void;
  inStockCount: number;
  totalPhonesCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenChangePassword,
  onLogout,
  inStockCount,
  totalPhonesCount,
}) => {
  interface NavItem {
    id: NavigationTab;
    label: string;
    icon: any;
    badge?: string | number | null;
    highlight?: boolean;
  }

  const operationsItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'phones', label: 'Phones (Inventory)', icon: Smartphone, badge: totalPhonesCount },
    { id: 'add-phone', label: 'Add Phone (Qabasho)', icon: PlusCircle, badge: null, highlight: true },
    { id: 'sales', label: 'Sales (Iibka)', icon: ShoppingBag, badge: null },
  ];

  const financeItems: NavItem[] = [
    { id: 'partners', label: 'Partners', icon: Users, badge: '2' },
    { id: 'capital', label: 'Capital (Lafaha)', icon: Wallet, badge: null },
    { id: 'transactions', label: 'Transactions', icon: ArrowRightLeft, badge: null },
    { id: 'expenses', label: 'Expenses (Kharash)', icon: Receipt, badge: null },
    { id: 'reports', label: 'P&L Reports', icon: BarChart3, badge: null },
    { id: 'settings', label: 'Database & SQL', icon: Database, badge: null },
  ];

  const adminItems: NavItem[] = [
    { id: 'users', label: 'Users (Maamulka)', icon: ShieldCheck, badge: null },
    { id: 'audit', label: 'Audit Logs', icon: FileText, badge: null },
  ];

  const isAdmin = currentUser?.role === 'admin';

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 shrink-0 hidden md:flex flex-col justify-between border-r border-slate-800 min-h-screen sticky top-0 h-screen select-none">
      {/* Brand & App Title */}
      <div className="p-4 border-b border-slate-800/90">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs font-black">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-tight text-white leading-tight">
              Phone Trading Hub
            </h1>
            <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mt-0.5">
              <span className="text-blue-400">Zakariye</span>
              <span className="text-slate-600">&</span>
              <span className="text-emerald-400">Shariif</span>
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {/* Operations Group */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-1.5">
            Operations (Hawlgalka)
          </div>
          <div className="space-y-0.5">
            {operationsItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-white' : 'text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== null && item.badge !== undefined && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Finance Group */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-1.5">
            Finance & Ledgers (Maaliyadda)
          </div>
          <div className="space-y-0.5">
            {financeItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-white' : 'text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== null && item.badge !== undefined && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Admin Management Group (Admin Only) */}
        {isAdmin && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 px-3 mb-1.5 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>Security & Admin</span>
            </div>
            <div className="space-y-0.5">
              {adminItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-white' : 'text-indigo-400'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Active User Profile & Actions Footer */}
      <div className="p-3.5 border-t border-slate-800/90 bg-slate-950/80">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs text-white shrink-0 shadow-xs ${
                isAdmin ? 'bg-indigo-600 ring-2 ring-indigo-500/30' : 'bg-slate-700'
              }`}
            >
              {currentUser?.fullName[0] || currentUser?.username[0]?.toUpperCase() || 'U'}
            </div>
            <div className="text-left overflow-hidden">
              <span className="text-xs font-bold text-white block leading-tight truncate">
                {currentUser?.fullName || 'User'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono block truncate">
                @{currentUser?.username} ({currentUser?.role?.toUpperCase()})
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions: Change Password & Logout */}
        <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-800/60">
          <button
            onClick={onOpenChangePassword}
            title="Beddel Furaha Sirta ah (Change Password)"
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] font-bold text-slate-300 hover:text-white transition cursor-pointer border border-slate-800"
          >
            <KeyRound className="w-3 h-3 text-amber-400" />
            <span>Furaha</span>
          </button>

          <button
            onClick={onLogout}
            title="Ka bax nidaamka (Sign Out)"
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-rose-950/30 hover:bg-rose-900/50 text-[11px] font-bold text-rose-300 hover:text-rose-100 transition cursor-pointer border border-rose-900/40"
          >
            <LogOut className="w-3 h-3 text-rose-400" />
            <span>Ka bax</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
