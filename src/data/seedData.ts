import {
  ExpenseRecord,
  Partner,
  PhoneRecord,
  SaleRecord,
  TransactionRecord,
  WithdrawalRecord,
} from '../types/accounting';

export const INITIAL_PARTNERS: Partner[] = [
  {
    id: 1,
    name: 'Zakariye',
    avatarColor: '#2563EB', // Blue
    phone: '+252 61 500 0001',
    email: 'zakariye@phonehub.so',
    role: 'Partner & Capital Owner',
  },
  {
    id: 2,
    name: 'Shariif',
    avatarColor: '#059669', // Emerald
    phone: '+252 61 500 0002',
    email: 'shariif@phonehub.so',
    role: 'Partner & Capital Owner',
  },
];

// Seed Phones matching the required test scenario:
// Phone 1: Acquired By: Zakariye, Paid By: Zakariye, Purchase: $50, Sale: $70, Profit: $20 (Sold)
// Phone 2: Acquired By: Shariif, Paid By: Shariif, Purchase: $80, Sale: $110, Profit: $30 (Sold)
// Phone 3: Acquired By: Shariif, Paid By: Zakariye, Purchase: $50, Status: 'In Stock'
// Resulting in:
// Zakariye Capital = $100 ($50 from Phone 1 + $50 from Phone 3)
// Shariif Capital = $80 ($80 from Phone 2 + $0 from Phone 3)
// Total Capital = $180
// Total Sales = $180 ($70 + $110)
// Gross Profit = $50 ($20 + $30, undivided business profit)
export const INITIAL_PHONES: PhoneRecord[] = [
  {
    id: 'PH-001',
    imei: '354892019482701',
    brand: 'Apple',
    model: 'iPhone 13',
    storage: '128GB',
    color: 'Midnight Black',
    condition: 'Grade A (Nadiif)',
    purchasePrice: 50, // Capital funded by Zakariye: $50
    acquiredBy: 1, // Zakariye found/brought it
    paidBy: 1, // Zakariye paid for it
    capitalOwner: 1, // Zakariye owns capital
    purchasedBy: 1, // Zakariye
    purchaseDate: '2026-09-10',
    status: 'Sold',
    salePrice: 70, // Sold: $70 -> Profit: $20
    saleDate: '2026-09-12',
    customerName: 'Axmed Cali',
    customerPhone: '+252 61 5123456',
    paymentMethod: 'EVC Plus',
    notes: 'Teleefanka 1 ee Zakariye ($50 -> $70, faa\'iido: $20)',
    createdAt: '2026-09-10T09:00:00.000Z',
    updatedAt: '2026-09-12T14:30:00.000Z',
  },
  {
    id: 'PH-002',
    imei: '358912049182902',
    brand: 'Apple',
    model: 'iPhone X',
    storage: '64GB',
    color: 'Space Gray',
    condition: 'Grade B (Dhex-dhexaad)',
    purchasePrice: 80, // Capital funded by Shariif: $80
    acquiredBy: 2, // Shariif found/brought it
    paidBy: 2, // Shariif paid for it
    capitalOwner: 2, // Shariif owns capital
    purchasedBy: 2, // Shariif
    purchaseDate: '2026-09-11',
    status: 'Sold',
    salePrice: 110, // Sold: $110 -> Profit: $30
    saleDate: '2026-09-14',
    customerName: 'Faadumo Xasan',
    customerPhone: '+252 61 7890123',
    paymentMethod: 'Zaad',
    notes: 'Teleefanka 2 ee Shariif ($80 -> $110, faa\'iido: $30)',
    createdAt: '2026-09-11T10:15:00.000Z',
    updatedAt: '2026-09-14T16:45:00.000Z',
  },
  {
    id: 'PH-003',
    imei: '352981029481003',
    brand: 'Apple',
    model: 'iPhone 12',
    storage: '128GB',
    color: 'Pacific Blue',
    condition: 'Grade A (Nadiif)',
    purchasePrice: 50, // Capital funded by Zakariye: $50
    acquiredBy: 2, // Shariif found/brought it
    paidBy: 1, // Zakariye paid for it
    capitalOwner: 1, // Zakariye owns capital
    purchasedBy: 1, // Zakariye
    purchaseDate: '2026-09-15',
    status: 'In Stock',
    notes: 'Teleefanka 3: Shariif ayaa keenay, Zakariye ayaa lacagta bixiyay $50',
    createdAt: '2026-09-15T11:00:00.000Z',
  },
];

export const INITIAL_EXPENSES: ExpenseRecord[] = [];

export const INITIAL_WITHDRAWALS: WithdrawalRecord[] = [];

export const INITIAL_TRANSACTIONS: TransactionRecord[] = [
  {
    id: 'TXN-001',
    type: 'Phone Purchase',
    partnerId: 1,
    acquiredBy: 1,
    paidBy: 1,
    phoneId: 'PH-001',
    amount: 50,
    description: 'iPhone 13 (Acquired & Paid by Zakariye $50)',
    date: '2026-09-10',
    reference: 'PH-001',
    impact: 'CAPITAL_IN',
  },
  {
    id: 'TXN-002',
    type: 'Phone Purchase',
    partnerId: 2,
    acquiredBy: 2,
    paidBy: 2,
    phoneId: 'PH-002',
    amount: 80,
    description: 'iPhone X (Acquired & Paid by Shariif $80)',
    date: '2026-09-11',
    reference: 'PH-002',
    impact: 'CAPITAL_IN',
  },
  {
    id: 'TXN-003',
    type: 'Phone Sale',
    partnerId: 1,
    acquiredBy: 1,
    paidBy: 1,
    phoneId: 'PH-001',
    amount: 70,
    description: 'Iibka iPhone 13: $70 (Lafaha Zakariye: $50, Faa\'iido: $20)',
    date: '2026-09-12',
    reference: 'SALE-PH-001',
    impact: 'INFLOW',
  },
  {
    id: 'TXN-004',
    type: 'Phone Sale',
    partnerId: 2,
    acquiredBy: 2,
    paidBy: 2,
    phoneId: 'PH-002',
    amount: 110,
    description: 'Iibka iPhone X: $110 (Lafaha Shariif: $80, Faa\'iido: $30)',
    date: '2026-09-14',
    reference: 'SALE-PH-002',
    impact: 'INFLOW',
  },
  {
    id: 'TXN-005',
    type: 'Phone Purchase',
    partnerId: 1,
    acquiredBy: 2,
    paidBy: 1,
    phoneId: 'PH-003',
    amount: 50,
    description: 'Purchase: iPhone 12 (Acquired by: Shariif, Paid by: Zakariye $50)',
    date: '2026-09-15',
    reference: 'PH-003',
    impact: 'CAPITAL_IN',
  },
];
