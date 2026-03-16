/**
 * @module DayRow
 * @description Single day item in the attendance history list.
 *              Shows: date, status badge, check-in/out times, total hours.
 *              Tap → opens DayDetailSheet.
 *              Called by: HistoryScreen FlatList.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors }     from '../../theme/colors.js';
import { typography } from '../../theme/typography.js';
import { spacing }    from '../../theme/spacing.js';
import StatusBadge    from '../common/StatusBadge.jsx';
import { formatTime, formatDuration, formatDayDate } from '../../utils/formatters.js';

/**
 * @param {object}  props
 * @param {object}  props.record       - Attendance record for the day
 * @param {function}props.onPress      - Opens detail sheet
 */
const DayRow = ({ record, onPress }) => {
  const {
    date,
    status,
    isLate,
    firstCheckIn,
    lastCheckOut,
    totalWorkedMins,
    isAnomaly,
  } = record;

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Left — date */}
      <View style={styles.dateBlock}>
        <Text style={styles.dayNum}>{new Date(date).getDate()}</Text>
        <Text style={styles.dayName}>{formatDayDate(date).split(',')[0].slice(0, 3)}</Text>
      </View>

      {/* Center — times */}
      <View style={styles.middle}>
        <View style={styles.timeRow}>
          <Text style={styles.timeLabel}>IN  </Text>
          <Text style={styles.timeValue}>{firstCheckIn ? formatTime(firstCheckIn) : '—'}</Text>
        </View>
        <View style={styles.timeRow}>
          <Text style={styles.timeLabel}>OUT </Text>
          <Text style={styles.timeValue}>{lastCheckOut ? formatTime(lastCheckOut) : '—'}</Text>
        </View>
      </View>

      {/* Right — status + hours */}
      <View style={styles.right}>
        <StatusBadge status={isLate ? 'late' : status} size="sm" />
        <Text style={styles.worked}>
          {formatDuration(totalWorkedMins)}
        </Text>
      </View>

      {/* Anomaly indicator */}
      {isAnomaly && (
        <View style={styles.anomalyDot} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: colors.bgSurface,
    marginHorizontal: spacing.base,
    marginBottom:    spacing.sm,
    borderRadius:    12,
    padding:         spacing.base,
    // iOS
    shadowColor:  '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    // Android
    elevation: 1,
    position: 'relative',
  },
  dateBlock: {
    width:      44,
    alignItems: 'center',
    marginRight: spacing.base,
  },
  dayNum: {
    fontFamily: typography.fontBold,
    fontSize:   typography.xl,
    color:      colors.textPrimary,
    lineHeight: typography.xl,
  },
  dayName: {
    fontFamily: typography.fontRegular,
    fontSize:   typography.xs,
    color:      colors.textMuted,
    marginTop:  2,
  },
  middle: {
    flex: 1,
  },
  timeRow: {
    flexDirection:  'row',
    alignItems:     'center',
    marginBottom:   2,
  },
  timeLabel: {
    fontFamily: typography.fontRegular,
    fontSize:   typography.xs,
    color:      colors.textMuted,
    width:      28,
  },
  timeValue: {
    fontFamily: typography.fontMono,
    fontSize:   typography.sm,
    color:      colors.textPrimary,
  },
  right: {
    alignItems: 'flex-end',
    minWidth:   64,
  },
  worked: {
    fontFamily: typography.fontMonoMed,
    fontSize:   typography.sm,
    color:      colors.textSecondary,
    marginTop:  spacing.xs,
  },
  anomalyDot: {
    position:     'absolute',
    top:          spacing.sm,
    right:        spacing.sm,
    width:        6,
    height:       6,
    borderRadius: 3,
    backgroundColor: colors.warning,
  },
});

export default DayRow;
