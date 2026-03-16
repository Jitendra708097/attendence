/**
 * @module SetPasswordScreen
 * @description First-login password setup screen.
 *              Shows real-time password requirement checklist.
 *              On success → FaceEnrollScreen.
 *              Called by: AuthNavigator after first login detection.
 */

import React, { useState } from 'react';
import {
  View, Text, ScrollView, KeyboardAvoidingView,
  Platform, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    <Text style={[styles.checkIcon, met && styles.checkIconMet]}>
      {met ? '✓' : '○'}
    </Text>
    <Text style={[styles.checkLabel, met && styles.checkLabelMet]}>
      {label}
    </Text>
  </View>
);

const SetPasswordScreen = ({ navigation }) => {
  const setPassword = useAuthStore((s) => s.setPassword);
  const isLoading   = useAuthStore((s) => s.isLoading);
  const storeErr    = useAuthStore((s) => s.error);
  const clearErr    = useAuthStore((s) => s.clearError);

  const [newPass,     setNewPass]     = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors,      setErrors]      = useState({});

  const checks = getPasswordChecks(newPass);

  const validate = () => {
    const e  = {};
    const pv = validateNewPassword(newPass);
    const cv = validatePasswordMatch(newPass, confirmPass);
    if (!pv.valid) e.newPass     = pv.message;
    if (!cv.valid) e.confirmPass = cv.message;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    clearErr();
    if (!validate()) return;
    const result = await setPassword(newPass);
    if (result.success) navigation.replace('FaceEnroll');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.emoji}>🔐</Text>
            <Text style={styles.title}>Set Your Password</Text>
            <Text style={styles.subtitle}>
              Choose a secure password for your account.{'\n'}
              You'll use this every time you sign in.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {storeErr && <ErrorMessage message={storeErr} />}

            <AppInput
              label="New Password"
              value={newPass}
              onChangeText={(v) => { setNewPass(v); setErrors((p) => ({ ...p, newPass: '' })); }}
              placeholder="Min. 8 characters"
              secureTextEntry={!showNew}
              error={errors.newPass}
              rightIcon={<Text style={styles.eye}>{showNew ? '🙈' : '👁️'}</Text>}
              onRightIconPress={() => setShowNew((p) => !p)}
            />

            {/* Requirements checklist */}
            <View style={styles.checklist}>
              <CheckRow met={checks.minLength} label="At least 8 characters" />
              <CheckRow met={checks.uppercase} label="One uppercase letter" />
              <CheckRow met={checks.number}    label="One number" />
            </View>

            <AppInput
              label="Confirm Password"
              value={confirmPass}
              onChangeText={(v) => { setConfirmPass(v); setErrors((p) => ({ ...p, confirmPass: '' })); }}
              placeholder="Re-enter your password"
              secureTextEntry={!showConfirm}
              error={errors.confirmPass}
              rightIcon={<Text style={styles.eye}>{showConfirm ? '🙈' : '👁️'}</Text>}
              onRightIconPress={() => setShowConfirm((p) => !p)}
            />

            <AppButton
              label="Set Password & Continue"
              onPress={handleSubmit}
              loading={isLoading}
              fullWidth
              style={styles.btn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.bgPrimary },
  flex:   { flex: 1 },
  scroll: { flexGrow: 1, padding: spacing.xl, paddingTop: spacing['2xl'] },

  header: { alignItems: 'center', marginBottom: spacing['2xl'] },
  emoji:  { fontSize: 48, marginBottom: spacing.base },
  title: {
    fontFamily:   typography.fontBold,
    fontSize:     typography['2xl'],
    color:        colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: typography.fontRegular,
    fontSize:   typography.base,
    color:      colors.textSecondary,
    textAlign:  'center',
    lineHeight: typography.base * typography.normal,
  },

  form: {
    backgroundColor: colors.bgSurface,
    borderRadius:    20,
    padding:         spacing.xl,
    shadowColor:  '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },
  eye: { fontSize: 18 },

  checklist: {
    backgroundColor: colors.bgSubtle,
    borderRadius:    12,
    padding:         spacing.md,
    marginBottom:    spacing.base,
    marginTop:       -spacing.sm,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  spacing.xs,
  },
  checkIcon: {
    fontFamily:  typography.fontBold,
    fontSize:    typography.sm,
    color:       colors.textMuted,
    marginRight: spacing.sm,
    width:       16,
  },
  checkIconMet:  { color: colors.success },
  checkLabel: {
    fontFamily: typography.fontRegular,
    fontSize:   typography.sm,
    color:      colors.textMuted,
  },
  checkLabelMet: { color: colors.success },

  btn: { marginTop: spacing.sm },
});

export default SetPasswordScreen;
