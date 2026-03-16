/**
 * @module AppInput
 * @description Styled TextInput wrapper with label, error state, and focus border.
 *              Supports secure text, multiline, and custom right icon/action.
 *              Focus: teal border. Error: red border + error message below.
 *              Called by: LoginScreen, SetPasswordScreen, all form screens.
 */

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
} from 'react-native';
import { colors }     from '../../theme/colors.js';
import { typography } from '../../theme/typography.js';
import { spacing }    from '../../theme/spacing.js';

/**
 * @param {object}   props
 * @param {string}   [props.label]             - Field label above input
 * @param {string}   props.value               - Controlled value
 * @param {function} props.onChangeText        - Change handler
 * @param {string}   [props.placeholder]
 * @param {boolean}  [props.secureTextEntry]
 * @param {string}   [props.error]             - Error message (shows red border)
 * @param {string}   [props.keyboardType]
 * @param {string}   [props.autoCapitalize]
 * @param {boolean}  [props.autoCorrect]
 * @param {boolean}  [props.multiline]
 * @param {number}   [props.numberOfLines]
 * @param {React.ReactNode} [props.rightIcon]  - Right-side icon/action
 * @param {function} [props.onRightIconPress]
 * @param {object}   [props.style]             - Wrapper style override
 * @param {boolean}  [props.editable=true]
 */
const AppInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  error,
  keyboardType       = 'default',
  autoCapitalize     = 'none',
  autoCorrect        = false,
  multiline          = false,
  numberOfLines      = 1,
  rightIcon,
  onRightIconPress,
  style,
  editable           = true,
  returnKeyType,
  onSubmitEditing,
  inputRef,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const inputContainerStyle = [
    styles.inputContainer,
    isFocused && styles.inputFocused,
    error      && styles.inputError,
    !editable  && styles.inputDisabled,
  ];

  return (
    <View style={[styles.wrapper, style]}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}

      <View style={inputContainerStyle}>
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            multiline && styles.inputMultiline,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : undefined}
          editable={editable}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          accessibilityLabel={label || placeholder}
        />

        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIcon}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.base,
  },
  label: {
    fontFamily:    typography.fontMedium,
    fontSize:      typography.sm,
    color:         colors.textSecondary,
    marginBottom:  spacing.xs,
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: colors.bgSurface,
    borderWidth:     1.5,
    borderColor:     colors.border,
    borderRadius:    12,
    minHeight:       52,
    paddingHorizontal: spacing.base,
  },
  inputFocused: {
    borderColor: colors.borderFocus,
    // iOS
    shadowColor:   colors.accent,
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius:  6,
    // Android
    elevation: 2,
  },
  inputError: {
    borderColor: colors.danger,
  },
  inputDisabled: {
    backgroundColor: colors.bgSubtle,
    opacity: 0.7,
  },
  input: {
    flex:       1,
    fontFamily: typography.fontRegular,
    fontSize:   typography.base,
    color:      colors.textPrimary,
    paddingVertical: spacing.md,
  },
  inputMultiline: {
    minHeight:  100,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  rightIcon: {
    marginLeft: spacing.sm,
    padding:    spacing.xs,
  },
  error: {
    fontFamily: typography.fontRegular,
    fontSize:   typography.xs,
    color:      colors.danger,
    marginTop:  spacing.xs,
    marginLeft: spacing.xs,
  },
});

export default AppInput;
