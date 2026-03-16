/**
 * @module department.validator
 * @description Input validation schemas for department endpoints.
 * Called by: department.controller
 */
const { body, validationResult  } = require('express-validator');
const { AppError  } = require('../../utils/AppError.js');

const createDepartmentValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Department name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('parentId')
    .optional()
    .isUUID().withMessage('Invalid parent department ID'),
  body('headEmpId')
    .optional()
    .isUUID().withMessage('Invalid head employee ID'),
];

const updateDepartmentValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('parentId')
    .optional()
    .isUUID().withMessage('Invalid parent department ID'),
  body('headEmpId')
    .optional()
    .isUUID().withMessage('Invalid head employee ID'),
];

const validate = (validators) => {
  return async (req, res, next) => {
    await Promise.all(validators.map(validator => validator.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(
        new AppError('VAL_001', 'Validation failed', 400, errors.array())
      );
    }
    next();
  };
};

module.exports = {
  createDepartmentValidator,
  updateDepartmentValidator,
  validate,
};