import { initDatabase, seedInitialAccountingData, checkDatabaseHealth } from './database.ts';

async function main() {
  console.log('====================================================');
  console.log('MANUAL DATABASE SEEDING UTILITY (TEST DATA)');
  console.log('====================================================');
  console.log('[WARNING] This will reset sample accounting records to baseline.');

  initDatabase();
  seedInitialAccountingData();

  const health = checkDatabaseHealth();
  console.log(`[SEED COMPLETE] Database seeded at ${health.databasePath}`);
  console.log(`Phones: ${health.totalPhones} | Transactions: ${health.totalTransactions}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('[FATAL]:', err);
  process.exit(1);
});
