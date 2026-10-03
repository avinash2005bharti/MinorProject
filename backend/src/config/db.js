const { connectMongo, disconnectMongo } = require('./mongo');

module.exports = {
  connectDB: connectMongo,
  disconnectDB: disconnectMongo
};