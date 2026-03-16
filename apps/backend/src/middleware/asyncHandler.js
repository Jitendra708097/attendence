/**
 * @module asyncHandler
 * @description Wraps async route handlers to catch errors and pass to error handler.
 * Eliminates try/catch repetition in all async controller functions.
 * Usage: router.get('/', asyncHandler(controller.getAll))
 */

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { asyncHandler };
