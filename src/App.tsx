import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar, NavigationTab } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { PhoneTableView } from './components/PhoneTableView';
import { SalesView } from './components/SalesView';
import { PartnersView } from './components/PartnersView';
import { CapitalView } from './components/CapitalView';
import { TransactionsView } from './components/TransactionsView';
import { ExpensesView } from './components/ExpensesView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { UsersManagementView } from './components/UsersManagementView';
import { AuditLogsView } from './components/AuditLogsView';
import { LoginPage } from './components/LoginPage';
import { ChangePasswordModal } from './components/ChangePasswordModal';

import { AddPhoneModal } from './components/AddPhoneModal';
import { SellPhoneModal } from './components/SellPhoneModal';
import { EditPhoneModal } from './components/EditPhoneModal';
import { ReceiptModal } from './components/ReceiptModal';

import { INITIAL_PARTNERS } from './data/seedData';
import { calculateSummary } from './services/accountingService';
import {
  ExpenseRecord,
  Partner,
  PaymentMethod,
  PhoneRecord,
  TransactionRecord,
  WithdrawalRecord,
  SafeUser,
} from './types/accounting';
import { CheckCircle2, AlertCircle, X, ShieldCheck, KeyRound, LogOut } from 'lucide-react';

export default function App() {
  // Authentication & Session State
  const [currentUser, setCurrentUser] = useState<SafeUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('phone_hub_auth_token') : null;
  });
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState<string | null>(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // Business & Partners State
  const [partners, setPartners] = useState<Partner[]>(INITIAL_PARTNERS);
  const [activeUser, setActiveUser] = useState<Partner | null>(null);

  // Core Accounting Data (authoritative from SQLite backend)
  const [phones, setPhones] = useState<PhoneRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Navigation & UI state
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [phoneToSell, setPhoneToSell] = useState<PhoneRecord | null>(null);
  const [phoneToEdit, setPhoneToEdit] = useState<PhoneRecord | null>(null);
  const [phoneForReceipt, setPhoneForReceipt] = useState<PhoneRecord | null>(null);

  // Toast Alerts
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const showToast = (text: string, isError = false) => {
    setToastMessage({ text, isError });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper for authenticated requests (Bearer token + Cookie)
  const getAuthHeaders = (): HeadersInit => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
  };

  // Session expiry handler (triggers when a 401 is received from backend)
  const handleSessionExpired = (message?: string) => {
    localStorage.removeItem('phone_hub_auth_token');
    setAuthToken(null);
    setCurrentUser(null);
    setActiveUser(null);
    setPhones([]);
    setExpenses([]);
    setWithdrawals([]);
    setTransactions([]);
    setSessionExpiredMessage(
      message || 'Fadlan dib u gal nidaamka. Session-kaagu wuu dhacay ama ma shaqaynayo (Session expired).'
    );
  };

  // 1. Fetch Authoritative Data from Persistent SQLite Database
  const fetchAllData = async (tokenOverride?: string) => {
    const currentToken = tokenOverride || authToken;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }

    setIsLoading(true);
    try {
      const [phonesRes, expRes, wdrRes, txnRes, partnersRes] = await Promise.all([
        fetch('/api/phones', { headers, credentials: 'include' }),
        fetch('/api/expenses', { headers, credentials: 'include' }),
        fetch('/api/withdrawals', { headers, credentials: 'include' }),
        fetch('/api/transactions', { headers, credentials: 'include' }),
        fetch('/api/partners', { headers, credentials: 'include' }),
      ]);

      // Check if unauthenticated (401)
      if (
        phonesRes.status === 401 ||
        expRes.status === 401 ||
        wdrRes.status === 401 ||
        txnRes.status === 401 ||
        partnersRes.status === 401
      ) {
        handleSessionExpired();
        return;
      }

      if (phonesRes.ok) {
        const json = await phonesRes.json();
        if (json.success && Array.isArray(json.data)) {
          setPhones(json.data);
        }
      }

      if (expRes.ok) {
        const json = await expRes.json();
        if (json.success && Array.isArray(json.data)) {
          setExpenses(json.data);
        }
      }

      if (wdrRes.ok) {
        const json = await wdrRes.json();
        if (json.success && Array.isArray(json.data)) {
          setWithdrawals(json.data);
        }
      }

      if (txnRes.ok) {
        const json = await txnRes.json();
        if (json.success && Array.isArray(json.data)) {
          setTransactions(json.data);
        }
      }

      if (partnersRes.ok) {
        const json = await partnersRes.json();
        if (json.success && Array.isArray(json.data)) {
          setPartners(json.data);
        }
      }
    } catch (e) {
      console.error('Database connection error:', e);
      showToast('Xiriirka database-ka waa uu xumaaday!', true);
    } finally {
      setIsLoading(false);
    }
  };

  // Check auth session on startup
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        const res = await fetch('/api/auth/me', {
          headers,
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setCurrentUser(data.user);
            const partner = data.user.partnerId ? INITIAL_PARTNERS.find((p) => p.id === data.user.partnerId) || null : null;
            setActiveUser(partner || INITIAL_PARTNERS[0]);
            await fetchAllData(authToken || undefined);
            setIsAuthChecking(false);
            return;
          }
        }

        // If not authenticated or token invalid
        if (authToken) {
          localStorage.removeItem('phone_hub_auth_token');
          setAuthToken(null);
        }
        setCurrentUser(null);
      } catch (e) {
        console.error('Auth verification error:', e);
        if (authToken) {
          localStorage.removeItem('phone_hub_auth_token');
          setAuthToken(null);
        }
        setCurrentUser(null);
      } finally {
        setIsAuthChecking(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Derived Financial Summary directly from active state
  const summary = useMemo(() => {
    return calculateSummary(phones, expenses, withdrawals);
  }, [phones, expenses, withdrawals]);

  // Login handler
  const handleLoginSuccess = async (token: string, user: SafeUser) => {
    setAuthToken(token);
    localStorage.setItem('phone_hub_auth_token', token);
    setCurrentUser(user);
    setSessionExpiredMessage(null);

    const currentPartner = user.partnerId ? partners.find((p) => p.id === user.partnerId) || null : null;
    setActiveUser(currentPartner || partners[0]);

    setActiveTab('dashboard');
    showToast(`Ku soo dhowow nidaamka, ${user.fullName}!`);
    await fetchAllData(token);
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers,
        credentials: 'include',
      });
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      localStorage.removeItem('phone_hub_auth_token');
      setAuthToken(null);
      setCurrentUser(null);
      setActiveUser(null);
      setPhones([]);
      setExpenses([]);
      setWithdrawals([]);
      setTransactions([]);
      showToast('Waa lagaa saaray nidaamka si guul leh (Logged out).');
    }
  };

  // ----------------- CRUD HANDLERS WITH PERSISTENT BACKEND -----------------

  const handleAddPhone = async (phoneData: Omit<PhoneRecord, 'id' | 'status'>) => {
    try {
      const res = await fetch('/api/phones', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(phoneData),
      });

      if (res.status === 401) {
        handleSessionExpired();
        return;
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || 'Qalad ayaa ka dhacay qabashada teleefanka', true);
        return;
      }

      await fetchAllData();
      showToast(data.message || `Teleefanka ${data.phone.model} si guul leh ayaa loogu qoray database-ka!`);
    } catch (err: any) {
      showToast('Khalad xagga server-ka ah ayaa dhacay', true);
    }
  };

  const handleConfirmSell = async (
    phoneId: string,
    saleData: {
      salePrice: number;
      saleDate: string;
      customerName?: string;
      customerPhone?: string;
      paymentMethod?: PaymentMethod;
      notes?: string;
    }
  ) => {
    try {
      const res = await fetch(`/api/phones/${phoneId}/sell`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(saleData),
      });

      if (res.status === 401) {
        handleSessionExpired();
        return;
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || 'Qalad ayaa ka dhacay iibinta teleefanka', true);
        return;
      }

      setPhoneToSell(null);
      await fetchAllData();
      showToast(`Teleefanka si guul leh ayaa loo iibiyay! Faa'iido: +$${data.profitGenerated}`);
    } catch (err) {
      showToast('Khalad xagga server-ka ah ayaa dhacay', true);
    }
  };

  const handleUpdatePhone = async (phoneData: PhoneRecord) => {
    try {
      const res = await fetch(`/api/phones/${phoneData.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(phoneData),
      });

      if (res.status === 401) {
        handleSessionExpired();
        return;
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || 'Qalad ayaa ka dhacay cusboonaysiinta', true);
        return;
      }

      setPhoneToEdit(null);
      await fetchAllData();
      showToast('Xogta teleefanka waa lagu cusboonaysiiyay database-ka');
    } catch (err) {
      showToast('Khalad xagga server-ka ah ayaa dhacay', true);
    }
  };

  const handleDeletePhone = async (id: string) => {
    try {
      const res = await fetch(`/api/phones/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (res.status === 401) {
        handleSessionExpired();
        return;
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || 'Qalad ayaa ka dhacay tirtirista', true);
        return;
      }

      await fetchAllData();
      showToast('Teleefanka waa laga tirtiray database-ka');
    } catch (err) {
      showToast('Khalad xagga server-ka ah ayaa dhacay', true);
    }
  };

  const handleAddExpense = async (expenseData: Omit<ExpenseRecord, 'id'>) => {
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(expenseData),
      });

      if (res.status === 401) {
        handleSessionExpired();
        return;
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || 'Qalad ayaa ka dhacay qorista kharashka', true);
        return;
      }

      await fetchAllData();
      showToast(`Kharashka $${expenseData.amount} waa lagu keydiyay database-ka`);
    } catch (err) {
      showToast('Khalad xagga server-ka ah ayaa dhacay', true);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (res.status === 401) {
        handleSessionExpired();
        return;
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || 'Qalad ayaa ka dhacay tirtirista', true);
        return;
      }

      await fetchAllData();
      showToast('Kharashka waa la tirtiray');
    } catch (err) {
      showToast('Khalad xagga server-ka ah ayaa dhacay', true);
    }
  };

  const handleAddWithdrawal = async (wdrData: Omit<WithdrawalRecord, 'id'>) => {
    try {
      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(wdrData),
      });

      if (res.status === 401) {
        handleSessionExpired();
        return;
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || 'Qalad ayaa ka dhacay kala bixidda', true);
        return;
      }

      const partnerName = wdrData.partnerId === 1 ? 'Zakariye' : 'Shariif';
      await fetchAllData();
      showToast(`Kala bixidda $${wdrData.amount} ee ${partnerName} waa lagu keydiyay database-ka`);
    } catch (err) {
      showToast('Khalad xagga server-ka ah ayaa dhacay', true);
    }
  };

  const handleResetData = async () => {
    if (confirm('Ma hubtaa inaad dib ugu celiso xogtii rasmiga ahayd ee tijaabada ee database-ka?')) {
      try {
        const res = await fetch('/api/reset', {
          method: 'POST',
          headers: getAuthHeaders(),
          credentials: 'include',
        });

        if (res.status === 401) {
          handleSessionExpired();
          return;
        }

        const data = await res.json();
        if (data.success) {
          await fetchAllData();
          showToast(data.message || 'Xogtii asalka ahayd ee tijaabada ayaa dib loo soo celiyay');
        }
      } catch (e) {
        showToast('Qalad ayaa ka dhacay dib u celinta database-ka', true);
      }
    }
  };

  const handleLoadTestCase = async () => {
    try {
      const res = await fetch('/api/reset', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (res.status === 401) {
        handleSessionExpired();
        return;
      }

      const data = await res.json();
      if (data.success) {
        await fetchAllData();
        setActiveTab('dashboard');
        showToast('Example Test waa la soo raray: Zakariye $50->$70, Shariif $80->$110, Profit $50!');
      }
    } catch (e) {
      showToast('Qalad ayaa ka dhacay tijaabada', true);
    }
  };

  const handleTabChange = (tab: NavigationTab) => {
    if (tab === 'add-phone') {
      setIsAddModalOpen(true);
      setActiveTab('phones');
    } else {
      setActiveTab(tab);
    }
  };

  // ----------------- LOADING SPLASH SCREEN -----------------
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/20 ring-4 ring-blue-500/20">
            <ShieldCheck className="w-9 h-9 text-white animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">Phone Trading Hub</h2>
            <p className="text-xs text-slate-400 mt-1">Xaqiijinta nidaamka amniga & server-ka...</p>
          </div>
          <div className="w-8 h-8 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mt-2" />
        </div>
      </div>
    );
  }

  // ----------------- REQUIRE AUTHENTICATION -----------------
  // If user is not authenticated, render ONLY the Login Page!
  // No accounting dashboard, inventory, or financial data is exposed.
  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        sessionExpiredMessage={sessionExpiredMessage}
      />
    );
  }

  // ----------------- MAIN AUTHENTICATED APPLICATION -----------------
  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 text-xs sm:text-sm font-bold ${
              toastMessage.isError
                ? 'bg-rose-900 text-white border-rose-700'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            {toastMessage.isError ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        activeUser={activeUser}
        currentUser={currentUser}
        onOpenAuth={() => {}}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        onLogout={handleLogout}
        inStockCount={summary.phonesInStock}
        totalPhonesCount={summary.totalPhones}
      />

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
          <div className="relative w-64 bg-slate-900 text-white flex flex-col h-full shadow-2xl z-10">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <span className="font-black text-sm">Phone Trading Hub</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {[
                { id: 'dashboard', label: 'Dashboard' },
                { id: 'phones', label: 'Phones (Inventory)' },
                { id: 'add-phone', label: 'Add Phone (Qabasho)' },
                { id: 'sales', label: 'Sales (Iibka)' },
                { id: 'partners', label: 'Partners' },
                { id: 'capital', label: 'Capital (Lafaha)' },
                { id: 'transactions', label: 'Transactions' },
                { id: 'expenses', label: 'Expenses (Kharash)' },
                { id: 'reports', label: 'Reports' },
                { id: 'settings', label: 'Database & SQL' },
                ...(isAdmin
                  ? [
                      { id: 'users', label: 'Users (Maamulka)' },
                      { id: 'audit', label: 'Audit Logs' },
                    ]
                  : []),
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'add-phone') {
                      setIsAddModalOpen(true);
                    } else {
                      setActiveTab(item.id as NavigationTab);
                    }
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold ${
                    activeTab === item.id ? 'bg-blue-600 text-white' : 'text-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Mobile Footer Profile */}
            <div className="p-3 border-t border-slate-800 bg-slate-950">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white truncate">{currentUser.fullName}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
                  {currentUser.role.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => {
                    setIsChangePasswordOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="p-1.5 rounded-lg bg-slate-900 text-[11px] font-bold text-slate-300 flex items-center justify-center gap-1"
                >
                  <KeyRound className="w-3 h-3 text-amber-400" />
                  <span>Furaha</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg bg-rose-950/40 text-[11px] font-bold text-rose-300 flex items-center justify-center gap-1"
                >
                  <LogOut className="w-3 h-3 text-rose-400" />
                  <span>Ka bax</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          summary={summary}
          partners={partners}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          activeUser={activeUser}
          currentUser={currentUser}
          onOpenAuth={() => {}}
          onOpenChangePassword={() => setIsChangePasswordOpen(true)}
          onLogout={handleLogout}
          onOpenAddPhone={() => setIsAddModalOpen(true)}
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-16">
          {activeTab === 'dashboard' && (
            <DashboardView
              summary={summary}
              partners={partners}
              phones={phones}
              transactions={transactions}
              onOpenAddPhone={() => setIsAddModalOpen(true)}
              onOpenSellModal={(p) => setPhoneToSell(p)}
              setActiveTab={setActiveTab}
              onLoadTestCase={handleLoadTestCase}
            />
          )}

          {activeTab === 'phones' && (
            <PhoneTableView
              phones={phones}
              partners={partners}
              transactions={transactions}
              onOpenSellModal={(p) => setPhoneToSell(p)}
              onOpenReceiptModal={(p) => setPhoneForReceipt(p)}
              onOpenEditModal={(p) => setPhoneToEdit(p)}
              onDeletePhone={handleDeletePhone}
              onOpenAddPhone={() => setIsAddModalOpen(true)}
            />
          )}

          {activeTab === 'sales' && (
            <SalesView
              phones={phones}
              partners={partners}
              onOpenSellModal={(p) => setPhoneToSell(p)}
              onOpenReceiptModal={(p) => setPhoneForReceipt(p)}
            />
          )}

          {activeTab === 'partners' && (
            <PartnersView
              summary={summary}
              partners={partners}
              phones={phones}
              transactions={transactions}
              onOpenSellModal={(p) => setPhoneToSell(p)}
            />
          )}

          {activeTab === 'capital' && (
            <CapitalView
              summary={summary}
              partners={partners}
              phones={phones}
              withdrawals={withdrawals}
              onAddWithdrawal={handleAddWithdrawal}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsView
              transactions={transactions}
              partners={partners}
              phones={phones}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesView
              expenses={expenses}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
              grossProfit={summary.grossProfit}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              summary={summary}
              phones={phones}
              expenses={expenses}
              partners={partners}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              summary={summary}
              phones={phones}
              expenses={expenses}
              withdrawals={withdrawals}
              transactions={transactions}
              onReset={handleResetData}
              onLoadTestCase={handleLoadTestCase}
              onImportJson={async (imported: any) => {
                if (imported && Array.isArray(imported.phones)) {
                  await fetchAllData();
                  showToast('Database waa la cusboonaysiiyay');
                }
              }}
            />
          )}

          {/* Admin Only Views */}
          {activeTab === 'users' && isAdmin && (
            <UsersManagementView currentUser={currentUser} authToken={authToken || ''} />
          )}

          {activeTab === 'audit' && isAdmin && (
            <AuditLogsView authToken={authToken || ''} />
          )}
        </main>
      </div>

      {/* ALL MODALS */}
      <AddPhoneModal
        isOpen={isAddModalOpen || activeTab === 'add-phone'}
        onClose={() => {
          setIsAddModalOpen(false);
          if (activeTab === 'add-phone') setActiveTab('phones');
        }}
        partners={partners}
        onAddPhone={handleAddPhone}
        existingPhones={phones}
      />

      <SellPhoneModal
        phone={phoneToSell}
        isOpen={Boolean(phoneToSell)}
        onClose={() => setPhoneToSell(null)}
        onConfirmSell={handleConfirmSell}
      />

      <EditPhoneModal
        phone={phoneToEdit}
        isOpen={Boolean(phoneToEdit)}
        onClose={() => setPhoneToEdit(null)}
        onUpdatePhone={handleUpdatePhone}
        existingPhones={phones}
      />

      <ReceiptModal
        phone={phoneForReceipt}
        isOpen={Boolean(phoneForReceipt)}
        onClose={() => setPhoneForReceipt(null)}
      />

      {/* Password Change Modal */}
      <ChangePasswordModal
        currentUser={currentUser}
        authToken={authToken || ''}
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        onSuccess={(msg) => showToast(msg)}
      />
    </div>
  );
}
