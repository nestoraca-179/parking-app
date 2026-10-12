const mongoose = require('mongoose');
const env = require('../config/env');

const MAX_ATTEMPTS = 30;
const RETRY_DELAY_MS = 2000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectWithRetry = async () => {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 3000 });
      console.log('Connected to MongoDB');
      return;
    } catch (error) {
      console.log(`MongoDB connection attempt ${attempt}/${MAX_ATTEMPTS} failed: ${error.message}`);
      if (attempt === MAX_ATTEMPTS) {
        throw error;
      }
      await sleep(RETRY_DELAY_MS);
    }
  }
};

const isConnected = () => mongoose.connection.readyState === 1;

const disconnect = () => mongoose.disconnect();

module.exports = { connectWithRetry, isConnected, disconnect };
