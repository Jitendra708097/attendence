/**
 * @module face.validator
 * @description Input validation schemas for face recognition endpoints.
 * Called by: face.controller
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
 * Validation schema for enrolling face
 */
const enrollFaceValidator = [
  body('empId')
    .notEmpty()
    .withMessage('Employee ID is required')
    .isUUID()
    .withMessage('Employee ID must be a valid UUID'),
  body('imageBase64')
    .notEmpty()
    .withMessage('Image is required')
    .isString()
    .withMessage('Image must be base64 string')
    .isLength({ min: 100 })
    .withMessage('Image data is invalid'),
];

/**
 * Validation schema for recognizing face
 */
const recognizeFaceValidator = [
  body('imageBase64')
    .notEmpty()
    .withMessage('Image is required')
    .isString()
    .withMessage('Image must be base64 string')
    .isLength({ min: 100 })
    .withMessage('Image data is invalid'),
];

module.exports = {
  validate,
  enrollFaceValidator,
  recognizeFaceValidator,
};