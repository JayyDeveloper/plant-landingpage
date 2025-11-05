const { Pool } = require('pg');
const redis = require('redis');
const mongoose = require('mongoose');
const logger = require('./logger');

// PostgreSQL Connection
let pgPool;

const connectDatabase = async () => {
  try {
    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection
    const client = await pgPool.connect();
    await client.query('SELECT NOW()');
    client.release();

    logger.info('✅ PostgreSQL connected successfully');
    return pgPool;
  } catch (error) {
    logger.error('❌ PostgreSQL connection failed:', error);
    throw error;
  }
};

const getPgPool = () => {
  if (!pgPool) {
    throw new Error('Database not initialized. Call connectDatabase first.');
  }
  return pgPool;
};

// Redis Connection
let redisClient;

const connectRedis = async () => {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('✅ Redis connected successfully');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error('❌ Redis connection failed:', error);
    throw error;
  }
};

const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis not initialized. Call connectRedis first.');
  }
  return redisClient;
};

// MongoDB Connection
const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/vibe_newsletter', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    mongoose.connection.on('connected', () => {
      logger.info('✅ MongoDB connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    return mongoose.connection;
  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error);
    throw error;
  }
};

module.exports = {
  connectDatabase,
  getPgPool,
  connectRedis,
  getRedisClient,
  connectMongoDB,
};
