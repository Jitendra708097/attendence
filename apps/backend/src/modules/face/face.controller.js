/**
 * @module face.controller
 * @description Handles face recognition operations.
 */
const faceService = require('./face.service.js');
const { logAudit  } = require('../../utils/auditLogger.js');

/**
 * POST /api/v1/face/enroll
 * Enroll employee face for recognition
 */
const enrollFace = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const { empId, imageBase64 } = req.body;

    const result = await faceService.enrollFace(orgId, empId, imageBase64);

    await logAudit(req, 'FACE_ENROLLED', 'FaceData', empId, {});

    res.status(200).json({
      success: true,
      message: 'Face enrolled successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/face/recognize
 * Recognize employee from face image
 */
const recognizeFace = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const { imageBase64 } = req.body;

    const result = await faceService.recognizeFace(orgId, imageBase64);

    res.status(200).json({
      success: true,
      message: 'Face recognized successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/face/:empId
 * Get employee face data
 */
const getEmployeeFaceData = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const { empId } = req.params;

    const data = await faceService.getEmployeeFaceData(orgId, empId);

    res.status(200).json({
      success: true,
      message: 'Face data retrieved',
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/face/:empId
 * Delete employee face data
 */
const deleteEmployeeFaceData = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const { empId } = req.params;

    await faceService.deleteEmployeeFaceData(orgId, empId);

    await logAudit(req, 'FACE_DELETED', 'FaceData', empId, {});

    res.status(200).json({
      success: true,
      message: 'Face data deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  enrollFace,
  recognizeFace,
  getEmployeeFaceData,
  deleteEmployeeFaceData,
};