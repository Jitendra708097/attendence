/**
 * @module holiday.validator
 * @description Input validation schemas for holiday endpoints.
 * Called by: holiday.controller
 */
const { body, validationResult  } = require('express-validator');
const { AppError  } = require('../../utils/AppError.js');

/**
 * Middleware to handle validation errors
 */
const validate = (validations) => async (req, res, next) => {
  await Promise.all(validations.map(validation => validation.run(req)));

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(err => `${err.param}: ${err.msg}`).join('; ');
    return next(new AppError('VAL_001', messages, 400));
  }
  next();
};

/**
 * Validation schema for creating holiday
 */
const createHolidayValidator = [
  body('holidayDate')
    .notEmpty()
    .withMessage('Holiday date is required')
    .isISO8601()
    .withMessage('Holiday date must be a valid date'),
  body('name')
    .notEmpty()
    .withMessage('Holiday name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Holiday name must be 1-100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be maximum 500 characters'),
  body('branchId')
    .optional()
    .isUUID()
    .withMessage('Branch ID must be a valid UUID'),
  body('isOptional')
    .optional()
    .isBoolean()
    .withMessage('isOptional must be boolean'),
  body('isRecurring')
    .optional()
    .isBoolean()
    .withMessage('isRecurring must be boolean'),
  body('recurringPattern')
    .optional()
    .isIn(['yearly', 'monthly'])
    .withMessage('Recurring pattern must be yearly or monthly'),
  body('impactOnLeave')
    .optional()
    .isIn(['full_day', 'half_day', 'no_deduction'])
    .withMessage('Impact on leave must be full_day, half_day, or no_deduction'),
];

/**
 * Validation schema for updating holiday
 */
const updateHolidayValidator = [
  body('holidayDate')
    .optional()
    .isISO8601()
    .withMessage('Holiday date must be a valid date'),
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Holiday name must be 1-100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be maximum 500 characters'),
  body('branchId')
    .optional()
    .isUUID()
    .withMessage('Branch ID must be a valid UUID'),
  body('isOptional')
    .optional()
    .isBoolean()
    .withMessage('isOptional must be boolean'),
  body('isRecurring')
    .optional()
    .isBoolean()
    .withMessage('isRecurring must be boolean'),
  body('recurringPattern')
    .optional()
    .isIn(['yearly', 'monthly'])
    .withMessage('Recurring pattern must be yearly or monthly'),
  body('impactOnLeave')
    .optional()
    .isIn(['full_day', 'half_day', 'no_deduction'])
    .withMessage('Impact on leave must be full_day, half_day, or no_deduction'),
];

module.exports = {
  validate,
  createHolidayValidator,
  updateHolidayValidator,
};