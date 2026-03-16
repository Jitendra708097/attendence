/**
 * @module regularisation.validator
 * @description Input validation schemas for regularisation endpoints.
 * Called by: regularisation.controller
 */
const { body, query, validationResult } = require('express-validator');
const { AppError } = require('../../utils/AppError.js');

const createRegularisationValidator = [
  body('attendance_id')
    .notEmpty()
    .withMessage('Attendance ID is required')
    .isUUID()
    .withMessage('Attendance ID must be valid UUID'),
  body('issue_type')
    .notEmpty()
    .withMessage('Issue type is required')
    .isIn(['late_checkin', 'early_checkout', 'missing_attendance', 'incomplete_session'])
    .withMessage('Issue type must be one of: late_checkin, early_checkout, missing_attendance, incomplete_session'),
  body('evidence_type')
    .notEmpty()
    .withMessage('Evidence type is required')
    .isIn(['email_reply', 'message', 'document', 'verbal', 'other'])
    .withMessage('Evidence type must be one of: email_reply, message, document, verbal, other'),
  body('reason')
    .notEmpty()
    .withMessage('Reason is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Reason must be 10-1000 characters'),
  body('evidence_url')
    .optional()
    .isURL()
    .withMessage('Evidence URL must be valid URL'),
];

const updateRegularisationValidator = [
  body('issue_type')
    .optional()
    .isIn(['late_checkin', 'early_checkout', 'missing_attendance', 'incomplete_session'])
    .withMessage('Issue type must be one of: late_checkin, early_checkout, missing_attendance, incomplete_session'),
  body('evidence_type')
    .optional()
    .isIn(['email_reply', 'message', 'document', 'verbal', 'other'])
    .withMessage('Evidence type must be one of: email_reply, message, document, verbal, other'),
  body('reason')
    .optional()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Reason must be 10-1000 characters'),
  body('evidence_url')
    .optional()
    .isURL()
    .withMessage('Evidence URL must be valid URL'),
];

const approveRegularisationValidator = [
  body('admin_rejection_reason')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Rejection reason must be max 500 characters'),
];

const rejectRegularisationValidator = [
  body('rejection_reason')
    .notEmpty()
    .withMessage('Rejection reason is required')
    .isLength({ min: 5, max: 500 })
    .withMessage('Rejection reason must be 5-500 characters'),
];

/**
 * Middleware to validate express-validator results
 */
const validate = (validationChain) => {
  return async (req, res, next) => {
    try {
      for (const validation of validationChain) {
        await validation.run(req);
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const details = errors.array().map(e => ({ field: e.path, message: e.msg }));
        return next(new AppError('VAL_001', 'Validation failed', 400, details));
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = {
  validate,
  createRegularisationValidator,
  updateRegularisationValidator,
  approveRegularisationValidator,
  rejectRegularisationValidator,
};
