/**
 * @module offlineQueueStore
 * @description Zustand store bridging in-memory offline queue with
 *              the file-system persistence layer (offlineService).
 *              Syncs pending records when internet is restored.
 *              Called by: useAppState hook, useNetworkStatus, attendanceStore.
 */

import { create } from 'zustand';
import api from '../api/axiosInstance.js';
import {
  loadOfflineQueue,
  saveOfflineQueue,
  removeFromOfflineQueue,
  clearOfflineQueue,
} from '../services/offlineService.js';

const useOfflineQueueStore = create((set, get) => ({
  // ─── State ─────────────────────────────────────────────────────────────────
  queue:     [],
  isSyncing: false,

  // ─── Hydrate from disk on app boot ─────────────────────────────────────────
  hydrate: async () => {
    const records = await loadOfflineQueue();
    set({ queue: records });
  },

  // ─── Add a record to the queue ──────────────────────────────────────────────
  addRecord: async (record) => {
    const updated = [...get().queue, record];
    set({ queue: updated });
    await saveOfflineQueue(updated);
  },

  // ─── Sync all pending records when back online ──────────────────────────────
  syncQueue: async () => {
    const { queue, isSyncing } = get();
    if (isSyncing || queue.length === 0) return;

    set({ isSyncing: true });

    const toSync = [...queue];

    for (const record of toSync) {
      try {
        await api.post('/attendance/checkin-offline', {
          clientRecordId: record.clientRecordId,
          type:           record.type,
          latitude:       record.latitude,
          longitude:      record.longitude,
          accuracy:       record.accuracy,
          capturedAt:     record.capturedAt,
          selfieBase64:   record.selfieBase64,
        });

        // Remove successfully synced record from queue
        const updated = await removeFromOfflineQueue(record.clientRecordId);
        set({ queue: updated });
      } catch (err) {
        // Stop on first failure — keep record in queue
        // Will retry on next foreground / reconnect event
        break;
      }
    }

    set({ isSyncing: false });
  },

  // ─── Clear queue (after full sync) ─────────────────────────────────────────
  clearQueue: async () => {
    await clearOfflineQueue();
    set({ queue: [] });
  },
}));

export default useOfflineQueueStore;
