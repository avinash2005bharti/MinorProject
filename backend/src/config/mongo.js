// ============================================================================
// MongoDB + Mongoose Connection Service
// Dedicated to User / App Data and LLM Short-Term Memory (STM)
// ============================================================================

const mongoose = require('mongoose');
const dns = require('dns');

// Configure reliable DNS servers for mongodb+srv lookup on Windows networks
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (dnsErr) {}

let isConnected = false;

const connectMongo = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/erp_cse';
  const safeUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      autoIndex: true
    });
    isConnected = true;
    console.log(`[MongoDB] Connected successfully (User Data & STM): ${safeUri}`);
    return mongoose.connection;
  } catch (err) {
    console.error(`[MongoDB] Connection to ${safeUri} failed; persistent storage is unavailable: ${err.message}`);
    throw err;
  }
};

const getMongoHealth = async () => {
  try {
    const readyState = mongoose.connection.readyState;
    const isHealthy = readyState === 1;
    return {
      status: isHealthy ? 'UP' : 'DOWN',
      readyState,
      database: 'MongoDB (Mongoose)',
      role: 'User/App Data & LLM STM'
    };
  } catch (err) {
    return { status: 'DOWN', error: err.message };
  }
};

const disconnectMongo = async () => {
  await mongoose.disconnect();
  isConnected = false;
};

module.exports = {
  mongoose,
  connectMongo,
  connectDB: connectMongo, // Backward compatibility alias
  getMongoHealth,
  disconnectMongo
};
