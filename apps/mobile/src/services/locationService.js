/**
 * @module locationService
 * @description Handles GPS capture with 4-layer mock location detection.
 *
 *   Layer 1 — position.mocked flag (Android only, immediate disqualifier)
 *   Layer 2 — accuracy > 100m  → GPS_INACCURATE (reject)
 *   Layer 3 — speed > 300 km/h → IMPOSSIBLE_SPEED (reject)
 *   Layer 4 — altitude < -100m → INVALID_ALTITUDE (reject)
 *
 *   Accuracy thresholds:
 *     ≤ 50m    → good, proceed normally
 *     50–100m  → allow + return flagged { isAnomaly: true }
 *     > 100m   → reject entirely
 *
 *   Called by: attendanceStore.checkIn(), HomeScreen GPS status bar.
 */

import * as Location from 'expo-location';
import { GPS } from '../utils/constants.js';

/**
 * Custom error codes thrown by this service.
 * These map to GEO_XXX backend codes via errorParser.
 */
export const LOCATION_ERRORS = {
  PERMISSION_DENIED:  'PERMISSION_DENIED',
  MOCK_LOCATION:      'MOCK_LOCATION',
  GPS_INACCURATE:     'GPS_INACCURATE',
  IMPOSSIBLE_SPEED:   'IMPOSSIBLE_SPEED',
  INVALID_ALTITUDE:   'INVALID_ALTITUDE',
  TIMEOUT:            'LOCATION_TIMEOUT',
};

/**
 * Request foreground location permission.
 * @returns {Promise<boolean>} true if granted
 */
export const requestLocationPermission = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
};

/**
 * Check current permission status without prompting.
 * @returns {Promise<boolean>}
 */
export const hasLocationPermission = async () => {
  const { status } = await Location.getForegroundPermissionsAsync();
  return status === 'granted';
};

/**
 * Get verified location with all 4 mock detection layers.
 * @returns {Promise<{
 *   latitude: number,
 *   longitude: number,
 *   accuracy: number,
 *   altitude: number|null,
 *   speed: number|null,
 *   timestamp: number,
 *   isAnomaly: boolean
 * }>}
 * @throws {Error} with message = LOCATION_ERRORS constant
 */
export const getVerifiedLocation = async () => {
  // Permission check
  const permitted = await hasLocationPermission();
  if (!permitted) {
    const granted = await requestLocationPermission();
    if (!granted) {
      const err = new Error(LOCATION_ERRORS.PERMISSION_DENIED);
      err.code = LOCATION_ERRORS.PERMISSION_DENIED;
      throw err;
    }
  }

  // Get high-accuracy position
  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
    maximumAge: 10000,    // accept cached if < 10 seconds old
    timeout: 15000,
  });

  const { coords } = location;

  // ── Layer 1: Mock location flag (Android only) ──────────────────────────
  if (location.mocked === true) {
    const err = new Error(LOCATION_ERRORS.MOCK_LOCATION);
    err.code = LOCATION_ERRORS.MOCK_LOCATION;
    throw err;
  }

  // ── Layer 2: Accuracy check ─────────────────────────────────────────────
  if (coords.accuracy > GPS.REJECT_ACCURACY) {
    const err = new Error(LOCATION_ERRORS.GPS_INACCURATE);
    err.code = LOCATION_ERRORS.GPS_INACCURATE;
    err.accuracy = coords.accuracy;
    throw err;
  }

  // ── Layer 3: Speed check (300 km/h = 83.33 m/s) ────────────────────────
  if (coords.speed !== null && coords.speed > GPS.MAX_SPEED_MS) {
    const err = new Error(LOCATION_ERRORS.IMPOSSIBLE_SPEED);
    err.code = LOCATION_ERRORS.IMPOSSIBLE_SPEED;
    throw err;
  }

  // ── Layer 4: Altitude check ─────────────────────────────────────────────
  if (coords.altitude !== null && coords.altitude < GPS.MIN_ALTITUDE) {
    const err = new Error(LOCATION_ERRORS.INVALID_ALTITUDE);
    err.code = LOCATION_ERRORS.INVALID_ALTITUDE;
    throw err;
  }

  // ── Anomaly flag for borderline accuracy ────────────────────────────────
  const isAnomaly = coords.accuracy > GPS.GOOD_ACCURACY;

  return {
    latitude:  coords.latitude,
    longitude: coords.longitude,
    accuracy:  coords.accuracy,
    altitude:  coords.altitude,
    speed:     coords.speed,
    timestamp: location.timestamp,
    isAnomaly,
  };
};

/**
 * Get a fast, low-accuracy location for the GPS status bar display only.
 * Does NOT run mock detection — just for UI feedback.
 * @returns {Promise<Location.LocationObject|null>}
 */
export const getQuickLocation = async () => {
  try {
    const permitted = await hasLocationPermission();
    if (!permitted) return null;

    return await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      maximumAge: 30000,
      timeout: 10000,
    });
  } catch {
    return null;
  }
};

/**
 * Map a LOCATION_ERROR code to a user-friendly message.
 * @param {string} code
 * @returns {string}
 */
export const getLocationErrorMessage = (code) => {
  switch (code) {
    case LOCATION_ERRORS.PERMISSION_DENIED:
      return 'Location permission denied. Please enable in Settings.';
    case LOCATION_ERRORS.MOCK_LOCATION:
      return 'Mock location detected. Please disable fake GPS apps.';
    case LOCATION_ERRORS.GPS_INACCURATE:
      return 'GPS signal is too weak. Please move to an open area.';
    case LOCATION_ERRORS.IMPOSSIBLE_SPEED:
      return 'Location data looks incorrect. Please try again.';
    case LOCATION_ERRORS.INVALID_ALTITUDE:
      return 'Invalid location data. Please try again.';
    case LOCATION_ERRORS.TIMEOUT:
      return 'GPS timed out. Please ensure location is enabled.';
    default:
      return 'Could not get your location. Please try again.';
  }
};
