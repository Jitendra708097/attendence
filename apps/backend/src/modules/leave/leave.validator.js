/**
 * @module leave.validator
 * @description Input validation for leave endpoints.
 */
const { body, validationResult  } = require('express-validator');
const { AppError  } = require('../../utils/AppError.js');

const LEAVE_TYPES = ['casual', 'sick', 'earned'];

const createLeaveValidator = [
  body('startDate').isISO8601().withMessage('startDate must be a valid ISO8601 date'),
  body('endDate').isISO8601().withMessage('endDate must be a valid ISO8601 date').custom((value, { req }) => {
    if (new Date(value) <= new Date(req.body.startDate)) throw new AppError('VAL_001', 'endDate must be after startDate', 400);
    return true;
  }),
  body('type').isIn(LEAVE_TYPES).withMessage(`type must be one of: ${LEAVE_TYPES.join(', ')}`),
  body('reason').trim().isLength({ min: 5, max: 500 }).withMessage('reason must be between 5 and 500 characters'),
  body('alternateEmpId').optional().isUUID().withMessage('alternateEmpId must be a valid UUID'),
];

const updateLeaveValidator = [
  body('startDate').optional().isISO8601().withMessage('startDate must be a valid ISO8601 date'),
  body('endDate').optional().isISO8601().withMessage('endDate must be a valid ISO8601 date').custom((value, { req }) => {
    if (value && req.body.startDate && new Date(value) <= new Date(req.body.startDate)) throw new AppError('VAL_001', 'endDate must be after startDate', 400);
    return true;
  }),
  body('type').optional().isIn(LEAVE_TYPES).withMessage(`type must be one of: ${LEAVE_TYPES.join(', ')}`),
  body('reason').optional().trim().isLength({ min: 5, max: 500 }).withMessage('reason must be between 5 and 500 characters'),
];

const approveRejectValidator = [
  body('comments').optional().trim().isLength({ max: 500 }).withMessage('comments cannot exceed 500 characters'),
];

const validate = (validationChain) => {
  return async (req, res, next) => {
    try {
      for (const validation of validationChain) await validation.run(req);
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(new AppError('VAL_001', errors.array().map(e => e.msg).join(', '), 400));
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = {
  createLeaveValidator,
  updateLeaveValidator,
  approveRejectValidator,
  validate,
};