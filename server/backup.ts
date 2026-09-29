import { createDatabaseBackup, checkDatabaseHealth } from './database.ts';

async function main() {
  console.log('====================================================');
  console.log('SQLITE PRODUCTION DATABASE BACKUP UTILITY');
  console.log('====================================================');

  const health = checkDatabaseHealth();
  console.log(`Checking database health at: ${health.databasePath}`);
  console.log(`Integrity: ${health.integrity} | Mode: ${health.journalMode} | Tables: ${Object.keys(health.tables).length}`);

  if (health.status !== 'healthy') {
    console.error('[ERROR] Database is not healthy, aborting backup!');
    process.exit(1);
  }

  const result = createDatabaseBackup();
  if (result.success) {
    console.log(`[SUCCESS] Backup created successfully:`);
    console.log(`  File: ${result.backupFilename}`);
    console.log(`  Location: ${result.backupPath}`);
    console.log(`  Size: ${(result.sizeBytes! / 1024).toFixed(2)} KB`);
    console.log(`  Timestamp: ${result.timestamp}`);
    console.log('====================================================');
    process.exit(0);
  } else {
    console.error(`[FAILURE] Backup failed: ${result.error}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[FATAL]:', err);
  process.exit(1);
});
