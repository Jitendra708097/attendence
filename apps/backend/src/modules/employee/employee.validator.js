/**
 * @module employee.validator
 * @description Input validation schemas for employee endpoints.
 * Called by: employee.controller
 */
const { body, validationResult  } = require('express-validator');
const { AppError  } = require('../../utils/AppError.js');

/**
 * Validation schema for creating employee
 */
const createValidator = [
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be 1-50 characters'),
  body('lastName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be 1-50 characters'),
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email must be valid'),
  body('phone')
    .optional()
    .isString()
    .withMessage('Phone must be valid'),
  body('branchId')
    .optional()
    .isUUID()
    .withMessage('Branch ID must be valid UUID'),
  body('shiftId')
    .optional()
    .isUUID()
    .withMessage('Shift ID must be valid UUID'),
  body('deptId')
    .optional()
    .isUUID()
    .withMessage('Department ID must be valid UUID'),
  body('role')
    .optional()
    .isIn(['employee', 'admin'])
    .withMessage('Role must be employee or admin'),
  body('sendInvite')
    .optional()
    .isBoolean()
    .withMessage('sendInvite must be boolean'),
];

/**
 * Validation schema for updating employee
 */
const updateValidator = [
  body('firstName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be 1-50 characters'),
  body('lastName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be 1-50 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email must be valid'),
  body('phone')
    .optional()
    .isString()
    .withMessage('Phone must be valid'),
  body('branchId')
    .optional()
    .isUUID()
    .withMessage('Branch ID must be valid UUID'),
  body('shiftId')
    .optional()
    .isUUID()
    .withMessage('Shift ID must be valid UUID'),
  body('deptId')
    .optional()
    .isUUID()
    .withMessage('Department ID must be valid UUID'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage('Status must be active, inactive, or suspended'),
];

/**
 * Validation schema for bulk upload
 */
const bulkUploadValidator = [
  body('employees')
    .isArray()
    .withMessage('Employees must be an array'),
  body('sendInvites')
    .optional()
    .isBoolean()
    .withMessage('sendInvites must be boolean'),
];

/**
 * Validation schema for leave balance update
 */
const leaveBalanceValidator = [
  body('casual')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Casual leave must be non-negative integer'),
  body('sick')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sick leave must be non-negative integer'),
  body('earned')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Earned leave must be non-negative integer'),
];

/**
 * Middleware to run validation and return formatted errors
 */
const validate = (validationChain) => {
  return async (req, res, next) => {
    try {
      for (const validation of validationChain) {
        await validation.run(req);
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(e => e.msg).join(', ');
        return next(new AppError('VAL_001', errorMessages, 400));
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
  bulkUploadValidator,
  leaveBalanceValidator,
  validate,
};