/**
 * @module shift.validator
 * @description Input validation schemas for shift endpoints.
 * Called by: shift.controller
 */
const { body, validationResult  } = require('express-validator');
const { AppError  } = require('../../utils/AppError.js');

const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

const createValidator = [
  body('name').notEmpty().withMessage('Shift name is required').trim(),
  body('startTime').matches(timeRegex).withMessage('Start time must be HH:mm format'),
  body('endTime').matches(timeRegex).withMessage('End time must be HH:mm format'),
  body('workDays').isArray().withMessage('Work days must be array'),
  body('workDays.*').isInt({ min: 0, max: 6 }).withMessage('Work days must be 0-6'),
  body('graceCheckin').optional().isInt({ min: 0 }).withMessage('Grace checkin must be positive'),
  body('graceCheckout').optional().isInt({ min: 0 }).withMessage('Grace checkout must be positive'),
  body('halfDayThreshold').optional().isInt({ min: 0 }).withMessage('Half day threshold must be positive'),
  body('absentThreshold').optional().isInt({ min: 0 }).withMessage('Absent threshold must be positive'),
  body('overtimeThreshold').optional().isInt({ min: 0 }).withMessage('Overtime threshold must be positive'),
  body('minOvertimeMinutes').optional().isInt({ min: 0 }).withMessage('Min overtime must be positive'),
  body('breakDuration').optional().isInt({ min: 0 }).withMessage('Break duration must be positive'),
  body('minSessionDuration').optional().isInt({ min: 0 }).withMessage('Min session must be positive'),
  body('cooldownBetweenSessions').optional().isInt({ min: 0 }).withMessage('Cooldown must be positive'),
  body('maxSessionsPerDay').optional().isInt({ min: 1 }).withMessage('Max sessions must be >= 1'),
];

const updateValidator = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('startTime').optional().matches(timeRegex).withMessage('Start time must be HH:mm'),
  body('endTime').optional().matches(timeRegex).withMessage('End time must be HH:mm'),
  body('workDays').optional().isArray().withMessage('Work days must be array'),
  body('graceCheckin').optional().isInt({ min: 0 }).withMessage('Must be positive'),
  body('graceCheckout').optional().isInt({ min: 0 }).withMessage('Must be positive'),
  body('halfDayThreshold').optional().isInt({ min: 0 }).withMessage('Must be positive'),
  body('absentThreshold').optional().isInt({ min: 0 }).withMessage('Must be positive'),
  body('overtimeThreshold').optional().isInt({ min: 0 }).withMessage('Must be positive'),
  body('minOvertimeMinutes').optional().isInt({ min: 0 }).withMessage('Must be positive'),
];

const validate = (validations) => {
  return async (req, res, next) => {
    try {
      await Promise.all(validations.map(v => v.run(req)));
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const details = errors.array().map(e => `${e.path}: ${e.msg}`);
        return next(new AppError('VAL_001', 'Validation failed', 400, details));
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = {
  createValidator,
  updateValidator,
  validate,
};