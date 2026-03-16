/**
 * @module billing.validator
 * @description Input validation schemas for billing endpoints.
 * Called by: billing.controller
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
 * Validation schema for creating order
 */
const createOrderValidator = [
  body('planId')
    .notEmpty()
    .withMessage('Plan ID is required')
    .isIn(['starter', 'professional', 'enterprise'])
    .withMessage('Invalid plan ID'),
];

/**
 * Validation schema for verifying payment
 */
const verifyPaymentValidator = [
  body('orderId')
    .notEmpty()
    .withMessage('Order ID is required'),
  body('paymentId')
    .notEmpty()
    .withMessage('Payment ID is required'),
  body('signature')
    .notEmpty()
    .withMessage('Signature is required'),
];

/**
 * Validation schema for upgrading plan
 */
const upgradePlanValidator = [
  body('newPlanId')
    .notEmpty()
    .withMessage('New plan ID is required')
    .isIn(['starter', 'professional', 'enterprise'])
    .withMessage('Invalid plan ID'),
];

module.exports = {
  validate,
  createOrderValidator,
  verifyPaymentValidator,
  upgradePlanValidator,
};