const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');

const { connectMongo, getMongoHealth } = require('./config/mongo');
const { connectPostgres, getPostgresHealth } = require('./config/postgres');
const { connectQdrant, getQdrantHealth } = require('./config/qdrant');
const { setupSwagger } = require('./config/swagger');
const { initSocket } = require('./sockets/socketHandler');
const { logger } = require('./services/loggerService');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes/index');
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with cloud origin support
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((s) => s.trim())
  : [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000'
    ];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins.length === 1 && allowedOrigins[0] === '*' ? '*' : allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
  }
});
initSocket(io);

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false // Allow loading static uploads
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || true,
  credentials: true
}));

// Winston Request Logger
app.use(requestLogger);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', limiter);

// Parsing
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static uploads directory
const uploadPath = process.env.UPLOAD_PATH || path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadPath));

// Swagger Documentation
setupSwagger(app);

// Mount API routes (Both /api and /api/v1 for versioning)
app.use('/api/v1', routes);
app.use('/api', routes);

// Welcome / Root route
app.get('/', (req, res) => {
  res.json({
    department: 'Computer Science & Engineering (CSE)',
    system: 'CSE Department AI Agentic ERP Backend',
    version: '2.0.0',
    architecture: {
      relational: 'PostgreSQL + Prisma ORM (Source of Truth)',
      application: 'MongoDB + Mongoose (User Data & LLM STM)',
      vector: 'Qdrant (LLM LTM & RAG Knowledge)'
    },
    documentation: '/api-docs',
    health: '/api/health',
    databases: '/api/health/databases',
    status: 'Running'
  });
});

// Database Architecture Health Endpoint
app.get('/api/health/databases', async (req, res) => {
  const [pgHealth, mongoHealth, qdrantHealth] = await Promise.all([
    getPostgresHealth(),
    getMongoHealth(),
    getQdrantHealth()
  ]);

  const coreHealthy = pgHealth.status === 'UP' && mongoHealth.status === 'UP';

  res.status(coreHealthy ? 200 : 503).json({
    status: coreHealthy ? (qdrantHealth.status === 'UP' ? 'HEALTHY' : 'DEGRADED') : 'UNHEALTHY',
    timestamp: new Date().toISOString(),
    databases: {
      postgres: pgHealth,
      mongodb: mongoHealth,
      qdrant: qdrantHealth
    }
  });
});

// Centralized Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Start Server after validating all three database layers
const startServer = async () => {
  try {
    console.log('\n======================================================');
    console.log('  CAMPUSFLOW ERP - DATABASE ARCHITECTURE VALIDATION  ');
    console.log('======================================================');

    // 1. PostgreSQL (Prisma ORM) - Relational Source of Truth
    try {
      await connectPostgres();
      console.log('  [PostgreSQL + Prisma] : ✓ CONNECTED (Relational ERP Source of Truth)');
    } catch (pgErr) {
      console.warn(`  [PostgreSQL + Prisma] : ⚠️ INITIAL ATTEMPT FAILED - Retrying in background (${pgErr.message})`);
      setTimeout(() => connectPostgres().catch(() => {}), 5000);
    }

    // 2. MongoDB (Mongoose) - User/App Data & LLM STM
    try {
      await connectMongo();
      console.log('  [MongoDB + Mongoose]  : ✓ CONNECTED (User Data & LLM STM)');
    } catch (mErr) {
      console.error(`  [MongoDB + Mongoose]  : ✗ FAILED - ${mErr.message}`);
      throw mErr;
    }

    // 3. Qdrant Vector Database - LLM LTM & RAG
    try {
      const qOk = await connectQdrant();
      if (qOk) {
        console.log('  [Qdrant Vector DB]    : ✓ CONNECTED (LLM LTM & RAG Embeddings)');
      } else {
        console.warn('  [Qdrant Vector DB]    : ⚠️  UNAVAILABLE (Vector features in fallback mode)');
      }
    } catch (qErr) {
      console.warn(`  [Qdrant Vector DB]    : ⚠️  WARNING (${qErr.message}) - running fallback`);
    }

    console.log('======================================================\n');

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`[Server Error] Port ${PORT} is already in use by another process.`);
      } else {
        logger.error(`[Server Error]: ${err.message}`);
      }
      process.exit(1);
    });

    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`======================================================`);
      logger.info(`  CSE AGENTIC ERP BACKEND RUNNING ON PORT ${PORT} `);
      logger.info(`======================================================`);
      logger.info(`• Base API:       http://localhost:${PORT}/api`);
      logger.info(`• Database Health:http://localhost:${PORT}/api/health/databases`);
      logger.info(`• Swagger Docs:   http://localhost:${PORT}/api-docs`);
      logger.info(`• Static Uploads: http://localhost:${PORT}/uploads`);
      logger.info(`• Socket.IO:      ws://localhost:${PORT}`);
      logger.info(`======================================================`);
    });
  } catch (err) {
    logger.error(`[Server] Fatal startup error: ${err.message}`);
    process.exit(1);
  }
};

if (require.main === module || process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = { app, server, startServer };

