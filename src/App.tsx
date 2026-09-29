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

import { AddPhoneModal } from './components/AddPhoneModal';
import { SellPhoneModal } from './components/SellPhoneModal';
import { EditPhoneModal } from './components/EditPhoneModal';
import { ReceiptModal } from './components/ReceiptModal';
import { AuthModal } from './components/AuthModal';

import { INITIAL_PARTNERS } from './data/seedData';
import { calculateSummary } from './services/accountingService';
import {
  ExpenseRecord,
  Partner,
  PaymentMethod,
  PhoneRecord,
  TransactionRecord,
  WithdrawalRecord,
} from './types/accounting';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function App() {
  const [partners, setPartners] = useState<Partner[]>(INITIAL_PARTNERS);
  const [activeUser, setActiveUser] = useState<Partner | null>(INITIAL_PARTNERS[0]); // Default Zakariye
  const [authToken, setAuthToken] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('phone_hub_auth_token') : null;
  });

  // Core State (authoritative from SQLite backend)
  const [phones, setPhones] = useState<PhoneRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // UI state
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [phoneToSell, setPhoneToSell] = useState<PhoneRecord | null>(null);
  const [phoneToEdit, setPhoneToEdit] = useState<PhoneRecord | null>(null);
  const [phoneForReceipt, setPhoneForReceipt] = useState<PhoneRecord | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const showToast = (text: string, isError = false) => {
    setToastMessage({ text, isError });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper for authenticated requests
  const getAuthHeaders = (): HeadersInit => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
  };

  // 1. Fetch Authoritative Data from Persistent SQLite Database
  const fetchAllData = async () => {
    try {
      const [phonesRes, expRes, wdrRes, txnRes, partnersRes] = await Promise.all([
        fetch('/api/phones'),
        fetch('/api/expenses'),
        fetch('/api/withdrawals'),
        fetch('/api/transactions'),
        fetch('/api/partners'),
      ]);

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

  // Check auth session and load database records on mount
  useEffect(() => {
    const initApp = async () => {
      if (authToken) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          const data = await res.json();
          if (data.authenticated && data.user) {
            const currentPartner = partners.find((p) => p.id === data.user.partnerId) || null;
            setActiveUser(currentPartner);
          }
        } catch (e) {
          // Token expired or invalid
          localStorage.removeItem('phone_hub_auth_token');
          setAuthToken(null);
        }
      }
      await fetchAllData();
    };

    initApp();
  }, [authToken]);

  // Derived Financial Summary directly from active state
  const summary = useMemo(() => {
    return calculateSummary(phones, expenses, withdrawals);
  }, [phones, expenses, withdrawals]);

  // ----------------- CRUD HANDLERS WITH PERSISTENT BACKEND -----------------

  const handleAddPhone = async (phoneData: Omit<PhoneRecord, 'id' | 'status'>) => {
    try {
      const res = await fetch('/api/phones', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(phoneData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || 'Qalad ayaa ka dhacay qabashada teleefanka', true);
        return;
      }

      // Refresh authoritative data from database
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
        body: JSON.stringify(saleData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || 'Qalad ayaa ka dhacay iibinta teleefanka', true);
        return;
      }

      await fetchAllData();
      showToast(
        `Iibku wuu guuleystay! Faa'iido: +$${data.profitGenerated} | Lafaha dib u soo noqday (${data.ownerPartner}): $${data.returnedCapital}`
      );
    } catch (err: any) {
      showToast('Khalad xagga server-ka ah ayaa dhacay', true);
    }
  };

  const handleUpdatePhone = async (updatedPhone: PhoneRecord) => {
    try {
      const res = await fetch(`/api/phones/${updatedPhone.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedPhone),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || 'Qalad ayaa ka dhacay cusboonaysiinta', true);
        return;
      }

      await fetchAllData();
      showToast(`Xogta ${updatedPhone.model} waa lagu cusboonaysiiyay database-ka`);
    } catch (err) {
      showToast('Khalad xagga server-ka ah ayaa dhacay', true);
    }
  };

  const handleDeletePhone = async (phoneId: string) => {
    if (confirm('Ma hubtaa inaad tirtirto teleefankan database-ka?')) {
      try {
        const res = await fetch(`/api/phones/${phoneId}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
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
    }
  };

  const handleAddExpense = async (expData: Omit<ExpenseRecord, 'id'>) => {
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(expData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || 'Qalad ayaa ka dhacay diiwaangelinta kharashka', true);
        return;
      }

      await fetchAllData();
      showToast(`Kharashka $${expData.amount} waa lagu keydiyay database-ka`);
    } catch (err) {
      showToast('Khalad xagga server-ka ah ayaa dhacay', true);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || 'Qalad ayaa ka dhacay tirtirista', true);
        return;
      }

      await fetchAllData();
      showToast('Kharashka waa laga tirtiray database-ka');
    } catch (err) {
      showToast('Khalad xagga server-ka ah ayaa dhacay', true);
    }
  };

  const handleAddWithdrawal = async (wdrData: Omit<WithdrawalRecord, 'id'>) => {
    try {
      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(wdrData),
      });

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
    if (confirm("Ma hubtaa inaad dib ugu celiso xogtii rasmiga ahayd ee tijaabada ee database-ka?")) {
      try {
        const res = await fetch('/api/reset', { method: 'POST', headers: getAuthHeaders() });
        const data = await res.json();
        if (data.success) {
          await fetchAllData();
          showToast(data.message || "Xogtii asalka ahayd ee tijaabada ayaa dib loo soo celiyay");
        }
      } catch (e) {
        showToast('Qalad ayaa ka dhacay dib u celinta database-ka', true);
      }
    }
  };

  const handleLoadTestCase = async () => {
    try {
      const res = await fetch('/api/reset', { method: 'POST', headers: getAuthHeaders() });
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

  const handleLoginSuccess = (user: Partner | null, token: string) => {
    setActiveUser(user);
    setAuthToken(token);
    localStorage.setItem('phone_hub_auth_token', token);
    showToast(`Guul: Waxaa galay ${user ? user.name : 'Maamul Guud (Admin)'}!`);
  };

  const handleLogout = async () => {
    try {
      if (authToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` },
        });
      }
    } catch (e) {}
    localStorage.removeItem('phone_hub_auth_token');
    setAuthToken(null);
    setActiveUser(null);
    showToast('Waa lagaa saaray nidaamka si guul leh (Logged out)');
  };

  const handleTabChange = (tab: NavigationTab) => {
    if (tab === 'add-phone') {
      setIsAddModalOpen(true);
      setActiveTab('phones');
    } else {
      setActiveTab(tab);
    }
  };

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
        onOpenAuth={() => setIsAuthOpen(true)}
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
          onOpenAuth={() => setIsAuthOpen(true)}
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
                  // Reload directly from database
                  await fetchAllData();
                  showToast('Database waa la cusboonaysiiyay');
                }
              }}
            />
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

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        partners={partners}
        activeUser={activeUser}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
