/**
 * @module organisation.routes
 * @description Route definitions for organisation management endpoints.
 */
const { Router  } = require('express');
const orgController = require('./organisation.controller.js');
const { validate, updateProfileValidator, updateSettingsValidator  } = require('./organisation.validator.js');
const { verifyJWT  } = require('../../middleware/verifyJWT.js');
const { orgGuard  } = require('../../middleware/orgGuard.js');
const { requireRole  } = require('../../middleware/requireRole.js');

const router = Router();

/**
 * All routes require JWT + orgGuard (admin role enforced in controller)
 */

// GET /api/v1/org/profile
router.get('/profile', verifyJWT, orgGuard, orgController.getProfile);

// PUT /api/v1/org/profile
router.put(
  '/profile',
  verifyJWT,
  orgGuard,
  requireRole(['admin']),
  validate(updateProfileValidator),
  orgController.updateProfile
);

// PUT /api/v1/org/settings
router.put(
  '/settings',
  verifyJWT,
  orgGuard,
  requireRole(['admin']),
  validate(updateSettingsValidator),
  orgController.updateSettings
);

// GET /api/v1/org/stats
router.get('/stats', verifyJWT, orgGuard, orgController.getDashboardStats);

module.exports = router;
