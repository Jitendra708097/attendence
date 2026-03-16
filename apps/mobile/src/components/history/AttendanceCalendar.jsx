/**
 * @module AttendanceCalendar
 * @description Monthly calendar grid with colored status dots per day.
 *   Green  → present
 *   Red    → absent
 *   Amber  → half day / late
 *   Blue   → on leave
 *   Grey   → weekend / holiday / no data
 *   Empty  → future date
 * Called by: HistoryScreen.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import dayjs from 'dayjs';
import { colors }     from '../../theme/colors.js';
import { typography } from '../../theme/typography.js';
import { spacing }    from '../../theme/spacing.js';

const DOT_COLORS = {
  present:        colors.success,
  absent:         colors.danger,
  half_day:       colors.warning,
  half_day_early: colors.warning,
  late:           colors.warning,
  on_leave:       colors.info,
  holiday:        colors.accent,
  weekend:        colors.border,
};

const DAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/**
 * @param {object} props
 * @param {Date|string} props.month         - Any date in the target month
 * @param {object}      props.attendanceMap - { 'YYYY-MM-DD': { status, isLate } }
 * @param {function}    [props.onDayPress]  - (dateString: 'YYYY-MM-DD') => void
 */
const AttendanceCalendar = ({ month, attendanceMap = {}, onDayPress }) => {
  const firstDay  = dayjs(month).startOf('month');
  const lastDay   = dayjs(month).endOf('month');
  const startDow  = firstDay.day(); // 0 = Sunday
  const totalDays = lastDay.date();
  const today     = dayjs().format('YYYY-MM-DD');

  // Build grid cells: nulls for leading blank days, then day numbers
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);

  return (
    <View style={styles.calendar}>
      {/* Day headers */}
      <View style={styles.headerRow}>
        {DAY_HEADERS.map((h, i) => (
          <Text key={i} style={styles.headerCell}>{h}</Text>
        ))}
      </View>

      {/* Day cells in rows of 7 */}
      <View style={styles.grid}>
        {cells.map((day, idx) => {
          if (!day) return <View key={`blank-${idx}`} style={styles.cell} />;

          const dateStr  = firstDay.date(day).format('YYYY-MM-DD');
          const record   = attendanceMap[dateStr];
          const status   = record?.status || (dayjs(dateStr).isAfter(today) ? null : 'weekend');
          const isToday  = dateStr === today;
          const dotColor = record?.isLate
            ? DOT_COLORS.late
            : (status ? DOT_COLORS[status] : null);

          return (
            <TouchableOpacity
              key={dateStr}
              style={[styles.cell, isToday && styles.cellToday]}
              onPress={() => onDayPress && record && onDayPress(dateStr)}
              activeOpacity={record ? 0.7 : 1}
            >
              <Text style={[
                styles.dayNum,
                isToday && styles.dayNumToday,
                !record && styles.dayNumMuted,
              ]}>
                {day}
              </Text>
              {dotColor && (
                <View style={[styles.dot, { backgroundColor: dotColor }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  calendar: {
    backgroundColor: colors.bgSurface,
    borderRadius:    16,
    padding:         spacing.base,
    marginHorizontal: spacing.base,
  },
  headerRow: {
    flexDirection:   'row',
    marginBottom:    spacing.sm,
  },
  headerCell: {
    flex:       1,
    textAlign:  'center',
    fontFamily: typography.fontSemiBold,
    fontSize:   typography.xs,
    color:      colors.textMuted,
  },
  grid: {
    flexDirection:  'row',
    flexWrap:       'wrap',
  },
  cell: {
    width:          `${100 / 7}%`,
    aspectRatio:    1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  cellToday: {
    backgroundColor: colors.accentLight,
    borderRadius:    8,
  },
  dayNum: {
    fontFamily: typography.fontMedium,
    fontSize:   typography.sm,
    color:      colors.textPrimary,
  },
  dayNumToday: {
    color: colors.accent,
  },
  dayNumMuted: {
    color: colors.textMuted,
  },
  dot: {
    width:        5,
    height:       5,
    borderRadius: 3,
    marginTop:    2,
  },
});

export default AttendanceCalendar;
