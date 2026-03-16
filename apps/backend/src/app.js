/**
 * @module app
 * @description Express application setup and configuration.
 * Called by: server.js
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { errorHandler } = require('./middleware/errorHandler.js');
const { rateLimiter } = require('./middleware/rateLimiter.js');
const routes = require('./routes/index.js');

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Global Rate Limiter
app.use(rateLimiter);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/v1', routes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'GEN_001', message: 'Route not found' },
  });
});

// Global Error Handler (must be last)
app.use(errorHandler);

module.exports = app;
