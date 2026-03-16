/**
 * @module AppNavigator
 * @description Root navigator for AttendEase.
 *              Decides between AuthNavigator and MainNavigator
 *              based on auth state from authStore.
 *
 *              Routing logic:
 *                not authenticated           → AuthNavigator (Login stack)
 *                authenticated + firstLogin  → SetPasswordScreen
 *                authenticated + !faceEnrolled → FaceEnrollScreen
 *                authenticated + faceEnrolled  → MainNavigator (tabs)
 *
 *              Also bootstraps:
 *                - authStore.hydrate()   (token check on boot)
 *                - offlineQueueStore.hydrate() (load persisted queue)
 *                - push notification setup
 *                - foreground notification listener
 *              Called by: App root (index.js / AppEntry).
 */

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import useAuthStore             from '../store/authStore.js';
import useOfflineQueueStore     from '../store/offlineQueueStore.js';
import useNotificationStore     from '../store/notificationStore.js';
import AuthNavigator            from './AuthNavigator.jsx';
import MainNavigator            from './MainNavigator.jsx';
import { colors }               from '../theme/colors.js';
import { setupPushNotifications, addForegroundNotificationListener } from '../services/notificationService.js';
import { getDeviceId }          from '../services/deviceService.js';
import useAppState              from '../hooks/useAppState.js';

const AppNavigator = () => {
  const hydrate        = useAuthStore((s) => s.hydrate);
  const isLoading      = useAuthStore((s) => s.isLoading);
  const isAuthenticated= useAuthStore((s) => s.isAuthenticated);
  const hydrateQueue   = useOfflineQueueStore((s) => s.hydrate);
  const addNotification= useNotificationStore((s) => s.addIncomingNotification);

  // Boot sequence
  useEffect(() => {
    const boot = async () => {
      await hydrate();
      await hydrateQueue();

      // Setup push notifications
      const deviceId = await getDeviceId();
      await setupPushNotifications(deviceId);
    };
    boot();
  }, []);

  // Foreground push notification listener
  useEffect(() => {
    const sub = addForegroundNotificationListener((notification) => {
      addNotification({
        id:        notification.request.identifier,
        title:     notification.request.content.title,
        body:      notification.request.content.body,
        isRead:    false,
        createdAt: new Date().toISOString(),
      });
    });
    return () => sub.remove();
  }, []);

  // App state hook (background → foreground sync)
  useAppState();

  // Loading screen while checking stored tokens
  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <NavigationContainer>
          {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: colors.bgPrimary,
  },
});

export default AppNavigator;
