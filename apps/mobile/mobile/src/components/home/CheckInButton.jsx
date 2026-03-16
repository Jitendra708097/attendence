/**
 * @module CheckInButton
 * @description The most important UI element in the app.
 *              Large teal button with spring scale animation and teal glow shadow.
 *              State: CHECK_IN — green, "Mark Attendance".
 *              Height: 64px. Full-width minus screen padding.
 *              Called by: HomeScreen when buttonState === 'CHECK_IN'.
 */

import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors }     from '../../theme/colors.js';
import { typography } from '../../theme/typography.js';
import { spacing }    from '../../theme/spacing.js';

/**
 * @param {object}   props
 * @param {function} props.onPress   - Tap handler (opens LivenessChallenge)
 * @param {boolean}  [props.loading] - Disable during API call
 */
const CheckInButton = ({ onPress, loading = false }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn  = () => { scale.value = withSpring(0.96, { damping: 12 }); };
  const handlePressOut = () => { scale.value = withSpring(1.0,  { damping: 12 }); };

  return (
    <Animated.View style={[styles.wrapper, animatedStyle]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={loading}
        activeOpacity={1}
        style={styles.button}
        accessibilityRole="button"
        accessibilityLabel="Mark Attendance"
      >
        <View style={styles.content}>
          <Text style={styles.icon}>✓</Text>
          <Text style={styles.label}>Mark Attendance</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  button: {
    backgroundColor: colors.accent,
    height:          64,
    borderRadius:    14,
    alignItems:      'center',
    justifyContent:  'center',
    // iOS glow
    shadowColor:   colors.accent,
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius:  16,
    // Android
    elevation: 8,
  },
  content: {
    flexDirection:  'row',
    alignItems:     'center',
  },
  icon: {
    fontSize:    22,
    color:       colors.textInverse,
    marginRight: spacing.sm,
    fontFamily:  typography.fontBold,
  },
  label: {
    fontFamily: typography.fontSemiBold,
    fontSize:   typography.md,
    color:      colors.textInverse,
    letterSpacing: 0.2,
  },
});

export default CheckInButton;
