/**
 * @module LeaveBalanceCard
 * @description Standalone card displaying balance for one leave type.
 *              Shows: type label, remaining count (large DM Mono),
 *              used/total text, progress bar.
 *              Color-coded by leave type.
 *              Called by: LeaveScreen Tab 1 (Balance) in a 2x2 grid.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors }     from '../../theme/colors.js';
import { typography } from '../../theme/typography.js';
import { spacing }    from '../../theme/spacing.js';
import { LEAVE_TYPE_LABELS } from '../../utils/constants.js';

/** Color per leave type */
const TYPE_COLORS = {
  casual:   colors.info,
  sick:     colors.danger,
  earned:   colors.success,
  optional: colors.warning,
};

/**
 * @param {object} props
 * @param {'casual'|'sick'|'earned'|'optional'} props.type
 * @param {{ total: number, used: number, remaining: number }} props.balance
 */
const LeaveBalanceCard = ({ type, balance }) => {
  const { total = 0, used = 0, remaining = 0 } = balance || {};
  const color    = TYPE_COLORS[type] || colors.accent;
  const progress = total > 0 ? Math.min(1, used / total) : 0;

  return (
    <View style={[styles.card, { borderTopColor: color }]}>
      <Text style={styles.typeLabel}>{LEAVE_TYPE_LABELS[type] || type}</Text>

      <Text style={[styles.remaining, { color }]}>{remaining}</Text>
      <Text style={styles.unit}>days left</Text>

      {/* Progress bar: filled = used */}
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${Math.round(progress * 100)}%`, backgroundColor: color },
          ]}
        />
      </View>

      <Text style={styles.detail}>{used} used · {total} total</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgSurface,
    borderRadius:    14,
    padding:         spacing.base,
    borderTopWidth:  4,
    flex:            1,
    // iOS
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius:  8,
    // Android
    elevation: 2,
  },
  typeLabel: {
    fontFamily:   typography.fontSemiBold,
    fontSize:     typography.sm,
    color:        colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight:   typography.sm * 1.3,
  },
  remaining: {
    fontFamily: typography.fontBold,
    fontSize:   typography['3xl'],
    lineHeight: typography['3xl'] * 1.0,
  },
  unit: {
    fontFamily:   typography.fontRegular,
    fontSize:     typography.xs,
    color:        colors.textMuted,
    marginBottom: spacing.sm,
    marginTop:    2,
  },
  track: {
    height:          4,
    backgroundColor: colors.border,
    borderRadius:    2,
    overflow:        'hidden',
    marginBottom:    spacing.xs,
  },
  fill: {
    height:       4,
    borderRadius: 2,
  },
  detail: {
    fontFamily: typography.fontRegular,
    fontSize:   typography.xs,
    color:      colors.textMuted,
  },
});

export default LeaveBalanceCard;
