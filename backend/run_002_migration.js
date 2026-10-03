require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { sequelize } = require('./src/config/postgres');

async function run() {
  console.log('[Migration] Connecting to PostgreSQL at:', process.env.PGHOST);
  await sequelize.authenticate();
  console.log('[Migration] Authenticated. Reading 002 migration script...');
  const sql = fs.readFileSync(path.join(__dirname, 'src/migrations/002_normalized_core_erd_schema.sql'), 'utf8');

  // Split statements by semicolon and execute each
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    try {
      await sequelize.query(statement + ';');
    } catch (err) {
      console.warn('[FAILED STATEMENT]:\n', statement.slice(0, 100), '...\nError:', err.message);
    }
  }

  console.log('[Migration] 002 execution completed.');
  const [rows] = await sequelize.query("SELECT tablename FROM pg_tables WHERE schemaname='public'");
  console.log('Total tables in public schema:', rows.length);
  console.log('Tables:', rows.map(r => r.tablename).sort());
}

run().catch(console.error).finally(() => process.exit(0));
