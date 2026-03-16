/**
 * @module attendanceStore
 * @description Zustand store for all attendance state and actions.
 *
 *   Button state machine:
 *     CHECK_IN    → green, ready to check in
 *     CHECKED_IN  → red,   session open, can check out
 *     COOLDOWN    → grey,  wait for cooldown to expire
 *     CAP_REACHED → grey,  max sessions hit, done for today
 *
 *   Critical rule: syncWithServer() is called on every HomeScreen focus,
 *   not just mount. This keeps state accurate after crash/restart/background.
 *
 *   Called by: HomeScreen, LivenessChallenge, ConfirmCheckoutSheet,
 *              UndoCheckoutBar, useSyncOnFocus hook.
 */

import { create } from 'zustand';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import api from '../api/axiosInstance.js';
import { parseError } from '../utils/errorParser.js';
import { BUTTON_STATES, API_ROUTES, SESSION } from '../utils/constants.js';
import {
  saveOfflineQueue,
  loadOfflineQueue,
  appendToOfflineQueue,
  removeFromOfflineQueue,
} from '../services/offlineService.js';

const useAttendanceStore = create((set, get) => ({
  // ─── State ─────────────────────────────────────────────────────────────────
  buttonState:      BUTTON_STATES.CHECK_IN,
  openSession:      null,     // { id, checkInTime, sessionNumber, isOffline }
  cooldownEndsAt:   null,     // ISO string when cooldown expires
  lastCheckout:     null,     // ISO string of last checkout (undo window)
  lastCheckoutId:   null,     // session ID for undo
  todayStatus:      null,     // 'present' | 'absent' | 'half_day' | etc
  totalWorkedMins:  0,
  sessionsToday:    0,
  firstCheckInTime: null,     // ISO string
  shiftInfo:        null,     // { name, startTime, endTime }
  isLoading:        false,
  isSyncing:        false,
  error:            null,
  offlineQueue:     [],

  // ─── Sync button state from server ─────────────────────────────────────────
  syncWithServer: async () => {
    // Prevent concurrent syncs
    if (get().isSyncing) return;
    set({ isSyncing: true, error: null });

    try {
      const res  = await api.get(API_ROUTES.ATTENDANCE_STATUS);
      const data = res.data.data;

      // Derive button state from server response
      let buttonState = BUTTON_STATES.CHECK_IN;
      if (data.openSession)                    buttonState = BUTTON_STATES.CHECKED_IN;
      else if (data.cooldownEndsAt && new Date(data.cooldownEndsAt) > new Date())
                                               buttonState = BUTTON_STATES.COOLDOWN;
      else if (data.sessionsToday >= SESSION.MAX_SESSIONS_PER_DAY)
                                               buttonState = BUTTON_STATES.CAP_REACHED;

      set({
        buttonState,
        openSession:      data.openSession     || null,
        cooldownEndsAt:   data.cooldownEndsAt  || null,
        lastCheckout:     data.lastCheckout    || null,
        lastCheckoutId:   data.lastCheckoutId  || null,
        todayStatus:      data.todayStatus     || null,
        totalWorkedMins:  data.totalWorkedMins || 0,
        sessionsToday:    data.sessionsToday   || 0,
        firstCheckInTime: data.firstCheckInTime|| null,
        shiftInfo:        data.shiftInfo       || null,
        isSyncing:        false,
      });
    } catch (err) {
      set({ isSyncing: false, error: parseError(err) });
    }
  },

  // ─── Check-in ───────────────────────────────────────────────────────────────
  checkIn: async ({ selfieBase64, location, challengeToken, isOnline }) => {
    set({ isLoading: true, error: null });

    // ── Offline path ──────────────────────────────────────────────────────────
    if (!isOnline) {
      const record = {
        clientRecordId: uuidv4(),
        type:           'checkin',
        latitude:       location.latitude,
        longitude:      location.longitude,
        accuracy:       location.accuracy,
        capturedAt:     Date.now(),
        selfieBase64,
        challengeToken: null, // cannot obtain challenge offline
        isOffline:      true,
      };

      const updated = await appendToOfflineQueue(record);

      set({
        buttonState:   BUTTON_STATES.CHECKED_IN,
        openSession:   { isOffline: true, checkInTime: new Date().toISOString() },
        offlineQueue:  updated,
        isLoading:     false,
      });

      return { success: true, offline: true };
    }

    // ── Online path ───────────────────────────────────────────────────────────
    try {
      const res = await api.post(API_ROUTES.CHECKIN, {
        selfieBase64,
        latitude:       location.latitude,
        longitude:      location.longitude,
        accuracy:       location.accuracy,
        altitude:       location.altitude,
        challengeToken,
        captureTimestamp: Date.now(),
      });

      const { session } = res.data.data;

      set({
        buttonState:   BUTTON_STATES.CHECKED_IN,
        openSession:   session,
        sessionsToday: get().sessionsToday + 1,
        isLoading:     false,
        error:         null,
      });

      return { success: true };
    } catch (err) {
      const message = parseError(err);
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  // ─── Check-out ──────────────────────────────────────────────────────────────
  checkOut: async (isFinalCheckout = false) => {
    set({ isLoading: true, error: null });

    try {
      const res = await api.post(API_ROUTES.CHECKOUT, { isFinalCheckout });
      const { session, totalWorkedMins, cooldownEndsAt } = res.data.data;

      let newButtonState;
      if (isFinalCheckout) {
        newButtonState = BUTTON_STATES.CAP_REACHED; // no more sessions today
      } else if (get().sessionsToday >= SESSION.MAX_SESSIONS_PER_DAY - 1) {
        newButtonState = BUTTON_STATES.CAP_REACHED;
      } else {
        newButtonState = BUTTON_STATES.COOLDOWN;
      }

      // Undo window — ISO string 10 minutes from now
      const undoWindowEndsAt = new Date(Date.now() + SESSION.UNDO_WINDOW_MINUTES * 60000).toISOString();

      set({
        buttonState:     newButtonState,
        openSession:     null,
        cooldownEndsAt:  cooldownEndsAt || null,
        lastCheckout:    undoWindowEndsAt,
        lastCheckoutId:  session.id,
        totalWorkedMins: totalWorkedMins || 0,
        isLoading:       false,
        error:           null,
      });

      return { success: true, session };
    } catch (err) {
      const message = parseError(err);
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  // ─── Undo Checkout ──────────────────────────────────────────────────────────
  undoCheckout: async () => {
    set({ isLoading: true, error: null });

    try {
      await api.post(API_ROUTES.CHECKOUT_UNDO);

      set({
        buttonState:  BUTTON_STATES.CHECKED_IN,
        openSession:  { checkInTime: get().openSession?.checkInTime },
        lastCheckout: null,
        lastCheckoutId: null,
        isLoading:    false,
        error:        null,
      });

      return { success: true };
    } catch (err) {
      const message = parseError(err);
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  // ─── Request Check-in (get challenge token) ─────────────────────────────────
  requestCheckIn: async () => {
    try {
      const res = await api.post(API_ROUTES.REQUEST_CHECKIN);
      return { success: true, data: res.data.data }; // { challengeToken, challenge }
    } catch (err) {
      return { success: false, error: parseError(err) };
    }
  },

  // ─── Offline Queue Management ───────────────────────────────────────────────
  loadOfflineQueue: async () => {
    const queue = await loadOfflineQueue();
    set({ offlineQueue: queue });
  },

  syncOfflineQueue: async () => {
    const queue = get().offlineQueue;
    if (queue.length === 0) return;

    for (const record of queue) {
      try {
        await api.post('/attendance/checkin-offline', record);
        const updated = await removeFromOfflineQueue(record.clientRecordId);
        set({ offlineQueue: updated });
      } catch {
        // Leave in queue — will retry later
        break;
      }
    }

    // Re-sync button state after offline sync
    await get().syncWithServer();
  },

  // ─── Helpers ────────────────────────────────────────────────────────────────
  clearError: () => set({ error: null }),
  setLoading: (val) => set({ isLoading: val }),
}));

export default useAttendanceStore;
