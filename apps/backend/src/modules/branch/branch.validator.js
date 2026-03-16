/**
 * @module branch.validator
 * @description Input validation schemas for branch endpoints.
 * Called by: branch.controller
 */
const { body, validationResult  } = require('express-validator');
const { AppError  } = require('../../utils/AppError.js');

const createValidator = [
  body('name').notEmpty().withMessage('Branch name is required').trim(),
  body('address').notEmpty().withMessage('Address is required').trim(),
  body('city').notEmpty().withMessage('City is required').trim(),
  body('isRemote').isBoolean().withMessage('isRemote must be boolean'),
];

const updateValidator = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('address').optional().trim().notEmpty().withMessage('Address cannot be empty'),
  body('city').optional().trim().notEmpty().withMessage('City cannot be empty'),
  body('isRemote').optional().isBoolean().withMessage('isRemote must be boolean'),
];

const geofenceValidator = [
  body('coordinates').isArray({ min: 3 }).withMessage('Geofence requires at least 3 coordinates'),
  body('coordinates.*.lat').isFloat().withMessage('Latitude must be number'),
  body('coordinates.*.lng').isFloat().withMessage('Longitude must be number'),
];

const wifiValidator = [
  body('bssids').isArray({ min: 1 }).withMessage('At least one BSSID required'),
  body('bssids.*').matches(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/).withMessage('Invalid MAC address format'),
];

const validate = (validations) => {
  return async (req, res, next) => {
    try {
      await Promise.all(validations.map(v => v.run(req)));
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const details = errors.array().map(e => `${e.path}: ${e.msg}`);
        return next(new AppError('VAL_001', 'Validation failed', 400, details));
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
  geofenceValidator,
  wifiValidator,
  validate,
};