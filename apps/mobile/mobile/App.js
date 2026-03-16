/**
 * @module App
 * @description Root Expo entry point for AttendEase mobile app.
 *              Loads custom fonts (Outfit + DM Mono) before rendering.
 *              Hides native splash screen once fonts are ready.
 *              Mounts AppNavigator which handles all routing logic.
 *              Called by: Expo runtime via app.json "main" field.
 */

import 'react-native-get-random-values'; // MUST be first import for UUID
import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';
import {
  DMMono_400Regular,
  DMMono_500Medium,
} from '@expo-google-fonts/dm-mono';

import AppNavigator from './src/navigation/AppNavigator.jsx';
import { colors }   from './src/theme/colors.js';

// Keep the splash screen visible while fonts load
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    DMMono_400Regular,
    DMMono_500Medium,
  });

  // Hide splash once fonts are ready (or on error)
  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Don't render until fonts are loaded
  if (!fontsLoaded && !fontError) return null;

  return (
    <View style={styles.root} onLayout={onLayoutRootView}>
      <AppNavigator />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: colors.bgPrimary,
  },
});
