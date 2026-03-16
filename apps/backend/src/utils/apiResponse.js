/**
 * @module apiResponse
 * @description Standard API response envelope for all endpoints.
 * Usage: sendSuccess(res, 200, 'Data fetched', data)
 *        sendError(res, 400, 'VAL_001', 'Validation failed', details)
 */

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (200, 201, etc.)
 * @param {string} message - Human-readable success message
 * @param {*} data - Response payload (can be object, array, null)
 */
const sendSuccess = (res, statusCode = 200, message = 'Success', data = null) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (400, 401, 404, etc.)
 * @param {string} code - Error code (e.g., 'VAL_001', 'AUTH_002')
 * @param {string} message - Error message
 * @param {Array} details - Optional validation errors or additional details
 */
const sendError = (res, statusCode = 500, code = 'GEN_002', message = 'Internal server error', details = []) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details.length > 0 && { details }),
    },
  });
};

module.exports = {
  sendSuccess,
  sendError,
};
