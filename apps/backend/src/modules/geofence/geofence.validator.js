/**
 * @module geofence.validator
 * @description Input validation schemas for geofence endpoints.
 * Called by: geofence.controller
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
 * Validation schema for creating geofence
 */
const createGeofenceValidator = [
  body('name')
    .notEmpty()
    .withMessage('Geofence name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be 1-100 characters'),
  body('branchId')
    .notEmpty()
    .withMessage('Branch ID is required')
    .isUUID()
    .withMessage('Branch ID must be a valid UUID'),
  body('latitude')
    .notEmpty()
    .withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .notEmpty()
    .withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('radiusMeters')
    .notEmpty()
    .withMessage('Radius is required')
    .isInt({ min: 1, max: 10000 })
    .withMessage('Radius must be between 1 and 10000 meters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be maximum 500 characters'),
];

/**
 * Validation schema for updating geofence
 */
const updateGeofenceValidator = [
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be 1-100 characters'),
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('radiusMeters')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Radius must be between 1 and 10000 meters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be maximum 500 characters'),
];

/**
 * Validation schema for validating location
 */
const validateLocationValidator = [
  body('branchId')
    .optional()
    .isUUID()
    .withMessage('Branch ID must be a valid UUID'),
  body('latitude')
    .notEmpty()
    .withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .notEmpty()
    .withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
];

module.exports = {
  validate,
  createGeofenceValidator,
  updateGeofenceValidator,
  validateLocationValidator,
};