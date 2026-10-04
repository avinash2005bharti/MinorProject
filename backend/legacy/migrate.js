require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { sequelize, connectPostgres } = require('../config/postgres');

const runMigrations = async () => {
  console.log('[Migration] Initializing database migration pipeline...');
  try {
    await connectPostgres();
    const dialect = sequelize.getDialect();
    console.log(`[Migration] Running migrations against dialect: ${dialect.toUpperCase()}`);

    if (dialect === 'postgres') {
      // 1. Ensure migrations tracking table exists
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          name VARCHAR(255) PRIMARY KEY,
          applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 2. Fetch applied migrations
      const [appliedRows] = await sequelize.query(`SELECT name FROM schema_migrations;`);
      const appliedSet = new Set(appliedRows.map((r) => r.name));

      // 3. Read migration directory
      const migrationsDir = __dirname;
      const files = fs.readdirSync(migrationsDir)
        .filter((f) => f.endsWith('.sql') || (f.endsWith('.js') && f !== 'migrate.js'))
        .sort();

      for (const file of files) {
        if (appliedSet.has(file)) {
          console.log(`[Migration] Skipped (already applied): ${file}`);
          continue;
        }

        console.log(`[Migration] Applying pending migration: ${file}...`);
        const filePath = path.join(migrationsDir, file);

        if (file.endsWith('.sql')) {
          const sql = fs.readFileSync(filePath, 'utf-8');
          const transaction = await sequelize.transaction();
          try {
            await sequelize.query(sql, { transaction });
            await sequelize.query(
              `INSERT INTO schema_migrations (name, applied_at) VALUES (:name, CURRENT_TIMESTAMP);`,
              { replacements: { name: file }, transaction }
            );
            await transaction.commit();
            console.log(`[Migration] Successfully applied: ${file}`);
          } catch (err) {
            await transaction.rollback();
            console.error(`[Migration] Error applying ${file}: ${err.message}`);
            throw err;
          }
        } else if (file.endsWith('.js')) {
          const migrationModule = require(filePath);
          if (typeof migrationModule.up === 'function') {
            const transaction = await sequelize.transaction();
            try {
              await migrationModule.up(sequelize.getQueryInterface(), sequelize.Sequelize, transaction);
              await sequelize.query(
                `INSERT INTO schema_migrations (name, applied_at) VALUES (:name, CURRENT_TIMESTAMP);`,
                { replacements: { name: file }, transaction }
              );
              await transaction.commit();
              console.log(`[Migration] Successfully applied JS migration: ${file}`);
            } catch (err) {
              await transaction.rollback();
              console.error(`[Migration] Error executing ${file}: ${err.message}`);
              throw err;
            }
          }
        }
      }
    } else {
      // In SQLite dev fallback mode, sync models directly
      console.log('[Migration] Syncing models for local development SQLite fallback...');
      const models = require('../models/postgres');
      await sequelize.sync();
      console.log('[Migration] SQLite development tables synchronized successfully.');
    }

    console.log('[Migration] Database schema is fully up to date.');

    if (require.main === module) {
      process.exit(0);
    }
  } catch (error) {
    console.error(`[Migration Fatal Error]: ${error.message}`);
    if (require.main === module) {
      process.exit(1);
    }
    throw error;
  }
};

if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
