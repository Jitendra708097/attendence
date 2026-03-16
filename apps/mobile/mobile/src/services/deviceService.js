/**
 * @module deviceService
 * @description Gets unique device ID for single device binding.
 *              Device ID is generated once (UUID v4) and stored in SecureStore.
 *              Persists across app restarts and updates.
 *              Uses expo-device for model and platform information.
 *              Called by: authStore (login), attendanceStore (checkin), LoginScreen.
 */

import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { STORAGE_KEYS } from '../utils/constants.js';

/**
 * Returns the persistent device ID.
 * Generates a new UUID on first call, then reuses stored value.
 * @returns {Promise<string>} UUID device identifier
 */
export const getDeviceId = async () => {
  let deviceId = await SecureStore.getItemAsync(STORAGE_KEYS.DEVICE_ID);
  if (!deviceId) {
    deviceId = uuidv4();
    await SecureStore.setItemAsync(STORAGE_KEYS.DEVICE_ID, deviceId);
  }
  return deviceId;
};

/**
 * Returns static device info from expo-device.
 * @returns {{ deviceModel: string, platform: string, osVersion: string }}
 */
export const getDeviceInfo = () => ({
  deviceModel: Device.modelName   || 'Unknown Device',
  platform:    Device.osName?.toLowerCase() || 'unknown',
  osVersion:   Device.osVersion   || 'unknown',
  brand:       Device.brand       || 'unknown',
  manufacturer: Device.manufacturer || 'unknown',
});

/**
 * Returns a combined payload for device registration at login.
 * @returns {Promise<{ deviceId: string, deviceModel: string, platform: string, osVersion: string }>}
 */
export const getDevicePayload = async () => {
  const deviceId = await getDeviceId();
  const info     = getDeviceInfo();
  return { deviceId, ...info };
};

/**
 * Checks if the app is running on a physical device (not simulator/emulator).
 * @returns {boolean}
 */
export const isPhysicalDevice = () => Device.isDevice === true;
