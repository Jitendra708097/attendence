/**
 * @module queues/index
 * @description Bull queue initialization and worker setup.
 * Exports queue instances and worker processors.
 */
const Queue = require('bull');
const Redis = require('ioredis');

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
};

const redis = new Redis(redisConfig);

// Define queues
const autoAbsentQueue = new Queue('autoAbsent', { redis });
const checkoutGraceQueue = new Queue('checkoutGrace', { redis });
const faceEnrollmentQueue = new Queue('faceEnrollment', { redis });
const notificationQueue = new Queue('notification', { redis });
const reportGenerationQueue = new Queue('reportGeneration', { redis });
const offlineSyncQueue = new Queue('offlineSync', { redis });

// Export queues
module.exports = {
  autoAbsentQueue,
  checkoutGraceQueue,
  faceEnrollmentQueue,
  notificationQueue,
  reportGenerationQueue,
  offlineSyncQueue,
};
