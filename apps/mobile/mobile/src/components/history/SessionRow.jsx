/**
 * @module SessionRow
 * @description Single attendance session item inside DayDetailSheet.
 *              Shows: session number, check-in → check-out, duration,
 *              GPS coordinates (muted), face method used.
 *              Called by: DayDetailSheet.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors }     from '../../theme/colors.js';
import { typography } from '../../theme/typography.js';
import { spacing }    from '../../theme/spacing.js';
import { formatTime, formatDuration } from '../../utils/formatters.js';

/**
 * @param {object} props
 * @param {object} props.session
 *   { sessionNumber, checkInTime, checkOutTime, workedMinutes,
 *     status, checkInLat, checkInLng, faceMethod }
 */
const SessionRow = ({ session }) => {
  const {
    sessionNumber,
    checkInTime,
    checkOutTime,
    workedMinutes,
    status,
    checkInLat,
    checkInLng,
    faceMethod,
  } = session;

  const isOpen = status === 'open';

  return (
    <View style={styles.row}>
      {/* Session number badge */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>#{sessionNumber}</Text>
      </View>

      <View style={styles.content}>
        {/* Time range */}
        <View style={styles.timeRow}>
          <Text style={styles.time}>{formatTime(checkInTime)}</Text>
          <Text style={styles.arrow}> → </Text>
          <Text style={styles.time}>
            {isOpen ? <Text style={styles.openLabel}>Active</Text> : formatTime(checkOutTime)}
          </Text>
          <Text style={styles.duration}>  {formatDuration(workedMinutes)}</Text>
        </View>

        {/* GPS + face method */}
        <View style={styles.metaRow}>
          {checkInLat && checkInLng && (
            <Text style={styles.meta}>
              📍 {checkInLat.toFixed(4)}, {checkInLng.toFixed(4)}
            </Text>
          )}
          {faceMethod && (
            <Text style={styles.meta}>
              {faceMethod === 'rekognition' ? '☁️ Cloud verify' : '📱 On-device'}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection:   'row',
    alignItems:      'flex-start',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  badge: {
    backgroundColor: colors.accentLight,
    borderRadius:    8,
    paddingHorizontal: spacing.sm,
    paddingVertical:   spacing.xs,
    marginRight:     spacing.md,
    marginTop:       2,
  },
  badgeText: {
    fontFamily: typography.fontMonoMed,
    fontSize:   typography.xs,
    color:      colors.accent,
  },
  content: {
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems:    'center',
    flexWrap:      'wrap',
  },
  time: {
    fontFamily: typography.fontMono,
    fontSize:   typography.base,
    color:      colors.textPrimary,
  },
  arrow: {
    fontFamily: typography.fontRegular,
    fontSize:   typography.base,
    color:      colors.textMuted,
  },
  openLabel: {
    fontFamily: typography.fontSemiBold,
    fontSize:   typography.base,
    color:      colors.success,
  },
  duration: {
    fontFamily: typography.fontMonoMed,
    fontSize:   typography.sm,
    color:      colors.accent,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    marginTop:     spacing.xs,
    gap:           spacing.md,
  },
  meta: {
    fontFamily: typography.fontRegular,
    fontSize:   typography.xs,
    color:      colors.textMuted,
  },
});

export default SessionRow;
