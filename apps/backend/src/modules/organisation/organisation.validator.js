/**
 * @module organisation.validator
 * @description Input validation schemas for organisation endpoints.
 * Called by: organisation.controller
 */
const { body, validationResult  } = require('express-validator');
const { AppError  } = require('../../utils/AppError.js');

/**
 * Validation schema for updating organisation profile
 */
const updateProfileValidator = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Organisation name must be 2-100 characters'),
  body('timezone')
    .optional()
    .isString()
    .withMessage('Timezone must be a valid string'),
  body('logoUrl')
    .optional()
    .isURL()
    .withMessage('Logo URL must be a valid URL'),
];

/**
 * Validation schema for updating organisation settings
 */
const updateSettingsValidator = [
  body('allowRemoteCheckin')
    .optional()
    .isBoolean()
    .withMessage('allowRemoteCheckin must be boolean'),
  body('requireFaceEnrollment')
    .optional()
    .isBoolean()
    .withMessage('requireFaceEnrollment must be boolean'),
  body('defaultGraceMinsCheckin')
    .optional()
    .isInt({ min: 0, max: 120 })
    .withMessage('defaultGraceMinsCheckin must be 0-120 minutes'),
  body('defaultGraceMinsCheckout')
    .optional()
    .isInt({ min: 0, max: 300 })
    .withMessage('defaultGraceMinsCheckout must be 0-300 minutes'),
];

/**
 * Middleware to run validation and return formatted errors
 */
const validate = (validationChain) => {
  return async (req, res, next) => {
    // Run all validations
    for (const validation of validationChain) {
      await validation.run(req);
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(
        'VAL_001',
        'Validation failed',
        400
      );
    }

    next();
  };
};

module.exports = {
  updateProfileValidator,
  updateSettingsValidator,
  validate,
};