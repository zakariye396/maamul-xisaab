export type PartnerId = 1 | 2;

export interface Partner {
  id: PartnerId;
  name: string; // 'Zakariye' | 'Shariif'
  avatarColor: string;
  phone?: string;
  email?: string;
  role?: string;
}

export type PhoneCondition = 'Brand New' | 'Grade A (Nadiif)' | 'Grade B (Dhex-dhexaad)' | 'Grade C (Cillad yar)';
export type PhoneStatus = 'In Stock' | 'Sold' | 'Returned';
export type PaymentMethod = 'EVC Plus' | 'Zaad' | 'Sahal' | 'eDahab' | 'Cash' | 'Bank Transfer' | 'Other';

export interface PhoneRecord {
  id: string;
  imei: string;
  brand: string;
  model: string;
  storage: string;
  color?: string;
  condition: PhoneCondition;
  purchasePrice: number; // Qiimaha Lafaha (Capital invested)

  // 1. Acquired By: The partner who found, negotiated, or brought the phone
  acquiredBy: PartnerId;

  // 2. Paid By / Funded By: The partner whose money was actually used to buy the phone
  paidBy: PartnerId;

  // 3. Capital Owner: Follows Paid By (owns the invested capital)
  capitalOwner?: PartnerId;

  // Backward compatibility alias (maps to paidBy / capitalOwner)
  purchasedBy: PartnerId;

  purchaseDate: string; // YYYY-MM-DD
  status: PhoneStatus;
  salePrice?: number;
  saleDate?: string;
  customerName?: string;
  customerPhone?: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SaleRecord {
  id: string;
  phoneId: string;
  phoneModel: string;
  imei: string;
  acquiredBy?: PartnerId;
  paidBy: PartnerId;
  capitalOwner: PartnerId;
  purchasedBy: PartnerId;
  purchasePrice: number;
  salePrice: number;
  profit: number; // Sale Price - Purchase Price
  saleDate: string;
  customerName?: string;
  customerPhone?: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
}

export type ExpenseCategory =
  | 'Kirada (Rent)'
  | 'Koronto (Electricity)'
  | 'Internet & Wi-Fi'
  | 'Gaadiid / Delivery'
  | 'Repairs / Dayactir'
  | 'Shaqaale / Mushaar'
  | 'Other Expenses';

export interface ExpenseRecord {
  id: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  description: string;
  recordedBy?: string;
}

export type TransactionType =
  | 'Phone Purchase'
  | 'Phone Sale'
  | 'Partner Capital'
  | 'Capital Withdrawal'
  | 'Expense'
  | 'Adjustment';

export interface TransactionRecord {
  id: string;
  type: TransactionType;
  partnerId?: PartnerId; // Capital Owner / Primary party
  acquiredBy?: PartnerId;
  paidBy?: PartnerId;
  phoneId?: string;
  amount: number;
  description: string;
  date: string;
  reference?: string;
  impact: 'INFLOW' | 'OUTFLOW' | 'CAPITAL_IN' | 'CAPITAL_OUT' | 'NEUTRAL';
}

export interface WithdrawalRecord {
  id: string;
  partnerId: PartnerId;
  amount: number;
  date: string;
  reason: string;
  notes?: string;
}

export interface AccountingSummary {
  // Zakariye metrics
  zakariyeTotalCapital: number; // Capital funded / owned by Zakariye (based on paidBy/capitalOwner)
  zakariyeInStockCapital: number;
  zakariyeSoldCapital: number;
  zakariyePhonesCount: number; // Total phones funded by Zakariye
  zakariyePhonesAcquired: number; // Total phones found/negotiated by Zakariye (acquiredBy === 1)
  zakariyeInStockCount: number;
  zakariyeSoldCount: number;
  zakariyeWithdrawals: number;

  // Shariif metrics
  shariifTotalCapital: number; // Capital funded / owned by Shariif (based on paidBy/capitalOwner)
  shariifInStockCapital: number;
  shariifSoldCapital: number;
  shariifPhonesCount: number; // Total phones funded by Shariif
  shariifPhonesAcquired: number; // Total phones found/negotiated by Shariif (acquiredBy === 2)
  shariifInStockCount: number;
  shariifSoldCount: number;
  shariifWithdrawals: number;

  // Business summary totals
  totalPhones: number;
  phonesInStock: number;
  phonesSold: number;
  phonesReturned: number;

  totalCapital: number; // Zakariye Capital + Shariif Capital
  totalInStockCapital: number; // Current active inventory cost (Inventory Value)
  totalSoldCapital: number; // Cost of sold phones (Total Purchase Cost)

  totalSales: number; // Total Revenue from phone sales
  grossProfit: number; // Total Sales - Total Sold Phones Purchase Cost
  totalExpenses: number; // Business Expenses
  netProfit: number; // Gross Profit - Expenses = Total Sales - Cost - Expenses
  totalWithdrawals: number; // Partner withdrawals
}
