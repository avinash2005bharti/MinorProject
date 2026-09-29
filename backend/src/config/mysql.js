const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

const dbUrl = process.env.MYSQL_DATABASE_URL || process.env.DATABASE_URL;
const host = process.env.MYSQL_HOST;
const port = parseInt(process.env.MYSQL_PORT, 10) || 3306;
const database = process.env.MYSQL_DATABASE || 'cse_erp';
const username = process.env.MYSQL_USER || 'root';
const password = process.env.MYSQL_PASSWORD || '';
const sslRequired = process.env.MYSQL_SSL === 'true' || (dbUrl && dbUrl.includes('ssl=true'));

const dialectOptions = sslRequired
  ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  : {};

// Explicitly use MySQL when MYSQL_DATABASE_URL, USE_MYSQL=true, or MYSQL_HOST is specified
const useRealMySQL =
  Boolean(dbUrl) ||
  process.env.USE_MYSQL === 'true' ||
  (host && host !== 'localhost' && host !== '127.0.0.1') ||
  process.env.NODE_ENV === 'production';

let sequelize;

if (dbUrl) {
  sequelize = new Sequelize(dbUrl, {
    dialect: 'mysql',
    dialectOptions,
    logging: false,
    pool: {
      max: 15,
      min: 1,
      acquire: 60000,
      idle: 10000
    }
  });
} else if (useRealMySQL) {
  sequelize = new Sequelize(database, username, password, {
    host: host || '127.0.0.1',
    port,
    dialect: 'mysql',
    dialectOptions,
    logging: false,
    pool: {
      max: 15,
      min: 1,
      acquire: 60000,
      idle: 10000
    }
  });
} else {
  // Local development / CI test fallback
  const dbDir = path.join(__dirname, '../../data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  const dbPath = path.join(dbDir, 'cse_erp.sqlite');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false
  });
}

const connectMySQL = async (retries = 3, delay = 2500) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await sequelize.authenticate();
      const dialect = sequelize.getDialect();
      console.log(`[Database] Relational DB connected successfully using dialect: ${dialect.toUpperCase()}`);

      if (dialect === 'mysql') {
        console.log(`[MySQL Workbench Connection Target]:`);
        console.log(`  • Host:     ${host || (dbUrl ? new URL(dbUrl).hostname : '127.0.0.1')}`);
        console.log(`  • Port:     ${port || (dbUrl ? new URL(dbUrl).port || 3306 : 3306)}`);
        console.log(`  • Database: ${database || (dbUrl ? new URL(dbUrl).pathname.replace('/', '') : 'cse_erp')}`);
        console.log(`  • User:     ${username || (dbUrl ? new URL(dbUrl).username : 'root')}`);
        if (sslRequired) console.log(`  • SSL:      Required (Use SSL Mode in MySQL Workbench)`);
      }
      return sequelize;
    } catch (err) {
      console.warn(`[Database] Connection attempt ${attempt}/${retries} failed: ${err.message}`);
      if (attempt < retries) {
        await new Promise((res) => setTimeout(res, delay));
      } else {
        // In local non-production environment, if real MySQL fails, fallback to local sqlite so tests/dev don't crash
        if (process.env.NODE_ENV !== 'production' && sequelize.getDialect() !== 'sqlite') {
          console.warn('[Database] MySQL server unreachable. Falling back to SQLite local storage for development/test mode.');
          const dbDir = path.join(__dirname, '../../data');
          if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
          sequelize = new Sequelize({
            dialect: 'sqlite',
            storage: path.join(dbDir, 'cse_erp.sqlite'),
            logging: false
          });
          await sequelize.authenticate();
          return sequelize;
        }
        console.error(`[Database] Fatal MySQL connection failure: ${err.message}`);
        throw err;
      }
    }
  }
};

module.exports = {
  sequelize,
  connectMySQL
};
