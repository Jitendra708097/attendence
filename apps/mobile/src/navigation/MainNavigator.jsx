/**
 * @module MainNavigator
 * @description Bottom tab navigator for authenticated employees.
 *
 *   4 tabs: Home, History, Leave, Profile.
 *
 *   Full stack screens (pushed on top of tabs, NOT tabs themselves):
 *     - Notifications     → bell icon in every tab header
 *     - LivenessChallenge → full-screen camera, pushed from HomeScreen
 *     - Regularisation    → modal form, pushed from HistoryScreen FAB
 *
 *   Auth guards (checked before rendering tabs):
 *     isFirstLogin   → redirects to SetPassword
 *     !faceEnrolled  → redirects to FaceEnroll
 *
 *   Tab bar:
 *     White background · teal active · grey inactive
 *     Outfit_500Medium labels at 11px
 *
 *   Called by: AppNavigator when isAuthenticated === true.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator }     from '@react-navigation/stack';

import HomeScreen           from '../screens/home/HomeScreen.jsx';
import HistoryScreen        from '../screens/history/HistoryScreen.jsx';
import LeaveScreen          from '../screens/leave/LeaveScreen.jsx';
import ProfileScreen        from '../screens/profile/ProfileScreen.jsx';
import NotificationsScreen  from '../screens/notifications/NotificationsScreen.jsx';
import LivenessChallenge    from '../screens/home/LivenessChallenge.jsx';
import RegularisationModal  from '../screens/history/RegularisationModal.jsx';
import SetPasswordScreen    from '../screens/auth/SetPasswordScreen.jsx';
import FaceEnrollScreen     from '../screens/auth/FaceEnrollScreen.jsx';

import useAuthStore         from '../store/authStore.js';
import useNotificationStore from '../store/notificationStore.js';
import { colors }           from '../theme/colors.js';
import { typography }       from '../theme/typography.js';
import { spacing }          from '../theme/spacing.js';

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

// ── Tab icon map ─────────────────────────────────────────────────────────────
const TAB_ICONS = {
  Home:    '🏠',
  History: '📅',
  Leave:   '📋',
  Profile: '👤',
};

// ── Bell icon with unread badge (shown in every tab header) ──────────────────
const BellButton = ({ navigation }) => {
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  return (
    <TouchableOpacity
      onPress={() => navigation.push('Notifications')}
      style={bellStyles.btn}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Text style={bellStyles.icon}>🔔</Text>
      {unreadCount > 0 && (
        <View style={bellStyles.badge}>
          <Text style={bellStyles.badgeText}>
            {unreadCount > 9 ? '9+' : String(unreadCount)}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const bellStyles = StyleSheet.create({
  btn:  { marginRight: spacing.base, position: 'relative' },
  icon: { fontSize: 22 },
  badge: {
    position:        'absolute',
    top:             -4,
    right:           -5,
    minWidth:        16,
    height:          16,
    borderRadius:    8,
    backgroundColor: colors.danger,
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontFamily: typography.fontBold,
    fontSize:   9,
    color:      colors.textInverse,
    lineHeight: 16,
  },
});

// ── Bottom Tab Navigator ──────────────────────────────────────────────────────
const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route, navigation }) => ({
      headerStyle: {
        backgroundColor: colors.bgSurface,
        shadowColor:     '#000',
        shadowOpacity:   0.06,
        shadowRadius:    8,
        elevation:       3,
      },
      headerTitleStyle: {
        fontFamily: typography.fontSemiBold,
        fontSize:   typography.md,
        color:      colors.textPrimary,
      },
      headerRight: () => <BellButton navigation={navigation} />,
      tabBarStyle: {
        backgroundColor: colors.bgSurface,
        borderTopColor:  colors.border,
        borderTopWidth:  1,
        height:          60,
        paddingBottom:   8,
        paddingTop:      6,
      },
      tabBarActiveTintColor:   colors.accent,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarLabelStyle: {
        fontFamily: typography.fontMedium,
        fontSize:   11,
        marginTop:  -2,
      },
      tabBarIcon: ({ focused }) => (
        <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>
          {TAB_ICONS[route.name]}
        </Text>
      ),
    })}
  >
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{ title: 'Attendance', tabBarLabel: 'Home' }}
    />
    <Tab.Screen
      name="History"
      component={HistoryScreen}
      options={{ title: 'History', tabBarLabel: 'History' }}
    />
    <Tab.Screen
      name="Leave"
      component={LeaveScreen}
      options={{ title: 'Leave', tabBarLabel: 'Leave' }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ title: 'My Profile', tabBarLabel: 'Profile' }}
    />
  </Tab.Navigator>
);

// ── Regularisation wrapper — lets the modal work as a stack screen ────────────
const RegularisationScreenWrapper = ({ route, navigation }) => (
  <RegularisationModal
    visible
    onClose={() => navigation.goBack()}
    date={route?.params?.date}
  />
);

// ── Root Stack: Tabs + all full-screen overlays ───────────────────────────────
const MainNavigator = () => {
  const user = useAuthStore((s) => s.user);

  // Auth guards — checked on every render
  if (user?.isFirstLogin)  return <SetPasswordScreen />;
  if (!user?.faceEnrolled) return <FaceEnrollScreen />;

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown:      false,
        cardStyle:        { backgroundColor: colors.bgPrimary },
        animationEnabled: true,
      }}
    >
      {/* Primary surface — bottom tabs */}
      <Stack.Screen name="Tabs" component={TabNavigator} />

      {/* Notifications — slide in from right with header */}
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          headerShown:            true,
          title:                  'Notifications',
          headerStyle:            { backgroundColor: colors.bgSurface, elevation: 3, shadowOpacity: 0.06 },
          headerTitleStyle:       { fontFamily: typography.fontSemiBold, fontSize: typography.md, color: colors.textPrimary },
          headerBackTitleVisible: false,
          headerTintColor:        colors.accent,
        }}
      />

      {/* Liveness Challenge — full-screen camera, no swipe-back */}
      <Stack.Screen
        name="LivenessChallenge"
        component={LivenessChallenge}
        options={{
          headerShown:    false,
          gestureEnabled: false,
          cardStyle:      { backgroundColor: '#000' },
          presentation:   'modal',
        }}
      />

      {/* Regularisation form — page-sheet modal */}
      <Stack.Screen
        name="Regularisation"
        component={RegularisationScreenWrapper}
        options={{
          headerShown:    false,
          presentation:   'modal',
          gestureEnabled: true,
        }}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;
