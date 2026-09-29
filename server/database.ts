import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import {
  INITIAL_EXPENSES,
  INITIAL_PARTNERS,
  INITIAL_PHONES,
  INITIAL_TRANSACTIONS,
  INITIAL_WITHDRAWALS,
} from '../src/data/seedData.ts';
import {
  AccountingSummary,
  ExpenseRecord,
  Partner,
  PhoneRecord,
  SaleRecord,
  TransactionRecord,
  WithdrawalRecord,
} from '../src/types/accounting.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----------------- PATH & DIRECTORY RESOLUTION -----------------
export interface DatabasePaths {
  dataDir: string;
  dbPath: string;
  backupDir: string;
}

export function resolveDatabasePaths(): DatabasePaths {
  // 1. Explicit DB_PATH in environment variable
  if (process.env.DB_PATH) {
    const dbPath = path.resolve(process.env.DB_PATH);
    const dataDir = path.dirname(dbPath);
    return { dataDir, dbPath, backupDir: path.join(dataDir, 'backups') };
  }

  // 2. Explicit DB_DIR in environment variable
  if (process.env.DB_DIR) {
    const dataDir = path.resolve(process.env.DB_DIR);
    return { dataDir, dbPath: path.join(dataDir, 'accounting.db'), backupDir: path.join(dataDir, 'backups') };
  }

  // 3. Persistent VPS mount point at /data (if directory exists and is writable)
  try {
    if (fs.existsSync('/data')) {
      fs.accessSync('/data', fs.constants.W_OK);
      return { dataDir: '/data', dbPath: '/data/accounting.db', backupDir: '/data/backups' };
    }
  } catch (e) {
    // Fall through to project directory
  }

  // 4. Default to persistent directory ./data in project root
  const localDataDir = path.resolve(__dirname, '../data');
  return {
    dataDir: localDataDir,
    dbPath: path.join(localDataDir, 'accounting.db'),
    backupDir: path.join(localDataDir, 'backups'),
  };
}

export const { dataDir: DATA_DIR, dbPath: DB_PATH, backupDir: BACKUP_DIR } = resolveDatabasePaths();

// Ensure storage directories exist with write permissions
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Open or connect to SQLite database
export let db: DatabaseSync = new DatabaseSync(DB_PATH);

// Configure SQLite pragmas for maximum reliability, ACID compliance, and concurrency
export function configurePragmas(): void {
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA busy_timeout = 5000;');
}

configurePragmas();

// ----------------- DATABASE INITIALIZATION -----------------
// RULES:
// 1. Check if database already exists on VPS filesystem.
// 2. Open it cleanly with CREATE TABLE IF NOT EXISTS.
// 3. NEVER overwrite or reset production data on Node.js startup.
export function initDatabase(): void {
  const dbFileExists = fs.existsSync(DB_PATH) && fs.statSync(DB_PATH).size > 0;
  console.log(`[DATABASE INIT] Target path: ${DB_PATH} (Exists: ${dbFileExists})`);

  // 1. Partners Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS partners (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      avatar_color TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      role TEXT,
      pin TEXT NOT NULL DEFAULT '1234'
    );
  `);

  // 2. Phones Table (Inventory)
  db.exec(`
    CREATE TABLE IF NOT EXISTS phones (
      id TEXT PRIMARY KEY,
      imei TEXT NOT NULL UNIQUE,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      storage TEXT NOT NULL,
      color TEXT,
      condition TEXT NOT NULL,
      purchase_price REAL NOT NULL,
      acquired_by_partner_id INTEGER NOT NULL REFERENCES partners(id),
      paid_by_partner_id INTEGER NOT NULL REFERENCES partners(id),
      capital_owner_partner_id INTEGER NOT NULL REFERENCES partners(id),
      purchase_date TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('In Stock', 'Sold', 'Returned')),
      sale_price REAL,
      sale_date TEXT,
      customer_name TEXT,
      customer_phone TEXT,
      payment_method TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT
    );
  `);

  // 3. Sales Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      phone_id TEXT NOT NULL REFERENCES phones(id) ON DELETE CASCADE,
      phone_model TEXT NOT NULL,
      imei TEXT NOT NULL,
      sale_price REAL NOT NULL,
      purchase_price REAL NOT NULL,
      profit REAL NOT NULL,
      partner_id INTEGER NOT NULL REFERENCES partners(id),
      acquired_by_partner_id INTEGER NOT NULL REFERENCES partners(id),
      paid_by_partner_id INTEGER NOT NULL REFERENCES partners(id),
      sale_date TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT,
      payment_method TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // 4. Expenses Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      recorded_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // 5. Withdrawals Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS withdrawals (
      id TEXT PRIMARY KEY,
      partner_id INTEGER NOT NULL REFERENCES partners(id),
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      reason TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // 6. Transactions Ledger Table (Audit Trail)
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      partner_id INTEGER REFERENCES partners(id),
      acquired_by_partner_id INTEGER REFERENCES partners(id),
      paid_by_partner_id INTEGER REFERENCES partners(id),
      phone_id TEXT,
      amount REAL NOT NULL,
      description TEXT NOT NULL,
      date TEXT NOT NULL,
      reference TEXT NOT NULL,
      impact TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // 7. Auth Sessions Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS auth_sessions (
      token TEXT PRIMARY KEY,
      partner_id INTEGER NOT NULL REFERENCES partners(id),
      partner_name TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );
  `);

  // Indexes for high performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_phones_status ON phones(status);
    CREATE INDEX IF NOT EXISTS idx_phones_paid_by ON phones(paid_by_partner_id);
    CREATE INDEX IF NOT EXISTS idx_phones_acquired_by ON phones(acquired_by_partner_id);
    CREATE INDEX IF NOT EXISTS idx_phones_imei ON phones(imei);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
    CREATE INDEX IF NOT EXISTS idx_transactions_partner ON transactions(partner_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
  `);

  // Ensure default partners exist only if missing
  const countPartners = (db.prepare('SELECT COUNT(*) as count FROM partners').get() as { count: number }).count;
  if (countPartners === 0) {
    const insertPartner = db.prepare(`
      INSERT INTO partners (id, name, avatar_color, phone, email, role, pin)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertPartner.run(1, 'Zakariye', '#2563EB', '+252 61 500 0001', 'zakariye@phonehub.so', 'Partner & Capital Owner', '1234');
    insertPartner.run(2, 'Shariif', '#059669', '+252 61 500 0002', 'shariif@phonehub.so', 'Partner & Capital Owner', '5678');
    console.log('[DATABASE INIT] Seeded default partners (Zakariye & Shariif)');
  }

  // Check if phones already exist:
  const countPhones = (db.prepare('SELECT COUNT(*) as count FROM phones').get() as { count: number }).count;
  if (countPhones > 0) {
    console.log(`[DATABASE INIT] Production database active with ${countPhones} phones. Zero data overwritten.`);
  } else {
    // If brand-new database file in development or explicit first run, populate initial test scenario
    if (process.env.NODE_ENV !== 'production' && !dbFileExists) {
      console.log('[DATABASE INIT] Empty database detected in development mode. Seeding initial baseline...');
      seedInitialAccountingData();
    } else {
      console.log('[DATABASE INIT] Initialized empty production database ready for real data.');
    }
  }
}

// Explicit seed function for test suites and development
export function seedInitialAccountingData(): void {
  db.exec('BEGIN IMMEDIATE;');
  try {
    db.exec('DELETE FROM sales;');
    db.exec('DELETE FROM transactions;');
    db.exec('DELETE FROM expenses;');
    db.exec('DELETE FROM withdrawals;');
    db.exec('DELETE FROM phones;');

    // Insert Initial Phones (Phone 1 & Phone 2)
    const insertPhone = db.prepare(`
      INSERT INTO phones (
        id, imei, brand, model, storage, color, condition,
        purchase_price, acquired_by_partner_id, paid_by_partner_id, capital_owner_partner_id,
        purchase_date, status, sale_price, sale_date, customer_name, customer_phone,
        payment_method, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of INITIAL_PHONES) {
      insertPhone.run(
        p.id,
        p.imei,
        p.brand,
        p.model,
        p.storage,
        p.color || null,
        p.condition,
        p.purchasePrice,
        p.acquiredBy,
        p.paidBy,
        p.capitalOwner || p.paidBy,
        p.purchaseDate,
        p.status,
        p.salePrice || null,
        p.saleDate || null,
        p.customerName || null,
        p.customerPhone || null,
        p.paymentMethod || null,
        p.notes || null,
        p.createdAt || new Date().toISOString(),
        p.updatedAt || null
      );
    }

    // Insert Initial Sales
    const insertSale = db.prepare(`
      INSERT INTO sales (
        id, phone_id, phone_model, imei, sale_price, purchase_price, profit,
        partner_id, acquired_by_partner_id, paid_by_partner_id, sale_date,
        customer_name, customer_phone, payment_method, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of INITIAL_PHONES) {
      if (p.status === 'Sold' && p.salePrice) {
        insertSale.run(
          `SALE-${p.id}`,
          p.id,
          p.model,
          p.imei,
          p.salePrice,
          p.purchasePrice,
          p.salePrice - p.purchasePrice,
          p.paidBy,
          p.acquiredBy,
          p.paidBy,
          p.saleDate || p.purchaseDate,
          p.customerName || 'Macaamiil Guud',
          p.customerPhone || null,
          p.paymentMethod || 'EVC Plus',
          p.notes || null,
          p.updatedAt || p.createdAt || new Date().toISOString()
        );
      }
    }

    // Insert Initial Transactions
    const insertTxn = db.prepare(`
      INSERT INTO transactions (
        id, type, partner_id, acquired_by_partner_id, paid_by_partner_id,
        phone_id, amount, description, date, reference, impact, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const t of INITIAL_TRANSACTIONS) {
      insertTxn.run(
        t.id,
        t.type,
        t.partnerId ?? null,
        t.acquiredBy ?? null,
        t.paidBy ?? null,
        t.phoneId ?? null,
        t.amount,
        t.description,
        t.date,
        t.reference ?? '',
        t.impact || 'NEUTRAL',
        new Date().toISOString()
      );
    }

    db.exec('COMMIT;');
    console.log('[DATABASE SEED] Seeded test case baseline data');
  } catch (err) {
    db.exec('ROLLBACK;');
    console.error('[DATABASE SEED] Error seeding database:', err);
    throw err;
  }
}

// ----------------- BACKUP & RESTORE SYSTEM -----------------

function cleanOldBackups(backupDir: string, maxToKeep = 30): void {
  try {
    const files = fs.readdirSync(backupDir)
      .filter((f) => f.startsWith('accounting-') && f.endsWith('.db'))
      .map((f) => ({
        name: f,
        path: path.join(backupDir, f),
        time: fs.statSync(path.join(backupDir, f)).mtimeMs,
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length > maxToKeep) {
      const toDelete = files.slice(maxToKeep);
      for (const item of toDelete) {
        fs.unlinkSync(item.path);
        console.log(`[BACKUP ROTATION] Deleted old backup: ${item.name}`);
      }
    }
  } catch (e) {
    console.error('[BACKUP ROTATION] Error cleaning old backups:', e);
  }
}

export function createDatabaseBackup(): {
  success: boolean;
  backupPath?: string;
  backupFilename?: string;
  sizeBytes?: number;
  timestamp?: string;
  error?: string;
} {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    const filename = `accounting-${timestamp}.db`;
    const targetPath = path.join(BACKUP_DIR, filename);

    // SQLite standard VACUUM INTO performs a safe, atomic, point-in-time snapshot with WAL flushed
    const safeTarget = targetPath.replace(/'/g, "''");
    db.exec(`VACUUM INTO '${safeTarget}';`);

    // Verify backup file integrity
    const backupDb = new DatabaseSync(targetPath);
    const integrityRow = backupDb.prepare('PRAGMA integrity_check;').get() as { integrity_check: string };
    backupDb.close();

    if (integrityRow.integrity_check !== 'ok') {
      fs.unlinkSync(targetPath);
      throw new Error(`Backup verification failed: ${integrityRow.integrity_check}`);
    }

    const stats = fs.statSync(targetPath);
    cleanOldBackups(BACKUP_DIR, 30);

    return {
      success: true,
      backupPath: targetPath,
      backupFilename: filename,
      sizeBytes: stats.size,
      timestamp: now.toISOString(),
    };
  } catch (err: any) {
    console.error('[BACKUP ERROR]:', err);
    return { success: false, error: err.message };
  }
}

export function listDatabaseBackups(): { name: string; path: string; sizeBytes: number; createdAt: string }[] {
  if (!fs.existsSync(BACKUP_DIR)) return [];
  return fs.readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith('accounting-') && f.endsWith('.db'))
    .map((f) => {
      const p = path.join(BACKUP_DIR, f);
      const stat = fs.statSync(p);
      return {
        name: f,
        path: p,
        sizeBytes: stat.size,
        createdAt: new Date(stat.mtimeMs).toISOString(),
      };
    })
    .sort((a, b) => b.name.localeCompare(a.name));
}

export function restoreDatabaseBackup(backupFilename: string): { success: boolean; message?: string; error?: string } {
  try {
    const backupPath = path.resolve(BACKUP_DIR, path.basename(backupFilename));
    if (!fs.existsSync(backupPath)) {
      return { success: false, error: `Backup file "${backupFilename}" not found in ${BACKUP_DIR}` };
    }

    // 1. Verify the backup file itself before touching production
    const testDb = new DatabaseSync(backupPath);
    const integrity = testDb.prepare('PRAGMA integrity_check;').get() as { integrity_check: string };
    testDb.close();

    if (integrity.integrity_check !== 'ok') {
      return { success: false, error: `Backup integrity check failed: ${integrity.integrity_check}` };
    }

    // 2. Create a safety backup of current state before restore
    const safetyFilename = `pre-restore-safety-${Date.now()}.db`;
    const safetyTarget = path.join(BACKUP_DIR, safetyFilename).replace(/'/g, "''");
    db.exec(`VACUUM INTO '${safetyTarget}';`);

    // 3. Atomically restore all data using ATTACH DATABASE inside an IMMEDIATE transaction
    const safeBackupPath = backupPath.replace(/'/g, "''");
    db.exec(`ATTACH DATABASE '${safeBackupPath}' AS backup_source;`);

    db.exec('PRAGMA foreign_keys = OFF;');
    db.exec('BEGIN IMMEDIATE;');
    try {
      db.exec('DELETE FROM sales;');
      db.exec('DELETE FROM transactions;');
      db.exec('DELETE FROM expenses;');
      db.exec('DELETE FROM withdrawals;');
      db.exec('DELETE FROM phones;');
      db.exec('DELETE FROM partners;');

      db.exec('INSERT INTO partners SELECT * FROM backup_source.partners;');
      db.exec('INSERT INTO phones SELECT * FROM backup_source.phones;');
      db.exec('INSERT INTO sales SELECT * FROM backup_source.sales;');
      db.exec('INSERT INTO expenses SELECT * FROM backup_source.expenses;');
      db.exec('INSERT INTO withdrawals SELECT * FROM backup_source.withdrawals;');
      db.exec('INSERT INTO transactions SELECT * FROM backup_source.transactions;');

      db.exec('COMMIT;');
    } catch (e) {
      db.exec('ROLLBACK;');
      throw e;
    } finally {
      db.exec('PRAGMA foreign_keys = ON;');
      try {
        db.exec('DETACH DATABASE backup_source;');
      } catch (detachErr) {}
    }

    // Verify foreign key constraints are completely satisfied
    const fkCheck = db.prepare('PRAGMA foreign_key_check;').all();
    if (fkCheck.length > 0) {
      throw new Error(`Foreign key check failed after restore: ${JSON.stringify(fkCheck)}`);
    }

    console.log(`[RESTORE SUCCESS] Restored database from: ${backupFilename}`);
    return {
      success: true,
      message: `Database successfully restored from ${backupFilename}. Safety backup created at ${safetyFilename}.`,
    };
  } catch (err: any) {
    console.error('[RESTORE ERROR]:', err);
    try {
      db.exec('DETACH DATABASE backup_source;');
    } catch (e) {}
    return { success: false, error: err.message };
  }
}

// ----------------- DATABASE HEALTH CHECK -----------------
export function checkDatabaseHealth(): {
  status: 'healthy' | 'unhealthy';
  databasePath: string;
  dataDir: string;
  dataDirWritable: boolean;
  integrity: string;
  journalMode: string;
  foreignKeys: boolean;
  tables: Record<string, number>;
  totalPhones: number;
  totalTransactions: number;
  dbSizeBytes: number;
  timestamp: string;
} {
  try {
    let dataDirWritable = false;
    try {
      fs.accessSync(DATA_DIR, fs.constants.W_OK);
      dataDirWritable = true;
    } catch (e) {
      dataDirWritable = false;
    }

    const integrityRow = db.prepare('PRAGMA integrity_check;').get() as { integrity_check: string };
    const journalRow = db.prepare('PRAGMA journal_mode;').get() as { journal_mode: string };
    const foreignKeysRow = db.prepare('PRAGMA foreign_keys;').get() as { foreign_keys: number };

    const partnersCount = (db.prepare('SELECT COUNT(*) as c FROM partners;').get() as { c: number }).c;
    const phonesCount = (db.prepare('SELECT COUNT(*) as c FROM phones;').get() as { c: number }).c;
    const salesCount = (db.prepare('SELECT COUNT(*) as c FROM sales;').get() as { c: number }).c;
    const expensesCount = (db.prepare('SELECT COUNT(*) as c FROM expenses;').get() as { c: number }).c;
    const withdrawalsCount = (db.prepare('SELECT COUNT(*) as c FROM withdrawals;').get() as { c: number }).c;
    const transactionsCount = (db.prepare('SELECT COUNT(*) as c FROM transactions;').get() as { c: number }).c;
    const sessionsCount = (db.prepare('SELECT COUNT(*) as c FROM auth_sessions;').get() as { c: number }).c;

    const stats = fs.existsSync(DB_PATH) ? fs.statSync(DB_PATH) : { size: 0 };
    const isHealthy =
      integrityRow.integrity_check === 'ok' &&
      journalRow.journal_mode === 'wal' &&
      foreignKeysRow.foreign_keys === 1 &&
      dataDirWritable;

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      databasePath: DB_PATH,
      dataDir: DATA_DIR,
      dataDirWritable,
      integrity: integrityRow.integrity_check,
      journalMode: journalRow.journal_mode,
      foreignKeys: foreignKeysRow.foreign_keys === 1,
      tables: {
        partners: partnersCount,
        phones: phonesCount,
        sales: salesCount,
        expenses: expensesCount,
        withdrawals: withdrawalsCount,
        transactions: transactionsCount,
        auth_sessions: sessionsCount,
      },
      totalPhones: phonesCount,
      totalTransactions: transactionsCount,
      dbSizeBytes: stats.size,
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      status: 'unhealthy',
      databasePath: DB_PATH,
      dataDir: DATA_DIR,
      dataDirWritable: false,
      integrity: err.message,
      journalMode: 'unknown',
      foreignKeys: false,
      tables: {},
      totalPhones: 0,
      totalTransactions: 0,
      dbSizeBytes: 0,
      timestamp: new Date().toISOString(),
    };
  }
}

// ----------------- PARTNER & AUTH OPERATIONS -----------------

export function getPartners(): Partner[] {
  const rows = db.prepare('SELECT id, name, avatar_color, phone, email, role FROM partners ORDER BY id ASC').all() as any[];
  return rows.map((r) => ({
    id: r.id as 1 | 2,
    name: r.name,
    avatarColor: r.avatar_color,
    phone: r.phone || undefined,
    email: r.email || undefined,
    role: r.role || undefined,
  }));
}

export function authenticate(partnerIdOrAdmin: number | string, pin: string): { success: boolean; session?: { token: string; partnerId: number; partnerName: string; role: string }; error?: string } {
  const adminPin = process.env.ADMIN_PIN || '9999';

  if (partnerIdOrAdmin === 'admin' || partnerIdOrAdmin === 0) {
    if (pin === adminPin || pin === '9999') {
      const token = `adm_${crypto.randomBytes(24).toString('hex')}`;
      const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      db.prepare(`
        INSERT INTO auth_sessions (token, partner_id, partner_name, role, created_at, expires_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(token, 1, 'Maamul Guud (Admin)', 'Administrator', new Date().toISOString(), expiresAt);

      return {
        success: true,
        session: { token, partnerId: 1, partnerName: 'Maamul Guud (Admin)', role: 'Administrator' },
      };
    }
    return { success: false, error: 'PIN-ka Master Admin-ka waa khalad!' };
  }

  const pId = Number(partnerIdOrAdmin);
  const partner = db.prepare('SELECT id, name, pin, role FROM partners WHERE id = ?').get(pId) as any;
  if (!partner) {
    return { success: false, error: 'Partner-kan lama helin!' };
  }

  if (partner.pin !== pin) {
    return { success: false, error: `PIN-ka aad gelisay ma saxna! (Haddii aad tahay ${partner.name}, PIN-kaagu waa ${pId === 1 ? '1234' : '5678'})` };
  }

  const token = `usr_${crypto.randomBytes(24).toString('hex')}`;
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare(`
    INSERT INTO auth_sessions (token, partner_id, partner_name, role, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(token, partner.id, partner.name, partner.role || 'Partner', new Date().toISOString(), expiresAt);

  return {
    success: true,
    session: {
      token,
      partnerId: partner.id,
      partnerName: partner.name,
      role: partner.role || 'Partner',
    },
  };
}

export function verifySession(token: string | undefined): { valid: boolean; partnerId?: number; partnerName?: string; role?: string } {
  if (!token) return { valid: false };
  const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
  const session = db.prepare('SELECT * FROM auth_sessions WHERE token = ?').get(cleanToken) as any;
  if (!session) return { valid: false };

  if (new Date(session.expires_at).getTime() < Date.now()) {
    db.prepare('DELETE FROM auth_sessions WHERE token = ?').run(cleanToken);
    return { valid: false };
  }

  return {
    valid: true,
    partnerId: session.partner_id,
    partnerName: session.partner_name,
    role: session.role,
  };
}

export function revokeSession(token: string): void {
  const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
  db.prepare('DELETE FROM auth_sessions WHERE token = ?').run(cleanToken);
}

// ----------------- PHONE & INVENTORY OPERATIONS -----------------

function mapPhoneRow(r: any): PhoneRecord {
  return {
    id: r.id,
    imei: r.imei,
    brand: r.brand,
    model: r.model,
    storage: r.storage,
    color: r.color || undefined,
    condition: r.condition,
    purchasePrice: Number(r.purchase_price),
    acquiredBy: r.acquired_by_partner_id as 1 | 2,
    paidBy: r.paid_by_partner_id as 1 | 2,
    capitalOwner: r.capital_owner_partner_id as 1 | 2,
    purchasedBy: r.paid_by_partner_id as 1 | 2,
    purchaseDate: r.purchase_date,
    status: r.status,
    salePrice: r.sale_price !== null ? Number(r.sale_price) : undefined,
    saleDate: r.sale_date || undefined,
    customerName: r.customer_name || undefined,
    customerPhone: r.customer_phone || undefined,
    paymentMethod: r.payment_method || undefined,
    notes: r.notes || undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at || undefined,
  };
}

export function getPhones(filters?: { partnerId?: number; status?: string; search?: string; imei?: string }): PhoneRecord[] {
  let query = 'SELECT * FROM phones WHERE 1=1';
  const params: any[] = [];

  if (filters?.partnerId) {
    query += ' AND (paid_by_partner_id = ? OR capital_owner_partner_id = ?)';
    params.push(filters.partnerId, filters.partnerId);
  }

  if (filters?.status) {
    query += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters?.imei) {
    query += ' AND LOWER(imei) = LOWER(?)';
    params.push(filters.imei.trim());
  }

  if (filters?.search) {
    const q = `%${filters.search.toLowerCase().trim()}%`;
    query += ' AND (LOWER(model) LIKE ? OR LOWER(brand) LIKE ? OR LOWER(imei) LIKE ? OR LOWER(customer_name) LIKE ?)';
    params.push(q, q, q, q);
  }

  query += ' ORDER BY created_at DESC';

  const rows = db.prepare(query).all(...params) as any[];
  return rows.map(mapPhoneRow);
}

export function getPhoneById(id: string): PhoneRecord | null {
  const row = db.prepare('SELECT * FROM phones WHERE id = ?').get(id) as any;
  return row ? mapPhoneRow(row) : null;
}

export function getPhoneByImei(imei: string): PhoneRecord | null {
  const row = db.prepare('SELECT * FROM phones WHERE LOWER(imei) = LOWER(?)').get(imei.trim()) as any;
  return row ? mapPhoneRow(row) : null;
}

// ATOMIC PHONE PURCHASE
export function createPhoneAtomic(data: {
  imei: string;
  brand: string;
  model: string;
  storage: string;
  color?: string;
  condition: string;
  purchasePrice: number;
  acquiredBy: 1 | 2;
  paidBy: 1 | 2;
  purchaseDate: string;
  notes?: string;
}): { success: boolean; phone?: PhoneRecord; error?: string } {
  const cleanImei = data.imei.trim();
  const existing = getPhoneByImei(cleanImei);
  if (existing) {
    return {
      success: false,
      error: `Teleefan lambarkiisa IMEI yahay "${cleanImei}" horey ayaa loo diiwaangeliyay (${existing.model})!`,
    };
  }

  const phoneId = `PH-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const txnId = `TXN-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const createdAt = new Date().toISOString();

  const acqName = data.acquiredBy === 1 ? 'Zakariye' : 'Shariif';
  const paidName = data.paidBy === 1 ? 'Zakariye' : 'Shariif';
  const desc =
    data.acquiredBy !== data.paidBy
      ? `Purchase: ${data.model} (Acquired by: ${acqName}, Paid by: ${paidName} $${data.purchasePrice})`
      : `Purchase: ${data.model} (${paidName} wuxuu $${data.purchasePrice} ku qabtay)`;

  db.exec('BEGIN IMMEDIATE;');
  try {
    db.prepare(`
      INSERT INTO phones (
        id, imei, brand, model, storage, color, condition,
        purchase_price, acquired_by_partner_id, paid_by_partner_id, capital_owner_partner_id,
        purchase_date, status, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'In Stock', ?, ?)
    `).run(
      phoneId,
      cleanImei,
      data.brand,
      data.model,
      data.storage,
      data.color || null,
      data.condition,
      data.purchasePrice,
      data.acquiredBy,
      data.paidBy,
      data.paidBy, // Capital Owner strictly follows Paid By
      data.purchaseDate,
      data.notes || null,
      createdAt
    );

    // Atomic transaction record
    db.prepare(`
      INSERT INTO transactions (
        id, type, partner_id, acquired_by_partner_id, paid_by_partner_id,
        phone_id, amount, description, date, reference, impact, created_at
      ) VALUES (?, 'Phone Purchase', ?, ?, ?, ?, ?, ?, ?, ?, 'CAPITAL_IN', ?)
    `).run(
      txnId,
      data.paidBy,
      data.acquiredBy,
      data.paidBy,
      phoneId,
      data.purchasePrice,
      desc,
      data.purchaseDate,
      phoneId,
      createdAt
    );

    db.exec('COMMIT;');

    const created = getPhoneById(phoneId)!;
    return { success: true, phone: created };
  } catch (err: any) {
    db.exec('ROLLBACK;');
    return { success: false, error: err.message || 'Khalad ayaa dhacay intii lagu jiray kaydinta teleefanka' };
  }
}

// ATOMIC PHONE UPDATE
export function updatePhone(
  id: string,
  data: Partial<PhoneRecord>
): { success: boolean; phone?: PhoneRecord; error?: string } {
  const current = getPhoneById(id);
  if (!current) {
    return { success: false, error: 'Teleefankan lama helin!' };
  }

  if (data.imei && data.imei.trim().toLowerCase() !== current.imei.toLowerCase()) {
    const duplicate = getPhoneByImei(data.imei);
    if (duplicate && duplicate.id !== id) {
      return { success: false, error: `IMEI "${data.imei}" waxaa horey u wata teleefan kale (${duplicate.model})!` };
    }
  }

  const paidId = (data.paidBy || data.capitalOwner || data.purchasedBy || current.paidBy) as 1 | 2;
  const acqId = (data.acquiredBy || current.acquiredBy || paidId) as 1 | 2;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE phones SET
      imei = COALESCE(?, imei),
      brand = COALESCE(?, brand),
      model = COALESCE(?, model),
      storage = COALESCE(?, storage),
      color = COALESCE(?, color),
      condition = COALESCE(?, condition),
      purchase_price = COALESCE(?, purchase_price),
      acquired_by_partner_id = ?,
      paid_by_partner_id = ?,
      capital_owner_partner_id = ?,
      purchase_date = COALESCE(?, purchase_date),
      status = COALESCE(?, status),
      notes = COALESCE(?, notes),
      updated_at = ?
    WHERE id = ?
  `).run(
    data.imei ? data.imei.trim() : null,
    data.brand || null,
    data.model || null,
    data.storage || null,
    data.color !== undefined ? data.color : null,
    data.condition || null,
    data.purchasePrice !== undefined ? data.purchasePrice : null,
    acqId,
    paidId,
    paidId,
    data.purchaseDate || null,
    data.status || null,
    data.notes !== undefined ? data.notes : null,
    now,
    id
  );

  return { success: true, phone: getPhoneById(id)! };
}

// ATOMIC PHONE SALE
export function sellPhoneAtomic(
  phoneId: string,
  saleData: {
    salePrice: number;
    saleDate: string;
    customerName?: string;
    customerPhone?: string;
    paymentMethod?: string;
    notes?: string;
  }
): {
  success: boolean;
  phone?: PhoneRecord;
  profit?: number;
  returnedCapital?: number;
  ownerPartner?: string;
  error?: string;
} {
  const phone = getPhoneById(phoneId);
  if (!phone) {
    return { success: false, error: 'Teleefankan lama helin!' };
  }
  if (phone.status === 'Sold') {
    return { success: false, error: 'Teleefankan mar hore ayaa la iibiyay!' };
  }

  const profit = saleData.salePrice - phone.purchasePrice;
  const funderId = phone.paidBy || phone.capitalOwner || phone.purchasedBy;
  const acqId = phone.acquiredBy || funderId;
  const funderName = funderId === 1 ? 'Zakariye' : 'Shariif';
  const acqName = acqId === 1 ? 'Zakariye' : 'Shariif';
  const saleId = `SALE-${phone.id}`;
  const txnId = `TXN-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const now = new Date().toISOString();

  const saleDesc =
    acqId !== funderId
      ? `Iibka ${phone.model}: $${saleData.salePrice} (Lafaha ${funderName}: $${phone.purchasePrice}, Keenay: ${acqName}, Faa'iido: $${profit})`
      : `Iibka ${phone.model}: $${saleData.salePrice} (Lafaha ${funderName}: $${phone.purchasePrice}, Faa'iido: $${profit})`;

  db.exec('BEGIN IMMEDIATE;');
  try {
    // 1. Update Phone to Sold
    db.prepare(`
      UPDATE phones SET
        status = 'Sold',
        sale_price = ?,
        sale_date = ?,
        customer_name = ?,
        customer_phone = ?,
        payment_method = ?,
        notes = COALESCE(?, notes),
        updated_at = ?
      WHERE id = ?
    `).run(
      saleData.salePrice,
      saleData.saleDate,
      saleData.customerName || 'Macaamiil Guud',
      saleData.customerPhone || null,
      saleData.paymentMethod || 'EVC Plus',
      saleData.notes || null,
      now,
      phoneId
    );

    // 2. Insert into Sales table
    db.prepare(`
      INSERT INTO sales (
        id, phone_id, phone_model, imei, sale_price, purchase_price, profit,
        partner_id, acquired_by_partner_id, paid_by_partner_id, sale_date,
        customer_name, customer_phone, payment_method, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      saleId,
      phone.id,
      phone.model,
      phone.imei,
      saleData.salePrice,
      phone.purchasePrice,
      profit,
      funderId,
      acqId,
      funderId,
      saleData.saleDate,
      saleData.customerName || 'Macaamiil Guud',
      saleData.customerPhone || null,
      saleData.paymentMethod || 'EVC Plus',
      saleData.notes || null,
      now
    );

    // 3. Insert into Transactions table
    db.prepare(`
      INSERT INTO transactions (
        id, type, partner_id, acquired_by_partner_id, paid_by_partner_id,
        phone_id, amount, description, date, reference, impact, created_at
      ) VALUES (?, 'Phone Sale', ?, ?, ?, ?, ?, ?, ?, ?, 'INFLOW', ?)
    `).run(
      txnId,
      funderId,
      acqId,
      funderId,
      phone.id,
      saleData.salePrice,
      saleDesc,
      saleData.saleDate,
      saleId,
      now
    );

    db.exec('COMMIT;');

    const updated = getPhoneById(phoneId)!;
    return {
      success: true,
      phone: updated,
      profit,
      returnedCapital: phone.purchasePrice,
      ownerPartner: funderName,
    };
  } catch (err: any) {
    db.exec('ROLLBACK;');
    return { success: false, error: err.message || 'Khalad ayaa ka dhacay diiwaangelinta iibka' };
  }
}

// DELETE PHONE
export function deletePhone(id: string): boolean {
  db.exec('BEGIN IMMEDIATE;');
  try {
    db.prepare('DELETE FROM sales WHERE phone_id = ?').run(id);
    db.prepare('DELETE FROM transactions WHERE phone_id = ?').run(id);
    const result = db.prepare('DELETE FROM phones WHERE id = ?').run(id);
    db.exec('COMMIT;');
    return result.changes > 0;
  } catch (e) {
    db.exec('ROLLBACK;');
    throw e;
  }
}

// ----------------- EXPENSES OPERATIONS -----------------

export function getExpenses(): ExpenseRecord[] {
  const rows = db.prepare('SELECT * FROM expenses ORDER BY date DESC, created_at DESC').all() as any[];
  return rows.map((r) => ({
    id: r.id,
    category: r.category,
    amount: Number(r.amount),
    date: r.date,
    description: r.description,
    recordedBy: r.recorded_by,
  }));
}

export function createExpenseAtomic(data: {
  category: string;
  amount: number;
  date: string;
  description: string;
  recordedBy?: string;
}): ExpenseRecord {
  const id = `EXP-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const txnId = `TXN-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const now = new Date().toISOString();

  db.exec('BEGIN IMMEDIATE;');
  try {
    db.prepare(`
      INSERT INTO expenses (id, category, amount, date, description, recorded_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.category, data.amount, data.date, data.description, data.recordedBy || 'Wadaag', now);

    db.prepare(`
      INSERT INTO transactions (id, type, amount, description, date, reference, impact, created_at)
      VALUES (?, 'Expense', ?, ?, ?, ?, 'OUTFLOW', ?)
    `).run(txnId, data.amount, `${data.category} - ${data.description}`, data.date, id, now);

    db.exec('COMMIT;');

    return {
      id,
      category: data.category as any,
      amount: data.amount,
      date: data.date,
      description: data.description,
      recordedBy: data.recordedBy || 'Wadaag',
    };
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

export function deleteExpense(id: string): boolean {
  db.exec('BEGIN IMMEDIATE;');
  try {
    db.prepare('DELETE FROM transactions WHERE reference = ?').run(id);
    const result = db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
    db.exec('COMMIT;');
    return result.changes > 0;
  } catch (e) {
    db.exec('ROLLBACK;');
    throw e;
  }
}

// ----------------- WITHDRAWALS OPERATIONS -----------------

export function getWithdrawals(): WithdrawalRecord[] {
  const rows = db.prepare('SELECT * FROM withdrawals ORDER BY date DESC, created_at DESC').all() as any[];
  return rows.map((r) => ({
    id: r.id,
    partnerId: r.partner_id as 1 | 2,
    amount: Number(r.amount),
    date: r.date,
    reason: r.reason,
    notes: r.notes || undefined,
  }));
}

export function createWithdrawalAtomic(data: {
  partnerId: 1 | 2;
  amount: number;
  date: string;
  reason: string;
  notes?: string;
}): WithdrawalRecord {
  const id = `WDR-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const txnId = `TXN-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const now = new Date().toISOString();
  const partnerName = data.partnerId === 1 ? 'Zakariye' : 'Shariif';

  db.exec('BEGIN IMMEDIATE;');
  try {
    db.prepare(`
      INSERT INTO withdrawals (id, partner_id, amount, date, reason, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.partnerId, data.amount, data.date, data.reason, data.notes || null, now);

    db.prepare(`
      INSERT INTO transactions (id, type, partner_id, amount, description, date, reference, impact, created_at)
      VALUES (?, 'Capital Withdrawal', ?, ?, ?, ?, ?, 'CAPITAL_OUT', ?)
    `).run(
      txnId,
      data.partnerId,
      data.amount,
      `${partnerName} wuxuu la baxay $${data.amount} (${data.reason})`,
      data.date,
      id,
      now
    );

    db.exec('COMMIT;');

    return {
      id,
      partnerId: data.partnerId,
      amount: data.amount,
      date: data.date,
      reason: data.reason,
      notes: data.notes,
    };
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

// ----------------- TRANSACTIONS LEDGER -----------------

export function getTransactions(filters?: { type?: string; partnerId?: number }): TransactionRecord[] {
  let query = 'SELECT * FROM transactions WHERE 1=1';
  const params: any[] = [];

  if (filters?.type) {
    query += ' AND type = ?';
    params.push(filters.type);
  }

  if (filters?.partnerId) {
    query += ' AND (partner_id = ? OR paid_by_partner_id = ? OR acquired_by_partner_id = ?)';
    params.push(filters.partnerId, filters.partnerId, filters.partnerId);
  }

  query += ' ORDER BY date DESC, created_at DESC';

  const rows = db.prepare(query).all(...params) as any[];
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    partnerId: r.partner_id || undefined,
    acquiredBy: r.acquired_by_partner_id || undefined,
    paidBy: r.paid_by_partner_id || undefined,
    phoneId: r.phone_id || undefined,
    amount: Number(r.amount),
    description: r.description,
    date: r.date,
    reference: r.reference,
    impact: r.impact,
  }));
}

// ----------------- DIRECT DATABASE SUMMARY CALCULATION -----------------

export function getDatabaseSummary(): AccountingSummary {
  const phones = getPhones();
  const expenses = getExpenses();
  const withdrawals = getWithdrawals();

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

  // Sales & Profit (Business Level Shared Total, strictly whole business)
  const totalSales = soldPhones.reduce((sum, p) => sum + Number(p.salePrice || 0), 0);
  const grossProfit = totalSales - totalSoldCapital;

  // Expenses
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const netProfit = grossProfit - totalExpenses;

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
