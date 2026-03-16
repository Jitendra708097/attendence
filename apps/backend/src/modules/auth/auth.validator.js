/**
 * @module auth.validator
 * @description Input validation schemas for auth endpoints using express-validator.
 */
const { body, validationResult } = require('express-validator');

/**
 * Signup endpoint validators
 */
const signupValidator = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('VAL_003'),
  body('phone')
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage('VAL_003'),
  body('first_name')
    .trim()
    .notEmpty()
    .isLength({ min: 2 })
    .withMessage('VAL_002'),
  body('last_name')
    .trim()
    .notEmpty()
    .isLength({ min: 2 })
    .withMessage('VAL_002'),
  body('organisation_name')
    .trim()
    .notEmpty()
    .isLength({ min: 3 })
    .withMessage('VAL_002'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage('Password must contain letters and numbers'),
];

/**
 * Login endpoint validators
 */
const loginValidator = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('VAL_003'),
  body('password')
    .notEmpty()
    .withMessage('VAL_002'),
];

/**
 * Refresh token endpoint validators
 */
const refreshTokenValidator = [
  body('refresh_token')
    .trim()
    .notEmpty()
    .withMessage('VAL_002'),
];

/**
 * Change password validators
 */
const changePasswordValidator = [
  body('old_password')
    .notEmpty()
    .withMessage('VAL_002'),
  body('new_password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage('Password must contain letters and numbers'),
];

module.exports = {
  signupValidator,
  loginValidator,
  refreshTokenValidator,
  changePasswordValidator,
};
