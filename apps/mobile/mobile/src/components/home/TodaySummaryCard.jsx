/**
 * @module TodaySummaryCard
 * @description Summary card showing today's worked time, session count, status.
 *              Displayed below the check-in button on HomeScreen.
 *              Called by: HomeScreen.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors }      from '../../theme/colors.js';
import { typography }  from '../../theme/typography.js';
import { spacing }     from '../../theme/spacing.js';
import AppCard         from '../common/AppCard.jsx';
import StatusBadge     from '../common/StatusBadge.jsx';
import { formatDuration, formatTime } from '../../utils/formatters.js';
import { SESSION }     from '../../utils/constants.js';

/**
 * @param {object} props
 * @param {number} props.totalWorkedMins    - Total minutes worked today
 * @param {number} props.sessionsToday      - Sessions used today
 * @param {string} [props.todayStatus]      - e.g. 'present', 'absent'
 * @param {string} [props.firstCheckInTime] - ISO string of first check-in
 * @param {boolean}[props.isLate]           - Late flag
 */
const TodaySummaryCard = ({
  totalWorkedMins = 0,
  sessionsToday   = 0,
  todayStatus,
  firstCheckInTime,
  isLate          = false,
}) => {
  return (
    <AppCard style={styles.card}>
      <Text style={styles.heading}>Today's Summary</Text>

      {/* Main worked time */}
      <Text style={styles.workedTime}>
        {formatDuration(totalWorkedMins)}
      </Text>
      <Text style={styles.workedLabel}>total worked</Text>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {sessionsToday}/{SESSION.MAX_SESSIONS_PER_DAY}
          </Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </View>

        {firstCheckInTime && (
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatTime(firstCheckInTime)}</Text>
            <Text style={styles.statLabel}>First Check-in</Text>
          </View>
        )}

        {todayStatus && (
          <View style={styles.stat}>
            <StatusBadge status={isLate ? 'late' : todayStatus} size="sm" />
            <Text style={styles.statLabel}>Status</Text>
          </View>
        )}
      </View>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.base,
    alignItems: 'center',
  },
  heading: {
    fontFamily:   typography.fontSemiBold,
    fontSize:     typography.sm,
    color:        colors.textSecondary,
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  workedTime: {
    fontFamily: typography.fontMonoMed,
    fontSize:   typography['3xl'],
    color:      colors.textPrimary,
    lineHeight: typography['3xl'] * 1.1,
  },
  workedLabel: {
    fontFamily:  typography.fontRegular,
    fontSize:    typography.sm,
    color:       colors.textMuted,
    marginBottom: spacing.base,
  },
  statsRow: {
    flexDirection:   'row',
    justifyContent:  'space-around',
    width:           '100%',
    borderTopWidth:  1,
    borderTopColor:  colors.border,
    paddingTop:      spacing.base,
  },
  stat: {
    alignItems:   'center',
    flex:          1,
  },
  statValue: {
    fontFamily:   typography.fontMonoMed,
    fontSize:     typography.base,
    color:        colors.textPrimary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontFamily: typography.fontRegular,
    fontSize:   typography.xs,
    color:      colors.textMuted,
  },
});

export default TodaySummaryCard;
