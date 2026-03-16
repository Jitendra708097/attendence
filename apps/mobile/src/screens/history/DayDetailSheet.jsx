/**
 * @module DayDetailSheet
 * @description Bottom sheet showing full detail for a selected attendance day.
 *              Lists all sessions, GPS coords, face method, anomaly flag.
 *              Called by: HistoryScreen on day row tap.
 */

import React, { useRef, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';

import api           from '../../api/axiosInstance.js';
import SessionRow    from '../../components/history/SessionRow.jsx';
import StatusBadge   from '../../components/common/StatusBadge.jsx';
import { colors }    from '../../theme/colors.js';
import { typography }from '../../theme/typography.js';
import { spacing }   from '../../theme/spacing.js';
import { formatDayDate, formatDuration } from '../../utils/formatters.js';

/**
 * @param {object}  props
 * @param {boolean} props.visible
 * @param {object}  props.record  - Day attendance record (basic)
 * @param {function}props.onClose
 */
const DayDetailSheet = ({ visible, record, onClose }) => {
  const sheetRef  = useRef(null);
  const [detail,  setDetail]  = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && record) {
      sheetRef.current?.expand();
      fetchDetail();
    } else {
      sheetRef.current?.close();
    }
  }, [visible, record?.date]);

  const fetchDetail = async () => {
    if (!record?.date) return;
    setLoading(true);
    try {
      const res = await api.get(`/attendance/${record.date}`);
      setDetail(res.data.data);
    } catch {
      setDetail(null);
    } finally {
      setLoading(false);
    }
  };

  const d = detail || record;

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={['60%', '90%']}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.date}>{formatDayDate(d?.date)}</Text>
            <Text style={styles.worked}>
              {formatDuration(d?.totalWorkedMins)} worked
            </Text>
          </View>
          <StatusBadge status={d?.isLate ? 'late' : d?.status} />
        </View>

        {/* Anomaly banner */}
        {d?.isAnomaly && (
          <View style={styles.anomalyBanner}>
            <Text style={styles.anomalyText}>⚠️ Anomaly flagged — admin is reviewing</Text>
          </View>
        )}

        {/* Sessions */}
        <Text style={styles.sectionHeading}>Sessions</Text>

        {loading && <ActivityIndicator color={colors.accent} style={{ margin: spacing.base }} />}

        {!loading && d?.sessions?.length > 0 && d.sessions.map((s, i) => (
          <SessionRow key={i} session={s} />
        ))}

        {!loading && (!d?.sessions || d.sessions.length === 0) && (
          <Text style={styles.noSessions}>No session data available.</Text>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  sheetBg: { backgroundColor: colors.bgSurface },
  handle:  { backgroundColor: colors.border, width: 40 },
  content: { padding: spacing.xl, paddingBottom: spacing['3xl'] },

  header: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'flex-start',
    marginBottom:    spacing.base,
  },
  date: {
    fontFamily: typography.fontBold,
    fontSize:   typography.lg,
    color:      colors.textPrimary,
  },
  worked: {
    fontFamily: typography.fontMono,
    fontSize:   typography.sm,
    color:      colors.textSecondary,
    marginTop:  spacing.xs,
  },

  anomalyBanner: {
    backgroundColor: colors.warningLight,
    borderRadius:    10,
    padding:         spacing.md,
    marginBottom:    spacing.base,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  anomalyText: {
    fontFamily: typography.fontMedium,
    fontSize:   typography.sm,
    color:      colors.warning,
  },

  sectionHeading: {
    fontFamily:    typography.fontSemiBold,
    fontSize:      typography.sm,
    color:         colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom:  spacing.sm,
  },

  noSessions: {
    fontFamily: typography.fontRegular,
    fontSize:   typography.base,
    color:      colors.textMuted,
    textAlign:  'center',
    marginTop:  spacing.base,
  },
});

export default DayDetailSheet;
