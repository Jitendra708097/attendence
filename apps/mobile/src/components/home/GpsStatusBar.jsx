/**
 * @module GpsStatusBar
 * @description Location status indicator bar with 4 possible states.
 *
 *   ✅ Inside office — green
 *   ⚠️ GPS weak     — amber
 *   ❌ Outside       — red
 *   📡 Getting GPS  — muted, pulsing
 *
 *   Never relies on color alone — icon + color + text always shown.
 *   Called by: HomeScreen below header.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { colors }     from '../../theme/colors.js';
import { typography } from '../../theme/typography.js';
import { spacing }    from '../../theme/spacing.js';

export const GPS_STATUS = {
  LOADING:  'loading',
  INSIDE:   'inside',
  WEAK:     'weak',
  OUTSIDE:  'outside',
};

const STATUS_CONFIG = {
  loading: {
    icon:    '📡',
    text:    'Getting your location...',
    bg:      colors.bgSubtle,
    textColor: colors.textMuted,
  },
  inside: {
    icon:    '✅',
    text:    'Inside office premises',
    bg:      colors.successLight,
    textColor: colors.success,
  },
  weak: {
    icon:    '⚠️',
    text:    'GPS signal weak — proceeding with flag',
    bg:      colors.warningLight,
    textColor: colors.warning,
  },
  outside: {
    icon:    '❌',
    text:    'Outside office premises',
    bg:      colors.dangerLight,
    textColor: colors.danger,
  },
};

/**
 * @param {object} props
 * @param {'loading'|'inside'|'weak'|'outside'} props.status
 * @param {string} [props.branchName] - e.g. "Acme HQ Mumbai"
 */
const GpsStatusBar = ({ status = GPS_STATUS.LOADING, branchName }) => {
  const config  = STATUS_CONFIG[status] || STATUS_CONFIG.loading;
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  useEffect(() => {
    if (status === GPS_STATUS.LOADING) {
      opacity.value = withRepeat(
        withTiming(0.4, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      opacity.value = withTiming(1, { duration: 200 });
    }
  }, [status]);

  const displayText = status === GPS_STATUS.INSIDE && branchName
    ? `Inside ${branchName}`
    : config.text;

  return (
    <Animated.View style={[styles.bar, { backgroundColor: config.bg }, animatedStyle]}>
      <Text style={styles.icon}>{config.icon}</Text>
      <Text style={[styles.text, { color: config.textColor }]}>{displayText}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection:   'row',
    alignItems:      'center',
    borderRadius:    10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    marginHorizontal: spacing.base,
    marginBottom:    spacing.base,
  },
  icon: {
    fontSize:    14,
    marginRight: spacing.sm,
  },
  text: {
    fontFamily: typography.fontMedium,
    fontSize:   typography.sm,
    flex:       1,
  },
});

export default GpsStatusBar;
