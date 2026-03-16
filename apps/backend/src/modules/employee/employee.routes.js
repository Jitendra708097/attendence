/**
 * @module employee.routes
 * @description Route definitions for employee management endpoints.
 */
const { Router  } = require('express');
const empController = require('./employee.controller.js');
const { validate, createValidator, updateValidator, leaveBalanceValidator, bulkUploadValidator  } = require('./employee.validator.js');
const { verifyJWT  } = require('../../middleware/verifyJWT.js');
const { orgGuard  } = require('../../middleware/orgGuard.js');
const { requireRole  } = require('../../middleware/requireRole.js');

const router = Router();

// GET /api/v1/employees - List all employees with filters
router.get(
  '/',
  verifyJWT,
  orgGuard,
  requireRole(['admin']),
  empController.listEmployees
);

// POST /api/v1/employees - Create single employee
router.post(
  '/',
  verifyJWT,
  orgGuard,
  requireRole(['admin']),
  validate(createValidator),
  empController.createEmployee
);

// POST /api/v1/employees/bulk - Bulk upload employees
router.post(
  '/bulk',
  verifyJWT,
  orgGuard,
  requireRole(['admin']),
  validate(bulkUploadValidator),
  empController.bulkUploadEmployees
);

// GET /api/v1/employees/me - Get own profile
router.get(
  '/me',
  verifyJWT,
  orgGuard,
  empController.getOwnProfile
);

// GET /api/v1/employees/:id - Get single employee
router.get(
  '/:id',
  verifyJWT,
  orgGuard,
  requireRole(['admin']),
  empController.getEmployeeById
);

// PUT /api/v1/employees/:id - Update employee
router.put(
  '/:id',
  verifyJWT,
  orgGuard,
  requireRole(['admin']),
  validate(updateValidator),
  empController.updateEmployee
);

// DELETE /api/v1/employees/:id - Soft delete employee
router.delete(
  '/:id',
  verifyJWT,
  orgGuard,
  requireRole(['admin']),
  empController.deleteEmployee
);

// POST /api/v1/employees/:id/resend-invite - Resend SMS/email invite
router.post(
  '/:id/resend-invite',
  verifyJWT,
  orgGuard,
  requireRole(['admin']),
  empController.resendInvite
);

// PUT /api/v1/employees/:id/leave-balance - Set leave balance
router.put(
  '/:id/leave-balance',
  verifyJWT,
  orgGuard,
  requireRole(['admin']),
  validate(leaveBalanceValidator),
  empController.updateLeaveBalance
);

// GET /api/v1/employees/:id/leave-balance - Get leave balance
router.get(
  '/:id/leave-balance',
  verifyJWT,
  orgGuard,
  empController.getLeaveBalance
);

module.exports = router;
