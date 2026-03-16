/**
 * @module notificationService
 * @description FCM push notification setup for Android and iOS.
 *              Handles permission request, FCM token retrieval,
 *              and registration of the token with the backend.
 *              Sets up foreground notification handler.
 *              Called by: MainNavigator (on auth), ProfileScreen toggle.
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from '../api/axiosInstance.js';
import { API_ROUTES } from '../utils/constants.js';

// ─── Configure foreground notification behaviour ──────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

/**
 * Request push notification permission from the OS.
 * @returns {Promise<boolean>} true if granted
 */
export const requestNotificationPermission = async () => {
  if (!Device.isDevice) {
    // Emulator — skip real permission
    return false;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

/**
 * Get the Expo push token (wraps FCM token for Expo's delivery system).
 * Falls back gracefully on emulator.
 * @returns {Promise<string|null>}
 */
export const getExpoPushToken = async () => {
  try {
    if (!Device.isDevice) return null;

    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId: 'attendease', // matches app.json slug
    });
    return token;
  } catch {
    return null;
  }
};

/**
 * Get the raw FCM token (for direct FCM sending from backend).
 * @returns {Promise<string|null>}
 */
export const getFCMToken = async () => {
  try {
    if (!Device.isDevice) return null;

    const { data: token } = await Notifications.getDevicePushTokenAsync();
    return token;
  } catch {
    return null;
  }
};

/**
 * Register the device FCM token with the AttendEase backend.
 * @param {string} fcmToken
 * @param {string} deviceId
 * @returns {Promise<void>}
 */
export const registerTokenWithBackend = async (fcmToken, deviceId) => {
  try {
    await api.post('/device-tokens', {
      fcmToken,
      deviceId,
      platform: Platform.OS,
    });
  } catch {
    // Non-critical — silently fail, will retry on next launch
  }
};

/**
 * Full setup: request permission → get token → register with backend.
 * @param {string} deviceId
 * @returns {Promise<{ token: string|null, granted: boolean }>}
 */
export const setupPushNotifications = async (deviceId) => {
  const granted = await requestNotificationPermission();
  if (!granted) return { token: null, granted: false };

  // Set Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name:       'AttendEase',
      importance:  Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0d7377', // colors.accent
    });
  }

  const fcmToken = await getFCMToken();
  if (fcmToken && deviceId) {
    await registerTokenWithBackend(fcmToken, deviceId);
  }

  return { token: fcmToken, granted: true };
};

/**
 * Add a listener for notifications received while app is foregrounded.
 * @param {function} handler - receives Notifications.Notification
 * @returns {Notifications.Subscription}
 */
export const addForegroundNotificationListener = (handler) => {
  return Notifications.addNotificationReceivedListener(handler);
};

/**
 * Add a listener for notification taps (app in background/killed).
 * @param {function} handler - receives Notifications.NotificationResponse
 * @returns {Notifications.Subscription}
 */
export const addNotificationResponseListener = (handler) => {
  return Notifications.addNotificationResponseReceivedListener(handler);
};

/**
 * Set the app badge count.
 * @param {number} count
 */
export const setBadgeCount = async (count) => {
  await Notifications.setBadgeCountAsync(count);
};
