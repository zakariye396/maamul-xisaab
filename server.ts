import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  initDatabase,
  getPartners,
  authenticate,
  verifySession,
  revokeSession,
  getPhones,
  getPhoneById,
  createPhoneAtomic,
  updatePhone,
  sellPhoneAtomic,
  deletePhone,
  getExpenses,
  createExpenseAtomic,
  deleteExpense,
  getWithdrawals,
  createWithdrawalAtomic,
  getTransactions,
  getDatabaseSummary,
  seedInitialAccountingData,
  checkDatabaseHealth,
  createDatabaseBackup,
  listDatabaseBackups,
  DB_PATH,
} from './server/database.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite Schema safely on startup (opens existing db, does not wipe)
initDatabase();

// Auth Middleware for protected endpoints
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'Fadlan gal nidaamka (Authorization token required)!',
    });
  }

  const session = verifySession(authHeader);
  if (!session.valid) {
    return res.status(401).json({
      success: false,
      error: 'Session-kaagu wuu dhacay ama ma saxna. Fadlan dib u gal (Login)!',
    });
  }

  (req as any).user = session;
  next();
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const HOST = process.env.HOST || '0.0.0.0';

  app.use(express.json());

  // ----------------- SECURITY RESTRICTIONS -----------------
  // Block any attempt to access database files, /data directory, backups, or environment secrets
  app.use((req, res, next) => {
    const url = req.url.toLowerCase();
    if (
      url.includes('/data/') ||
      url.endsWith('.db') ||
      url.endsWith('.sqlite') ||
      url.endsWith('.env') ||
      url.includes('backups')
    ) {
      return res.status(403).json({ success: false, error: 'Access to system database files is strictly forbidden.' });
    }
    next();
  });

  // ----------------- AUTHENTICATION API -----------------
  app.post('/api/auth/login', (req, res) => {
    const { partnerId, pin } = req.body;
    if (!pin) {
      return res.status(400).json({ success: false, error: 'Fadlan geli PIN-kaaga sirta ah!' });
    }

    const result = authenticate(partnerId, String(pin).trim());
    if (!result.success) {
      return res.status(401).json(result);
    }

    res.json({
      success: true,
      message: `Soo dhowow, ${result.session?.partnerName}!`,
      session: result.session,
    });
  });

  app.get('/api/auth/me', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.json({ success: true, authenticated: false, user: null });
    }

    const session = verifySession(authHeader);
    if (!session.valid) {
      return res.json({ success: true, authenticated: false, user: null });
    }

    res.json({
      success: true,
      authenticated: true,
      user: {
        partnerId: session.partnerId,
        partnerName: session.partnerName,
        role: session.role,
      },
    });
  });

  app.post('/api/auth/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      revokeSession(authHeader);
    }
    res.json({ success: true, message: 'Waa lagaa saaray nidaamka si guul leh (Logged out)!' });
  });

  // ----------------- PARTNERS API -----------------
  app.get('/api/partners', (req, res) => {
    const partners = getPartners();
    res.json({ success: true, data: partners });
  });

  // ----------------- PHONES (INVENTORY) API -----------------
  app.get('/api/phones', (req, res) => {
    const { partnerId, status, search, imei } = req.query;
    const phones = getPhones({
      partnerId: partnerId ? Number(partnerId) : undefined,
      status: status ? String(status) : undefined,
      search: search ? String(search) : undefined,
      imei: imei ? String(imei) : undefined,
    });
    res.json({ success: true, data: phones, count: phones.length });
  });

  app.get('/api/phones/:id', (req, res) => {
    const phone = getPhoneById(req.params.id);
    if (!phone) {
      return res.status(404).json({ success: false, error: 'Teleefankan lama helin!' });
    }
    res.json({ success: true, data: phone });
  });

  // Purchase / Add Phone (Qabasho)
  app.post('/api/phones', (req, res) => {
    const {
      imei,
      brand,
      model,
      storage,
      color,
      condition,
      purchasePrice,
      acquiredBy,
      paidBy,
      capitalOwner,
      purchasedBy,
      purchaseDate,
      notes,
    } = req.body;

    const paidId = Number(paidBy || capitalOwner || purchasedBy) as 1 | 2;
    const acqId = Number(acquiredBy || paidId) as 1 | 2;

    if (!model || !paidId || purchasePrice === undefined || purchasePrice === null) {
      return res.status(400).json({
        success: false,
        error: 'Fadlan buuxi Model-ka, Lacag Bixiyaha (Paid By), iyo Qiimaha Lafaha!',
      });
    }

    const priceNum = Number(purchasePrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Qiimaha lafaha waa inuu ka weyn yahay $0!',
      });
    }

    if ((paidId !== 1 && paidId !== 2) || (acqId !== 1 && acqId !== 2)) {
      return res.status(400).json({
        success: false,
        error: 'Partner-ku waa inuu ahaadaa Zakariye (1) ama Shariif (2)!',
      });
    }

    const cleanImei = String(imei || '').trim() || `IMEI-${Math.floor(100000000000000 + Math.random() * 900000000000000)}`;

    const result = createPhoneAtomic({
      imei: cleanImei,
      brand: String(brand || 'Apple/Samsung').trim(),
      model: String(model).trim(),
      storage: String(storage || '128GB'),
      color: color ? String(color).trim() : undefined,
      condition: condition || 'Grade A (Nadiif)',
      purchasePrice: priceNum,
      acquiredBy: acqId,
      paidBy: paidId,
      purchaseDate: purchaseDate || new Date().toISOString().split('T')[0],
      notes: notes ? String(notes).trim() : undefined,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    const summary = getDatabaseSummary();
    const acqName = acqId === 1 ? 'Zakariye' : 'Shariif';
    const paidName = paidId === 1 ? 'Zakariye' : 'Shariif';

    res.status(201).json({
      success: true,
      message: `Teleefanka ${result.phone?.model} si guul leh ayaa loogu qoray database-ka (Lafaha: ${paidName} $${priceNum}, Keenay: ${acqName})!`,
      phone: result.phone,
      summary,
    });
  });

  // Update Phone
  app.put('/api/phones/:id', (req, res) => {
    const { id } = req.params;
    const result = updatePhone(id, req.body);
    if (!result.success) {
      return res.status(400).json(result);
    }
    const summary = getDatabaseSummary();
    res.json({
      success: true,
      message: 'Xogta teleefanka waa lagu cusboonaysiiyay database-ka',
      phone: result.phone,
      summary,
    });
  });

  // Sell Phone (Iibinta Teleefanka - Atomic)
  app.post('/api/phones/:id/sell', (req, res) => {
    const { id } = req.params;
    const { salePrice, saleDate, customerName, customerPhone, paymentMethod, notes } = req.body;

    const priceNum = Number(salePrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      return res.status(400).json({ success: false, error: 'Fadlan geli qiime iib oo sax ah (ka weyn $0)!' });
    }

    const result = sellPhoneAtomic(id, {
      salePrice: priceNum,
      saleDate: saleDate || new Date().toISOString().split('T')[0],
      customerName: customerName ? String(customerName).trim() : 'Macaamiil Guud',
      customerPhone: customerPhone ? String(customerPhone).trim() : undefined,
      paymentMethod: paymentMethod || 'EVC Plus',
      notes: notes ? String(notes).trim() : undefined,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    const summary = getDatabaseSummary();
    res.json({
      success: true,
      message: `Teleefanka si guul leh ayaa loo iibiyay! Faa'iido: +$${result.profit}`,
      phone: result.phone,
      profitGenerated: result.profit,
      returnedCapital: result.returnedCapital,
      ownerPartner: result.ownerPartner,
      summary,
    });
  });

  // Delete Phone
  app.delete('/api/phones/:id', (req, res) => {
    try {
      const deleted = deletePhone(req.params.id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Teleefankan lama helin!' });
      }
      const summary = getDatabaseSummary();
      res.json({ success: true, message: 'Teleefanka waa laga tirtiray database-ka', summary });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // ----------------- EXPENSES API -----------------
  app.get('/api/expenses', (req, res) => {
    const expenses = getExpenses();
    res.json({ success: true, data: expenses });
  });

  app.post('/api/expenses', (req, res) => {
    const { category, amount, date, description, recordedBy } = req.body;
    const amountNum = Number(amount);
    if (!category || isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ success: false, error: 'Fadlan geli category iyo lacagta kharashka!' });
    }

    const newExpense = createExpenseAtomic({
      category,
      amount: amountNum,
      date: date || new Date().toISOString().split('T')[0],
      description: description ? String(description).trim() : 'Kharash dukaanka ah',
      recordedBy: recordedBy || 'Wadaag',
    });

    const summary = getDatabaseSummary();
    res.status(201).json({ success: true, data: newExpense, summary });
  });

  app.delete('/api/expenses/:id', (req, res) => {
    try {
      const deleted = deleteExpense(req.params.id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Kharashkan lama helin!' });
      }
      const summary = getDatabaseSummary();
      res.json({ success: true, message: 'Kharashka waa la tirtiray', summary });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // ----------------- WITHDRAWALS API -----------------
  app.get('/api/withdrawals', (req, res) => {
    const withdrawals = getWithdrawals();
    res.json({ success: true, data: withdrawals });
  });

  app.post('/api/withdrawals', (req, res) => {
    const { partnerId, amount, date, reason, notes } = req.body;
    const amountNum = Number(amount);
    const pId = Number(partnerId) as 1 | 2;

    if ((pId !== 1 && pId !== 2) || isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ success: false, error: 'Fadlan geli partner-ka iyo lacag sax ah!' });
    }

    const newWdr = createWithdrawalAtomic({
      partnerId: pId,
      amount: amountNum,
      date: date || new Date().toISOString().split('T')[0],
      reason: reason ? String(reason).trim() : 'Kala bixid lacageed',
      notes: notes ? String(notes).trim() : undefined,
    });

    const summary = getDatabaseSummary();
    res.status(201).json({ success: true, data: newWdr, summary });
  });

  // ----------------- TRANSACTIONS LEDGER API -----------------
  app.get('/api/transactions', (req, res) => {
    const { type, partnerId } = req.query;
    const transactions = getTransactions({
      type: type ? String(type) : undefined,
      partnerId: partnerId ? Number(partnerId) : undefined,
    });
    res.json({ success: true, data: transactions, count: transactions.length });
  });

  // ----------------- ACCOUNTING SUMMARY API -----------------
  app.get('/api/accounting/summary', (req, res) => {
    const summary = getDatabaseSummary();
    res.json({ success: true, data: summary });
  });

  // ----------------- DATABASE HEALTH & STATUS API -----------------
  app.get('/api/database/health', (req, res) => {
    const health = checkDatabaseHealth();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json({ success: health.status === 'healthy', health });
  });

  app.get('/api/database/backups', (req, res) => {
    const backups = listDatabaseBackups();
    res.json({ success: true, data: backups, count: backups.length });
  });

  app.post('/api/database/backup', (req, res) => {
    const result = createDatabaseBackup();
    if (result.success) {
      res.json({ success: true, message: 'Database backup created successfully', backup: result });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  });

  // ----------------- DEV ONLY / RESET API -----------------
  app.post('/api/reset', (req, res) => {
    seedInitialAccountingData();
    const summary = getDatabaseSummary();
    res.json({
      success: true,
      message: 'Database-ka waxaa dib loogu celiyay tijaabadii asalka ahayd (Zakariye $50, Shariif $80)!',
      summary,
    });
  });

  // ----------------- AUDIT / METRICS API -----------------
  app.get('/api/audit', (req, res) => {
    const health = checkDatabaseHealth();
    const summary = getDatabaseSummary();
    const phones = getPhones();
    const transactions = getTransactions();
    const expenses = getExpenses();
    const withdrawals = getWithdrawals();
    const partners = getPartners();

    res.json({
      success: true,
      audit: {
        databaseEngine: 'SQLite (Node.js 22 native node:sqlite DatabaseSync)',
        databasePath: health.databasePath,
        journalMode: health.journalMode,
        foreignKeys: health.foreignKeys ? 'Enabled (ON)' : 'Disabled',
        integrityCheck: health.integrity,
        tables: health.tables,
        counts: {
          partners: partners.length,
          phones: phones.length,
          transactions: transactions.length,
          expenses: expenses.length,
          withdrawals: withdrawals.length,
        },
        financials: {
          zakariyeCapital: summary.zakariyeTotalCapital,
          shariifCapital: summary.shariifTotalCapital,
          totalCapital: summary.totalCapital,
          totalSales: summary.totalSales,
          grossProfit: summary.grossProfit,
          totalExpenses: summary.totalExpenses,
          netProfit: summary.netProfit,
        },
        productionStatus: health.status === 'healthy' ? 'ready' : 'needs fixes',
      },
    });
  });

  // Serve Vite in development or static in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Express server running on http://${HOST}:${PORT} with persistent SQLite database at ${DB_PATH}`);
  });
}

startServer();
