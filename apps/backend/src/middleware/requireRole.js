/**
 * @module requireRole
 * @description Role-based access control middleware.
 * Usage: router.post('/path', verifyJWT, requireRole('admin', 'superadmin'), controller)
 */
const { AppError } = require('../utils/AppError.js');

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError('AUTH_001', 'Authentication required', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError('AUTH_004', 'Insufficient permissions', 403);
    }

    next();
  };
};

module.exports = { requireRole };
