/**
 * @module attendance.validator
 * @description Input validation schemas for attendance endpoints.
 */
const { body, query, validationResult  } = require('express-validator');
const { AppError  } = require('../../utils/AppError.js');

const requestCheckInValidator = [
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be valid'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be valid'),
  body('photo_base64')
    .optional()
    .isString()
    .withMessage('Photo must be base64 string'),
];

const checkInValidator = [
  body('challengeToken')
    .notEmpty()
    .withMessage('Challenge token is required')
    .isLength({ min: 32, max: 256 })
    .withMessage('Challenge token format invalid'),
  body('challengeResponse')
    .notEmpty()
    .withMessage('Challenge response is required'),
];

const checkOutValidator = [
  body('attendanceId')
    .notEmpty()
    .withMessage('Attendance ID is required')
    .isUUID()
    .withMessage('Attendance ID must be valid UUID'),
];

const undoCheckOutValidator = [
  body('attendanceId')
    .notEmpty()
    .withMessage('Attendance ID is required')
    .isUUID()
    .withMessage('Attendance ID must be valid UUID'),
];

const flagAnomalyValidator = [
  body('attendanceId')
    .notEmpty()
    .withMessage('Attendance ID is required')
    .isUUID()
    .withMessage('Attendance ID must be valid UUID'),
  body('reason')
    .notEmpty()
    .withMessage('Reason is required')
    .isLength({ min: 5, max: 500 })
    .withMessage('Reason must be 5-500 characters'),
  body('details')
    .optional()
    .isString()
    .withMessage('Details must be string'),
];

const exportValidator = [
  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be ISO8601 format'),
  body('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('End date must be ISO8601 format'),
  body('format')
    .notEmpty()
    .withMessage('Format is required')
    .isIn(['csv', 'xlsx'])
    .withMessage('Format must be csv or xlsx'),
  body('branchId')
    .optional()
    .isUUID()
    .withMessage('Branch ID must be valid UUID'),
];

const offlineSyncValidator = [
  body('records')
    .isArray({ min: 1 })
    .withMessage('Records must be non-empty array'),
  body('records.*.timestamp')
    .notEmpty()
    .withMessage('Record timestamp is required'),
  body('records.*.latitude')
    .isFloat()
    .withMessage('Record latitude must be valid'),
  body('records.*.longitude')
    .isFloat()
    .withMessage('Record longitude must be valid'),
  body('records.*.status')
    .notEmpty()
    .withMessage('Record status is required')
    .isIn(['checked_in', 'checked_out'])
    .withMessage('Record status must be checked_in or checked_out'),
];

const statusFilterValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be 1-100'),
  query('branch')
    .optional()
    .isUUID()
    .withMessage('Branch must be valid UUID'),
  query('status')
    .optional()
    .isIn(['checked_in', 'checked_out', 'absent'])
    .withMessage('Status filter invalid'),
];

const historyFilterValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be 1-100'),
  query('status')
    .optional()
    .isIn(['present', 'absent', 'half_day', 'on_leave'])
    .withMessage('Status filter invalid'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be ISO8601 format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be ISO8601 format'),
];

const validate = (validationChain) => {
  return async (req, res, next) => {
    try {
      for (const validation of validationChain) {
        await validation.run(req);
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const details = errors.array().map(e => ({ field: e.path, message: e.msg }));
        return next(new AppError('VAL_001', 'Validation failed', 400));
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = {
  requestCheckInValidator,
  checkInValidator,
  checkOutValidator,
  undoCheckOutValidator,
  flagAnomalyValidator,
  exportValidator,
  offlineSyncValidator,
  statusFilterValidator,
  historyFilterValidator,
  validate,
};