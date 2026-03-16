/**
 * @module branch.routes
 * @description Route definitions for branch endpoints.
 */
const { Router  } = require('express');
const { verifyJWT  } = require('../../middleware/verifyJWT.js');
const { orgGuard  } = require('../../middleware/orgGuard.js');
const { requireRole  } = require('../../middleware/requireRole.js');
const branchController = require('./branch.controller.js');
const { validate, createValidator, updateValidator, geofenceValidator, wifiValidator  } = require('./branch.validator.js');

const router = Router();

router.get('/', verifyJWT, orgGuard, branchController.listBranches);
router.post('/', verifyJWT, orgGuard, requireRole(['admin']), validate(createValidator), branchController.createBranch);
router.get('/:id', verifyJWT, orgGuard, branchController.getBranchById);
router.put('/:id', verifyJWT, orgGuard, requireRole(['admin']), validate(updateValidator), branchController.updateBranch);
router.delete('/:id', verifyJWT, orgGuard, requireRole(['admin']), branchController.deleteBranch);
router.put('/:id/geofence', verifyJWT, orgGuard, requireRole(['admin']), validate(geofenceValidator), branchController.setGeofence);
router.delete('/:id/geofence', verifyJWT, orgGuard, requireRole(['admin']), branchController.removeGeofence);
router.put('/:id/wifi', verifyJWT, orgGuard, requireRole(['admin']), validate(wifiValidator), branchController.setWifiVerification);

module.exports = router;
