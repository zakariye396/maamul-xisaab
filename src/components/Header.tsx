import React from 'react';
import {
  PlusCircle,
  Menu,
  TrendingUp,
} from 'lucide-react';
import { AccountingSummary, Partner } from '../types/accounting';
import { NavigationTab } from './Sidebar';

interface HeaderProps {
  summary: AccountingSummary;
  partners: Partner[];
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  activeUser: Partner | null;
  onOpenAuth: () => void;
  onOpenAddPhone: () => void;
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  summary,
  partners,
  activeTab,
  setActiveTab,
  activeUser,
  onOpenAuth,
  onOpenAddPhone,
  onToggleMobileMenu,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center justify-between gap-4">
          {/* Mobile Menu Trigger & Brand on Small Screens */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleMobileMenu}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 md:hidden transition cursor-pointer"
              aria-label="Open mobile menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 md:hidden">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs">
                PT
              </div>
              <span className="font-extrabold text-sm text-slate-900">Phone Hub</span>
            </div>

            {/* Breadcrumb / Page Title */}
            <div className="hidden md:block">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Nidaamka Xisaabaadka
              </div>
              <h2 className="text-sm font-extrabold text-slate-900 capitalize">
                {activeTab === 'dashboard'
                  ? 'Dulmarka Guud ee Ganacsiga'
                  : activeTab === 'phones'
                  ? 'Diiwaanka Teleefannada (Inventory)'
                  : activeTab === 'add-phone'
                  ? 'Qabashada Teleefan Cusub'
                  : activeTab === 'sales'
                  ? 'Iibka & Macaamiisha'
                  : activeTab === 'partners'
                  ? 'Xisaabta Zakariye & Shariif'
                  : activeTab === 'capital'
                  ? 'Lafaha Shuraakada (Capital Tracking)'
                  : activeTab === 'transactions'
                  ? 'Dhaqdhaqaaqa Guud (Transaction Ledger)'
                  : activeTab === 'expenses'
                  ? 'Kharashaadka Dukaanka (Expenses)'
                  : activeTab === 'reports'
                  ? 'Warbixinnada Maaliyadeed (P&L Reports)'
                  : 'Database & SQL Architecture'}
              </h2>
            </div>
          </div>

          {/* Clean Top Header Key Indicators (Section 17: Zakariye Capital, Shariif Capital, Business Profit) */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Zakariye Capital */}
            <div
              onClick={() => setActiveTab('partners')}
              className="px-3 py-1 rounded-xl bg-slate-50 hover:bg-blue-50/80 border border-slate-200 hover:border-blue-200 transition cursor-pointer flex items-center gap-2 text-xs"
              title="Guji si aad u aragto xisaabta Zakariye"
            >
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span className="text-slate-500 font-medium">Zakariye Capital:</span>
              <span className="font-black text-slate-900">
                ${summary.zakariyeTotalCapital}
              </span>
            </div>

            {/* Shariif Capital */}
            <div
              onClick={() => setActiveTab('partners')}
              className="px-3 py-1 rounded-xl bg-slate-50 hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-200 transition cursor-pointer flex items-center gap-2 text-xs"
              title="Guji si aad u aragto xisaabta Shariif"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span className="text-slate-500 font-medium">Shariif Capital:</span>
              <span className="font-black text-slate-900">
                ${summary.shariifTotalCapital}
              </span>
            </div>

            {/* Business Profit */}
            <div className="px-3 py-1 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center gap-1.5 text-xs">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-800 font-medium">Business Profit:</span>
              <span className="font-black text-emerald-700">
                +${summary.grossProfit}
              </span>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAddPhone}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Teleefan Qabo</span>
            </button>

            {/* Active User Switcher Pill */}
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 transition cursor-pointer"
              title="Beddel qofka galay nidaamka"
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                style={{ backgroundColor: activeUser ? activeUser.avatarColor : '#3B82F6' }}
              >
                {activeUser ? activeUser.name[0] : 'U'}
              </div>
              <span className="text-xs font-bold text-slate-700 hidden sm:inline">
                {activeUser ? activeUser.name : 'Switch'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
