/**
 * @module auth.routes
 * @description Route definitions for authentication endpoints.
 * All routes wrapped in asyncHandler middleware.
 */
const { Router } = require('express');
const { asyncHandler } = require('../../middleware/asyncHandler.js');
const { verifyJWT } = require('../../middleware/verifyJWT.js');
const { orgGuard } = require('../../middleware/orgGuard.js');
const { requireRole } = require('../../middleware/requireRole.js');
const authController = require('./auth.controller.js');
const {
  signupValidator,
  loginValidator,
  refreshTokenValidator,
  changePasswordValidator,
} = require('./auth.validator.js');

const router = Router();

/**
 * Public routes (no authentication required)
 */

// POST /api/v1/auth/signup
// Create new organisation + admin employee
router.post(
  '/signup',
  signupValidator,
  asyncHandler(authController.signup)
);

// POST /api/v1/auth/login
// Authenticate employee and issue tokens
router.post(
  '/login',
  loginValidator,
  asyncHandler(authController.login)
);

// POST /api/v1/auth/refresh-token
// Rotate refresh token and issue new access token
router.post(
  '/refresh-token',
  refreshTokenValidator,
  asyncHandler(authController.refreshToken)
);

/**
 * Protected routes (require JWT + org context)
 */

// GET /api/v1/auth/me
// Get current user profile
router.get(
  '/me',
  verifyJWT,
  orgGuard,
  asyncHandler(authController.getProfile)
);

// POST /api/v1/auth/logout
// Revoke all refresh tokens
router.post(
  '/logout',
  verifyJWT,
  orgGuard,
  asyncHandler(authController.logout)
);

// POST /api/v1/auth/change-password
// Change password (revokes all tokens)
router.post(
  '/change-password',
  verifyJWT,
  orgGuard,
  changePasswordValidator,
  asyncHandler(authController.changePassword)
);

module.exports = router;
