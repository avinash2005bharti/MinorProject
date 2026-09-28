require('dotenv').config();
const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');

const { connectDB } = require('./config/db');
const { connectMySQL } = require('./config/mysql');
const { setupSwagger } = require('./config/swagger');
const { initSocket } = require('./sockets/socketHandler');
const { logger } = require('./services/loggerService');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes/index');
const { User } = require('./models/mysql');
const seedCseDatabase = require('./utils/seedData');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: [
      process.env.CLIENT_URL || 'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000'
    ],
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
    documentation: '/api-docs',
    health: '/api/health',
    status: 'Running'
  });
});

// Centralized Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Start Server after connecting to MySQL and MongoDB
const startServer = async () => {
  try {
    // 1. Connect to Relational Database (MySQL with SQLite fallback)
    const sequelize = await connectMySQL();
    await sequelize.sync(); // ensure tables are synced

    // 2. Connect to MongoDB for AI Memory
    await connectDB();

    // 3. Check if initial seeding is needed
    const userCount = await User.count();
    if (userCount === 0) {
      logger.info('[Server] Database is empty. Running initial CSE department seed data...');
      await seedCseDatabase();
    }

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`[Server Error] Port ${PORT} is already in use by another process.`);
      } else {
        logger.error(`[Server Error]: ${err.message}`);
      }
      process.exit(1);
    });

    server.listen(PORT, () => {
      logger.info(`======================================================`);
      logger.info(`  CSE AGENTIC ERP BACKEND RUNNING ON PORT ${PORT} `);
      logger.info(`======================================================`);
      logger.info(`• Base API:       http://localhost:${PORT}/api`);
      logger.info(`• API v1:         http://localhost:${PORT}/api/v1`);
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
