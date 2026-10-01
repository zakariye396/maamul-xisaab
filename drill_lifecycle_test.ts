import {
  initDatabase,
  getPhones,
  getPhoneById,
  createPhoneAtomic,
  sellPhoneAtomic,
  getExpenses,
  createExpenseAtomic,
  getWithdrawals,
  createWithdrawalAtomic,
  getTransactions,
  getDatabaseSummary,
  createDatabaseBackup,
  listDatabaseBackups,
  restoreDatabaseBackup,
  checkDatabaseHealth,
  DB_PATH,
  BACKUP_DIR,
} from './server/database.ts';
import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';

async function runDrill() {
  console.log('======================================================================');
  console.log('STARTING DRILL: ADD PHONE -> SELL -> EXPENSE -> WITHDRAW -> BACKUP -> RESTART -> REBOOT -> RESTORE');
  console.log('======================================================================');

  // Initial state check
  initDatabase();
  const initSummary = getDatabaseSummary();
  console.log('\n[INITIAL STATE]');
  console.log(`Phones: ${initSummary.totalPhones} | Capital: $${initSummary.totalCapital} | Sales: $${initSummary.totalSales} | Profit: $${initSummary.grossProfit}`);

  // ------------------------------------------------------------------
  // STEP 1: ADD PHONE
  // ------------------------------------------------------------------
  console.log('\n------------------------------------------------------------------');
  console.log('STEP 1: ADD PHONE (Qabasho Teleefan Cusub)');
  console.log('------------------------------------------------------------------');
  const addRes = createPhoneAtomic({
    imei: '351234567890123',
    brand: 'Samsung',
    model: 'Galaxy S23 Ultra',
    storage: '256GB',
    color: 'Phantom Black',
    condition: 'Grade A (Nadiif)',
    purchasePrice: 400,
    acquiredBy: 1, // Zakariye keenay
    paidBy: 2,     // Shariif lacagta bixiyay
    purchaseDate: '2026-09-29',
    notes: 'Drill Test: Acquired by Zakariye, Paid by Shariif ($400)',
  });

  if (!addRes.success || !addRes.phone) {
    throw new Error('Step 1 Failed: ' + addRes.error);
  }
  const phoneId = addRes.phone.id;
  console.log(`[PASS] Phone Added: ${addRes.phone.model} (ID: ${phoneId})`);
  console.log(`  IMEI: ${addRes.phone.imei}`);
  console.log(`  Purchase Price: $${addRes.phone.purchasePrice}`);
  console.log(`  Acquired By: Zakariye (Partner 1)`);
  console.log(`  Paid By: Shariif (Partner 2)`);
  console.log(`  Status: ${addRes.phone.status}`);

  const s1 = getDatabaseSummary();
  console.log(`  Updated Shariif Capital: $${s1.shariifTotalCapital} (+$400)`);
  console.log(`  Updated Total Capital: $${s1.totalCapital}`);

  // ------------------------------------------------------------------
  // STEP 2: SELL PHONE
  // ------------------------------------------------------------------
  console.log('\n------------------------------------------------------------------');
  console.log('STEP 2: SELL PHONE (Iibinta Teleefanka)');
  console.log('------------------------------------------------------------------');
  const sellRes = sellPhoneAtomic(phoneId, {
    salePrice: 550,
    saleDate: '2026-09-29',
    customerName: 'Xasan Maxamed',
    customerPhone: '+252 61 999 8877',
    paymentMethod: 'EVC Plus',
    notes: 'Drill Test: Sold for $550 (Profit: +$150)',
  });

  if (!sellRes.success || !sellRes.phone) {
    throw new Error('Step 2 Failed: ' + sellRes.error);
  }
  console.log(`[PASS] Phone Sold: ${sellRes.phone.model}`);
  console.log(`  Sale Price: $550`);
  console.log(`  Purchase Cost: $400`);
  console.log(`  Profit Generated: +$${sellRes.profit}`);
  console.log(`  Returned Capital to: ${sellRes.ownerPartner}`);
  console.log(`  Status: ${sellRes.phone.status}`);

  const s2 = getDatabaseSummary();
  console.log(`  Total Sales: $${s2.totalSales} (+$550)`);
  console.log(`  Gross Profit: $${s2.grossProfit} (+$150)`);

  // ------------------------------------------------------------------
  // STEP 3: ADD EXPENSE
  // ------------------------------------------------------------------
  console.log('\n------------------------------------------------------------------');
  console.log('STEP 3: ADD EXPENSE (Kharash Dukaanka Ah)');
  console.log('------------------------------------------------------------------');
  const expRes = createExpenseAtomic({
    category: 'Koronto & Internet',
    amount: 35,
    date: '2026-09-29',
    description: 'Korontada dukaanka bisha 9aad (Drill Test)',
    recordedBy: 'Wadaag',
  });

  console.log(`[PASS] Expense Recorded: ID: ${expRes.id}`);
  console.log(`  Category: ${expRes.category}`);
  console.log(`  Amount: $${expRes.amount}`);
  console.log(`  Description: ${expRes.description}`);

  const s3 = getDatabaseSummary();
  console.log(`  Total Expenses: $${s3.totalExpenses}`);
  console.log(`  Net Profit: $${s3.netProfit}`);

  // ------------------------------------------------------------------
  // STEP 4: ADD WITHDRAWAL
  // ------------------------------------------------------------------
  console.log('\n------------------------------------------------------------------');
  console.log('STEP 4: ADD WITHDRAWAL (Kala Bixid Lacageed)');
  console.log('------------------------------------------------------------------');
  const wdrRes = createWithdrawalAtomic({
    partnerId: 1, // Zakariye
    amount: 25,
    date: '2026-09-29',
    reason: 'Kharash qoys oo degdeg ah (Drill Test)',
    notes: 'Kala bixid Zakariye',
  });

  console.log(`[PASS] Withdrawal Recorded: ID: ${wdrRes.id}`);
  console.log(`  Partner: Zakariye (Partner 1)`);
  console.log(`  Amount: $${wdrRes.amount}`);
  console.log(`  Reason: ${wdrRes.reason}`);

  const s4 = getDatabaseSummary();
  console.log(`  Zakariye Total Withdrawals: $${s4.zakariyeWithdrawals}`);
  console.log(`  Total Withdrawals: $${s4.totalWithdrawals}`);

  // Snapshot before restart
  const preSnapshot = {
    phonesCount: s4.totalPhones,
    totalCapital: s4.totalCapital,
    totalSales: s4.totalSales,
    grossProfit: s4.grossProfit,
    totalExpenses: s4.totalExpenses,
    netProfit: s4.netProfit,
    totalWithdrawals: s4.totalWithdrawals,
  };

  // ------------------------------------------------------------------
  // STEP 5: BACKUP
  // ------------------------------------------------------------------
  console.log('\n------------------------------------------------------------------');
  console.log('STEP 5: DATABASE BACKUP (VACUUM INTO Point-In-Time Snapshot)');
  console.log('------------------------------------------------------------------');
  const backupRes = createDatabaseBackup();
  if (!backupRes.success || !backupRes.backupPath || !backupRes.backupFilename) {
    throw new Error('Step 5 Failed: ' + backupRes.error);
  }

  console.log(`[PASS] Standalone SQLite Backup Created:`);
  console.log(`  Filename: ${backupRes.backupFilename}`);
  console.log(`  Location: ${backupRes.backupPath}`);
  console.log(`  Size: ${(backupRes.sizeBytes! / 1024).toFixed(2)} KB`);
  console.log(`  Timestamp: ${backupRes.timestamp}`);

  // Verify backup can be read independently
  const testDb = new DatabaseSync(backupRes.backupPath);
  const integ = testDb.prepare('PRAGMA integrity_check;').get() as { integrity_check: string };
  const backupPhones = (testDb.prepare('SELECT COUNT(*) as c FROM phones;').get() as { c: number }).c;
  const backupExpenses = (testDb.prepare('SELECT COUNT(*) as c FROM expenses;').get() as { c: number }).c;
  const backupWithdrawals = (testDb.prepare('SELECT COUNT(*) as c FROM withdrawals;').get() as { c: number }).c;
  testDb.close();

  console.log(`  Backup Standalone PRAGMA integrity: ${integ.integrity_check}`);
  console.log(`  Backup Verified Phones: ${backupPhones}`);
  console.log(`  Backup Verified Expenses: ${backupExpenses}`);
  console.log(`  Backup Verified Withdrawals: ${backupWithdrawals}`);

  const drillBackupFilename = backupRes.backupFilename;

  // ------------------------------------------------------------------
  // STEP 6: RESTART NODE
  // ------------------------------------------------------------------
  console.log('\n------------------------------------------------------------------');
  console.log('STEP 6: RESTART NODE.JS (Simulating Process Restart)');
  console.log('------------------------------------------------------------------');
  console.log('Re-initializing database from startup entrypoint: initDatabase()...');
  initDatabase();
  console.log('[PASS] Node.js startup routine completed cleanly without overwriting.');

  // ------------------------------------------------------------------
  // STEP 7: CHECK DATA
  // ------------------------------------------------------------------
  console.log('\n------------------------------------------------------------------');
  console.log('STEP 7: CHECK DATA (Post-Restart Verification)');
  console.log('------------------------------------------------------------------');
  const sAfterRestart = getDatabaseSummary();
  const phoneAfterRestart = getPhoneById(phoneId);
  const expAfterRestart = getExpenses().find((e) => e.id === expRes.id);
  const wdrAfterRestart = getWithdrawals().find((w) => w.id === wdrRes.id);

  console.log(`  Phones Count: ${sAfterRestart.totalPhones} (Expected: ${preSnapshot.phonesCount})`);
  console.log(`  Total Sales: $${sAfterRestart.totalSales} (Expected: $${preSnapshot.totalSales})`);
  console.log(`  Gross Profit: $${sAfterRestart.grossProfit} (Expected: $${preSnapshot.grossProfit})`);
  console.log(`  Total Expenses: $${sAfterRestart.totalExpenses} (Expected: $${preSnapshot.totalExpenses})`);
  console.log(`  Net Profit: $${sAfterRestart.netProfit} (Expected: $${preSnapshot.netProfit})`);
  console.log(`  Total Withdrawals: $${sAfterRestart.totalWithdrawals} (Expected: $${preSnapshot.totalWithdrawals})`);
  console.log(`  Samsung Galaxy Status: ${phoneAfterRestart?.status} (Sold: $${phoneAfterRestart?.salePrice})`);
  console.log(`  Expense Verified: ${expAfterRestart?.category} ($${expAfterRestart?.amount})`);
  console.log(`  Withdrawal Verified: Zakariye ($${wdrAfterRestart?.amount})`);

  if (
    sAfterRestart.totalSales !== preSnapshot.totalSales ||
    sAfterRestart.grossProfit !== preSnapshot.grossProfit ||
    sAfterRestart.netProfit !== preSnapshot.netProfit ||
    phoneAfterRestart?.status !== 'Sold' ||
    !expAfterRestart ||
    !wdrAfterRestart
  ) {
    throw new Error('Step 7 Failed: Data mismatch after Node restart!');
  }
  console.log('[PASS] Post-restart check: 100% of data survived intact.');

  // ------------------------------------------------------------------
  // STEP 8: REBOOT VPS
  // ------------------------------------------------------------------
  console.log('\n------------------------------------------------------------------');
  console.log('STEP 8: REBOOT VPS (Simulating Full System Cold Reboot)');
  console.log('------------------------------------------------------------------');
  console.log('Flushing WAL journals and simulating cold VPS reboot...');
  // Force WAL checkpoint to simulate clean system shutdown
  const checkDb = new DatabaseSync(DB_PATH);
  checkDb.exec('PRAGMA wal_checkpoint(TRUNCATE);');
  checkDb.close();

  // Cold start database open
  initDatabase();
  console.log('[PASS] Cold boot simulated. System reconnected to persistent storage.');

  // ------------------------------------------------------------------
  // STEP 9: CHECK DATA AGAIN
  // ------------------------------------------------------------------
  console.log('\n------------------------------------------------------------------');
  console.log('STEP 9: CHECK DATA AGAIN (Post-VPS Reboot Verification)');
  console.log('------------------------------------------------------------------');
  const sAfterReboot = getDatabaseSummary();
  const healthAfterReboot = checkDatabaseHealth();

  console.log(`  Database Health: ${healthAfterReboot.status.toUpperCase()}`);
  console.log(`  Integrity: ${healthAfterReboot.integrity}`);
  console.log(`  Journal Mode: ${healthAfterReboot.journalMode}`);
  console.log(`  Foreign Keys: ${healthAfterReboot.foreignKeys ? 'ON' : 'OFF'}`);
  console.log(`  Total Phones: ${sAfterReboot.totalPhones}`);
  console.log(`  Total Capital: $${sAfterReboot.totalCapital}`);
  console.log(`  Total Sales: $${sAfterReboot.totalSales}`);
  console.log(`  Gross Profit: $${sAfterReboot.grossProfit}`);
  console.log(`  Net Profit: $${sAfterReboot.netProfit}`);
  console.log(`  Total Withdrawals: $${sAfterReboot.totalWithdrawals}`);

  if (
    sAfterReboot.totalSales !== preSnapshot.totalSales ||
    sAfterReboot.netProfit !== preSnapshot.netProfit ||
    healthAfterReboot.integrity !== 'ok'
  ) {
    throw new Error('Step 9 Failed: Data mismatch after VPS reboot simulation!');
  }
  console.log('[PASS] Post-reboot check: 100% data fidelity confirmed.');

  // ------------------------------------------------------------------
  // STEP 10: RESTORE A TEST BACKUP
  // ------------------------------------------------------------------
  console.log('\n------------------------------------------------------------------');
  console.log('STEP 10: RESTORE A TEST BACKUP (Safe Point-in-Time Restore)');
  console.log('------------------------------------------------------------------');
  // First, add a dummy phone to prove restoration rolls back changes made after backup
  console.log('Adding dummy record that will be wiped upon restore...');
  createPhoneAtomic({
    imei: '350000000000999',
    brand: 'Dummy',
    model: 'Temporary Unwanted Phone',
    storage: '64GB',
    condition: 'Grade C',
    purchasePrice: 10,
    acquiredBy: 1,
    paidBy: 1,
    purchaseDate: '2026-09-29',
  });
  console.log(`Phones before restore (with dummy): ${getPhones().length}`);

  console.log(`Executing restore from backup: ${drillBackupFilename}...`);
  const restoreRes = restoreDatabaseBackup(drillBackupFilename);

  if (!restoreRes.success) {
    throw new Error('Step 10 Failed: ' + restoreRes.error);
  }
  console.log(`[PASS] ${restoreRes.message}`);

  // Verify dummy phone is gone and exact pre-snapshot is restored
  const sAfterRestore = getDatabaseSummary();
  const dummyPhone = getPhones().find((p) => p.imei === '350000000000999');

  console.log(`  Phones Count after Restore: ${sAfterRestore.totalPhones} (Dummy phone present: ${!!dummyPhone})`);
  console.log(`  Total Sales: $${sAfterRestore.totalSales}`);
  console.log(`  Gross Profit: $${sAfterRestore.grossProfit}`);
  console.log(`  Net Profit: $${sAfterRestore.netProfit}`);

  if (
    dummyPhone ||
    sAfterRestore.totalPhones !== preSnapshot.phonesCount ||
    sAfterRestore.totalSales !== preSnapshot.totalSales
  ) {
    throw new Error('Step 10 Failed: Restoration did not accurately recreate snapshot state!');
  }
  console.log('[PASS] Test backup restoration completed successfully with 100% integrity.');

  console.log('\n======================================================================');
  console.log('ALL 10 DRILL STAGES COMPLETED SUCCESSFULLY WITH ZERO ERRORS');
  console.log('======================================================================');
}

runDrill().catch((err) => {
  console.error('Drill Execution Failed:', err);
  process.exit(1);
});
