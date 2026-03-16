/**
 * @module organisation.controller
 * @description Handles organisation management endpoints.
 */
const orgService = require('./organisation.service.js');
const orgRepository = require('./organisation.repository.js');
const { AppError  } = require('../../utils/AppError.js');
const { logAudit  } = require('../../utils/auditLogger.js');

/**
 * GET /api/v1/org/profile
 * Get own organisation profile (admin only)
 */
const getProfile = async (req, res, next) => {
  try {
    const orgId = req.org_id;

    if (!orgId) {
      throw new AppError('AUTH_007', 'Organisation not found', 404);
    }

    const org = await orgRepository.findOrgById(orgId);
    if (!org) {
      throw new AppError('GEN_002', 'Organisation not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Organisation profile retrieved',
      data: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        plan: org.plan,
        status: org.status || 'active',
        timezone: org.timezone,
        trialEndsAt: org.trial_ends_at,
        settings: org.settings || {},
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/org/profile
 * Update organisation profile. Admin only.
 */
const updateProfile = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const { name, timezone, logoUrl } = req.body;

    const result = await orgService.updateOrgProfile(
      orgId,
      { name, timezone, logoUrl },
      orgRepository
    );

    await logAudit(req, 'UPDATE_ORG_PROFILE', 'Organisation', orgId, { name, timezone });

    res.status(200).json({
      success: true,
      message: 'Organisation profile updated',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/org/settings
 * Update organisation-level settings. Admin only.
 */
const updateSettings = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const settings = req.body;

    const result = await orgService.updateOrgSettings(orgId, settings, orgRepository);

    await logAudit(req, 'UPDATE_ORG_SETTINGS', 'Organisation', orgId, settings);

    res.status(200).json({
      success: true,
      message: 'Organisation settings updated',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/org/stats
 * Get dashboard statistics. Admin only.
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const orgId = req.org_id;

    const stats = await orgService.getDashboardStats(orgId, orgRepository);

    res.status(200).json({
      success: true,
      message: 'Dashboard stats retrieved',
      data: stats,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateSettings,
  getDashboardStats,
};