/**
 * @module redis
 * @description Redis client configuration and connection.
 */
const Redis = require('ioredis');
const { logger } = require('./logger.js');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('error', (err) => {
  // Suppress Redis connection errors in development
  // Redis is optional - queue and cache features will be unavailable
  if (process.env.NODE_ENV !== 'development') {
    logger.error('Redis error', { error: err.message });
  }
});

/**
 * Get value from Redis
 */
const getRedis = async (key) => {
  return redis.get(key);
};

/**
 * Set value in Redis with expiry
 */
const setRedis = async (key, value, expirySeconds = null) => {
  if (expirySeconds) {
    return redis.setex(key, expirySeconds, JSON.stringify(value));
  }
  return redis.set(key, JSON.stringify(value));
};

/**
 * Delete from Redis
 */
const delRedis = async (key) => {
  return redis.del(key);
};

/**
 * Generate one-time challenge token for check-in
 */
const generateChallengeToken = async (empId, expirySeconds = 30) => {
  const token = `challg_${empId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  await setRedis(`challenge:${token}`, { empId, isUsed: false }, expirySeconds);
  return token;
};

/**
 * Verify and consume challenge token
 */
const consumeChallengeToken = async (token) => {
  const key = `challenge:${token}`;
  const data = await redis.get(key);
  if (!data) return null;
  
  const parsed = JSON.parse(data);
  if (parsed.isUsed) return null;
  
  parsed.isUsed = true;
  await setRedis(key, parsed);
  return parsed;
};

module.exports = {
  getRedis,
  setRedis,
  delRedis,
  generateChallengeToken,
  consumeChallengeToken,
};
module.exports.default = redis;
