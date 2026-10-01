import { initDatabase, setupInitialUsers, checkDatabaseHealth, getUsers } from './database.ts';

async function main() {
  console.log('====================================================');
  console.log('PHONE TRADING HUB - DATABASE SETUP & INITIALIZATION');
  console.log('====================================================');

  console.log('1. Initializing SQLite tables and indexes...');
  initDatabase();

  console.log('2. Setting up administrator and system accounts...');
  setupInitialUsers();

  const health = checkDatabaseHealth();
  const users = getUsers();

  console.log('\n================== SETUP STATUS ====================');
  console.log(`Database Path:       ${health.databasePath}`);
  console.log(`Integrity Check:     ${health.integrity}`);
  console.log(`Journal Mode:        ${health.journalMode}`);
  console.log(`Foreign Keys:        ${health.foreignKeys ? 'ON (Active)' : 'OFF'}`);
  console.log(`Directory Writable:  ${health.dataDirWritable ? 'YES' : 'NO'}`);
  console.log(`Database Health:     ${health.status.toUpperCase()}`);

  console.log('\n================ ACTIVE ACCOUNTS ===================');
  users.forEach((u) => {
    console.log(`  - [${u.role.toUpperCase()}] ${u.username.padEnd(12)} | ${u.fullName} (Active: ${u.isActive ? 'YES' : 'NO'})`);
  });

  console.log('\n================ ACCOUNTING TABLES =================');
  for (const [table, count] of Object.entries(health.tables)) {
    console.log(`  - ${table.padEnd(16)}: ${count} records`);
  }

  console.log('\n[SUCCESS] Production setup complete. Existing financial records preserved.');
  console.log('====================================================');
  process.exit(0);
}

main().catch((err) => {
  console.error('[SETUP FATAL ERROR]:', err);
  process.exit(1);
});
