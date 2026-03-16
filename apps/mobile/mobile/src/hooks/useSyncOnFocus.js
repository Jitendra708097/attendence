/**
 * @module useSyncOnFocus
 * @description Syncs attendance button state from server on every screen focus.
 *              NOT just on mount — called every time HomeScreen comes into view.
 *              This keeps button state accurate after crash, restart, or
 *              background kill. Critical for correctness of check-in UX.
 *              Called by: HomeScreen (most important usage).
 */

import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import useAttendanceStore from '../store/attendanceStore.js';

/**
 * Attach this hook to any screen that needs fresh attendance state.
 * Fires syncWithServer() every time the screen is focused.
 */
const useSyncOnFocus = () => {
  const syncWithServer = useAttendanceStore((s) => s.syncWithServer);

  useFocusEffect(
    useCallback(() => {
      syncWithServer();
    }, [syncWithServer])
  );
};

export default useSyncOnFocus;
