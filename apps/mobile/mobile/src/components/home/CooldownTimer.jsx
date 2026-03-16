/**
 * @module CooldownTimer
 * @description Grey disabled button showing cooldown countdown + progress bar.
 *              State: COOLDOWN — "Wait MM:SS".
 *              Called by: HomeScreen when buttonState === 'COOLDOWN'.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors }     from '../../theme/colors.js';
import { typography } from '../../theme/typography.js';
import { spacing }    from '../../theme/spacing.js';
import useCountdown   from '../../hooks/useCountdown.js';
import { SESSION }    from '../../utils/constants.js';

/**
 * @param {object} props
 * @param {string} props.cooldownEndsAt - ISO string when cooldown expires
 */
const CooldownTimer = ({ cooldownEndsAt }) => {
  const totalSeconds = SESSION.COOLDOWN_MINUTES * 60;
  const { formatted, progress, isComplete } = useCountdown(cooldownEndsAt, totalSeconds);

  return (
    <View style={styles.wrapper}>
      {/* Disabled grey button */}
      <View style={styles.button}>
        <View style={styles.content}>
          <Text style={styles.icon}>⏳</Text>
          <Text style={styles.label}>
            {isComplete ? 'Ready...' : `Wait  ${formatted}`}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>

      <Text style={styles.hint}>
        {isComplete ? 'Refreshing...' : 'Cooldown in progress'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { width: '100%' },
  button: {
    backgroundColor: colors.bgSubtle,
    height:          64,
    borderRadius:    14,
    borderWidth:     1,
    borderColor:     colors.border,
    alignItems:      'center',
    justifyContent:  'center',
  },
  content: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  icon: {
    fontSize:    18,
    marginRight: spacing.sm,
    color:       colors.cooldownGrey,
  },
  label: {
    fontFamily: typography.fontMonoMed,
    fontSize:   typography.md,
    color:      colors.cooldownGrey,
  },
  progressTrack: {
    height:          4,
    backgroundColor: colors.border,
    borderRadius:    2,
    marginTop:       spacing.sm,
    overflow:        'hidden',
  },
  progressFill: {
    height:          4,
    backgroundColor: colors.accent,
    borderRadius:    2,
  },
  hint: {
    fontFamily:  typography.fontRegular,
    fontSize:    typography.xs,
    color:       colors.textMuted,
    textAlign:   'center',
    marginTop:   spacing.xs,
  },
});

export default CooldownTimer;
