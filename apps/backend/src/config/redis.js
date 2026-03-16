/**
 * @module redis
 * @description Redis configuration for caching, sessions, and job queues.
 */
const Redis = require('ioredis');

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  enableReadyCheck: false,
  enableOfflineQueue: true,
  maxRetriesPerRequest: null,
};

// Initialize Redis client
const redis = new Redis(redisConfig);

// Event listeners
redis.on('connect', () => {
  console.log('✓ Redis connected');
});

redis.on('error', (error) => {
  console.error('Redis error:', error);
});

redis.on('close', () => {
  console.log('Redis connection closed');
});

/**
 * Get value from Redis
 * @param {string} key
 * @returns {Promise}
 */
const get = async (key) => {
  try {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error(`Redis GET error for key ${key}:`, error);
    return null;
  }
};

/**
 * Set value in Redis with optional TTL
 * @param {string} key
 * @param {*} value
 * @param {number} ttl - Time to live in seconds (optional)
 * @returns {Promise}
 */
const set = async (key, value, ttl = null) => {
  try {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await redis.setex(key, ttl, serialized);
    } else {
      await redis.set(key, serialized);
    }
    return true;
  } catch (error) {
    console.error(`Redis SET error for key ${key}:`, error);
    return false;
  }
};

/**
 * Delete key from Redis
 * @param {string} key
 * @returns {Promise}
 */
const del = async (key) => {
  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error(`Redis DEL error for key ${key}:`, error);
    return false;
  }
};

/**
 * Increment counter in Redis
 * @param {string} key
 * @returns {Promise}
 */
const incr = async (key) => {
  try {
    return await redis.incr(key);
  } catch (error) {
    console.error(`Redis INCR error for key ${key}:`, error);
    return null;
  }
};

/**
 * Decrement counter in Redis
 * @param {string} key
 * @returns {Promise}
 */
const decr = async (key) => {
  try {
    return await redis.decr(key);
  } catch (error) {
    console.error(`Redis DECR error for key ${key}:`, error);
    return null;
  }
};

/**
 * Set expiry on a key
 * @param {string} key
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise}
 */
const expire = async (key, ttl) => {
  try {
    await redis.expire(key, ttl);
    return true;
  } catch (error) {
    console.error(`Redis EXPIRE error for key ${key}:`, error);
    return false;
  }
};

/**
 * Flush all keys from current Redis database
 * @returns {Promise}
 */
const flushDb = async () => {
  try {
    await redis.flushdb();
    console.log('Redis database flushed');
    return true;
  } catch (error) {
    console.error('Redis FLUSHDB error:', error);
    return false;
  }
};

/**
 * Get Redis client instance
 * @returns {Redis}
 */
const getRedisClient = () => redis;

module.exports.get = get;
module.exports.set = set;
module.exports.del = del;
module.exports.incr = incr;
module.exports.decr = decr;
module.exports.expire = expire;
module.exports.flushDb = flushDb;
module.exports.getRedisClient = getRedisClient;
module.exports = redis;
