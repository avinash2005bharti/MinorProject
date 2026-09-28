const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

const dbUrl = process.env.MYSQL_DATABASE_URL;
const host = process.env.MYSQL_HOST;
const port = process.env.MYSQL_PORT || 3306;
const database = process.env.MYSQL_DATABASE || 'cse_erp';
const username = process.env.MYSQL_USER || 'root';
const password = process.env.MYSQL_PASSWORD || '';

// If MYSQL_DATABASE_URL is provided, USE_MYSQL is true, or MYSQL_HOST is set, connect to MySQL
const useRealMySQL = Boolean(dbUrl) || process.env.USE_MYSQL === 'true' || (host && host !== 'localhost' && host !== '127.0.0.1');

let sequelize;

if (dbUrl) {
  sequelize = new Sequelize(dbUrl, {
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else if (useRealMySQL) {
  sequelize = new Sequelize(database, username, password, {
    host: host || 'localhost',
    port,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else {
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

const connectMySQL = async () => {
  try {
    await sequelize.authenticate();
    const dialect = sequelize.getDialect();
    console.log(`[Database] Relational DB connected successfully using dialect: ${dialect}`);
    return sequelize;
  } catch (err) {
    console.error(`[Database] Relational DB connection error: ${err.message}`);
    throw err;
  }
};

module.exports = {
  sequelize,
  connectMySQL
};
