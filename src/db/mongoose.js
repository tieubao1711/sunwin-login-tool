const mongoose = require('mongoose');
const config = require('../config');

async function connectMongo() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(config.mongoUri, {
    serverSelectionTimeoutMS: 15000
  });
  console.log('[MongoDB] Connected:', mongoose.connection.name);
}

module.exports = {
  connectMongo
};
