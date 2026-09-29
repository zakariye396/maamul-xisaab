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
  ChevronRight,
} from 'lucide-react';
import { Partner } from '../types/accounting';

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
  | 'settings';

interface SidebarProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  activeUser: Partner | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  inStockCount: number;
  totalPhonesCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  activeUser,
  onOpenAuth,
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

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 shrink-0 hidden md:flex flex-col justify-between border-r border-slate-800 min-h-screen sticky top-0 h-screen select-none">
      {/* Brand & App Title */}
      <div className="p-4 border-b border-slate-800/90">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs font-black">
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
                        isActive
                          ? 'text-white'
                          : item.highlight
                          ? 'text-blue-400'
                          : 'text-slate-400'
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
            Finance & Audit (Xisaabaadka)
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
      </div>

      {/* Active Profile / Auth Switcher Footer */}
      <div className="p-3.5 border-t border-slate-800/90 bg-slate-950/70">
        <div className="flex items-center justify-between">
          <div
            onClick={onOpenAuth}
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-85 transition"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs text-white shadow-xs"
              style={{ backgroundColor: activeUser ? activeUser.avatarColor : '#3B82F6' }}
            >
              {activeUser ? activeUser.name[0] : 'A'}
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-white block leading-none">
                {activeUser ? activeUser.name : 'Maamul Guud'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {activeUser ? 'Partner Active' : 'All Access'}
              </span>
            </div>
          </div>

          <button
            onClick={onOpenAuth}
            title="Switch Partner"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
