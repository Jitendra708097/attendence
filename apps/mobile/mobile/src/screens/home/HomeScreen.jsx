/**
 * @module HomeScreen
 * @description Main attendance screen — the heart of the app.
 *              Syncs button state from server on EVERY screen focus (not just mount).
 *              Handles 4 button states: CHECK_IN, CHECKED_IN, COOLDOWN, CAP_REACHED.
 *              Renders GPS status bar, shift card, action button, today summary.
 *              Called by: MainNavigator (Tab 1 — Home).
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import useAttendanceStore   from '../../store/attendanceStore.js';
import useAuthStore         from '../../store/authStore.js';
import useNotificationStore from '../../store/notificationStore.js';
import useSyncOnFocus       from '../../hooks/useSyncOnFocus.js';
import useNetworkStatus     from '../../hooks/useNetworkStatus.js';

import CheckInButton        from '../../components/home/CheckInButton.jsx';
import CheckOutButton       from '../../components/home/CheckOutButton.jsx';
import CooldownTimer        from '../../components/home/CooldownTimer.jsx';
import TodaySummaryCard     from '../../components/home/TodaySummaryCard.jsx';
import GpsStatusBar, { GPS_STATUS } from '../../components/home/GpsStatusBar.jsx';
import { OfflineBanner }    from '../../components/common/CommonComponents.jsx';
import ConfirmCheckoutSheet from './ConfirmCheckoutSheet.jsx';
import UndoCheckoutBar      from './UndoCheckoutBar.jsx';

import { getQuickLocation }   from '../../services/locationService.js';
import { colors }    from '../../theme/colors.js';
import { typography }from '../../theme/typography.js';
import { spacing }   from '../../theme/spacing.js';
import { BUTTON_STATES, SESSION } from '../../utils/constants.js';
import { getGreeting, formatShiftRange } from '../../utils/formatters.js';
import dayjs from 'dayjs';

const HomeScreen = ({ navigation }) => {
  const user = useAuthStore((s) => s.user);

  const buttonState      = useAttendanceStore((s) => s.buttonState);
  const openSession      = useAttendanceStore((s) => s.openSession);
  const cooldownEndsAt   = useAttendanceStore((s) => s.cooldownEndsAt);
  const lastCheckout     = useAttendanceStore((s) => s.lastCheckout);
  const totalWorkedMins  = useAttendanceStore((s) => s.totalWorkedMins);
  const sessionsToday    = useAttendanceStore((s) => s.sessionsToday);
  const todayStatus      = useAttendanceStore((s) => s.todayStatus);
  const firstCheckInTime = useAttendanceStore((s) => s.firstCheckInTime);
  const shiftInfo        = useAttendanceStore((s) => s.shiftInfo);
  const isSyncing        = useAttendanceStore((s) => s.isSyncing);

  const unreadCount      = useNotificationStore((s) => s.unreadCount);
  const refreshUnread    = useNotificationStore((s) => s.refreshUnreadCount);

  const isOnline         = useNetworkStatus();

  const [gpsStatus,  setGpsStatus]  = useState(GPS_STATUS.LOADING);
  const [branchName, setBranchName] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);

  // ── Sync on every focus ──────────────────────────────────────────────────
  useSyncOnFocus();

  // ── Refresh GPS status + unread count on focus ───────────────────────────
  useEffect(() => {
    refreshGps();
    refreshUnread();
  }, []);

  const refreshGps = async () => {
    setGpsStatus(GPS_STATUS.LOADING);
    const loc = await getQuickLocation();
    if (!loc) { setGpsStatus(GPS_STATUS.OUTSIDE); return; }
    const accuracy = loc.coords.accuracy;
    if (accuracy > 100)       setGpsStatus(GPS_STATUS.OUTSIDE);
    else if (accuracy > 50)   setGpsStatus(GPS_STATUS.WEAK);
    else                      setGpsStatus(GPS_STATUS.INSIDE);
  };

  // ── CAP_REACHED grey button ──────────────────────────────────────────────
  const CapReachedButton = () => (
    <View style={styles.capButton}>
      <Text style={styles.capIcon}>✓</Text>
      <Text style={styles.capLabel}>Done for today</Text>
      <Text style={styles.capSub}>{SESSION.MAX_SESSIONS_PER_DAY} sessions completed</Text>
    </View>
  );

  const sessionMinutes = openSession?.checkInTime
    ? Math.floor((Date.now() - new Date(openSession.checkInTime)) / 60000)
    : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <OfflineBanner visible={!isOnline} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {getGreeting()}, {user?.name?.split(' ')[0]} 👋
            </Text>
            <Text style={styles.date}>
              {dayjs().format('dddd, D MMMM YYYY')}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.push('Notifications')}
            style={styles.bellBtn}
          >
            <Text style={styles.bellIcon}>🔔</Text>
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── GPS Status Bar ── */}
        <GpsStatusBar status={gpsStatus} branchName={branchName} />

        {/* ── Shift Info Card ── */}
        {shiftInfo && (
          <View style={styles.shiftCard}>
            <Text style={styles.shiftName}>{shiftInfo.name}</Text>
            <Text style={styles.shiftTime}>
              {formatShiftRange(shiftInfo.startTime, shiftInfo.endTime)}
            </Text>
          </View>
        )}

        {/* ── THE BUTTON ── */}
        <View style={styles.buttonSection}>
          {buttonState === BUTTON_STATES.CHECK_IN && (
            <CheckInButton
              onPress={() => navigation.push('LivenessChallenge')}
              loading={isSyncing}
            />
          )}

          {buttonState === BUTTON_STATES.CHECKED_IN && (
            <CheckOutButton
              onPress={() => setShowCheckout(true)}
              sessionStartTime={openSession?.checkInTime}
              sessionMinutes={sessionMinutes}
            />
          )}

          {buttonState === BUTTON_STATES.COOLDOWN && (
            <CooldownTimer cooldownEndsAt={cooldownEndsAt} />
          )}

          {buttonState === BUTTON_STATES.CAP_REACHED && (
            <CapReachedButton />
          )}
        </View>

        {/* ── Today Summary ── */}
        <TodaySummaryCard
          totalWorkedMins={totalWorkedMins}
          sessionsToday={sessionsToday}
          todayStatus={todayStatus}
          firstCheckInTime={firstCheckInTime}
        />

        <View style={styles.bottomPad} />
      </ScrollView>

      {/* ── Checkout Confirmation Sheet ── */}
      <ConfirmCheckoutSheet
        visible={showCheckout}
        onClose={() => setShowCheckout(false)}
        sessionStartTime={openSession?.checkInTime}
        sessionMinutes={sessionMinutes}
      />

      {/* ── Undo Checkout Bar ── */}
      {lastCheckout && (
        <UndoCheckoutBar undoWindowEndsAt={lastCheckout} />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.bgPrimary },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing['2xl'] },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'flex-start',
    paddingHorizontal: spacing.base,
    paddingTop:      spacing.base,
    paddingBottom:   spacing.base,
  },
  greeting: {
    fontFamily: typography.fontSemiBold,
    fontSize:   typography.lg,
    color:      colors.textPrimary,
  },
  date: {
    fontFamily: typography.fontRegular,
    fontSize:   typography.sm,
    color:      colors.textMuted,
    marginTop:  spacing.xs,
  },
  bellBtn: { position: 'relative', padding: spacing.xs },
  bellIcon: { fontSize: 24 },
  bellBadge: {
    position:        'absolute',
    top:             -2,
    right:           -2,
    minWidth:        16,
    height:          16,
    borderRadius:    8,
    backgroundColor: colors.danger,
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: {
    fontFamily: typography.fontBold,
    fontSize:   9,
    color:      colors.textInverse,
  },

  // ── Shift Card ────────────────────────────────────────────────────────────
  shiftCard: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
    backgroundColor: colors.bgSurface,
    marginHorizontal: spacing.base,
    marginBottom:    spacing.base,
    borderRadius:    12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderLeftWidth:  3,
    borderLeftColor:  colors.accent,
  },
  shiftName: {
    fontFamily: typography.fontSemiBold,
    fontSize:   typography.sm,
    color:      colors.textPrimary,
  },
  shiftTime: {
    fontFamily: typography.fontMono,
    fontSize:   typography.sm,
    color:      colors.textSecondary,
  },

  // ── Button section ────────────────────────────────────────────────────────
  buttonSection: {
    paddingHorizontal: spacing.base,
    marginBottom:      spacing.base,
  },

  // ── Cap Reached ───────────────────────────────────────────────────────────
  capButton: {
    backgroundColor: colors.bgSubtle,
    height:          64,
    borderRadius:    14,
    borderWidth:     1,
    borderColor:     colors.border,
    alignItems:      'center',
    justifyContent:  'center',
    flexDirection:   'row',
    gap:             spacing.sm,
  },
  capIcon:  { fontSize: 18, color: colors.capGrey },
  capLabel: {
    fontFamily: typography.fontSemiBold,
    fontSize:   typography.base,
    color:      colors.capGrey,
  },
  capSub: {
    fontFamily: typography.fontRegular,
    fontSize:   typography.xs,
    color:      colors.textMuted,
  },

  bottomPad: { height: spacing['2xl'] },
});

export default HomeScreen;
