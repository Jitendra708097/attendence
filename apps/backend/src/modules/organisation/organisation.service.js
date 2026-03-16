/**
 * @module organisation.service
 * @description Business logic for organisation management.
 * Called by: organisation.controller
 * Calls: organisation.repository
 */
const { AppError  } = require('../../utils/AppError.js');

/**
 * Update organisation profile (name, timezone, logo)
 */
const updateOrgProfile = async (orgId, data, orgRepository) => {
  const { name, timezone, logoUrl } = data;

  // Validate timezone if provided
  if (timezone) {
    try {
      // Simple validation - timezone should be a valid IANA timezone
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
    } catch (err) {
      throw new AppError('VAL_001', 'Invalid timezone', 400);
    }
  }

  const updateData = {};
  if (name) updateData.name = name;
  if (timezone) updateData.timezone = timezone;
  if (logoUrl) {
    // Ensure logoUrl is valid
    try {
      new URL(logoUrl);
      updateData.logo_url = logoUrl;
    } catch (err) {
      throw new AppError('VAL_001', 'Invalid logo URL', 400);
    }
  }

  const org = await orgRepository.updateOrg(orgId, updateData);
  return {
    id: org.id,
    name: org.name,
    timezone: org.timezone,
    logoUrl: org.logo_url,
  };
};

/**
 * Update organisation settings (nested JSONB fields)
 */
const updateOrgSettings = async (orgId, settingsData, orgRepository) => {
  const allowedSettings = {
    allowRemoteCheckin: 'boolean',
    requireFaceEnrollment: 'boolean',
    defaultGraceMinsCheckin: 'number',
    defaultGraceMinsCheckout: 'number',
  };

  // Validate input - check keys and value types
  for (const [key, value] of Object.entries(settingsData)) {
    if (!allowedSettings.hasOwnProperty(key)) {
      throw new AppError('VAL_001', `Invalid setting: ${key}`, 400);
    }

    const expectedType = allowedSettings[key];
    const actualType = typeof value;

    if (actualType !== expectedType) {
      throw new AppError('VAL_001', `Setting '${key}' must be ${expectedType}, got ${actualType}`, 400);
    }

    // Additional validation for number settings
    if (expectedType === 'number' && value < 0) {
      throw new AppError('VAL_001', `Setting '${key}' must be non-negative`, 400);
    }
  }

  // Get current org to merge settings
  const org = await orgRepository.findOrgById(orgId);
  if (!org) {
    throw new AppError('GEN_002', 'Organisation not found', 404);
  }

  const currentSettings = org.settings || {};
  const newSettings = {
    ...currentSettings,
    ...settingsData,
  };

  const updatedOrg = await orgRepository.updateOrg(orgId, {
    settings: newSettings,
  });

  return {
    id: updatedOrg.id,
    settings: updatedOrg.settings,
  };
};

/**
 * Get dashboard statistics
 * - Total employees
 * - Active today
 * - Absent, late, on leave today
 * - Pending requests (leave, regularisation)
 */
const getDashboardStats = async (orgId, orgRepository) => {
  const stats = await orgRepository.getDashboardStats(orgId);

  return {
    totalEmployees: stats.totalEmployees || 0,
    activeToday: stats.activeToday || 0,
    absentToday: stats.absentToday || 0,
    lateToday: stats.lateToday || 0,
    onLeaveToday: stats.onLeaveToday || 0,
    pendingLeaveRequests: stats.pendingLeaveRequests || 0,
    pendingRegularisations: stats.pendingRegularisations || 0,
  };
};

module.exports = {
  updateOrgProfile,
  updateOrgSettings,
  getDashboardStats,
};