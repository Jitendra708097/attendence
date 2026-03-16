/**
 * @module notification.validator
 * @description Input validation schemas for notification endpoints.
 * Called by: notification.controller
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
 * Validation schema for creating notification (internal use)
 */
const createNotificationValidator = [
  body('notificationType')
    .notEmpty()
    .withMessage('Notification type is required')
    .isIn([
      'leave_approved', 'leave_rejected', 'leave_requested',
      'check_in_reminder', 'check_out_reminder', 'geofence_alert',
      'attendance_marked', 'regularisation_approved', 'regularisation_rejected',
      'leave_balance_low', 'system_alert'
    ])
    .withMessage('Invalid notification type'),
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be 1-100 characters'),
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be 1-1000 characters'),
  body('actionUrl')
    .optional()
    .isURL()
    .withMessage('Action URL must be valid'),
  body('actionType')
    .optional()
    .isIn(['view_leave', 'view_attendance', 'view_regularisation', 'navigate', 'app_action'])
    .withMessage('Invalid action type'),
  body('actionData')
    .optional()
    .isObject()
    .withMessage('Action data must be an object'),
];

module.exports = {
  validate,
  createNotificationValidator,
};