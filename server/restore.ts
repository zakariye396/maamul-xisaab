import { listDatabaseBackups, restoreDatabaseBackup, resolveDatabasePaths } from './database.ts';

async function main() {
  console.log('====================================================');
  console.log('SQLITE PRODUCTION DATABASE RESTORE UTILITY');
  console.log('====================================================');

  const args = process.argv.slice(2);
  const { backupDir, dbPath } = resolveDatabasePaths();
  const backups = listDatabaseBackups();

  if (backups.length === 0) {
    console.log(`No backups found in ${backupDir}.`);
    console.log('Run "npm run db:backup" first to create a database backup.');
    process.exit(0);
  }

  // Filter arguments
  const confirm = args.includes('--confirm');
  const targetFileArg = args.find((a) => !a.startsWith('--'));

  if (!targetFileArg || !confirm) {
    console.log(`Current Production Database: ${dbPath}`);
    console.log(`Available historical backups in ${backupDir}:`);
    backups.forEach((b, idx) => {
      console.log(`  [${idx + 1}] ${b.name} (${(b.sizeBytes / 1024).toFixed(2)} KB, ${b.createdAt})`);
    });

    console.log('\n[SAFETY GATE]: To prevent accidental data loss, restore requires explicit confirmation.');
    console.log('Usage:');
    console.log(`  npm run db:restore -- <backup-filename> --confirm\n`);
    console.log(`Example:`);
    console.log(`  npm run db:restore -- ${backups[backups.length - 1].name} --confirm\n`);
    process.exit(1);
  }

  console.log(`Target backup: ${targetFileArg}`);
  console.log(`Destination: ${dbPath}`);
  console.log('Executing verified restore...');

  const result = restoreDatabaseBackup(targetFileArg);
  if (result.success) {
    console.log(`[RESTORE SUCCESS]: ${result.message}`);
    process.exit(0);
  } else {
    console.error(`[RESTORE FAILED]: ${result.error}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[FATAL]:', err);
  process.exit(1);
});
