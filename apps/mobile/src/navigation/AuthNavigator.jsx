/**
 * @module AuthNavigator
 * @description Stack navigator for the unauthenticated flow.
 *              Screens: Login → SetPassword → FaceEnroll.
 *              FaceEnrollScreen has no back button — must complete enrollment.
 *              Called by: AppNavigator when isAuthenticated === false.
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen       from '../screens/auth/LoginScreen.jsx';
import { colors }       from '../theme/colors.js';
import SetPasswordScreen from '../screens/auth/SetPasswordScreen.jsx';
import FaceEnrollScreen  from '../screens/auth/FaceEnrollScreen.jsx';

const Stack = createStackNavigator();

const AuthNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown:    false,
      cardStyle:      { backgroundColor: colors.bgPrimary },
      animationEnabled: true,
    }}
  >
    <Stack.Screen name="Login"       component={LoginScreen}       />
    <Stack.Screen name="SetPassword" component={SetPasswordScreen} />
    <Stack.Screen
      name="FaceEnroll"
      component={FaceEnrollScreen}
      options={{ gestureEnabled: false }}  // No swipe-back — must complete
    />
  </Stack.Navigator>
);

export default AuthNavigator;
