/**
 * @module FaceEnrollScreen
 * @description 3-selfie face enrollment flow.
 *              Auto-detects face quality via expo-face-detector (ML Kit).
 *              Captures 3 selfies, uploads to /face/enroll, polls status.
 *              Progress: Step 1 of 3 → Step 2 of 3 → Step 3 of 3 → Done.
 *              No back button — employee must complete enrollment.
 *              Called by: AuthNavigator, MainNavigator (when !faceEnrolled).
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Alert,} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FaceDetector from 'expo-face-detector';

import useAuthStore from '../../store/authStore.js';
import api          from '../../api/axiosInstance.js';
import AppButton    from '../../components/common/AppButton.jsx';
import { LoadingOverlay } from '../../components/common/CommonComponents.jsx';
import { validateFaceQuality, compressSelfie, getLiveFaceDetectorConfig } from '../../services/faceService.js';
import { colors }    from '../../theme/colors.js';
import { typography }from '../../theme/typography.js';
import { spacing }   from '../../theme/spacing.js';
import { API_ROUTES }from '../../utils/constants.js';

const TOTAL_STEPS   = 3;
const POLL_INTERVAL = 3000;

const STEP_INSTRUCTIONS = [
  'Look directly at the camera',
  'Slightly tilt your head left',
  'Slightly tilt your head right',
];

const FaceEnrollScreen = ({ navigation }) => {
  const markFaceEnrolled = useAuthStore((s) => s.markFaceEnrolled);

  const [permission, requestPermission] = useCameraPermissions();
  const [step,       setStep]      = useState(0);         // 0-based, 0–2
  const [captured,   setCaptured]  = useState([]);        // base64 images
  const [quality,    setQuality]   = useState(null);      // { valid, reason }
  const [isCapturing,setCapturing] = useState(false);
  const [isUploading,setUploading] = useState(false);
  const [isDone,     setDone]      = useState(false);
  const [statusMsg,  setStatusMsg] = useState('');

  const cameraRef  = useRef(null);
  const pollRef    = useRef(null);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
    return () => clearInterval(pollRef.current);
  }, []);

  // Auto-capture when quality is good
  const handleFacesDetected = async ({ faces }) => {
    if (isCapturing || captured.length !== step) return;
    if (!faces || faces.length === 0) {
      setQuality({ valid: false, reason: 'No face detected. Please look at camera.' });
      return;
    }
    if (faces.length > 1) {
      setQuality({ valid: false, reason: 'Multiple faces. Only you should be in frame.' });
      return;
    }

    const face = faces[0];
    const area = face.bounds.size.width * face.bounds.size.height;
    const leftOpen  = face.leftEyeOpenProbability  ?? 1;
    const rightOpen = face.rightEyeOpenProbability ?? 1;

    if (area < 8000) {
      setQuality({ valid: false, reason: 'Too far — move closer.' }); return;
    }
    if (Math.abs(face.yawAngle) > 30 && step === 0) {
      setQuality({ valid: false, reason: 'Face the camera directly.' }); return;
    }
    if (leftOpen < 0.4 || rightOpen < 0.4) {
      setQuality({ valid: false, reason: 'Keep your eyes open.' }); return;
    }

    setQuality({ valid: true, reason: '' });

    // Auto-capture after brief quality confirmation
    setCapturing(true);
    try {
      const photo   = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: false });
      const compressed = await compressSelfie(photo.uri);

      const nextCaptured = [...captured, compressed.base64];
      setCaptured(nextCaptured);

      if (nextCaptured.length < TOTAL_STEPS) {
        setStep(nextCaptured.length);
        setQuality(null);
      } else {
        // All 3 captured — upload
        await uploadEnrollment(nextCaptured);
      }
    } catch (e) {
      setQuality({ valid: false, reason: 'Capture failed. Please try again.' });
    } finally {
      setCapturing(false);
    }
  };

  const uploadEnrollment = async (images) => {
    setUploading(true);
    setStatusMsg('Submitting enrollment...');
    try {
      await api.post(API_ROUTES.FACE_ENROLL, { images });
      pollEnrollmentStatus();
    } catch {
      setUploading(false);
      setStatusMsg('Upload failed. Please try again.');
    }
  };

  const pollEnrollmentStatus = () => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get(API_ROUTES.FACE_ENROLL_STATUS);
        const { status } = res.data.data;

        if (status === 'completed') {
          clearInterval(pollRef.current);
          setDone(true);
          setUploading(false);
          await markFaceEnrolled();
          setTimeout(() => navigation.replace('Tabs'), 1500);
        } else if (status === 'failed') {
          clearInterval(pollRef.current);
          setUploading(false);
          setStatusMsg('Enrollment failed. Please try again.');
          setCaptured([]);
          setStep(0);
        }
      } catch {
        clearInterval(pollRef.current);
        setUploading(false);
      }
    }, POLL_INTERVAL);
  };

  if (!permission) return <View style={styles.safe} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.permissionBlock}>
          <Text style={styles.permEmoji}>📷</Text>
          <Text style={styles.permTitle}>Camera Access Needed</Text>
          <Text style={styles.permSub}>AttendEase needs camera access to enroll your face.</Text>
          <AppButton label="Grant Permission" onPress={requestPermission} style={{ marginTop: spacing.xl }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Progress */}
      <View style={styles.progressBar}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[
              styles.progressSegment,
              i <= (isDone ? 2 : step) && styles.progressActive,
            ]}
          />
        ))}
      </View>
      <Text style={styles.stepLabel}>
        {isDone ? 'Enrollment Complete ✅' : `Step ${step + 1} of ${TOTAL_STEPS}`}
      </Text>

      {/* Camera */}
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="front"
          onFacesDetected={handleFacesDetected}
          faceDetectorSettings={getLiveFaceDetectorConfig()}
        />

        {/* Oval face guide */}
        <View style={styles.ovalGuide} />

        {/* Quality feedback */}
        <View style={styles.feedbackBox}>
          {quality?.valid === false && (
            <Text style={styles.feedbackBad}>⚠ {quality.reason}</Text>
          )}
          {quality?.valid === true && (
            <Text style={styles.feedbackGood}>✓ Good — capturing...</Text>
          )}
          {!quality && (
            <Text style={styles.feedbackNeutral}>{STEP_INSTRUCTIONS[step]}</Text>
          )}
        </View>
      </View>

      {/* Thumbnail strip */}
      <View style={styles.thumbRow}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[styles.thumb, captured.length > i && styles.thumbDone]}
          >
            <Text style={styles.thumbText}>{captured.length > i ? '✓' : (i + 1)}</Text>
          </View>
        ))}
      </View>

      {isUploading && (
        <LoadingOverlay message={statusMsg || 'Processing...'} subMessage="This may take a few seconds" />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.textPrimary },

  progressBar: {
    flexDirection:   'row',
    paddingHorizontal: spacing.xl,
    paddingTop:      spacing.base,
    gap:             spacing.sm,
  },
  progressSegment: {
    flex:         1,
    height:       4,
    borderRadius: 2,
    backgroundColor: colors.bgSubtle,
  },
  progressActive: { backgroundColor: colors.accent },
  stepLabel: {
    fontFamily: typography.fontSemiBold,
    fontSize:   typography.base,
    color:      colors.textInverse,
    textAlign:  'center',
    marginTop:  spacing.sm,
    marginBottom: spacing.base,
  },

  cameraContainer: {
    flex:     1,
    position: 'relative',
  },
  camera: { flex: 1 },
  ovalGuide: {
    position:     'absolute',
    top:          '10%',
    left:         '15%',
    right:        '15%',
    bottom:       '20%',
    borderRadius: 200,
    borderWidth:  3,
    borderColor:  colors.accent,
    borderStyle:  'dashed',
  },
  feedbackBox: {
    position:        'absolute',
    bottom:          spacing.xl,
    left:            spacing.base,
    right:           spacing.base,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius:    12,
    padding:         spacing.md,
    alignItems:      'center',
  },
  feedbackNeutral: {
    fontFamily: typography.fontMedium,
    fontSize:   typography.base,
    color:      colors.textInverse,
    textAlign:  'center',
  },
  feedbackGood: {
    fontFamily: typography.fontSemiBold,
    fontSize:   typography.base,
    color:      colors.success,
    textAlign:  'center',
  },
  feedbackBad: {
    fontFamily: typography.fontSemiBold,
    fontSize:   typography.sm,
    color:      colors.dangerLight,
    textAlign:  'center',
  },

  thumbRow: {
    flexDirection:  'row',
    justifyContent: 'center',
    padding:        spacing.xl,
    gap:            spacing.base,
  },
  thumb: {
    width:           48,
    height:          48,
    borderRadius:    24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth:     2,
    borderColor:     'rgba(255,255,255,0.3)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  thumbDone: {
    backgroundColor: colors.accent,
    borderColor:     colors.accent,
  },
  thumbText: {
    fontFamily: typography.fontBold,
    fontSize:   typography.base,
    color:      colors.textInverse,
  },

  // Permission screen
  permissionBlock: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    padding:        spacing['2xl'],
  },
  permEmoji: { fontSize: 56, marginBottom: spacing.base },
  permTitle: {
    fontFamily: typography.fontBold,
    fontSize:   typography.xl,
    color:      colors.textPrimary,
    marginBottom: spacing.sm,
  },
  permSub: {
    fontFamily: typography.fontRegular,
    fontSize:   typography.base,
    color:      colors.textSecondary,
    textAlign:  'center',
  },
});

export default FaceEnrollScreen;
