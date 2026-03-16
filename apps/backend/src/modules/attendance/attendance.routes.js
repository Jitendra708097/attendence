/**
 * @module attendance.routes
 * @description Route definitions for attendance endpoints.
 */
const { Router  } = require('express');
const attendanceController = require('./attendance.controller.js');
const { validate,
  requestCheckInValidator,
  checkInValidator,
  checkOutValidator,
  undoCheckOutValidator,
  flagAnomalyValidator,
  exportValidator,
  offlineSyncValidator,
  statusFilterValidator,
  historyFilterValidator,
 } = require('./attendance.validator.js');
const { verifyJWT  } = require('../../middleware/verifyJWT.js');
const { orgGuard  } = require('../../middleware/orgGuard.js');
const { requireRole  } = require('../../middleware/requireRole.js');

const router = Router();

router.post(
  '/request-checkin',
  verifyJWT,
  orgGuard,
  validate(requestCheckInValidator),
  attendanceController.requestCheckIn
);

router.post(
  '/checkin',
  verifyJWT,
  orgGuard,
  validate(checkInValidator),
  attendanceController.checkIn
);

router.post(
  '/checkout',
  verifyJWT,
  orgGuard,
  validate(checkOutValidator),
  attendanceController.checkOut
);

router.post(
  '/undo-checkout',
  verifyJWT,
  orgGuard,
  validate(undoCheckOutValidator),
  attendanceController.undoCheckOut
);

router.get(
  '/today-status',
  verifyJWT,
  orgGuard,
  attendanceController.getTodayStatus
);

router.get(
  '/history',
  verifyJWT,
  orgGuard,
  validate(historyFilterValidator),
  attendanceController.getHistory
);

router.get(
  '/live-board',
  verifyJWT,
  orgGuard,
  requireRole(['admin']),
  validate(statusFilterValidator),
  attendanceController.getLiveBoard
);

router.post(
  '/flag-anomaly',
  verifyJWT,
  orgGuard,
  requireRole(['admin', 'manager']),
  validate(flagAnomalyValidator),
  attendanceController.flagAnomaly
);

router.post(
  '/export',
  verifyJWT,
  orgGuard,
  requireRole(['admin']),
  validate(exportValidator),
  attendanceController.exportAttendance
);

router.post(
  '/offline-sync',
  verifyJWT,
  orgGuard,
  validate(offlineSyncValidator),
  attendanceController.offlineSync
);

router.get(
  '/:id',
  verifyJWT,
  orgGuard,
  attendanceController.getAttendanceById
);

router.put(
  '/:id/status',
  verifyJWT,
  orgGuard,
  requireRole(['admin']),
  validate(checkOutValidator),
  attendanceController.updateAttendanceStatus
);

module.exports = router;
