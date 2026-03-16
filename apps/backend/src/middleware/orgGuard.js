/**
 * @module orgGuard
 * @description Middleware to inject and enforce organisation context.
 * CRITICAL: req.org_id comes ONLY from verified JWT - never from request body/params.
 * All tenant data must include org_id in WHERE clause.
 */
const { AppError } = require('../utils/AppError.js');

const orgGuard = (req, res, next) => {
  // For superadmin routes (orgId = null from JWT)
  if (req.user.role === 'superadmin') {
    req.org_id = null;
    return next();
  }

  // For employee/admin routes
  if (!req.user.orgId) {
    throw new AppError('AUTH_005', 'Organisation context required', 403);
  }

  req.org_id = req.user.orgId;
  next();
};

module.exports = { orgGuard };
