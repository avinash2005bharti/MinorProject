// ============================================================================
// PostgreSQL + Prisma Client Connection Service
// Single Source of Truth for Structured Relational ERP Data
// ============================================================================

const { PrismaClient } = require('@prisma/client');
const dns = require('dns');

// ARCH-04: Opt-in custom DNS servers instead of unconditional hardcoding
if (process.env.CUSTOM_DNS_SERVERS) {
  try {
    const servers = process.env.CUSTOM_DNS_SERVERS.split(',').map(s => s.trim()).filter(Boolean);
    if (servers.length > 0) {
      dns.setServers(servers);
    }
  } catch (dnsErr) {}
}

let dbUrl = process.env.DATABASE_URL || '';
if (dbUrl && !dbUrl.includes('sslmode=') && (dbUrl.includes('render.com') || process.env.DB_SSL === 'true')) {
  dbUrl += (dbUrl.includes('?') ? '&' : '?') + 'sslmode=require';
}
// Pool tuning: optimize concurrent parallel queries to cloud database
if (dbUrl && !dbUrl.includes('connection_limit=')) {
  dbUrl += (dbUrl.includes('?') ? '&' : '?') + 'connection_limit=15&pool_timeout=20';
}

// Single PrismaClient instance for connection pooling and resource management
const prisma = new PrismaClient({
  datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
});

// Periodic keep-alive ping every 45 seconds to prevent Render PostgreSQL cold-connect penalty (2.7s)
let keepAliveTimer = null;
const startKeepAlive = () => {
  if (keepAliveTimer) return;
  keepAliveTimer = setInterval(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (e) {
      // Background ping failure ignored
    }
  }, 45000);
  if (keepAliveTimer.unref) keepAliveTimer.unref();
};
startKeepAlive();

let isPostgresConnected = false;

const connectPostgres = async (retries = 6, delay = 3000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Execute raw ping to verify PostgreSQL connectivity through Prisma
      await prisma.$queryRaw`SELECT 1`;
      isPostgresConnected = true;
      const maskedHost = dbUrl.includes('@') ? dbUrl.split('@')[1].split('/')[0] : 'localhost';
      console.log(`[PostgreSQL + Prisma] Connected successfully to Relational ERP Database (Host: ${maskedHost})`);
      return prisma;
    } catch (err) {
      console.warn(`[PostgreSQL + Prisma] Connection attempt ${attempt}/${retries} failed: ${err.message}`);
      if (attempt < retries) {
        await new Promise((res) => setTimeout(res, delay));
      } else {
        console.error(`[PostgreSQL + Prisma] Fatal connection failure: ${err.message}`);
        throw err;
      }
    }
  }
};

const getPostgresHealth = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'UP',
      connected: true,
      database: 'PostgreSQL (Prisma ORM)',
      role: 'Structured Relational ERP Source of Truth'
    };
  } catch (err) {
    return {
      status: 'DOWN',
      connected: false,
      database: 'PostgreSQL (Prisma ORM)',
      role: 'Structured Relational ERP Source of Truth',
      error: err.message
    };
  }
};

const disconnectPostgres = async () => {
  await prisma.$disconnect();
  isPostgresConnected = false;
};

module.exports = {
  prisma,
  connectPostgres,
  connectDB: connectPostgres,
  getPostgresHealth,
  disconnectPostgres
};
