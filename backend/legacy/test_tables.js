require('dotenv').config();
const { sequelize } = require('./src/config/postgres');

async function test() {
  const [rows] = await sequelize.query("SELECT tablename FROM pg_tables WHERE schemaname='public'");
  console.log('Tables in public:', rows.map(r => r.tablename).sort());
}

test().catch(console.error).finally(() => process.exit(0));
