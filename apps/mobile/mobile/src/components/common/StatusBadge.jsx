/**
 * @module StatusBadge
 * @description Pill-shaped badge for attendance and leave status display.
 *              Always shows: background color + text (never color alone).
 *              Accessible — does not rely on color alone for meaning.
 *              Called by: DayRow, HistoryScreen summary, HomeScreen.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors }     from '../../theme/colors.js';
import { typography } from '../../theme/typography.js';
import { spacing }    from '../../theme/spacing.js';

const STATUS_CONFIG = {
  // Attendance
  present:        { bg: colors.successLight, text: colors.success,  label: 'Present'    },
  absent:         { bg: colors.dangerLight,  text: colors.danger,   label: 'Absent'     },
  half_day:       { bg: colors.warningLight, text: colors.warning,  label: 'Half Day'   },
  half_day_early: { bg: colors.warningLight, text: colors.warning,  label: 'Early Exit' },
  on_leave:       { bg: colors.infoLight,    text: colors.info,     label: 'On Leave'   },
  holiday:        { bg: colors.accentLight,  text: colors.accent,   label: 'Holiday'    },
  weekend:        { bg: colors.bgSubtle,     text: colors.textMuted,label: 'Weekend'    },
  overtime:       { bg: colors.accentLight,  text: colors.accent,   label: 'Overtime'   },
  not_marked:     { bg: colors.bgSubtle,     text: colors.textMuted,label: 'Not Marked' },
  late:           { bg: colors.warningLight, text: colors.warning,  label: 'Late'       },

  // Leave request
  pending:        { bg: colors.warningLight, text: colors.warning,  label: 'Pending'    },
  approved:       { bg: colors.successLight, text: colors.success,  label: 'Approved'   },
  rejected:       { bg: colors.dangerLight,  text: colors.danger,   label: 'Rejected'   },
  cancelled:      { bg: colors.bgSubtle,     text: colors.textMuted,label: 'Cancelled'  },

  // Regularisation
  submitted:      { bg: colors.warningLight, text: colors.warning,  label: 'Submitted'  },
};

/**
 * @param {object} props
 * @param {string} props.status   - One of STATUS_CONFIG keys
 * @param {string} [props.label]  - Override default label
 * @param {'sm'|'md'} [props.size='md']
 */
const StatusBadge = ({ status, label, size = 'md' }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.not_marked;
  const displayLabel = label || config.label;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, size === 'sm' && styles.badgeSm]}>
      <Text style={[styles.text, { color: config.text }, size === 'sm' && styles.textSm]}>
        {displayLabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius:      20,
    paddingHorizontal: spacing.md,
    paddingVertical:   spacing.xs - 1,
    alignSelf:         'flex-start',
  },
  badgeSm: {
    paddingHorizontal: spacing.sm,
    paddingVertical:   2,
  },
  text: {
    fontFamily: typography.fontSemiBold,
    fontSize:   typography.sm,
  },
  textSm: {
    fontSize: typography.xs,
  },
});

export default StatusBadge;
