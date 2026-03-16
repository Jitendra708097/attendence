/**
 * @module UndoCheckoutBar
 * @description Slides up from bottom for 10 minutes after checkout.
 *              Shows countdown and undo button.
 *              Disappears automatically when timer expires.
 *              Called by: HomeScreen (rendered when lastCheckout is set).
 */

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import useAttendanceStore from '../../store/attendanceStore.js';
import useCountdown       from '../../hooks/useCountdown.js';
import { colors }    from '../../theme/colors.js';
import { typography }from '../../theme/typography.js';
import { spacing }   from '../../theme/spacing.js';
import { SESSION }   from '../../utils/constants.js';

/**
 * @param {object} props
 * @param {string} props.undoWindowEndsAt - ISO string when undo expires
 */
const UndoCheckoutBar = ({ undoWindowEndsAt }) => {
  const undoCheckout = useAttendanceStore((s) => s.undoCheckout);
  const isLoading    = useAttendanceStore((s) => s.isLoading);

  const totalSeconds = SESSION.UNDO_WINDOW_MINUTES * 60;
  const { formatted, isComplete } = useCountdown(undoWindowEndsAt, totalSeconds);

  const translateY = useSharedValue(100);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 18 });
  }, []);

  useEffect(() => {
    if (isComplete) {
      translateY.value = withTiming(120, { duration: 300 });
    }
  }, [isComplete]);

  if (isComplete) return null;

  const handleUndo = async () => {
    const result = await undoCheckout();
    if (result.success) {
      translateY.value = withTiming(120, { duration: 250 });
    }
  };

  return (
    <Animated.View style={[styles.bar, animStyle]}>
      <View style={styles.left}>
        <Text style={styles.checkText}>Checked out ✅</Text>
        <Text style={styles.countdown}>Undo available: {formatted}</Text>
      </View>
      <TouchableOpacity
        onPress={handleUndo}
        disabled={isLoading}
        style={styles.undoBtn}
        activeOpacity={0.8}
      >
        <Text style={styles.undoBtnText}>Undo</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bar: {
    position:        'absolute',
    bottom:          0,
    left:            0,
    right:           0,
    backgroundColor: colors.textPrimary,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    // iOS
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius:  12,
    // Android
    elevation: 12,
  },
  left: { flex: 1 },
  checkText: {
    fontFamily: typography.fontSemiBold,
    fontSize:   typography.base,
    color:      colors.textInverse,
  },
  countdown: {
    fontFamily: typography.fontMono,
    fontSize:   typography.sm,
    color:      colors.accent,
    marginTop:  2,
  },
  undoBtn: {
    backgroundColor: colors.accentLight,
    borderRadius:    10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    marginLeft:      spacing.base,
  },
  undoBtnText: {
    fontFamily: typography.fontBold,
    fontSize:   typography.base,
    color:      colors.accent,
  },
});

export default UndoCheckoutBar;
