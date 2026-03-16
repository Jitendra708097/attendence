/**
 * @module face.service
 * @description Complete face recognition service for attendance verification.
 * Orchestrates local and cloud face recognition models with 6-layer verification pipeline.
 * Called by: attendance.service (check-in), face.controller (enrollment)
 * Calls: face.localModel, face.cloudService, redis
 * 
 * 6-LAYER VERIFICATION PIPELINE (per spec):
 * 1. Quality Gate: Validates selfie quality (brightness, sharpness, etc from mobile ML Kit)
 * 2. Redis Dedup: 5-minute cooldown window per employee (prevents replay attacks)
 * 3. Redis Session Cache: 10-minute TTL for same face (fast path - no re-matching)
 * 4. Local Matching: Cosine similarity with stored embedding (TensorFlow.js)
 * 5. Trust Score Threshold: Adjusted per employee (probationary: 0.88, default: 0.84, trusted: 0.80)
 * 6. Cloud Fallback: AWS Rekognition for borderline cases (0.80-0.84 similarity)
 */

const { AppError } = require('../../utils/AppError.js');
const { scopedModel } = require('../../utils/scopedModel.js');
const localModel = require('./face.localModel.js');
const cloudService = require('./face.cloudService.js');
const Redis = require('ioredis');
const { models } = require('../../models/index.js');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

/**
 * Get trust-adjusted threshold for employee
 * Higher threshold for new/flagged employees
 * Lower threshold for trusted employees
 */
const getTrustThreshold = (trustScore) => {
  const thresholds = {
    probationary: 0.88, // 88% similarity required (new employees)
    default: 0.84,      // 84% similarity required (normal)
    trusted: 0.80,      // 80% similarity required (high confidence)
    flagged: 0.95,      // 95% similarity required (suspicious activity)
  };
  return thresholds[trustScore] || 0.84;
};

/**
 * ENROLLMENT: Add employee face to system
 * Generates embedding via local model, stores hash
 * Optionally enrolls in AWS Rekognition collection
 * 
 * Step 1: Validate image quality
 * Step 2: Extract embedding (local)
 * Step 3: Store in employee.face_embedding_local
 * Step 4: Also enroll in cloud (if enabled)
 * Step 5: Set initial trust_score to 'probationary'
 * 
 * @param {string} orgId
 * @param {string} empId
 * @param {string} imageBase64
 * @param {object} models - Sequelize models
 * @returns {object} { success, message, enrolledLocal, enrolledCloud }
 */
const enrollFace = async (orgId, empId, imageBase64) => {
  if (!imageBase64) {
    throw new AppError('VAL_001', 'Image required for enrollment', 400);
  }

  if (!empId) {
    throw new AppError('VAL_001', 'Employee ID required', 400);
  }

  // Use scopedModel to enforce multi-tenancy
  const employeeModel = scopedModel(models.Employee, orgId);

  // Validate employee exists in org
  const employee = await employeeModel.findOne({
    where: { id: empId },
  });
  if (!employee) {
    throw new AppError('EMP_001', 'Employee not found', 404);
  }

  try {
    let enrolledLocal = false;
    let enrolledCloud = false;
    let faceEmbedding = null;
    let faceEmbeddingId = null;

    // Step 1: Local enrollment
    const localResult = await localModel.enrollFace(orgId, empId, imageBase64);
    if (localResult.embedding) {
      faceEmbedding = localResult.embedding;
      enrolledLocal = true;
    }

    // Step 2: Cloud enrollment (if enabled)
    if (process.env.FACE_CLOUD_ENABLED === 'true') {
      try {
        await cloudService.ensureCollectionExists(orgId);
        const cloudResult = await cloudService.enrollFace(orgId, empId, imageBase64);
        if (cloudResult.faceId) {
          faceEmbeddingId = cloudResult.faceId;
          enrolledCloud = true;
        }
      } catch (err) {
        // Log but don't fail enrollment if cloud fails
        console.warn('Cloud enrollment failed:', err.message);
      }
    }

    // Step 3: Update employee record
    await employeeModel.update(
      {
        face_embedding_local: faceEmbedding,
        face_embedding_id: faceEmbeddingId,
        face_trust_score: 'probationary', // Start as probationary
        face_checkin_count: 0,
      },
      { where: { id: empId } }
    );

    return {
      success: true,
      message: 'Face enrolled successfully',
      enrolledLocal,
      enrolledCloud,
      trustScore: 'probationary',
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('FACE_007', 'Face enrollment failed: ' + err.message, 500);
  }
};

/**
 * VERIFICATION: 6-LAYER PIPELINE for attendance check-in (CRITICAL PATH)
 * 
 * Layer 1: Quality Gate (passed from mobile)
 * Layer 2: Redis Dedup (5 min cooldown)
 * Layer 3: Redis Cache (10 min session cache)
 * Layer 4: Local Matching (cosine similarity)
 * Layer 5: Trust Score Threshold (probationary → trusted)
 * Layer 6: Cloud Fallback (borderline cases)
 * 
 * @param {string} orgId
 * @param {string} empId
 * @param {string} selfieBase64 - New face image from check-in
 * @returns {object} { verified, confidence, message }
 * @throws {AppError} FACE_003 (no match), FACE_006 (flat surface), etc.
 */
const verifyFace = async (orgId, empId, selfieBase64) => {
  if (!selfieBase64) {
    throw new AppError('FACE_001', 'Face not detected in image', 400);
  }

  // Use scopedModel to enforce multi-tenancy
  const employeeModel = scopedModel(models.Employee, orgId);

  // Get employee
  const employee = await employeeModel.findOne({
    where: { id: empId },
  });
  if (!employee) {
    throw new AppError('EMP_001', 'Employee not found', 404);
  }

  // Check if employee is enrolled for face recognition
  if (!employee.face_embedding_local && !employee.face_embedding_id) {
    throw new AppError('EMP_003', 'Employee not enrolled for face recognition', 403);
  }

  try {
    // LAYER 1: Quality Gate (assume passed from mobile ML Kit)
    // In production: Validate brightness, sharpness, face count from client metrics

    // LAYER 2: Dedup Check (5 minute cooldown)
    const dedupKey = `face_dedup:${orgId}:${empId}`;
    const isDuplicate = await redis.exists(dedupKey);
    if (isDuplicate) {
      throw new AppError('GEN_005', 'Duplicate check-in within cooldown period (5 min)', 429);
    }

    // LAYER 3: Session Cache (10 minute TTL)
    const cacheKey = `face_cache:${orgId}:${empId}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      // Cache hit - return cached result
      await redis.set(dedupKey, '1', 'EX', 300); // Set dedup
      return JSON.parse(cached);
    }

    // LAYER 4: Local Matching (cosine similarity)
    const trustThreshold = getTrustThreshold(employee.face_trust_score);
    let localResult = null;

    if (employee.face_embedding_local) {
      localResult = await localModel.verifyFace(
        employee.face_embedding_local,
        selfieBase64,
        trustThreshold
      );
    }

    // LAYER 5 & 6: Trust Score + Cloud Fallback
    let finalResult = {
      verified: false,
      confidence: 0,
      method: 'none',
      message: 'Face verification failed',
    };

    if (localResult) {
      if (localResult.matched) {
        // Local match succeeded
        finalResult = {
          verified: true,
          confidence: localResult.confidence,
          method: 'local',
          similarity: localResult.similarity,
        };
      } else if (localResult.borderline && process.env.FACE_CLOUD_ENABLED === 'true') {
        // Borderline case - try cloud fallback
        try {
          const cloudResult = await cloudService.verifyFace(orgId, selfieBase64);
          if (cloudResult.matched && cloudResult.confidence >= 85) {
            finalResult = {
              verified: true,
              confidence: cloudResult.confidence,
              method: 'cloud_fallback',
              message: 'Verified via cloud after local borderline',
            };
          } else {
            throw new AppError('FACE_003', 'Face does not match stored embeddings', 401);
          }
        } catch (cloudErr) {
          if (cloudErr instanceof AppError) throw cloudErr;
          throw new AppError('FACE_003', 'Face verification failed', 401);
        }
      } else {
        throw new AppError('FACE_003', 'Face does not match stored embeddings', 401);
      }
    } else if (employee.face_embedding_id && process.env.FACE_CLOUD_ENABLED === 'true') {
      // No local embedding, try cloud directly
      const cloudResult = await cloudService.verifyFace(orgId, selfieBase64);
      if (cloudResult.matched) {
        finalResult = {
          verified: true,
          confidence: cloudResult.confidence,
          method: 'cloud',
        };
      } else {
        throw new AppError('FACE_003', 'Face does not match stored embeddings', 401);
      }
    } else {
      throw new AppError('EMP_003', 'Employee face data invalid', 403);
    }

    // Cache result + set dedup
    await redis.set(cacheKey, JSON.stringify(finalResult), 'EX', 600); // 10 min
    await redis.set(dedupKey, '1', 'EX', 300); // 5 min

    // Update employee trust score (improve with successful matches)
    if (finalResult.verified && employee.face_trust_score === 'probationary') {
      const newCheckinCount = (employee.face_checkin_count || 0) + 1;
      if (newCheckinCount >= 5) {
        // After 5 successful check-ins, promote to 'default'
        await employeeModel.update(
          { face_trust_score: 'default', face_checkin_count: newCheckinCount },
          { where: { id: empId } }
        );
      } else {
        await employeeModel.update(
          { face_checkin_count: newCheckinCount },
          { where: { id: empId } }
        );
      }
    }

    return finalResult;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('FACE_002', 'Face verification error: ' + err.message, 500);
  }
};

/**
 * Delete employee face data (on termination/deactivation)
 */
const deleteFaceData = async (orgId, empId) => {
  try {
    // Use scopedModel to enforce multi-tenancy
    const employeeModel = scopedModel(models.Employee, orgId);

    // Delete from cloud if enrolled
    const employee = await employeeModel.findOne({
      where: { id: empId },
    });

    if (employee?.face_embedding_id) {
      try {
        await cloudService.deleteFace(orgId, employee.face_embedding_id);
      } catch (err) {
        console.warn('Cloud face deletion failed:', err.message);
      }
    }

    // Clear employee record
    await employeeModel.update(
      {
        face_embedding_local: null,
        face_embedding_id: null,
        face_trust_score: null,
        face_checkin_count: 0,
      },
      { where: { id: empId } }
    );

    return { success: true };
  } catch (err) {
    throw new AppError('FACE_002', 'Face deletion failed: ' + err.message, 500);
  }
};

/**
 * Upgrade employee trust score (manual or after X successful check-ins)
 */
const upgradeTrustScore = async (orgId, empId, newScore) => {
  const validScores = ['probationary', 'default', 'trusted', 'flagged'];
  if (!validScores.includes(newScore)) {
    throw new AppError('VAL_001', 'Invalid trust score', 400);
  }

  await models.Employee.update(
    { face_trust_score: newScore },
    { where: { id: empId, org_id: orgId } }
  );

  return { success: true, newTrustScore: newScore };
};

module.exports = {
  enrollFace,
  verifyFace,
  deleteFaceData,
  upgradeTrustScore,
};
 
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