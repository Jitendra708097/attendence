/**
 * @module face.routes
 * @description Route definitions for face recognition endpoints.
 */
const { Router  } = require('express');
const { verifyJWT  } = require('../../middleware/verifyJWT.js');
const { orgGuard  } = require('../../middleware/orgGuard.js');
const faceController = require('./face.controller.js');
const { validate, enrollFaceValidator, recognizeFaceValidator  } = require('./face.validator.js');

const router = Router();

// POST /api/v1/face/enroll - Enroll employee face
router.post(
  '/enroll',
  verifyJWT,
  orgGuard,
  validate(enrollFaceValidator),
  faceController.enrollFace
);

// POST /api/v1/face/recognize - Recognize employee face
router.post(
  '/recognize',
  verifyJWT,
  orgGuard,
  validate(recognizeFaceValidator),
  faceController.recognizeFace
);

// GET /api/v1/face/:empId - Get employee face data
router.get(
  '/:empId',
  verifyJWT,
  orgGuard,
  faceController.getEmployeeFaceData
);

// DELETE /api/v1/face/:empId - Delete employee face data
router.delete(
  '/:empId',
  verifyJWT,
  orgGuard,
  faceController.deleteEmployeeFaceData
);

module.exports = router;
