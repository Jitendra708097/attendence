/**
 * @module errorHandler
 * @description Global Express error handling middleware.
 * Must be last middleware in app.js.
 */
const { AppError } = require('../utils/AppError.js');

const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  // Unknown error
  console.error('UNHANDLED ERROR:', err);
  return res.status(500).json({
    success: false,
    error: {
      code: 'GEN_001',
      message: 'Something went wrong. Please try again.',
    },
  });
};

module.exports = { errorHandler };
