/**
 * @module geofence.routes
 * @description Route definitions for geofence endpoints.
 */
const { Router  } = require('express');
const { verifyJWT  } = require('../../middleware/verifyJWT.js');
const { orgGuard  } = require('../../middleware/orgGuard.js');
const { requireRole  } = require('../../middleware/requireRole.js');
const geofenceController = require('./geofence.controller.js');
const { validate, createGeofenceValidator, updateGeofenceValidator, validateLocationValidator  } = require('./geofence.validator.js');

const router = Router();

// GET /api/v1/geofences - List geofences
router.get(
  '/',
  verifyJWT,
  orgGuard,
  geofenceController.listGeofences
);

// POST /api/v1/geofences - Create geofence
router.post(
  '/',
  verifyJWT,
  orgGuard,
  requireRole(['admin']),
  validate(createGeofenceValidator),
  geofenceController.createGeofence
);

// GET /api/v1/geofences/:id - Get single geofence
router.get(
  '/:id',
  verifyJWT,
  orgGuard,
  geofenceController.getGeofenceById
);

// PUT /api/v1/geofences/:id - Update geofence
router.put(
  '/:id',
  verifyJWT,
  orgGuard,
  requireRole(['admin']),
  validate(updateGeofenceValidator),
  geofenceController.updateGeofence
);

// DELETE /api/v1/geofences/:id - Delete geofence
router.delete(
  '/:id',
  verifyJWT,
  orgGuard,
  requireRole(['admin']),
  geofenceController.deleteGeofence
);

// POST /api/v1/geofences/validate-location - Check if location is within geofence
router.post(
  '/validate-location',
  verifyJWT,
  orgGuard,
  validate(validateLocationValidator),
  geofenceController.validateLocation
);

module.exports = router;
