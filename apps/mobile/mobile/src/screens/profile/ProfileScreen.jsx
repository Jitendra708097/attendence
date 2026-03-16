/**
 * @module ProfileScreen
 * @description Employee profile screen with personal info, device details,
 *              change password, notification toggle, and logout.
 *              Logout confirmation uses bottom sheet (never Alert.alert).
 *              Called by: MainNavigator (Tab 4 — Profile).
 */

import React, { useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Switch, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

import useAuthStore        from '../../store/authStore.js';
import AppButton           from '../../components/common/AppButton.jsx';
import { Avatar, Divider } from '../../components/common/CommonComponents.jsx';
import ChangePasswordSheet from './ChangePasswordSheet.jsx';
import DeviceInfoCard      from './DeviceInfoCard.jsx';
import { colors }          from '../../theme/colors.js';
import { typography }      from '../../theme/typography.js';
import { spacing }         from '../../theme/spacing.js';
import { formatDate }      from '../../utils/formatters.js';

// ── Main ProfileScreen ───────────────────────────────────────────────────────
const ProfileScreen = () => {
  const user          = useAuthStore((s) => s.user);
  const logout        = useAuthStore((s) => s.logout);
  const isLoading     = useAuthStore((s) => s.isLoading);

  const [notifEnabled, setNotifEnabled] = useState(true);

  const changePassRef = useRef(null);
  const logoutRef     = useRef(null);

  const InfoRow = ({ label, value, mono = false }) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={mono ? styles.infoValueMono : styles.infoValue}>{value || '—'}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Avatar + Name */}
        <View style={styles.avatarBlock}>
          <Avatar name={user?.name} size={72} />
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.empCode}>{user?.employeeCode}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{user?.role || 'Employee'}</Text>
            </View>
          </View>
        </View>

        {/* Info */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Personal Info</Text>
          <InfoRow label="Email"      value={user?.email} />
          <Divider />
          <InfoRow label="Phone"      value={user?.phone} />
          <Divider />
          <InfoRow label="Department" value={user?.department} />
          <Divider />
          <InfoRow label="Shift"      value={user?.shiftName} />
          <Divider />
          <InfoRow label="Joined"     value={formatDate(user?.joinedAt)} mono />
        </View>

        {/* Device */}
        <Text style={[styles.sectionHeading, { marginHorizontal: spacing.base }]}>Device</Text>
        <View style={{ paddingHorizontal: spacing.base }}>
          <DeviceInfoCard />
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Settings</Text>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => changePassRef.current?.expand()}
          >
            <Text style={styles.actionLabel}>🔒  Change Password</Text>
            <Text style={styles.actionChevron}>›</Text>
          </TouchableOpacity>

          <Divider />

          <View style={styles.actionRow}>
            <Text style={styles.actionLabel}>🔔  Push Notifications</Text>
            <Switch
              value={notifEnabled}
              onValueChange={setNotifEnabled}
              trackColor={{ false: colors.border, true: colors.accentLight }}
              thumbColor={notifEnabled ? colors.accent : colors.bgSubtle}
            />
          </View>

          <Divider />

          <View style={styles.actionRow}>
            <Text style={styles.actionLabel}>ℹ️  App Version</Text>
            <Text style={styles.versionText}>v1.0.0</Text>
          </View>

          <Divider />

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => logoutRef.current?.expand()}
          >
            <Text style={[styles.actionLabel, styles.logoutLabel]}>🚪  Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Change Password Sheet */}
      <ChangePasswordSheet
        sheetRef={changePassRef}
        onClose={() => changePassRef.current?.close()}
      />

      {/* Logout Confirmation Sheet */}
      <BottomSheet
        ref={logoutRef}
        index={-1}
        snapPoints={['32%']}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: colors.bgSurface }}
        handleIndicatorStyle={{ backgroundColor: colors.border, width: 40 }}
      >
        <BottomSheetView style={styles.logoutSheet}>
          <Text style={styles.logoutTitle}>Sign out?</Text>
          <Text style={styles.logoutSub}>You'll need to sign in again to mark attendance.</Text>
          <View style={styles.logoutBtns}>
            <AppButton
              label="Cancel"
              onPress={() => logoutRef.current?.close()}
              variant="outline"
              style={{ flex: 1 }}
            />
            <AppButton
              label="Sign Out"
              onPress={logout}
              variant="danger"
              loading={isLoading}
              style={{ flex: 1 }}
            />
          </View>
        </BottomSheetView>
      </BottomSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.bgPrimary },
  scroll: { paddingBottom: spacing['4xl'] },

  avatarBlock: {
    alignItems:    'center',
    paddingVertical: spacing['2xl'],
    backgroundColor: colors.bgSurface,
    marginBottom:   spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  name: {
    fontFamily:   typography.fontBold,
    fontSize:     typography.xl,
    color:        colors.textPrimary,
    marginTop:    spacing.sm,
  },
  empCode: {
    fontFamily: typography.fontMono,
    fontSize:   typography.sm,
    color:      colors.textMuted,
    marginTop:  spacing.xs,
  },
  badgeRow: { flexDirection: 'row', marginTop: spacing.sm },
  roleBadge: {
    backgroundColor: colors.accentLight,
    borderRadius:    20,
    paddingHorizontal: spacing.md,
    paddingVertical:  spacing.xs,
  },
  roleBadgeText: {
    fontFamily: typography.fontSemiBold,
    fontSize:   typography.xs,
    color:      colors.accent,
  },

  section: {
    backgroundColor: colors.bgSurface,
    marginHorizontal: spacing.base,
    borderRadius:    16,
    padding:         spacing.base,
    marginBottom:    spacing.base,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.05,
    shadowRadius:    8,
    elevation:       1,
  },
  sectionHeading: {
    fontFamily:   typography.fontSemiBold,
    fontSize:     typography.sm,
    color:        colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom:  spacing.base,
  },

  infoRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    fontFamily: typography.fontRegular,
    fontSize:   typography.base,
    color:      colors.textSecondary,
  },
  infoValue: {
    fontFamily: typography.fontMedium,
    fontSize:   typography.base,
    color:      colors.textPrimary,
    maxWidth:   '55%',
    textAlign:  'right',
  },
  infoValueMono: {
    fontFamily: typography.fontMono,
    fontSize:   typography.base,
    color:      colors.textPrimary,
  },

  actionRow: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingVertical: spacing.sm,
    minHeight:       48,
  },
  actionLabel: {
    fontFamily: typography.fontMedium,
    fontSize:   typography.base,
    color:      colors.textPrimary,
  },
  actionChevron: {
    fontFamily: typography.fontBold,
    fontSize:   typography.xl,
    color:      colors.textMuted,
  },
  versionText: {
    fontFamily: typography.fontMono,
    fontSize:   typography.sm,
    color:      colors.textMuted,
  },
  logoutLabel: { color: colors.danger },

  logoutSheet: { padding: spacing.xl },
  logoutTitle: {
    fontFamily:   typography.fontBold,
    fontSize:     typography.lg,
    color:        colors.textPrimary,
    marginBottom: spacing.xs,
  },
  logoutSub: {
    fontFamily:   typography.fontRegular,
    fontSize:     typography.base,
    color:        colors.textSecondary,
    marginBottom: spacing.xl,
  },
  logoutBtns: { flexDirection: 'row', gap: spacing.sm },
});

export default ProfileScreen;
