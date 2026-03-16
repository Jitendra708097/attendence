/**
 * @module CheckOutButton
 * @description Red check-out button with spring animation.
 *              State: CHECKED_IN — red, "Check Out".
 *              Shows minimum session warning if < 30 min elapsed.
 *              Called by: HomeScreen when buttonState === 'CHECKED_IN'.
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
import SessionTimer   from './SessionTimer.jsx';
import { SESSION }    from '../../utils/constants.js';

/**
 * @param {object}  props
 * @param {function}props.onPress          - Opens ConfirmCheckoutSheet
 * @param {string}  props.sessionStartTime - ISO string of check-in time
 * @param {number}  props.sessionMinutes   - Minutes elapsed in current session
 * @param {boolean} [props.loading]
 */
const CheckOutButton = ({ onPress, sessionStartTime, sessionMinutes = 0, loading = false }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn  = () => { scale.value = withSpring(0.96, { damping: 12 }); };
  const handlePressOut = () => { scale.value = withSpring(1.0,  { damping: 12 }); };

  const belowMinimum = sessionMinutes > 0 && sessionMinutes < SESSION.MIN_SESSION_MINUTES;

  return (
    <View style={styles.wrapper}>
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={loading}
          activeOpacity={1}
          style={styles.button}
          accessibilityRole="button"
          accessibilityLabel="Check Out"
        >
          <View style={styles.content}>
            <Text style={styles.icon}>⏹</Text>
            <Text style={styles.label}>Check Out</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Live session timer below button */}
      <View style={styles.timerRow}>
        <Text style={styles.timerLabel}>Session: </Text>
        <SessionTimer startTime={sessionStartTime} />
      </View>

      {belowMinimum && (
        <View style={styles.warningRow}>
          <Text style={styles.warningText}>
            ⚠ Min {SESSION.MIN_SESSION_MINUTES} min required for this session
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  button: {
    backgroundColor: colors.danger,
    height:          64,
    borderRadius:    14,
    alignItems:      'center',
    justifyContent:  'center',
    // iOS
    shadowColor:   colors.danger,
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius:  16,
    // Android
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  icon: {
    fontSize:    20,
    color:       colors.textInverse,
    marginRight: spacing.sm,
  },
  label: {
    fontFamily: typography.fontSemiBold,
    fontSize:   typography.md,
    color:      colors.textInverse,
    letterSpacing: 0.2,
  },
  timerRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    marginTop:      spacing.sm,
  },
  timerLabel: {
    fontFamily: typography.fontRegular,
    fontSize:   typography.sm,
    color:      colors.textSecondary,
  },
  warningRow: {
    marginTop:  spacing.xs,
    alignItems: 'center',
  },
  warningText: {
    fontFamily: typography.fontMedium,
    fontSize:   typography.xs,
    color:      colors.warning,
  },
});

export default CheckOutButton;
