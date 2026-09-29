import { checkDatabaseHealth } from './database.ts';

async function main() {
  console.log('====================================================');
  console.log('SQLITE PRODUCTION DATABASE HEALTH CHECK');
  console.log('====================================================');

  const health = checkDatabaseHealth();
  console.log(`Database Path:       ${health.databasePath}`);
  console.log(`Storage Dir:         ${health.dataDir} (Writable: ${health.dataDirWritable})`);
  console.log(`Integrity Check:     ${health.integrity}`);
  console.log(`Journal Mode:        ${health.journalMode}`);
  console.log(`Foreign Keys:        ${health.foreignKeys ? 'Enabled (ON)' : 'Disabled'}`);
  console.log(`Database Size:       ${(health.dbSizeBytes / 1024).toFixed(2)} KB`);
  console.log(`Phones in DB:        ${health.totalPhones}`);
  console.log(`Transactions in DB:  ${health.totalTransactions}`);
  console.log('\nTable Record Counts:');
  for (const [table, count] of Object.entries(health.tables)) {
    console.log(`  - ${table.padEnd(16)}: ${count}`);
  }
  console.log(`\nOverall Health:      ${health.status === 'healthy' ? '[OK] HEALTHY' : '[FAIL] UNHEALTHY'}`);
  console.log('====================================================');

  process.exit(health.status === 'healthy' ? 0 : 1);
}

main().catch((err) => {
  console.error('[FATAL]:', err);
  process.exit(1);
});
