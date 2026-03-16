/**
 * @module LoginScreen
 * @description Employee login screen.
 *              Layout: Logo top 30%, subtitle, white card with form.
 *              On success: routes to SetPassword / FaceEnroll / Main.
 *              Keyboard avoiding with platform-specific behavior.
 *              Called by: AuthNavigator (initial screen).
 */

import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import useAuthStore  from '../../store/authStore.js';
import AppInput      from '../../components/common/AppInput.jsx';
import AppButton     from '../../components/common/AppButton.jsx';
import { ErrorMessage } from '../../components/common/CommonComponents.jsx';
import { colors }    from '../../theme/colors.js';
import { typography }from '../../theme/typography.js';
import { spacing }   from '../../theme/spacing.js';
import { validateEmail, validateLoginPassword } from '../../utils/validators.js';

const LoginScreen = ({ navigation }) => {
  const login     = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const storeErr  = useAuthStore((s) => s.error);
  const clearErr  = useAuthStore((s) => s.clearError);

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errors,   setErrors]   = useState({});

  const passwordRef = useRef(null);

  const validate = () => {
    const e = {};
    const emailV = validateEmail(email);
    const passV  = validateLoginPassword(password);
    if (!emailV.valid)  e.email    = emailV.message;
    if (!passV.valid)   e.password = passV.message;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    clearErr();
    if (!validate()) return;

    const result = await login(email, password);
    if (result.success) {
      const { employee } = result;
      if (employee.isFirstLogin)  { navigation.replace('SetPassword'); return; }
      if (!employee.faceEnrolled) { navigation.replace('FaceEnroll');  return; }
      // MainNavigator handles the rest
    }
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
          {/* ── Logo ── */}
          <View style={styles.logoBlock}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoMark}>✓</Text>
            </View>
            <Text style={styles.appName}>AttendEase</Text>
            <Text style={styles.tagline}>Employee Portal</Text>
          </View>

          {/* ── Form Card ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSub}>Sign in to mark your attendance</Text>

            {storeErr && <ErrorMessage message={storeErr} />}

            <AppInput
              label="Work Email"
              value={email}
              onChangeText={(v) => { setEmail(v); setErrors((p) => ({ ...p, email: '' })); }}
              placeholder="you@company.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />

            <AppInput
              inputRef={passwordRef}
              label="Password"
              value={password}
              onChangeText={(v) => { setPassword(v); setErrors((p) => ({ ...p, password: '' })); }}
              placeholder="Your password"
              secureTextEntry={!showPass}
              error={errors.password}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              rightIcon={
                <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁️'}</Text>
              }
              onRightIconPress={() => setShowPass((p) => !p)}
            />

            <TouchableOpacity style={styles.forgotRow}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <AppButton
              label="Sign In"
              onPress={handleLogin}
              loading={isLoading}
              fullWidth
              style={styles.loginBtn}
            />
          </View>

          {/* ── Footer ── */}
          <Text style={styles.footer}>
            Attendance & compliance, simplified.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: colors.bgPrimary },
  flex:  { flex: 1 },
  scroll: {
    flexGrow:       1,
    paddingHorizontal: spacing.base,
    paddingBottom:  spacing['3xl'],
  },

  // ── Logo ──────────────────────────────────────────────────────────────────
  logoBlock: {
    alignItems:   'center',
    paddingTop:   spacing['4xl'],
    paddingBottom: spacing['2xl'],
  },
  logoCircle: {
    width:           80,
    height:          80,
    borderRadius:    40,
    backgroundColor: colors.accent,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    spacing.base,
    // iOS
    shadowColor:   colors.accent,
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius:  16,
    // Android
    elevation: 8,
  },
  logoMark: {
    fontSize:   36,
    color:      colors.textInverse,
    fontFamily: typography.fontBold,
  },
  appName: {
    fontFamily:   typography.fontBold,
    fontSize:     typography['2xl'],
    color:        colors.textPrimary,
    letterSpacing: 0.5,
  },
  tagline: {
    fontFamily: typography.fontRegular,
    fontSize:   typography.base,
    color:      colors.textMuted,
    marginTop:  spacing.xs,
  },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: colors.bgSurface,
    borderRadius:    20,
    padding:         spacing.xl,
    // iOS
    shadowColor:  '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    // Android
    elevation: 5,
  },
  cardTitle: {
    fontFamily:   typography.fontBold,
    fontSize:     typography.xl,
    color:        colors.textPrimary,
    marginBottom: spacing.xs,
  },
  cardSub: {
    fontFamily:   typography.fontRegular,
    fontSize:     typography.base,
    color:        colors.textSecondary,
    marginBottom: spacing.xl,
  },
  eyeIcon: { fontSize: 18 },
  forgotRow: {
    alignItems:    'flex-end',
    marginTop:     -spacing.sm,
    marginBottom:  spacing.base,
  },
  forgotText: {
    fontFamily: typography.fontMedium,
    fontSize:   typography.sm,
    color:      colors.textMuted,
  },
  loginBtn: {
    marginTop: spacing.sm,
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    fontFamily: typography.fontRegular,
    fontSize:   typography.xs,
    color:      colors.textMuted,
    textAlign:  'center',
    marginTop:  spacing.xl,
  },
});

export default LoginScreen;
