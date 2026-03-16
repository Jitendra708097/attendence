/**
 * @module logger
 * @description Structured logging utility for AttendEase.
 */
const fs = require('fs');
const path = require('path');

const logDir = 'logs';

// Create logs directory if it doesn't exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const getTimestamp = () => new Date().toISOString();

const logger = {
  info: (message, meta = {}) => {
    const log = { timestamp: getTimestamp(), level: 'INFO', message, ...meta };
    console.log(JSON.stringify(log));
    fs.appendFileSync(path.join(logDir, 'info.log'), JSON.stringify(log) + '\n');
  },

  error: (message, meta = {}) => {
    const log = { timestamp: getTimestamp(), level: 'ERROR', message, ...meta };
    console.error(JSON.stringify(log));
    fs.appendFileSync(path.join(logDir, 'error.log'), JSON.stringify(log) + '\n');
  },

  warn: (message, meta = {}) => {
    const log = { timestamp: getTimestamp(), level: 'WARN', message, ...meta };
    console.warn(JSON.stringify(log));
    fs.appendFileSync(path.join(logDir, 'warn.log'), JSON.stringify(log) + '\n');
  },

  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV === 'development') {
      const log = { timestamp: getTimestamp(), level: 'DEBUG', message, ...meta };
      console.log(JSON.stringify(log));
    }
  },
};

module.exports = { logger };
