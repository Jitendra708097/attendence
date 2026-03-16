/**
 * @module face.cloudService
 * @description Cloud-based face recognition service using AWS Rekognition.
 * Called by: face.service (as fallback for borderline cases)
 * 
 * AWS Rekognition provides:
 *   - SearchFacesByImage(): Find matching faces in collection (99%+ accuracy)
 *   - Confidence scores (0-100)
 *   - Liveness detection (if needed)
 *   - Explicit content filtering
 * 
 * Collection ID pattern: {orgId}-faces
 */

const AWS = require('aws-sdk');
const { AppError } = require('../../utils/AppError.js');

/**
 * Configure AWS Rekognition
 */
const rekognition = new AWS.Rekognition({
  region: process.env.AWS_REGION || 'ap-south-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

/**
 * Get AWS Rekognition collection ID for organisation
 */
const getCollectionId = (orgId) => {
  return `attendease-${orgId.substring(0, 8)}`;
};

/**
 * Enroll employee face in AWS Rekognition collection
 * Creates a face ID for faster subsequent retrievals
 * 
 * Step 1: Index face image in collection
 * Step 2: Store face ID on employee record
 * Step 3: Store external image ID (emp_id for easy lookup)
 * 
 * @param {string} orgId
 * @param {string} empId
 * @param {string} imageBase64
 * @returns {object} { faceId, confidence }
 */
const enrollFace = async (orgId, empId, imageBase64) => {
  if (!imageBase64) {
    throw new AppError('VAL_001', 'Image required for enrollment', 400);
  }

  try {
    const collectionId = getCollectionId(orgId);

    // Decode base64 to buffer
    const imageBuffer = Buffer.from(imageBase64, 'base64');

    // Index face in collection
    const params = {
      CollectionId: collectionId,
      Image: { Bytes: imageBuffer },
      ExternalImageId: empId,
      DetectionAttributes: ['ALL'],
    };

    const response = await rekognition.indexFaces(params).promise();

    if (!response.FaceRecords || response.FaceRecords.length === 0) {
      throw new Error('No face detected in image');
    }

    const faceRecord = response.FaceRecords[0];
    const confidence = faceRecord.FaceDetail.Confidence;

    if (confidence < 80) {
      throw new AppError('FACE_002', 'Face quality too low', 400);
    }

    return {
      faceId: faceRecord.Face.FaceId,
      confidence: Math.round(confidence),
      message: 'Face enrolled in cloud successfully',
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('FACE_007', 'Cloud enrollment failed: ' + err.message, 500);
  }
};

/**
 * Verify employee face using AWS Rekognition
 * Searches for the best match in the organisation's face collection
 * Used as fallback for borderline cases (similarity 0.80-0.84)
 * 
 * Step 1: Search for matching faces in collection
 * Step 2: Return top match with confidence
 * Step 3: Confidence >90% = trusted match, <80% = reject
 * 
 * @param {string} orgId
 * @param {string} imageBase64
 * @returns {object} { matched, confidence, faceId }
 */
const verifyFace = async (orgId, imageBase64) => {
  if (!imageBase64) {
    throw new AppError('FACE_001', 'Face not detected in image', 400);
  }

  try {
    const collectionId = getCollectionId(orgId);

    // Decode base64 to buffer
    const imageBuffer = Buffer.from(imageBase64, 'base64');

    // Search for matching faces
    const params = {
      CollectionId: collectionId,
      Image: { Bytes: imageBuffer },
      MaxFaces: 5,
      FaceMatchThreshold: 80, // AWS confidence threshold
    };

    const response = await rekognition.searchFacesByImage(params).promise();

    if (!response.FaceMatches || response.FaceMatches.length === 0) {
      return {
        matched: false,
        confidence: 0,
        message: 'No matching face found',
      };
    }

    const topMatch = response.FaceMatches[0];
    const confidence = Math.round(topMatch.Similarity);

    return {
      matched: confidence >= 85, // ~97% match
      confidence,
      faceId: topMatch.Face.FaceId,
      externalImageId: topMatch.Face.ExternalImageId,
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('FACE_002', 'Cloud verification failed: ' + err.message, 500);
  }
};

/**
 * Delete face from AWS Rekognition collection
 * Called on employee deactive/termination
 */
const deleteFace = async (orgId, faceId) => {
  if (!faceId) {
    throw new AppError('VAL_001', 'Face ID required', 400);
  }

  try {
    const collectionId = getCollectionId(orgId);

    const params = {
      CollectionId: collectionId,
      FaceIds: [faceId],
    };

    await rekognition.deleteFaces(params).promise();

    return { success: true };
  } catch (err) {
    throw new AppError('FACE_002', 'Failed to delete face: ' + err.message, 500);
  }
};

/**
 * Check if collection exists, create if not
 */
const ensureCollectionExists = async (orgId) => {
  const collectionId = getCollectionId(orgId);

  try {
    // Try to describe collection (fast check)
    await rekognition.describeCollection({ CollectionId: collectionId }).promise();
    return { exists: true };
  } catch (err) {
    if (err.code === 'ResourceNotFoundException') {
      // Create collection
      try {
        await rekognition.createCollection({ CollectionId: collectionId }).promise();
        return { exists: false, created: true };
      } catch (createErr) {
        throw new AppError('FACE_001', 'Failed to create collection: ' + createErr.message, 500);
      }
    }
    throw err;
  }
};

module.exports = {
  enrollFace,
  verifyFace,
  deleteFace,
  ensureCollectionExists,
};
