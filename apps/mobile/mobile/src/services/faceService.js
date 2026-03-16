/**
 * @module faceService
 * @description ML Kit face quality validation using expo-face-detector.
 *              Checks presence, count, size, centering, tilt, and eyes open.
 *              Also handles liveness challenge detection (blink, turn, smile).
 *              Does NOT perform recognition — that happens on the backend.
 *              Called by: FaceEnrollScreen, LivenessChallenge screen.
 */

import * as FaceDetector from 'expo-face-detector';
import * as ImageManipulator from 'expo-image-manipulator';

/** Shared detector config for accurate mode with full classifications */
const DETECTOR_CONFIG = {
  mode:              FaceDetector.FaceDetectorMode.accurate,
  detectLandmarks:   FaceDetector.FaceDetectorLandmarks.none,
  runClassifications: FaceDetector.FaceDetectorClassifications.all,
};

/**
 * Validate face quality in a captured photo URI.
 * @param {string} photoUri - local file URI from expo-camera
 * @returns {Promise<{ valid: boolean, reason: string, face?: object }>}
 */
export const validateFaceQuality = async (photoUri) => {
  const result = await FaceDetector.detectFacesAsync(photoUri, DETECTOR_CONFIG);

  if (result.faces.length === 0) {
    return { valid: false, reason: 'No face detected. Please look directly at the camera.' };
  }

  if (result.faces.length > 1) {
    return { valid: false, reason: 'Multiple faces detected. Only you should be in frame.' };
  }

  const face = result.faces[0];
  const area = face.bounds.size.width * face.bounds.size.height;

  // Minimum face area — too far away
  if (area < 8000) {
    return { valid: false, reason: 'Too far away. Please move closer to the camera.' };
  }

  // Face not centred (yaw angle — left/right rotation)
  if (Math.abs(face.yawAngle) > 25) {
    return { valid: false, reason: 'Please face the camera directly. Do not turn your head.' };
  }

  // Phone tilted (roll angle)
  if (Math.abs(face.rollAngle) > 20) {
    return { valid: false, reason: 'Please hold your phone upright.' };
  }

  // Eyes must be open
  const leftOpen  = face.leftEyeOpenProbability  ?? 1;
  const rightOpen = face.rightEyeOpenProbability ?? 1;
  if (leftOpen < 0.4 || rightOpen < 0.4) {
    return { valid: false, reason: 'Please keep your eyes open.' };
  }

  return { valid: true, reason: '', face };
};

/**
 * Detect liveness challenge completion from live face data.
 * Called in real-time from expo-face-detector onFacesDetected callback.
 *
 * @param {object} face        - Single face object from FaceDetector
 * @param {string} challenge   - 'blink' | 'turn_left' | 'turn_right' | 'smile'
 * @param {number} baselineYaw - Yaw angle at challenge start (for turn detection)
 * @returns {{ completed: boolean, newBaseline?: number }}
 */
export const detectChallengeCompletion = (face, challenge, baselineYaw = 0) => {
  if (!face) return { completed: false };

  switch (challenge) {
    case 'blink': {
      const leftClosed  = (face.leftEyeOpenProbability  ?? 1) < 0.3;
      const rightClosed = (face.rightEyeOpenProbability ?? 1) < 0.3;
      return { completed: leftClosed && rightClosed };
    }

    case 'turn_left': {
      const yaw = face.yawAngle ?? 0;
      // Turning left = positive yaw on most devices
      return { completed: yaw > 20 };
    }

    case 'turn_right': {
      const yaw = face.yawAngle ?? 0;
      // Turning right = negative yaw
      return { completed: yaw < -20 };
    }

    case 'smile': {
      const smiling = face.smilingProbability ?? 0;
      return { completed: smiling > 0.7 };
    }

    default:
      return { completed: false };
  }
};

/**
 * Compress a selfie image for upload.
 * Target: max 800px wide, 70% quality JPEG.
 * @param {string} uri - local photo URI
 * @returns {Promise<{ uri: string, base64: string }>}
 */
export const compressSelfie = async (uri) => {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 800 } }],
    {
      compress: 0.7,
      format:   ImageManipulator.SaveFormat.JPEG,
      base64:   true,
    }
  );
  return { uri: result.uri, base64: result.base64 };
};

/**
 * Get the face detector config for use in Camera onFacesDetected.
 * @returns {object} FaceDetector options
 */
export const getLiveFaceDetectorConfig = () => ({
  mode:               FaceDetector.FaceDetectorMode.fast,
  detectLandmarks:    FaceDetector.FaceDetectorLandmarks.none,
  runClassifications: FaceDetector.FaceDetectorClassifications.all,
  minDetectionInterval: 100,  // ms between detections
  tracking: true,
});
