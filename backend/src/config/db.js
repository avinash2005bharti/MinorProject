const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cse_erp';

  // Sanitize URI for safe logging (mask password)
  const safeUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');

  try {
    // 8-second timeout for cloud MongoDB Atlas latency
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      autoIndex: true
    });
    console.log(`[MongoDB] Connected successfully to Cloud/Local cluster: ${safeUri}`);
    console.log(`[MongoDB Compass Connection Target]:`);
    console.log(`  • Paste your MONGODB_URI directly into MongoDB Compass to browse all collections.`);
  } catch (err) {
    console.warn(`[MongoDB] Primary connection to ${safeUri} failed (${err.message}).`);

    if (process.env.NODE_ENV !== 'production') {
      try {
        console.log('[MongoDB] Starting MongoMemoryServer for local development/demo environment...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongodInstance = await MongoMemoryServer.create();
        const memUri = mongodInstance.getUri();
        await mongoose.connect(memUri);
        console.log(`[MongoDB] Connected to in-memory fallback: ${memUri}`);
      } catch (memErr) {
        console.error('[MongoDB] Failed to start MongoMemoryServer fallback:', memErr.message);
        throw memErr;
      }
    } else {
      console.error('[MongoDB] Fatal MongoDB connection failure in production environment.');
      throw err;
    }
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
};

module.exports = { connectDB, disconnectDB };
