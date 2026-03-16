/**
 * @module jwt
 * @description JWT token generation and verification utilities.
 */
const jwt = require('jsonwebtoken');
const { AppError } = require('./AppError.js');

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

/**
 * Generate access token
 * @param {string} empId - Employee ID
 * @param {string|null} orgId - Organisation ID (null for superadmin)
 * @param {string} role - User role (admin, employee, superadmin)
 */
const generateAccessToken = (empId, orgId, role) => {
  return jwt.sign(
    { empId, orgId, role },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
};

/**
 * Generate refresh token
 * @param {string} empId - Employee ID
 * @param {string|null} orgId - Organisation ID (null for superadmin)
 * @param {string} role - User role
 */
const generateRefreshToken = (empId, orgId, role) => {
  return jwt.sign(
    { empId, orgId, role },
    process.env.REFRESH_TOKEN_EXPIRY_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
};

/**
 * Verify access token
 * @param {string} token - JWT token
 * @returns {object} Decoded token
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new AppError('AUTH_002', 'Invalid or expired token', 401);
  }
};

/**
 * Verify refresh token
 * @param {string} token - JWT token
 * @returns {object} Decoded token
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.REFRESH_TOKEN_EXPIRY_SECRET);
  } catch (err) {
    throw new AppError('AUTH_003', 'Invalid or expired refresh token', 401);
  }
};

/**
 * Decode token without verification (for inspection)
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
};
