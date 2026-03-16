/**
 * @module holiday.routes
 * @description Route definitions for holiday endpoints.
 */
const { Router  } = require('express');
const { verifyJWT  } = require('../../middleware/verifyJWT.js');
const { orgGuard  } = require('../../middleware/orgGuard.js');
const { requireRole  } = require('../../middleware/requireRole.js');
const holidayController = require('./holiday.controller.js');
const { validate, createHolidayValidator, updateHolidayValidator  } = require('./holiday.validator.js');

const router = Router();

// GET /api/v1/holidays - List all holidays
router.get('/', verifyJWT, orgGuard, holidayController.listHolidays);

// POST /api/v1/holidays - Create holiday
router.post(
  '/',
  verifyJWT,
  orgGuard,
  requireRole(['admin']),
  validate(createHolidayValidator),
  holidayController.createHoliday
);

// GET /api/v1/holidays/:id - Get holiday by ID
router.get('/:id', verifyJWT, orgGuard, holidayController.getHolidayById);

// PUT /api/v1/holidays/:id - Update holiday
router.put(
  '/:id',
  verifyJWT,
  orgGuard,
  requireRole(['admin']),
  validate(updateHolidayValidator),
  holidayController.updateHoliday
);

// DELETE /api/v1/holidays/:id - Delete holiday
router.delete(
  '/:id',
  verifyJWT,
  orgGuard,
  requireRole(['admin']),
  holidayController.deleteHoliday
);

module.exports = router;
