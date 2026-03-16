/**
 * @module auth.controller
 * @description Handles authentication endpoints: signup, login, refresh, logout, changePassword, profile.
 * All routes wrapped in asyncHandler - no try/catch needed.
 */
const { validationResult } = require('express-validator');
const { sendSuccess, sendError } = require('../../utils/apiResponse.js');
// const { logAudit } = require('../../utils/auditLogger.js');
const authService = require('./auth.service.js');
const authRepository = require('./auth.repository.js');

// Stub logAudit for now
const logAudit = async () => {};

/**
 * POST /api/v1/auth/signup
 * Create new organisation + admin employee
 */
const signup = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 400, 'VAL_001', 'Validation failed', errors.array());
  }

  const result = await authService.signup(req.body, authRepository);

  await logAudit(req, 'SIGNUP', 'Organisation', result.organisation.id, { org_name: result.organisation.name });

  return sendSuccess(res, 201, 'Signup successful. Welcome to AttendEase!', result);
};

/**
 * POST /api/v1/auth/login
 * Authenticate employee and issue tokens
 */
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 400, 'VAL_001', 'Validation failed', errors.array());
  }

  const result = await authService.login(req.body, authRepository);

  await logAudit(req, 'LOGIN', 'Employee', result.user.empId, {});

  return sendSuccess(res, 200, 'Login successful', result);
};

/**
 * POST /api/v1/auth/refresh-token
 * Rotate refresh token and issue new access token
 * Token rotation ensures: old token marked 'used', new token issued
 */
const refreshToken = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 400, 'VAL_001', 'Validation failed', errors.array());
  }

  const { refresh_token } = req.body;
  const result = await authService.refreshAccessToken(refresh_token, authRepository);

  return sendSuccess(res, 200, 'Access token refreshed', result);
};

/**
 * POST /api/v1/auth/logout
 * Revoke all refresh tokens for employee
 */
const logout = async (req, res) => {
  const empId = req.user.empId;
  const orgId = req.org_id;

  await authService.logout(empId, orgId, authRepository);
  await logAudit(req, 'LOGOUT', 'Employee', empId, {});

  return sendSuccess(res, 200, 'Logout successful');
};

/**
 * GET /api/v1/auth/me
 * Get current user profile (sanitized)
 */
const getProfile = async (req, res) => {
  const empId = req.user.empId;
  const orgId = req.org_id;

  const user = await authRepository.getEmployeeProfile(empId, orgId);
  if (!user) {
    return sendError(res, 404, 'EMP_001', 'User not found');
  }

  return sendSuccess(res, 200, 'Profile retrieved', user);
};

/**
 * POST /api/v1/auth/change-password
 * Authenticated password change
 * Revokes all tokens after success (forces re-login)
 */
const changePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 400, 'VAL_001', 'Validation failed', errors.array());
  }

  const empId = req.user.empId;
  const orgId = req.org_id;

  await authService.changePassword(empId, orgId, req.body, authRepository);
  await logAudit(req, 'CHANGE_PASSWORD', 'Employee', empId, {});

  return sendSuccess(res, 200, 'Password changed successfully. Please log in again.');
};

module.exports = {
  signup,
  login,
  refreshToken,
  logout,
  getProfile,
  changePassword,
};
