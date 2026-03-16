/**
 * @module auth.service
 * @description Business logic for authentication, JWT generation, password hashing, token rotation.
 */
const bcryptjs = require('bcryptjs');
const crypto = require('crypto');
const { generateAccessToken, generateRefreshToken } = require('../../utils/jwt.js');
const { AppError } = require('../../utils/AppError.js');
const { sendWelcomeEmail } = require('../../utils/emailService.js');
const { v4: uuidv4 } = require('uuid');

const BCRYPT_ROUNDS = 12;

/**
 * Hash password using bcrypt with 12 rounds
 */
const hashPassword = async (password) => {
  return bcryptjs.hash(password, BCRYPT_ROUNDS);
};

/**
 * Compare password with hash
 */
const comparePassword = async (password, hash) => {
  return bcryptjs.compare(password, hash);
};

/**
 * Generate unique organisation slug
 */
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .substring(0, 50) + '-' + uuidv4().substring(0, 8);
};

/**
 * Sign up new organisation + admin employee
 * Creates organisation, admin employee, and initial refresh token
 */
const signup = async (data, authRepository) => {
  const { email, phone, first_name, last_name, organisation_name, password } = data;

  // Check if email already exists
  const existingEmployee = await authRepository.findEmployeeByEmail(email);
  if (existingEmployee) {
    throw new AppError('AUTH_010', 'Email already registered', 409);
  }

  // Create organisation
  const org = await authRepository.createOrganisation({
    name: organisation_name,
    slug: generateSlug(organisation_name),
    plan: 'trial',
    is_active: true,
    timezone: 'Asia/Kolkata',
  });

  // Hash password with 12 rounds
  const password_hash = await hashPassword(password);

  // Create admin employee
  const employee = await authRepository.createEmployee({
    org_id: org.id,
    email,
    phone,
    first_name,
    last_name,
    password_hash,
    role: 'admin',
    is_active: true,
  });

  // Generate tokens
  const accessToken = generateAccessToken(employee.id, org.id, 'admin');
  const refreshTokenString = generateRefreshToken(employee.id, org.id, 'admin');

  // Store refresh token as bcrypt hash
  const refreshTokenHash = await hashPassword(refreshTokenString);
  await authRepository.createRefreshToken({
    org_id: org.id,
    emp_id: employee.id,
    token_hash: refreshTokenHash,
    status: 'active',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  // Send welcome email (fire and forget)
  try {
    await sendWelcomeEmail(email, first_name, password);
  } catch (err) {
    console.error('Welcome email failed:', err.message);
    // Don't fail signup if email fails
  }

  return {
    access_token: accessToken,
    refresh_token: refreshTokenString,
    user: {
      empId: employee.id,
      orgId: org.id,
      email,
      first_name,
      last_name,
      role: 'admin',
    },
    organisation: {
      id: org.id,
      name: org.name,
      plan: org.plan,
    },
  };
};

/**
 * Login employee
 * Verifies credentials and issues new refresh token
 * On new device login, revokes all previous refresh tokens
 */
const login = async (data, authRepository) => {
  const { email, password, device_id } = data;

  // Find employee by email
  const employee = await authRepository.findEmployeeByEmail(email);
  if (!employee) {
    throw new AppError('AUTH_001', 'Invalid credentials', 401);
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, employee.password_hash);
  if (!isPasswordValid) {
    throw new AppError('AUTH_001', 'Invalid credentials', 401);
  }

  // Check employee status
  if (!employee.is_active) {
    throw new AppError('AUTH_005', 'Account suspended', 403);
  }

  // Check organisation status
  const org = await authRepository.getOrganisationById(employee.org_id);
  if (!org || !org.is_active) {
    throw new AppError('AUTH_006', 'Organisation suspended', 403);
  }

  // TODO: Check if new device - if yes, revoke all previous tokens
  // if (device_id && !employee.registered_device_id) {
  //   await authRepository.revokeAllRefreshTokens(employee.id);
  // }

  // Generate tokens
  const accessToken = generateAccessToken(employee.id, employee.org_id, employee.role);
  const refreshTokenString = generateRefreshToken(employee.id, employee.org_id, employee.role);

  // Store new refresh token
  const refreshTokenHash = await hashPassword(refreshTokenString);
  await authRepository.createRefreshToken({
    org_id: employee.org_id,
    emp_id: employee.id,
    token_hash: refreshTokenHash,
    status: 'active',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  // Update last login
  await authRepository.updateEmployee(employee.id, employee.org_id, {
    last_login_at: new Date(),
  });

  return {
    access_token: accessToken,
    refresh_token: refreshTokenString,
    user: {
      empId: employee.id,
      orgId: employee.org_id,
      email: employee.email,
      first_name: employee.first_name,
      last_name: employee.last_name,
      role: employee.role,
    },
  };
};

/**
 * Refresh access token (Token Rotation)
 * 1. Verify JWT signature and expiry
 * 2. Find all active refresh tokens for employee
 * 3. Compare plaintext with bcrypt hashes
 * 4. Mark matched token as 'used'
 * 5. Generate new access token + refresh token
 * CRITICAL: Refresh token can only be used once
 */
const refreshAccessToken = async (refreshTokenString, authRepository) => {
  if (!refreshTokenString || typeof refreshTokenString !== 'string') {
    throw new AppError('AUTH_004', 'Refresh token invalid or expired', 401);
  }

  const { verifyRefreshToken } = require('../../utils/jwt.js');

  // 1. Verify JWT signature and expiry
  const decoded = verifyRefreshToken(refreshTokenString);
  const { empId, orgId, role } = decoded;

  // 2. Get all active tokens for this employee
  const activeTokens = await authRepository.findActiveRefreshTokens(empId, orgId);
  if (!activeTokens || activeTokens.length === 0) {
    throw new AppError('AUTH_004', 'No active refresh token found', 401);
  }

  // 3. Try bcrypt.compare on each token hash to find the match
  let matchedTokenId = null;
  for (const tokenRecord of activeTokens) {
    const isMatch = await comparePassword(refreshTokenString, tokenRecord.token_hash);
    if (isMatch) {
      matchedTokenId = tokenRecord.id;
      break;
    }
  }

  if (!matchedTokenId) {
    throw new AppError('AUTH_004', 'Refresh token invalid or expired', 401);
  }

  // 4. Mark old token as 'used' (prevents replay attacks)
  await authRepository.markTokenAsUsed(matchedTokenId);

  // 5. Generate new token pair
  const accessToken = generateAccessToken(empId, orgId, role);
  const newRefreshTokenString = generateRefreshToken(empId, orgId, role);

  // Store new refresh token as bcrypt hash
  const newTokenHash = await hashPassword(newRefreshTokenString);
  await authRepository.createRefreshToken({
    org_id: orgId,
    emp_id: empId,
    token_hash: newTokenHash,
    status: 'active',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return {
    access_token: accessToken,
    refresh_token: newRefreshTokenString,
  };
};

/**
 * Logout - revoke refresh token
 */
const logout = async (empId, orgId, authRepository) => {
  // Revoke all active refresh tokens for this employee
  await authRepository.revokeAllRefreshTokens(empId, orgId);
  return { message: 'Logout successful' };
};

/**
 * Change password (authenticated route)
 */
const changePassword = async (empId, orgId, data, authRepository) => {
  const { old_password, new_password } = data;

  // Find employee
  const employee = await authRepository.findEmployeeByIdInOrg(empId, orgId);
  if (!employee) {
    throw new AppError('EMP_001', 'Employee not found', 404);
  }

  // Verify old password
  const isValid = await comparePassword(old_password, employee.password_hash);
  if (!isValid) {
    throw new AppError('AUTH_001', 'Invalid credentials', 401);
  }

  // Hash and update new password
  const newHash = await hashPassword(new_password);
  await authRepository.updateEmployee(empId, orgId, {
    password_hash: newHash,
  });

  // Revoke all refresh tokens (force re-login on all devices)
  await authRepository.revokeAllRefreshTokens(empId, orgId);

  return { message: 'Password changed successfully' };
};

module.exports = {
  signup,
  login,
  refreshAccessToken,
  logout,
  changePassword,
  hashPassword,
  comparePassword,
  generateSlug,
};
