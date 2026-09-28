const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusflow';
  
  try {
    // Attempt standard connection first with 3 second timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`[MongoDB] Connected successfully to: ${uri}`);
  } catch (err) {
    console.warn(`[MongoDB] Primary connection failed (${err.message}). Checking development fallback...`);
    
    if (process.env.NODE_ENV !== 'production') {
      try {
        console.log('[MongoDB] Starting MongoMemoryServer for development/demo environment...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongodInstance = await MongoMemoryServer.create();
        const memUri = mongodInstance.getUri();
        await mongoose.connect(memUri);
        console.log(`[MongoDB] Connected to MongoMemoryServer: ${memUri}`);
      } catch (memErr) {
        console.error('[MongoDB] Failed to start MongoMemoryServer:', memErr.message);
        throw memErr;
      }
    } else {
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
