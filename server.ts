import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  initDatabase,
  getPartners,
  loginUser,
  validateSession,
  logoutUser,
  changeUserPassword,
  getUsers,
  createUser,
  updateUser,
  resetUserPassword,
  deleteUser,
  getAuditLogs,
  authenticate as authenticateLegacyPin,
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
  getSessionTtlMs,
  DB_PATH,
} from './server/database.ts';
import { SafeUser } from './src/types/accounting.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite Schema & Default Admin safely on startup (never wipes)
initDatabase();

// ----------------- HELPER: COOKIE PARSER -----------------
function parseCookies(cookieHeader?: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    if (parts.length === 2) {
      cookies[parts[0].trim()] = decodeURIComponent(parts[1].trim());
    }
  });
  return cookies;
}

// ----------------- LOGIN BRUTE-FORCE RATE LIMITING -----------------
interface RateLimitRecord {
  count: number;
  firstAttempt: number;
  lockedUntil?: number;
}
const loginRateLimitMap = new Map<string, RateLimitRecord>();

function checkLoginRateLimit(ip: string): { allowed: boolean; remainingSeconds?: number } {
  const now = Date.now();
  const record = loginRateLimitMap.get(ip);
  if (!record) return { allowed: true };

  if (record.lockedUntil && record.lockedUntil > now) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { allowed: false, remainingSeconds };
  }

  // Reset window if older than 15 minutes
  if (now - record.firstAttempt > 15 * 60 * 1000) {
    loginRateLimitMap.delete(ip);
    return { allowed: true };
  }

  return { allowed: true };
}

function recordLoginFailure(ip: string): void {
  const now = Date.now();
  const record = loginRateLimitMap.get(ip) || { count: 0, firstAttempt: now };
  record.count += 1;
  if (record.count >= 5) {
    record.lockedUntil = now + 15 * 60 * 1000; // 15 minute temporary block
  }
  loginRateLimitMap.set(ip, record);
}

function resetLoginRateLimit(ip: string): void {
  loginRateLimitMap.delete(ip);
}

// ----------------- AUTH & ROLE MIDDLEWARES -----------------

export interface AuthenticatedRequest extends Request {
  user?: SafeUser;
  sessionToken?: string;
}

export function extractToken(req: Request): string | undefined {
  // 1. Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.substring(7).trim();
  }

  // 2. Custom header
  if (req.headers['x-session-token']) {
    return String(req.headers['x-session-token']).trim();
  }

  // 3. HTTP Cookie
  const cookies = parseCookies(req.headers.cookie);
  if (cookies['session_token']) {
    return cookies['session_token'].trim();
  }

  return undefined;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Fadlan gal nidaamka (Authentication required). Unauthorized access.',
    });
  }

  const result = validateSession(token);
  if (!result.valid || !result.user) {
    return res.status(401).json({
      success: false,
      error: result.error || 'Session-kaagu wuu dhacay ama ma saxna. Fadlan dib u gal (Session expired/invalid).',
    });
  }

  req.user = result.user;
  req.sessionToken = token;
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Ma haysatid ogolaansho maamule (Admin privileges required). Forbidden.',
      });
    }
    next();
  });
}

// ----------------- MAIN EXPRESS APPLICATION -----------------

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3001;
  const HOST = process.env.HOST || '0.0.0.0';

  app.use(express.json());

  // Security Headers Middleware
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Block direct access to database files, backups, and environment secrets
  app.use((req, res, next) => {
    const url = req.url.toLowerCase();
    if (
      url.includes('/data/') ||
      url.endsWith('.db') ||
      url.endsWith('.sqlite') ||
      url.endsWith('.sqlite3') ||
      url.endsWith('.wal') ||
      url.endsWith('.shm') ||
      url.endsWith('.env') ||
      url.includes('backups')
    ) {
      return res.status(403).json({ success: false, error: 'Access to system database files is strictly forbidden.' });
    }
    next();
  });

  const getClientIp = (req: Request): string => {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
    return req.socket.remoteAddress || '127.0.0.1';
  };

  // ----------------- AUTHENTICATION API -----------------

  // 1. Unified Login (Username + Password, or legacy partner PIN)
  app.post('/api/auth/login', (req, res) => {
    const clientIp = getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';

    // Check rate limit
    const rateCheck = checkLoginRateLimit(clientIp);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: `Isku dayo badan oo khalad ah. Fadlan sug ${rateCheck.remainingSeconds} ilbiriqsi ka hor inta aadan dib u tijaabin (Too many attempts. Locked for ${rateCheck.remainingSeconds}s)!`,
      });
    }

    const { username, password, partnerId, pin } = req.body;

    // Standard Username + Password Authentication
    if (username !== undefined || password !== undefined) {
      const result = loginUser(String(username || ''), String(password || ''), { ip: clientIp, userAgent });
      if (!result.success || !result.session) {
        recordLoginFailure(clientIp);
        return res.status(401).json({ success: false, error: result.error });
      }

      resetLoginRateLimit(clientIp);

      // Set HttpOnly Cookie
      const maxAgeMs = getSessionTtlMs();
      res.setHeader(
        'Set-Cookie',
        `session_token=${result.session.token}; Path=/; Max-Age=${Math.floor(maxAgeMs / 1000)}; HttpOnly; SameSite=Lax${
          process.env.NODE_ENV === 'production' ? '; Secure' : ''
        }`
      );

      return res.json({
        success: true,
        message: `Soo dhowow, ${result.session.user.fullName}!`,
        token: result.session.token,
        user: result.session.user,
        expiresAt: result.session.expiresAt,
      });
    }

    // Legacy PIN-based fallback for older partner switcher
    if (pin !== undefined) {
      const legacyResult = authenticateLegacyPin(partnerId, String(pin).trim());
      if (!legacyResult.success || !legacyResult.session) {
        recordLoginFailure(clientIp);
        return res.status(401).json(legacyResult);
      }

      resetLoginRateLimit(clientIp);
      return res.json({
        success: true,
        message: `Soo dhowow, ${legacyResult.session.partnerName}!`,
        token: legacyResult.session.token,
        session: legacyResult.session,
      });
    }

    return res.status(400).json({ success: false, error: 'Fadlan geli username iyo password!' });
  });

  // 2. Current User Profile (/api/auth/me)
  app.get('/api/auth/me', (req: AuthenticatedRequest, res) => {
    const token = extractToken(req);
    if (!token) {
      return res.json({ success: true, authenticated: false, user: null });
    }

    const result = validateSession(token);
    if (!result.valid || !result.user) {
      return res.json({ success: true, authenticated: false, user: null });
    }

    res.json({
      success: true,
      authenticated: true,
      user: result.user,
      expiresAt: result.session?.expiresAt,
    });
  });

  // 3. Logout (/api/auth/logout)
  app.post('/api/auth/logout', (req: AuthenticatedRequest, res) => {
    const token = extractToken(req);
    const clientIp = getClientIp(req);
    if (token) {
      logoutUser(token, { ip: clientIp });
    }

    // Clear session cookie
    res.setHeader('Set-Cookie', 'session_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax');
    res.json({ success: true, message: 'Waa lagaa saaray nidaamka si guul leh (Logged out)!' });
  });

  // 4. Change Password (/api/auth/change-password)
  app.post('/api/auth/change-password', requireAuth, (req: AuthenticatedRequest, res) => {
    const { currentPassword, newPassword } = req.body;
    const clientIp = getClientIp(req);

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Fadlan geli furaha hadda jira iyo kan cusub!' });
    }

    const result = changeUserPassword(req.user!.id, String(currentPassword), String(newPassword), { ip: clientIp });
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({ success: true, message: 'Furahaaga sirta ah si guul leh ayaa loo beddelay!' });
  });

  // ----------------- USER MANAGEMENT API (ADMIN ONLY) -----------------

  app.get('/api/users', requireAdmin, (_req, res) => {
    const users = getUsers();
    res.json({ success: true, data: users });
  });

  app.post('/api/users', requireAdmin, (req: AuthenticatedRequest, res) => {
    const clientIp = getClientIp(req);
    const result = createUser(req.body, req.user!, clientIp);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.status(201).json({ success: true, message: 'Isticmaalaha cusub si guul leh ayaa loo abuuray!', user: result.user });
  });

  app.put('/api/users/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    const clientIp = getClientIp(req);
    const id = Number(req.params.id);
    const result = updateUser(id, req.body, req.user!, clientIp);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json({ success: true, message: 'Xogta isticmaalaha waa la cusboonaysiiyay!', user: result.user });
  });

  app.post('/api/users/:id/reset-password', requireAdmin, (req: AuthenticatedRequest, res) => {
    const clientIp = getClientIp(req);
    const id = Number(req.params.id);
    const { newPassword } = req.body;
    const result = resetUserPassword(id, String(newPassword || ''), req.user!, clientIp);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json({ success: true, message: 'Furaha isticmaalaha si guul leh ayaa dib loogu dejiyay!' });
  });

  app.delete('/api/users/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    const clientIp = getClientIp(req);
    const id = Number(req.params.id);
    const result = deleteUser(id, req.user!, clientIp);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json({ success: true, message: 'Isticmaalaha waa laga tirtiray nidaamka!' });
  });

  // ----------------- AUDIT LOGS API (ADMIN ONLY) -----------------

  app.get('/api/audit-logs', requireAdmin, (req, res) => {
    const { action, search, limit, offset } = req.query;
    const result = getAuditLogs({
      action: action ? String(action) : undefined,
      search: search ? String(search) : undefined,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
    res.json({ success: true, data: result.logs, total: result.total });
  });

  // ----------------- PROTECTED ACCOUNTING ENDPOINTS -----------------

  // Partners (Protected)
  app.get('/api/partners', requireAuth, (_req, res) => {
    const partners = getPartners();
    res.json({ success: true, data: partners });
  });

  // Phones Inventory (Protected)
  app.get('/api/phones', requireAuth, (req, res) => {
    const { partnerId, status, search, imei } = req.query;
    const phones = getPhones({
      partnerId: partnerId ? Number(partnerId) : undefined,
      status: status ? String(status) : undefined,
      search: search ? String(search) : undefined,
      imei: imei ? String(imei) : undefined,
    });
    res.json({ success: true, data: phones, count: phones.length });
  });

  app.get('/api/phones/:id', requireAuth, (req, res) => {
    const phone = getPhoneById(req.params.id);
    if (!phone) {
      return res.status(404).json({ success: false, error: 'Teleefankan lama helin!' });
    }
    res.json({ success: true, data: phone });
  });

  // Purchase / Add Phone (Protected)
  app.post('/api/phones', requireAuth, (req, res) => {
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

  // Update Phone (Protected)
  app.put('/api/phones/:id', requireAuth, (req, res) => {
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

  // Sell Phone (Protected)
  app.post('/api/phones/:id/sell', requireAuth, (req, res) => {
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

  // Delete Phone (Protected)
  app.delete('/api/phones/:id', requireAuth, (req, res) => {
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

  // Expenses (Protected)
  app.get('/api/expenses', requireAuth, (_req, res) => {
    const expenses = getExpenses();
    res.json({ success: true, data: expenses });
  });

  app.post('/api/expenses', requireAuth, (req, res) => {
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

  app.delete('/api/expenses/:id', requireAuth, (req, res) => {
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

  // Withdrawals (Protected)
  app.get('/api/withdrawals', requireAuth, (_req, res) => {
    const withdrawals = getWithdrawals();
    res.json({ success: true, data: withdrawals });
  });

  app.post('/api/withdrawals', requireAuth, (req, res) => {
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

  // Transactions Ledger (Protected)
  app.get('/api/transactions', requireAuth, (req, res) => {
    const { type, partnerId } = req.query;
    const transactions = getTransactions({
      type: type ? String(type) : undefined,
      partnerId: partnerId ? Number(partnerId) : undefined,
    });
    res.json({ success: true, data: transactions, count: transactions.length });
  });

  // Accounting Summary (Protected)
  app.get('/api/accounting/summary', requireAuth, (_req, res) => {
    const summary = getDatabaseSummary();
    res.json({ success: true, data: summary });
  });

  // Audit Metrics (Protected)
  app.get('/api/audit', requireAuth, (_req, res) => {
    const health = checkDatabaseHealth();
    const summary = getDatabaseSummary();
    const phones = getPhones();
    const transactions = getTransactions();
    const expenses = getExpenses();
    const withdrawals = getWithdrawals();
    const partners = getPartners();
    const users = getUsers();

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
          users: users.length,
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

  // ----------------- ADMIN ONLY DATABASE OPERATIONS -----------------

  app.get('/api/database/backups', requireAdmin, (_req, res) => {
    const backups = listDatabaseBackups();
    res.json({ success: true, data: backups, count: backups.length });
  });

  app.post('/api/database/backup', requireAdmin, (_req, res) => {
    const result = createDatabaseBackup();
    if (result.success) {
      res.json({ success: true, message: 'Database backup created successfully', backup: result });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  });

  app.post('/api/reset', requireAdmin, (_req, res) => {
    seedInitialAccountingData();
    const summary = getDatabaseSummary();
    res.json({
      success: true,
      message: 'Database-ka waxaa dib loogu celiyay tijaabadii asalka ahayd (Zakariye $50, Shariif $80)!',
      summary,
    });
  });

  // ----------------- PUBLIC DATABASE HEALTH CHECK -----------------
  // Safe for Nginx / uptime monitors (exposes health status without sensitive data)
  app.get('/api/database/health', (_req, res) => {
    const health = checkDatabaseHealth();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json({ success: health.status === 'healthy', health });
  });

  // ----------------- FRONTEND SERVING -----------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Express server running on http://${HOST}:${PORT} with persistent SQLite database at ${DB_PATH}`);
  });
}

startServer();
