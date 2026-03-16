/**
 * @module face.service
 * @description Face recognition service for attendance verification.
 * Orchestrates local and cloud face recognition models.
 * Called by: attendance.service, face.controller
 * Calls: face.localModel, face.cloudService
 */
const { AppError  } = require('../../utils/AppError.js');
const localModel = require('./face.localModel.js');
const cloudService = require('./face.cloudService.js');

const USE_CLOUD = process.env.FACE_RECOGNITION_SERVICE === 'cloud';

/**
 * Enroll employee face
 * @param {string} orgId - Organization ID
 * @param {string} empId - Employee ID
 * @param {string} imageBase64 - Base64 encoded employee face image
 * @param {object} employeeRepository - Employee repository for validation
 */
const enrollFace = async (orgId, empId, imageBase64, employeeRepository) => {
  if (!imageBase64) {
    throw new AppError('VAL_001', 'Image is required', 400);
  }

  if (!empId) {
    throw new AppError('VAL_001', 'Employee ID is required', 400);
  }

  // Validate employee exists and belongs to organisation
  if (employeeRepository) {
    const employee = await employeeRepository.findEmployeeById(orgId, empId);
    if (!employee) {
      throw new AppError('EMP_001', 'Employee not found', 404);
    }
  }

  try {
    if (USE_CLOUD) {
      return await cloudService.enrollFace(orgId, empId, imageBase64);
    } else {
      return await localModel.enrollFace(orgId, empId, imageBase64);
    }
  } catch (err) {
    throw new AppError('FACE_001', 'Failed to enroll face: ' + err.message, 500);
  }
};

/**
 * Recognize employee from face image
 */
const recognizeFace = async (orgId, imageBase64) => {
  if (!imageBase64) {
    throw new AppError('VAL_001', 'Image is required', 400);
  }

  try {
    if (USE_CLOUD) {
      return await cloudService.recognizeFace(orgId, imageBase64);
    } else {
      return await localModel.recognizeFace(orgId, imageBase64);
    }
  } catch (err) {
    throw new AppError('FACE_002', 'Failed to recognize face: ' + err.message, 500);
  }
};

/**
 * Get employee face data
 */
const getEmployeeFaceData = async (orgId, empId) => {
  try {
    if (USE_CLOUD) {
      return await cloudService.getEmployeeFaceData(orgId, empId);
    } else {
      return await localModel.getEmployeeFaceData(orgId, empId);
    }
  } catch (err) {
    throw new AppError('FACE_001', 'Failed to retrieve face data: ' + err.message, 500);
  }
};

/**
 * Delete employee face data
 */
const deleteEmployeeFaceData = async (orgId, empId) => {
  try {
    if (USE_CLOUD) {
      return await cloudService.deleteEmployeeFaceData(orgId, empId);
    } else {
      return await localModel.deleteEmployeeFaceData(orgId, empId);
    }
  } catch (err) {
    throw new AppError('FACE_003', 'Failed to delete face data: ' + err.message, 500);
  }
};

/**
 * Verify attendance using face recognition
 * Called by: attendance.service
 */
const verifyAttendanceByFace = async (orgId, empId, imageBase64, threshold = 0.6) => {
  const recognition = await recognizeFace(orgId, imageBase64);

  if (!recognition || !recognition.matches || recognition.matches.length === 0) {
    return {
      verified: false,
      confidence: 0,
      message: 'No matching face found',
    };
  }

  const bestMatch = recognition.matches[0];
  const verified = bestMatch.confidence >= threshold && bestMatch.empId === empId;

  return {
    verified,
    confidence: bestMatch.confidence,
    empId: bestMatch.empId,
    message: verified ? 'Face verified' : 'Face does not match employee',
  };
};

module.exports = {
  enrollFace,
  recognizeFace,
  getEmployeeFaceData,
  deleteEmployeeFaceData,
  verifyAttendanceByFace,
};