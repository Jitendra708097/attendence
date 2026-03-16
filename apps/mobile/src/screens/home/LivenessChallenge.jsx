/**
 * @module LivenessChallenge
 * @description Liveness challenge camera screen before check-in.
 *              Flow:
 *                1. POST /attendance/request-checkin → challengeToken + challenge action
 *                2. Camera opens (front-facing, full screen)
 *                3. Random challenge shown: blink / turn_left / turn_right / smile
 *                4. ML Kit detects completion in real-time
 *                5. Auto-captures selfie on success
 *                6. Quality validation
 *                7. Compress + POST /attendance/checkin
 *              Timeout: 15 seconds per challenge.
 *              Cancel: X button top-right.
 *              Called by: HomeScreen "Mark Attendance" button press.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';

import useAttendanceStore from '../../store/attendanceStore.js';
import useNetworkStatus   from '../../hooks/useNetworkStatus.js';
import { LoadingOverlay } from '../../components/common/CommonComponents.jsx';
import {
  detectChallengeCompletion,
  compressSelfie,
  getLiveFaceDetectorConfig,
} from '../../services/faceService.js';
import { getVerifiedLocation } from '../../services/locationService.js';
import { colors }    from '../../theme/colors.js';
import { typography }from '../../theme/typography.js';
import { spacing }   from '../../theme/spacing.js';
import {
  LIVENESS_CHALLENGES,
  LIVENESS_CHALLENGE_LABELS,
  SESSION,
} from '../../utils/constants.js';

const CHALLENGE_ICONS = {
  blink:      '👁',
  turn_left:  '⬅',
  turn_right: '➡',
  smile:      '😊',
};

const LivenessChallenge = ({ navigation }) => {
  const requestCheckIn = useAttendanceStore((s) => s.requestCheckIn);
  const checkIn        = useAttendanceStore((s) => s.checkIn);
  const isLoading      = useAttendanceStore((s) => s.isLoading);
  const storeError     = useAttendanceStore((s) => s.error);
  const clearError     = useAttendanceStore((s) => s.clearError);
  const isOnline       = useNetworkStatus();

  const [permission, requestPermission] = useCameraPermissions();
  const [challenge,      setChallenge]      = useState(null);
  const [challengeToken, setChallengeToken] = useState(null);
  const [isReady,        setIsReady]        = useState(false);   // challenge loaded
  const [completed,      setCompleted]      = useState(false);
  const [timeoutLeft,    setTimeoutLeft]    = useState(15);
  const [loadingMsg,     setLoadingMsg]     = useState('');
  const [error,          setError]          = useState('');

  const cameraRef   = useRef(null);
  const capturing   = useRef(false);
  const timerRef    = useRef(null);
  const locationRef = useRef(null);

  // Boot: get challenge token + prefetch GPS
  useEffect(() => {
    if (!permission?.granted) { requestPermission(); return; }
    initChallenge();
    prefetchLocation();
    return () => { clearInterval(timerRef.current); clearError(); };
  }, [permission?.granted]);

  const initChallenge = async () => {
    const result = await requestCheckIn();
    if (!result.success) { setError(result.error); return; }
    setChallenge(result.data.challenge);
    setChallengeToken(result.data.challengeToken);
    setIsReady(true);
    startTimer();
  };

  const prefetchLocation = async () => {
    try {
      locationRef.current = await getVerifiedLocation();
    } catch (e) {
      locationRef.current = null;
    }
  };

  const startTimer = () => {
    setTimeoutLeft(15);
    timerRef.current = setInterval(() => {
      setTimeoutLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setError('Challenge timed out. Please try again.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleFacesDetected = useCallback(async ({ faces }) => {
    if (!isReady || completed || capturing.current || !challenge) return;
    if (!faces || faces.length !== 1) return;

    const result = detectChallengeCompletion(faces[0], challenge);
    if (!result.completed) return;

    // Challenge completed!
    capturing.current = true;
    clearInterval(timerRef.current);
    setCompleted(true);
    setLoadingMsg('Verifying identity...');

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85, base64: false });
      const { base64 } = await compressSelfie(photo.uri);

      // Verify we have GPS
      let location = locationRef.current;
      if (!location) {
        setLoadingMsg('Checking location...');
        location = await getVerifiedLocation();
      }

      const result2 = await checkIn({
        selfieBase64:   base64,
        location,
        challengeToken,
        isOnline,
      });

      if (result2.success) {
        navigation.goBack();
      } else {
        setError(result2.error);
        setCompleted(false);
        capturing.current = false;
        setLoadingMsg('');
        // Retry challenge
        setIsReady(false);
        await initChallenge();
      }
    } catch (e) {
      setError(e.message === 'MOCK_LOCATION'
        ? 'Mock location detected. Please disable fake GPS.'
        : 'Something went wrong. Please try again.');
      setCompleted(false);
      capturing.current = false;
      setLoadingMsg('');
    }
  }, [isReady, completed, challenge, challengeToken, isOnline]);

  const handleCancel = () => {
    clearInterval(timerRef.current);
    clearError();
    navigation.goBack();
  };

  if (!permission?.granted) {
    return (
      <SafeAreaView style={styles.dark}>
        <View style={styles.center}>
          <Text style={styles.permText}>Camera permission required.</Text>
          <TouchableOpacity onPress={requestPermission} style={styles.grantBtn}>
            <Text style={styles.grantText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.dark}>
      {/* Close button */}
      <TouchableOpacity onPress={handleCancel} style={styles.closeBtn}>
        <Text style={styles.closeIcon}>✕</Text>
      </TouchableOpacity>

      {/* Camera */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="front"
        onFacesDetected={handleFacesDetected}
        faceDetectorSettings={getLiveFaceDetectorConfig()}
      />

      {/* Oval guide */}
      <View style={styles.ovalGuide} />

      {/* Challenge instruction */}
      {isReady && !completed && !error && (
        <View style={styles.challengeBox}>
          <Text style={styles.challengeIcon}>
            {CHALLENGE_ICONS[challenge] || '👁'}
          </Text>
          <Text style={styles.challengeText}>
            {LIVENESS_CHALLENGE_LABELS[challenge] || 'Follow the instruction'}
          </Text>

          {/* Timeout countdown */}
          <View style={styles.timerBar}>
            <View style={[styles.timerFill, { width: `${(timeoutLeft / 15) * 100}%` }]} />
          </View>
          <Text style={styles.timerText}>{timeoutLeft}s</Text>
        </View>
      )}

      {/* Error state */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠ {error}</Text>
          <TouchableOpacity onPress={handleCancel} style={styles.retryBtn}>
            <Text style={styles.retryText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading overlay during API call */}
      {(loadingMsg || isLoading) && (
        <LoadingOverlay
          message={loadingMsg || 'Verifying...'}
          subMessage="Checking location..."
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  dark:   { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },

  closeBtn: {
    position:        'absolute',
    top:             spacing.xl,
    right:           spacing.base,
    zIndex:          10,
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  closeIcon: {
    fontFamily: typography.fontBold,
    fontSize:   typography.md,
    color:      colors.textInverse,
  },

  ovalGuide: {
    position:        'absolute',
    top:             '12%',
    left:            '12%',
    right:           '12%',
    bottom:          '28%',
    borderRadius:    200,
    borderWidth:     2.5,
    borderColor:     colors.accent,
    zIndex:          5,
  },

  challengeBox: {
    position:        'absolute',
    bottom:          spacing['3xl'],
    left:            spacing.base,
    right:           spacing.base,
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderRadius:    16,
    padding:         spacing.xl,
    alignItems:      'center',
    zIndex:          10,
  },
  challengeIcon: { fontSize: 40, marginBottom: spacing.sm },
  challengeText: {
    fontFamily:  typography.fontBold,
    fontSize:    typography.xl,
    color:       colors.textInverse,
    marginBottom: spacing.base,
  },
  timerBar: {
    width:           '100%',
    height:          4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius:    2,
    overflow:        'hidden',
    marginBottom:    spacing.xs,
  },
  timerFill: {
    height:          4,
    backgroundColor: colors.accent,
  },
  timerText: {
    fontFamily: typography.fontMono,
    fontSize:   typography.sm,
    color:      colors.textMuted,
  },

  errorBox: {
    position:        'absolute',
    bottom:          spacing['3xl'],
    left:            spacing.base,
    right:           spacing.base,
    backgroundColor: 'rgba(220,38,38,0.9)',
    borderRadius:    16,
    padding:         spacing.xl,
    alignItems:      'center',
    zIndex:          10,
  },
  errorText: {
    fontFamily:  typography.fontSemiBold,
    fontSize:    typography.base,
    color:       colors.textInverse,
    textAlign:   'center',
    marginBottom: spacing.base,
  },
  retryBtn: {
    backgroundColor: colors.textInverse,
    borderRadius:    10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  retryText: {
    fontFamily: typography.fontSemiBold,
    fontSize:   typography.base,
    color:      colors.danger,
  },

  permText: { color: colors.textInverse, fontFamily: typography.fontRegular, fontSize: typography.base },
  grantBtn: { marginTop: spacing.base, backgroundColor: colors.accent, borderRadius: 12, padding: spacing.base },
  grantText: { color: colors.textInverse, fontFamily: typography.fontSemiBold, fontSize: typography.base },
});

export default LivenessChallenge;
