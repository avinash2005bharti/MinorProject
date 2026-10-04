// ============================================================================
// MongoDB + Mongoose Connection Service
// Dedicated to User / App Data and LLM Short-Term Memory (STM)
// ============================================================================

const mongoose = require('mongoose');
const dns = require('dns');

// ARCH-04: Opt-in custom DNS servers instead of unconditional hardcoding
if (process.env.CUSTOM_DNS_SERVERS) {
  try {
    const servers = process.env.CUSTOM_DNS_SERVERS.split(',').map(s => s.trim()).filter(Boolean);
    if (servers.length > 0) {
      dns.setServers(servers);
    }
  } catch (dnsErr) {
    console.warn(`[DNS Config Warning]: ${dnsErr.message}`);
  }
}

let isConnected = false;
let reconnectTimer = null;
let reconnectAttempts = 0;

const connectMongo = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/erp_cse';
  const safeUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true
    });
    isConnected = true;
    reconnectAttempts = 0;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    console.log(`[MongoDB] Connected successfully (User Data & STM): ${safeUri}`);
    return mongoose.connection;
  } catch (err) {
    isConnected = false;
    console.error(`[MongoDB] Connection to ${safeUri} failed: ${err.message}`);
    throw err;
  }
};

const scheduleMongoReconnect = () => {
  if (reconnectTimer) return;
  const backoffMs = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
  reconnectAttempts++;
  console.log(`[MongoDB] Reconnection scheduled in ${backoffMs / 1000}s (Attempt #${reconnectAttempts})...`);

  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    try {
      await connectMongo();
      if (global.appInstance) {
        global.appInstance.locals.mongoAvailable = true;
      }
    } catch (err) {
      scheduleMongoReconnect();
    }
  }, backoffMs);

  if (reconnectTimer.unref) reconnectTimer.unref();
};

// Event listeners for graceful state tracking
mongoose.connection.on('disconnected', () => {
  isConnected = false;
  if (global.appInstance) {
    global.appInstance.locals.mongoAvailable = false;
  }
  scheduleMongoReconnect();
});

mongoose.connection.on('connected', () => {
  isConnected = true;
  reconnectAttempts = 0;
  if (global.appInstance) {
    global.appInstance.locals.mongoAvailable = true;
  }
});

const getMongoHealth = async () => {
  try {
    const readyState = mongoose.connection.readyState;
    const isHealthy = readyState === 1;
    return {
      status: isHealthy ? 'UP' : 'DOWN',
      readyState,
      database: 'MongoDB (Mongoose)',
      role: 'User/App Data & LLM STM',
      reconnectAttempts
    };
  } catch (err) {
    return { status: 'DOWN', error: err.message };
  }
};

const disconnectMongo = async () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  await mongoose.disconnect();
  isConnected = false;
};

module.exports = {
  mongoose,
  connectMongo,
  connectDB: connectMongo, // Backward compatibility alias
  scheduleMongoReconnect,
  getMongoHealth,
  disconnectMongo
};
