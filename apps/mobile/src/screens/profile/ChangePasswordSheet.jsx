/**
 * @module ChangePasswordSheet
 * @description Bottom sheet for changing employee password from Profile screen.
 *              Fields: current password, new password, confirm new password.
 *              Validates: new ≠ current, requirements met, passwords match.
 *              Snaps to 60% height.
 *              Called by: ProfileScreen "Change Password" action row.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

import useAuthStore  from '../../store/authStore.js';
import AppInput      from '../../components/common/AppInput.jsx';
import AppButton     from '../../components/common/AppButton.jsx';
import { ErrorMessage } from '../../components/common/CommonComponents.jsx';
import { colors }    from '../../theme/colors.js';
import { typography }from '../../theme/typography.js';
import { spacing }   from '../../theme/spacing.js';
import {
  validateNewPassword,
  validatePasswordMatch,
  getPasswordChecks,
} from '../../utils/validators.js';

const CheckRow = ({ met, label }) => (
  <View style={styles.checkRow}>
    <Text style={[styles.checkMark, met && styles.checkMarkMet]}>
      {met ? '✓' : '○'}
    </Text>
    <Text style={[styles.checkLabel, met && styles.checkLabelMet]}>{label}</Text>
  </View>
);

/**
 * @param {object} props
 * @param {object} props.sheetRef   - ref passed from ProfileScreen
 * @param {function} props.onClose  - called when sheet is dismissed
 */
const ChangePasswordSheet = ({ sheetRef, onClose }) => {
  const changePassword = useAuthStore((s) => s.changePassword);
  const isLoading      = useAuthStore((s) => s.isLoading);

  const [current,  setCurrent]  = useState('');
  const [newPass,  setNewPass]  = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showCur,  setShowCur]  = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);

  const checks = getPasswordChecks(newPass);

  const reset = () => {
    setCurrent(''); setNewPass(''); setConfirm('');
    setError(''); setSuccess(false);
  };

  const handleClose = () => {
    reset();
    onClose?.();
    sheetRef?.current?.close();
  };

  const handleSave = async () => {
    setError('');

    if (!current.trim()) { setError('Current password is required.'); return; }

    const pv = validateNewPassword(newPass);
    if (!pv.valid) { setError(pv.message); return; }

    const cv = validatePasswordMatch(newPass, confirm);
    if (!cv.valid) { setError(cv.message); return; }

    if (newPass === current) {
      setError('New password must be different from your current password.'); return;
    }

    const result = await changePassword(current, newPass);
    if (result.success) {
      setSuccess(true);
      setTimeout(handleClose, 1600);
    } else {
      setError(result.error);
    }
  };

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={['64%']}
      enablePanDownToClose
      onClose={reset}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetView style={styles.content}>
        <Text style={styles.title}>Change Password</Text>

        {success && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>✅ Password updated successfully!</Text>
          </View>
        )}

        {error && <ErrorMessage message={error} />}

        <AppInput
          label="Current Password"
          value={current}
          onChangeText={(v) => { setCurrent(v); setError(''); }}
          secureTextEntry={!showCur}
          placeholder="Your current password"
          rightIcon={<Text style={styles.eye}>{showCur ? '🙈' : '👁️'}</Text>}
          onRightIconPress={() => setShowCur((p) => !p)}
        />

        <AppInput
          label="New Password"
          value={newPass}
          onChangeText={(v) => { setNewPass(v); setError(''); }}
          secureTextEntry={!showNew}
          placeholder="Min. 8 characters"
          rightIcon={<Text style={styles.eye}>{showNew ? '🙈' : '👁️'}</Text>}
          onRightIconPress={() => setShowNew((p) => !p)}
        />

        {/* Requirements */}
        {newPass.length > 0 && (
          <View style={styles.checklist}>
            <CheckRow met={checks.minLength} label="At least 8 characters" />
            <CheckRow met={checks.uppercase} label="One uppercase letter" />
            <CheckRow met={checks.number}    label="One number" />
          </View>
        )}

        <AppInput
          label="Confirm New Password"
          value={confirm}
          onChangeText={(v) => { setConfirm(v); setError(''); }}
          secureTextEntry
          placeholder="Re-enter new password"
        />

        <AppButton
          label="Save Password"
          onPress={handleSave}
          loading={isLoading}
          fullWidth
          style={styles.saveBtn}
        />

        <AppButton
          label="Cancel"
          onPress={handleClose}
          variant="ghost"
          fullWidth
        />
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  sheetBg: { backgroundColor: colors.bgSurface },
  handle:  { backgroundColor: colors.border, width: 40 },
  content: { padding: spacing.xl, paddingBottom: spacing['2xl'] },

  title: {
    fontFamily:   typography.fontBold,
    fontSize:     typography.xl,
    color:        colors.textPrimary,
    marginBottom: spacing.base,
  },

  successBox: {
    backgroundColor: colors.successLight,
    borderRadius:    10,
    padding:         spacing.sm,
    marginBottom:    spacing.base,
    alignItems:      'center',
  },
  successText: {
    fontFamily: typography.fontSemiBold,
    fontSize:   typography.sm,
    color:      colors.success,
  },

  eye: { fontSize: 18 },

  checklist: {
    backgroundColor: colors.bgSubtle,
    borderRadius:    10,
    padding:         spacing.sm,
    marginTop:       -spacing.sm,
    marginBottom:    spacing.base,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  3,
  },
  checkMark:    { fontFamily: typography.fontBold, fontSize: typography.sm, color: colors.textMuted, marginRight: spacing.sm, width: 14 },
  checkMarkMet: { color: colors.success },
  checkLabel:   { fontFamily: typography.fontRegular, fontSize: typography.xs, color: colors.textMuted },
  checkLabelMet:{ color: colors.success },

  saveBtn: { marginTop: spacing.sm, marginBottom: spacing.sm },
});

export default ChangePasswordSheet;
