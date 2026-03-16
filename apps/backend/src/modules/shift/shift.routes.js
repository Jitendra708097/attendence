/**
 * @module shift.routes
 * @description Route definitions for shift endpoints.
 */
const { Router  } = require('express');
const { verifyJWT  } = require('../../middleware/verifyJWT.js');
const { orgGuard  } = require('../../middleware/orgGuard.js');
const { requireRole  } = require('../../middleware/requireRole.js');
const shiftController = require('./shift.controller.js');
const { validate, createValidator, updateValidator  } = require('./shift.validator.js');

const router = Router();

router.get('/', verifyJWT, orgGuard, shiftController.listShifts);
router.post('/', verifyJWT, orgGuard, requireRole(['admin']), validate(createValidator), shiftController.createShift);
router.get('/:id', verifyJWT, orgGuard, shiftController.getShiftById);
router.put('/:id', verifyJWT, orgGuard, requireRole(['admin']), validate(updateValidator), shiftController.updateShift);
router.delete('/:id', verifyJWT, orgGuard, requireRole(['admin']), shiftController.deleteShift);

module.exports = router;
