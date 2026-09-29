import {
  INITIAL_EXPENSES,
  INITIAL_PARTNERS,
  INITIAL_PHONES,
  INITIAL_TRANSACTIONS,
  INITIAL_WITHDRAWALS,
} from '../data/seedData';
import {
  AccountingSummary,
  ExpenseRecord,
  Partner,
  PhoneRecord,
  TransactionRecord,
  WithdrawalRecord,
} from '../types/accounting';

const STORAGE_KEY_PHONES = 'phone_system_phones_v2';
const STORAGE_KEY_EXPENSES = 'phone_system_expenses_v2';
const STORAGE_KEY_WITHDRAWALS = 'phone_system_withdrawals_v2';
const STORAGE_KEY_TRANSACTIONS = 'phone_system_transactions_v2';

export function calculateSummary(
  phones: PhoneRecord[],
  expenses: ExpenseRecord[] = [],
  withdrawals: WithdrawalRecord[] = []
): AccountingSummary {
  // Helper to determine capital owner (paidBy takes precedence over legacy purchasedBy)
  const getFunder = (p: PhoneRecord): number => p.paidBy || p.capitalOwner || p.purchasedBy;
  const getAcquirer = (p: PhoneRecord): number => p.acquiredBy || p.purchasedBy;

  // Zakariye (PartnerId = 1)
  const zakariyeFundedPhones = phones.filter((p) => getFunder(p) === 1);
  const zakariyeAcquiredPhones = phones.filter((p) => getAcquirer(p) === 1);

  const zakariyeInStock = zakariyeFundedPhones.filter((p) => p.status === 'In Stock');
  const zakariyeSold = zakariyeFundedPhones.filter((p) => p.status === 'Sold');

  const zakariyeInStockCapital = zakariyeInStock.reduce((sum, p) => sum + Number(p.purchasePrice || 0), 0);
  const zakariyeSoldCapital = zakariyeSold.reduce((sum, p) => sum + Number(p.purchasePrice || 0), 0);
  const zakariyeTotalCapital = zakariyeInStockCapital + zakariyeSoldCapital;
  const zakariyeWithdrawals = withdrawals
    .filter((w) => w.partnerId === 1)
    .reduce((sum, w) => sum + Number(w.amount || 0), 0);

  // Shariif (PartnerId = 2)
  const shariifFundedPhones = phones.filter((p) => getFunder(p) === 2);
  const shariifAcquiredPhones = phones.filter((p) => getAcquirer(p) === 2);

  const shariifInStock = shariifFundedPhones.filter((p) => p.status === 'In Stock');
  const shariifSold = shariifFundedPhones.filter((p) => p.status === 'Sold');

  const shariifInStockCapital = shariifInStock.reduce((sum, p) => sum + Number(p.purchasePrice || 0), 0);
  const shariifSoldCapital = shariifSold.reduce((sum, p) => sum + Number(p.purchasePrice || 0), 0);
  const shariifTotalCapital = shariifInStockCapital + shariifSoldCapital;
  const shariifWithdrawals = withdrawals
    .filter((w) => w.partnerId === 2)
    .reduce((sum, w) => sum + Number(w.amount || 0), 0);

  // Overall Phone Metrics
  const inStockPhones = phones.filter((p) => p.status === 'In Stock');
  const soldPhones = phones.filter((p) => p.status === 'Sold');
  const returnedPhones = phones.filter((p) => p.status === 'Returned');

  const totalCapital = zakariyeTotalCapital + shariifTotalCapital;
  const totalInStockCapital = zakariyeInStockCapital + shariifInStockCapital;
  const totalSoldCapital = zakariyeSoldCapital + shariifSoldCapital;

  // Sales & Profit (Business Level Shared Total, NOT 50/50, strictly whole business)
  const totalSales = soldPhones.reduce((sum, p) => sum + Number(p.salePrice || 0), 0);
  const grossProfit = totalSales - totalSoldCapital; // Total Sales - Total Sold Phones Purchase Cost

  // Expenses
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const netProfit = grossProfit - totalExpenses; // Total Sales - Total Sold Cost - Expenses

  const totalWithdrawals = zakariyeWithdrawals + shariifWithdrawals;

  return {
    zakariyeTotalCapital,
    zakariyeInStockCapital,
    zakariyeSoldCapital,
    zakariyePhonesCount: zakariyeFundedPhones.length,
    zakariyePhonesAcquired: zakariyeAcquiredPhones.length,
    zakariyeInStockCount: zakariyeInStock.length,
    zakariyeSoldCount: zakariyeSold.length,
    zakariyeWithdrawals,

    shariifTotalCapital,
    shariifInStockCapital,
    shariifSoldCapital,
    shariifPhonesCount: shariifFundedPhones.length,
    shariifPhonesAcquired: shariifAcquiredPhones.length,
    shariifInStockCount: shariifInStock.length,
    shariifSoldCount: shariifSold.length,
    shariifWithdrawals,

    totalPhones: phones.length,
    phonesInStock: inStockPhones.length,
    phonesSold: soldPhones.length,
    phonesReturned: returnedPhones.length,

    totalCapital,
    totalInStockCapital,
    totalSoldCapital,

    totalSales,
    grossProfit,
    totalExpenses,
    netProfit,
    totalWithdrawals,
  };
}

export function loadStoredPhones(): PhoneRecord[] {
  if (typeof window === 'undefined') return INITIAL_PHONES;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PHONES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading phones from storage', e);
  }
  return INITIAL_PHONES;
}

export function saveStoredPhones(phones: PhoneRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_PHONES, JSON.stringify(phones));
  } catch (e) {
    console.error('Error saving phones to storage', e);
  }
}

export function loadStoredExpenses(): ExpenseRecord[] {
  if (typeof window === 'undefined') return INITIAL_EXPENSES;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_EXPENSES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading expenses', e);
  }
  return INITIAL_EXPENSES;
}

export function saveStoredExpenses(expenses: ExpenseRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(expenses));
  } catch (e) {
    console.error('Error saving expenses', e);
  }
}

export function loadStoredWithdrawals(): WithdrawalRecord[] {
  if (typeof window === 'undefined') return INITIAL_WITHDRAWALS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_WITHDRAWALS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading withdrawals', e);
  }
  return INITIAL_WITHDRAWALS;
}

export function saveStoredWithdrawals(withdrawals: WithdrawalRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_WITHDRAWALS, JSON.stringify(withdrawals));
  } catch (e) {
    console.error('Error saving withdrawals', e);
  }
}

export function loadStoredTransactions(): TransactionRecord[] {
  if (typeof window === 'undefined') return INITIAL_TRANSACTIONS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading transactions', e);
  }
  return INITIAL_TRANSACTIONS;
}

export function saveStoredTransactions(transactions: TransactionRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
  } catch (e) {
    console.error('Error saving transactions', e);
  }
}

export function resetAllDataToDefault() {
  saveStoredPhones(INITIAL_PHONES);
  saveStoredExpenses(INITIAL_EXPENSES);
  saveStoredWithdrawals(INITIAL_WITHDRAWALS);
  saveStoredTransactions(INITIAL_TRANSACTIONS);
  return {
    phones: [...INITIAL_PHONES],
    expenses: [...INITIAL_EXPENSES],
    withdrawals: [...INITIAL_WITHDRAWALS],
    transactions: [...INITIAL_TRANSACTIONS],
  };
}
