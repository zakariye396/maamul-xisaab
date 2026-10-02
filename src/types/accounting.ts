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

export interface PhoneRepairRecord {
  id: string;
  phoneId: string;
  description: string;
  repairCost: number;
  repairDate: string;
  paidBy: PartnerId;
  capitalOwner: PartnerId;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

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

  // Repair / Maintenance Costs
  repairCost?: number; // Total sum of all repairs for this phone
  totalCost?: number; // purchasePrice + (repairCost || 0)
  repairs?: PhoneRepairRecord[];

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
  repairCost?: number;
  totalCost?: number;
  salePrice: number;
  profit: number; // Sale Price - (purchasePrice + repairCost)
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
  | 'Phone Repair'
  | 'REPAIR'
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
  zakariyePurchaseCapital: number; // Purchase capital funded by Zakariye
  zakariyeRepairCapital: number; // Repair capital funded by Zakariye
  zakariyeTotalCapital: number; // Total Capital funded / owned by Zakariye (Purchase + Repairs)
  zakariyeInStockCapital: number;
  zakariyeSoldCapital: number;
  zakariyePhonesCount: number; // Total phones funded by Zakariye
  zakariyePhonesAcquired: number; // Total phones found/negotiated by Zakariye (acquiredBy === 1)
  zakariyeInStockCount: number;
  zakariyeSoldCount: number;
  zakariyeWithdrawals: number;

  // Shariif metrics
  shariifPurchaseCapital: number; // Purchase capital funded by Shariif
  shariifRepairCapital: number; // Repair capital funded by Shariif
  shariifTotalCapital: number; // Total Capital funded / owned by Shariif (Purchase + Repairs)
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

  totalPurchaseCapital: number; // Sum of all phone purchase costs
  totalRepairCapital: number; // Sum of all phone repair costs
  totalCapital: number; // Total Capital = Purchase Capital + Repair Capital
  totalInStockCapital: number; // Current active inventory cost (Purchase + In-Stock Repairs)
  totalSoldCapital: number; // Cost of sold phones (Purchase + Sold Repairs)

  totalSales: number; // Total Revenue from phone sales
  grossProfit: number; // Total Sales - Total Sold Cost (Purchase + Repairs)
  totalExpenses: number; // Business Expenses (Operating)
  netProfit: number; // Gross Profit - Expenses = Total Sales - Cost - Expenses
  totalWithdrawals: number; // Partner withdrawals
}

export type UserRole = 'admin' | 'staff';

export interface SafeUser {
  id: number;
  username: string;
  fullName: string;
  role: UserRole;
  partnerId?: PartnerId;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface AuditLogRecord {
  id: number;
  userId?: number;
  username: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}
