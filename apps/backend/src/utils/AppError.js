/**
 * @module AppError
 * @description Custom error class for AttendEase.
 * Always throw this instead of raw Error.
 * Usage: throw new AppError('ATT_003', 'Open session exists.', 409)
 */
class AppError extends Error {
  constructor(code, message, statusCode = 500) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { AppError };
