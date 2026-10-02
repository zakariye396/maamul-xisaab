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
  // Helper to determine purchase capital owner (paidBy takes precedence over legacy purchasedBy)
  const getFunder = (p: PhoneRecord): number => p.paidBy || p.capitalOwner || p.purchasedBy;
  const getAcquirer = (p: PhoneRecord): number => p.acquiredBy || p.purchasedBy;

  // Zakariye (PartnerId = 1)
  const zakariyeFundedPhones = phones.filter((p) => getFunder(p) === 1);
  const zakariyeAcquiredPhones = phones.filter((p) => getAcquirer(p) === 1);

  // Shariif (PartnerId = 2)
  const shariifFundedPhones = phones.filter((p) => getFunder(p) === 2);
  const shariifAcquiredPhones = phones.filter((p) => getAcquirer(p) === 2);

  // Status lists
  const inStockPhones = phones.filter((p) => p.status === 'In Stock');
  const soldPhones = phones.filter((p) => p.status === 'Sold');
  const returnedPhones = phones.filter((p) => p.status === 'Returned');

  // Purchase Capital
  const zakariyePurchaseCapital = zakariyeFundedPhones.reduce(
    (sum, p) => sum + Number(p.purchasePrice || 0),
    0
  );
  const shariifPurchaseCapital = shariifFundedPhones.reduce(
    (sum, p) => sum + Number(p.purchasePrice || 0),
    0
  );

  // Repair Capital (Attributed to the partner who actually paid for the repair)
  let zakariyeRepairCapital = 0;
  let shariifRepairCapital = 0;

  let zakariyeInStockRepairs = 0;
  let shariifInStockRepairs = 0;
  let zakariyeSoldRepairs = 0;
  let shariifSoldRepairs = 0;

  for (const phone of phones) {
    if (phone.repairs && Array.isArray(phone.repairs)) {
      for (const rep of phone.repairs) {
        const cost = Number(rep.repairCost || 0);
        const payer = Number(rep.paidBy || rep.capitalOwner || 1);
        if (payer === 1) {
          zakariyeRepairCapital += cost;
          if (phone.status === 'In Stock') zakariyeInStockRepairs += cost;
          else if (phone.status === 'Sold') zakariyeSoldRepairs += cost;
        } else if (payer === 2) {
          shariifRepairCapital += cost;
          if (phone.status === 'In Stock') shariifInStockRepairs += cost;
          else if (phone.status === 'Sold') shariifSoldRepairs += cost;
        }
      }
    } else if (phone.repairCost && Number(phone.repairCost) > 0) {
      // Fallback if repairs array not loaded but repairCost is present on phone record
      const cost = Number(phone.repairCost);
      const payer = getFunder(phone);
      if (payer === 1) {
        zakariyeRepairCapital += cost;
        if (phone.status === 'In Stock') zakariyeInStockRepairs += cost;
        else if (phone.status === 'Sold') zakariyeSoldRepairs += cost;
      } else {
        shariifRepairCapital += cost;
        if (phone.status === 'In Stock') shariifInStockRepairs += cost;
        else if (phone.status === 'Sold') shariifSoldRepairs += cost;
      }
    }
  }

  // Zakariye Capital breakdown (Purchase + Repairs)
  const zakariyeInStockPurchase = zakariyeFundedPhones
    .filter((p) => p.status === 'In Stock')
    .reduce((sum, p) => sum + Number(p.purchasePrice || 0), 0);
  const zakariyeSoldPurchase = zakariyeFundedPhones
    .filter((p) => p.status === 'Sold')
    .reduce((sum, p) => sum + Number(p.purchasePrice || 0), 0);

  const zakariyeInStockCapital = zakariyeInStockPurchase + zakariyeInStockRepairs;
  const zakariyeSoldCapital = zakariyeSoldPurchase + zakariyeSoldRepairs;
  const zakariyeTotalCapital = zakariyePurchaseCapital + zakariyeRepairCapital;

  const zakariyeWithdrawals = withdrawals
    .filter((w) => w.partnerId === 1)
    .reduce((sum, w) => sum + Number(w.amount || 0), 0);

  // Shariif Capital breakdown (Purchase + Repairs)
  const shariifInStockPurchase = shariifFundedPhones
    .filter((p) => p.status === 'In Stock')
    .reduce((sum, p) => sum + Number(p.purchasePrice || 0), 0);
  const shariifSoldPurchase = shariifFundedPhones
    .filter((p) => p.status === 'Sold')
    .reduce((sum, p) => sum + Number(p.purchasePrice || 0), 0);

  const shariifInStockCapital = shariifInStockPurchase + shariifInStockRepairs;
  const shariifSoldCapital = shariifSoldPurchase + shariifSoldRepairs;
  const shariifTotalCapital = shariifPurchaseCapital + shariifRepairCapital;

  const shariifWithdrawals = withdrawals
    .filter((w) => w.partnerId === 2)
    .reduce((sum, w) => sum + Number(w.amount || 0), 0);

  // Overall Business Totals
  const totalPurchaseCapital = zakariyePurchaseCapital + shariifPurchaseCapital;
  const totalRepairCapital = zakariyeRepairCapital + shariifRepairCapital;
  const totalCapital = zakariyeTotalCapital + shariifTotalCapital;
  const totalInStockCapital = zakariyeInStockCapital + shariifInStockCapital;
  const totalSoldCapital = zakariyeSoldCapital + shariifSoldCapital;

  // Sales & Gross Profit (Total Sales - Total Sold Cost including repairs)
  const totalSales = soldPhones.reduce((sum, p) => sum + Number(p.salePrice || 0), 0);
  const grossProfit = totalSales - totalSoldCapital;

  // Operating Expenses & Net Profit
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const netProfit = grossProfit - totalExpenses;

  const totalWithdrawals = zakariyeWithdrawals + shariifWithdrawals;

  return {
    zakariyePurchaseCapital,
    zakariyeRepairCapital,
    zakariyeTotalCapital,
    zakariyeInStockCapital,
    zakariyeSoldCapital,
    zakariyePhonesCount: zakariyeFundedPhones.length,
    zakariyePhonesAcquired: zakariyeAcquiredPhones.length,
    zakariyeInStockCount: zakariyeFundedPhones.filter((p) => p.status === 'In Stock').length,
    zakariyeSoldCount: zakariyeFundedPhones.filter((p) => p.status === 'Sold').length,
    zakariyeWithdrawals,

    shariifPurchaseCapital,
    shariifRepairCapital,
    shariifTotalCapital,
    shariifInStockCapital,
    shariifSoldCapital,
    shariifPhonesCount: shariifFundedPhones.length,
    shariifPhonesAcquired: shariifAcquiredPhones.length,
    shariifInStockCount: shariifFundedPhones.filter((p) => p.status === 'In Stock').length,
    shariifSoldCount: shariifFundedPhones.filter((p) => p.status === 'Sold').length,
    shariifWithdrawals,

    totalPhones: phones.length,
    phonesInStock: inStockPhones.length,
    phonesSold: soldPhones.length,
    phonesReturned: returnedPhones.length,

    totalPurchaseCapital,
    totalRepairCapital,
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
  } catch (e) {}
  return INITIAL_PHONES;
}

export function loadStoredExpenses(): ExpenseRecord[] {
  if (typeof window === 'undefined') return INITIAL_EXPENSES;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_EXPENSES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return INITIAL_EXPENSES;
}

export function loadStoredWithdrawals(): WithdrawalRecord[] {
  if (typeof window === 'undefined') return INITIAL_WITHDRAWALS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_WITHDRAWALS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return INITIAL_WITHDRAWALS;
}

export function loadStoredTransactions(): TransactionRecord[] {
  if (typeof window === 'undefined') return INITIAL_TRANSACTIONS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return INITIAL_TRANSACTIONS;
}
