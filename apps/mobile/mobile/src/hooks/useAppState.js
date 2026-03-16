/**
 * @module useAppState
 * @description Tracks app foreground/background transitions.
 *              On foreground return: triggers offline queue sync.
 *              Called by: MainNavigator (mounted once at app root).
 */

import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import useOfflineQueueStore from '../store/offlineQueueStore.js';

/**
 * @returns {{ appState: string }}
 */
const useAppState = () => {
  const appState      = useRef(AppState.currentState);
  const syncOffline   = useOfflineQueueStore((s) => s.syncQueue);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const wasBackground = appState.current.match(/inactive|background/);
      const isActive      = nextState === 'active';

      if (wasBackground && isActive) {
        // App came to foreground — sync any offline records
        syncOffline();
      }

      appState.current = nextState;
    });

    return () => subscription.remove();
  }, [syncOffline]);

  return { appState: appState.current };
};

export default useAppState;
