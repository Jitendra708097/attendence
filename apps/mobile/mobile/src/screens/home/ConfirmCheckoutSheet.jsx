/**
 * @module ConfirmCheckoutSheet
 * @description Bottom sheet confirmation before checking out.
 *              Shows session start time, duration, and final-checkout toggle.
 *              Uses @gorhom/bottom-sheet — never Alert.alert().
 *              Called by: HomeScreen checkout button tap.
 */

import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import useAttendanceStore from '../../store/attendanceStore.js';
import AppButton          from '../../components/common/AppButton.jsx';
import { ErrorMessage }   from '../../components/common/CommonComponents.jsx';
import { colors }    from '../../theme/colors.js';
import { typography }from '../../theme/typography.js';
import { spacing }   from '../../theme/spacing.js';
import { formatTime, formatDuration } from '../../utils/formatters.js';

/**
 * @param {object}  props
 * @param {boolean} props.visible          - Controls sheet open/close
 * @param {function}props.onClose          - Called when sheet closes
 * @param {string}  props.sessionStartTime - ISO string
 * @param {number}  props.sessionMinutes   - Minutes in current session
 */
const ConfirmCheckoutSheet = ({ visible, onClose, sessionStartTime, sessionMinutes = 0 }) => {
  const checkOut   = useAttendanceStore((s) => s.checkOut);
  const isLoading  = useAttendanceStore((s) => s.isLoading);
  const storeError = useAttendanceStore((s) => s.error);
  const clearError = useAttendanceStore((s) => s.clearError);

  const [isFinal, setIsFinal] = useState(false);
  const sheetRef = useRef(null);

  useEffect(() => {
    if (visible) sheetRef.current?.expand();
    else         sheetRef.current?.close();
  }, [visible]);

  const handleConfirm = async () => {
    clearError();
    const result = await checkOut(isFinal);
    if (result.success) {
      setIsFinal(false);
      onClose();
    }
  };

  const handleClose = () => {
    clearError();
    setIsFinal(false);
    onClose();
  };

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={['44%']}
      enablePanDownToClose
      onClose={handleClose}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetView style={styles.content}>
        <Text style={styles.title}>Confirm Check Out?</Text>

        {/* Session info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Started at</Text>
            <Text style={styles.infoValue}>{formatTime(sessionStartTime)}</Text>
          </View>
          <View style={[styles.infoRow, styles.durationRow]}>
            <Text style={styles.infoLabel}>Session duration</Text>
            <Text style={styles.durationValue}>{formatDuration(sessionMinutes)}</Text>
          </View>
        </View>

        {/* Final checkout toggle */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleLeft}>
            <Text style={styles.toggleLabel}>Final check-out for today</Text>
            <Text style={styles.toggleSub}>No more check-ins after this</Text>
          </View>
          <Switch
            value={isFinal}
            onValueChange={setIsFinal}
            trackColor={{ false: colors.border, true: colors.accentLight }}
            thumbColor={isFinal ? colors.accent : colors.bgSubtle}
          />
        </View>

        {storeError && <ErrorMessage message={storeError} />}

        {/* Buttons */}
        <View style={styles.btnRow}>
          <AppButton
            label="Cancel"
            onPress={handleClose}
            variant="outline"
            style={styles.btnHalf}
          />
          <AppButton
            label="Check Out"
            onPress={handleConfirm}
            variant="danger"
            loading={isLoading}
            style={styles.btnHalf}
          />
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  sheetBg: { backgroundColor: colors.bgSurface },
  handle:  { backgroundColor: colors.border, width: 40 },
  content: { padding: spacing.xl, flex: 1 },

  title: {
    fontFamily:   typography.fontBold,
    fontSize:     typography.xl,
    color:        colors.textPrimary,
    marginBottom: spacing.base,
  },

  infoCard: {
    backgroundColor: colors.bgSubtle,
    borderRadius:    12,
    padding:         spacing.base,
    marginBottom:    spacing.base,
  },
  infoRow: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
    paddingVertical: spacing.xs,
  },
  durationRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop:      spacing.xs,
    paddingTop:     spacing.sm,
  },
  infoLabel: {
    fontFamily: typography.fontRegular,
    fontSize:   typography.sm,
    color:      colors.textSecondary,
  },
  infoValue: {
    fontFamily: typography.fontMono,
    fontSize:   typography.base,
    color:      colors.textPrimary,
  },
  durationValue: {
    fontFamily: typography.fontMonoMed,
    fontSize:   typography['2xl'],
    color:      colors.accent,
  },

  toggleRow: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    backgroundColor: colors.bgSubtle,
    borderRadius:    12,
    padding:         spacing.base,
    marginBottom:    spacing.base,
  },
  toggleLeft: { flex: 1, marginRight: spacing.base },
  toggleLabel: {
    fontFamily: typography.fontMedium,
    fontSize:   typography.base,
    color:      colors.textPrimary,
  },
  toggleSub: {
    fontFamily: typography.fontRegular,
    fontSize:   typography.xs,
    color:      colors.textMuted,
    marginTop:  2,
  },

  btnRow: {
    flexDirection: 'row',
    gap:           spacing.sm,
    marginTop:     spacing.sm,
  },
  btnHalf: { flex: 1 },
});

export default ConfirmCheckoutSheet;
