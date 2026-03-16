/**
 * @module offlineService
 * @description Persists offline check-in records to expo-file-system.
 *              Records survive app restart and OS kill.
 *              Synced to backend when internet is restored (via useAppState hook).
 *              Each record carries a clientRecordId for idempotency.
 *              Called by: offlineQueueStore, attendanceStore.
 */

import * as FileSystem from 'expo-file-system';

const OFFLINE_QUEUE_PATH = FileSystem.documentDirectory + 'attendease_offline_queue.json';

/**
 * Save the entire offline queue array to disk.
 * Overwrites any existing file.
 * @param {Array} records
 * @returns {Promise<void>}
 */
export const saveOfflineQueue = async (records) => {
  await FileSystem.writeAsStringAsync(
    OFFLINE_QUEUE_PATH,
    JSON.stringify(records),
    { encoding: FileSystem.EncodingType.UTF8 }
  );
};

/**
 * Load the offline queue from disk.
 * Returns empty array if file does not exist or is corrupted.
 * @returns {Promise<Array>}
 */
export const loadOfflineQueue = async () => {
  try {
    const info = await FileSystem.getInfoAsync(OFFLINE_QUEUE_PATH);
    if (!info.exists) return [];

    const content = await FileSystem.readAsStringAsync(OFFLINE_QUEUE_PATH);
    const parsed  = JSON.parse(content);

    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
};

/**
 * Clear the offline queue file from disk.
 * Called after successful sync.
 * @returns {Promise<void>}
 */
export const clearOfflineQueue = async () => {
  await FileSystem.deleteAsync(OFFLINE_QUEUE_PATH, { idempotent: true });
};

/**
 * Append a single record to the persisted queue.
 * @param {object} record - must include clientRecordId
 * @returns {Promise<Array>} updated queue
 */
export const appendToOfflineQueue = async (record) => {
  const existing = await loadOfflineQueue();
  const updated  = [...existing, record];
  await saveOfflineQueue(updated);
  return updated;
};

/**
 * Remove a record from the persisted queue by clientRecordId.
 * Called after a record syncs successfully.
 * @param {string} clientRecordId
 * @returns {Promise<Array>} updated queue
 */
export const removeFromOfflineQueue = async (clientRecordId) => {
  const existing = await loadOfflineQueue();
  const updated  = existing.filter((r) => r.clientRecordId !== clientRecordId);
  await saveOfflineQueue(updated);
  return updated;
};
