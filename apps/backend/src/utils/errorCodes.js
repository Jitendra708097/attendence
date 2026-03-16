/**
 * @module errorCodes
 * @description Centralised error code constants for all API responses.
 * Format: CODE_XXX where CODE is the module and XXX is sequential number.
 */

const ERROR_CODES = {
  // Authentication (AUTH_xxx)
  AUTH_001: 'Invalid credentials',
  AUTH_002: 'Token expired or invalid',
  AUTH_003: 'Token invalid',
  AUTH_004: 'Refresh token invalid or expired',
  AUTH_005: 'Account suspended',
  AUTH_006: 'Organisation suspended',
  AUTH_007: 'Insufficient permissions',
  AUTH_008: 'Token not provided',
  AUTH_009: 'Unregistered device',
  AUTH_010: 'Email already registered',

  // Validation (VAL_xxx)
  VAL_001: 'Validation failed',
  VAL_002: 'Required field missing',
  VAL_003: 'Invalid format',
  VAL_004: 'Invalid date range',
  VAL_005: 'Duplicate entry',

  // Employee (EMP_xxx)
  EMP_001: 'Employee not found',
  EMP_002: 'Email already exists in organisation',
  EMP_003: 'Employee already enrolled for face recognition',
  EMP_004: 'Device already registered',
  EMP_005: 'Employee code already exists',

  // Attendance (ATT_xxx)
  ATT_001: 'No active session',
  ATT_002: 'Session already open',
  ATT_003: 'Attendance already finalised',
  ATT_004: 'Outside geofence',
  ATT_005: 'Maximum sessions per day reached',
  ATT_006: 'Cooldown period active - cannot check in yet',
  ATT_007: 'Minimum session time not met',
  ATT_008: 'Challenge token expired',
  ATT_009: 'Challenge token invalid',
  ATT_010: 'Challenge token already used',
  ATT_011: 'Request timestamp invalid or too old',
  ATT_012: 'Undo checkout window expired',

  // Face Recognition (FACE_xxx)
  FACE_001: 'Face not detected in image',
  FACE_002: 'Face quality too low',
  FACE_003: 'Face does not match stored embedding',
  FACE_004: 'Multiple faces detected',
  FACE_005: 'Liveness check failed',
  FACE_006: 'Flat surface detected',
  FACE_007: 'Face enrollment failed',
  FACE_008: 'Spoofing attempt detected',

  // Geofence (GEO_xxx)
  GEO_001: 'Outside geofence boundary',
  GEO_002: 'GPS accuracy too low',
  GEO_003: 'Suspicious location (mock or anomaly detected)',
  GEO_004: 'GPS unavailable',

  // Leave (LEV_xxx)
  LEV_001: 'Leave request not found',
  LEV_002: 'Insufficient leave balance',
  LEV_003: 'Leave date overlap detected',
  LEV_004: 'Cannot modify approved leave',
  LEV_005: 'Invalid leave date range',
  LEV_006: 'Past leave requests cannot be modified',

  // Regularisation (REG_xxx)
  REG_001: 'Regularisation request not found',
  REG_002: 'Attendance not found for regularisation',
  REG_003: 'Cannot regularise future dates',
  REG_004: 'Duplicate regularisation request',

  // Branch (BR_xxx)
  BR_001: 'Branch not found',
  BR_002: 'Branch name already exists',
  BR_003: 'Cannot delete branch with active employees',

  // Department (DEPT_xxx)
  DEPT_001: 'Department not found',
  DEPT_002: 'Department name already exists',
  DEPT_003: 'Cannot delete department with employees',

  // Shift (SH_xxx)
  SH_001: 'Shift not found',
  SH_002: 'Shift name already exists',
  SH_003: 'Cannot delete shift with assigned employees',

  // Holiday (HOL_xxx)
  HOL_001: 'Holiday not found',
  HOL_002: 'Holiday date already exists',

  // Notification (NOT_xxx)
  NOT_001: 'Notification not found',
  NOT_002: 'Device token invalid',

  // Organisation (ORG_xxx)
  ORG_001: 'Organisation not found',
  ORG_002: 'Organisation slug already exists',
  ORG_003: 'Plan limit exceeded',
  ORG_004: 'Trial period expired',

  // General (GEN_xxx)
  GEN_001: 'Not found',
  GEN_002: 'Internal server error',
  GEN_003: 'Rate limit exceeded',
  GEN_004: 'Service temporarily unavailable',
  GEN_005: 'Duplicate request within cooldown period',
  GEN_006: 'Invalid request',
  GEN_007: 'Conflict - resource already exists',
};

module.exports = { ERROR_CODES };
