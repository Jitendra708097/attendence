/**
 * @module leave.routes
 * @description Route definitions for leave request endpoints.
 */
const { Router  } = require('express');
const { verifyJWT  } = require('../../middleware/verifyJWT.js');
const { orgGuard  } = require('../../middleware/orgGuard.js');
const { requireRole  } = require('../../middleware/requireRole.js');
const leaveController = require('./leave.controller.js');
const { validate, createLeaveValidator, updateLeaveValidator, approveRejectValidator  } = require('./leave.validator.js');

const router = Router();

router.get('/', verifyJWT, orgGuard, leaveController.listLeaves);
router.post('/', verifyJWT, orgGuard, validate(createLeaveValidator), leaveController.createLeave);
router.get('/:id', verifyJWT, orgGuard, leaveController.getLeaveById);
router.put('/:id', verifyJWT, orgGuard, validate(updateLeaveValidator), leaveController.updateLeave);
router.delete('/:id', verifyJWT, orgGuard, leaveController.deleteLeave);
router.post('/:id/approve', verifyJWT, orgGuard, requireRole(['admin']), validate(approveRejectValidator), leaveController.approveLeave);
router.post('/:id/reject', verifyJWT, orgGuard, requireRole(['admin']), validate(approveRejectValidator), leaveController.rejectLeave);

module.exports = router;
