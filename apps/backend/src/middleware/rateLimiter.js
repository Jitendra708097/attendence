/**
 * @module rateLimiter
 * @description Rate limiting middleware using express-rate-limit.
 * Applied globally in app.js
 * NOTE: Using memory store for now. TODO: Migrate to Redis store when needed for production.
 */
const rateLimit = require('express-rate-limit');

/**
 * Global rate limiter: 100 requests per 15 minutes
 */
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health',
});

/**
 * Strict rate limiter for auth endpoints: 5 requests per 15 minutes
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
});

/**
 * Check-in limiter: 60 requests per minute per user
 */
const checkinLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: (req) => `${req.user?.empId || req.ip}`,
});

module.exports = { rateLimiter, authLimiter, checkinLimiter };
