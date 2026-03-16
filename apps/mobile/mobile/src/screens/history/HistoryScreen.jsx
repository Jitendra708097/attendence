/**
 * @module HistoryScreen
 * @description Monthly attendance history with calendar dots and day list.
 *              Month picker (prev/next arrows).
 *              Summary strip: Present | Absent | Late | On Leave.
 *              Tap a day row → opens DayDetailSheet.
 *              FAB → RegularisationModal.
 *              Called by: MainNavigator (Tab 2 — History).
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import dayjs from 'dayjs';

import api from '../../api/axiosInstance.js';
import AttendanceCalendar from '../../components/history/AttendanceCalendar.jsx';
import DayRow             from '../../components/history/DayRow.jsx';
import { EmptyState }     from '../../components/common/CommonComponents.jsx';
import DayDetailSheet     from './DayDetailSheet.jsx';
import { colors }    from '../../theme/colors.js';
import { typography }from '../../theme/typography.js';
import { spacing }   from '../../theme/spacing.js';
import { formatMonthYear } from '../../utils/formatters.js';

const HistoryScreen = ({ navigation }) => {
  const [month,       setMonth]       = useState(dayjs());
  const [records,     setRecords]     = useState([]);
  const [attendanceMap,setMap]        = useState({});
  const [summary,     setSummary]     = useState({ present: 0, absent: 0, late: 0, onLeave: 0 });
  const [isLoading,   setLoading]     = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showDetail,  setShowDetail]  = useState(false);

  useEffect(() => { fetchHistory(); }, [month]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/attendance/history', {
        params: { month: month.format('YYYY-MM'), limit: 31 },
      });
      const data = res.data.data;
      setRecords(data.records || []);
      setMap(data.attendanceMap || {});
      setSummary(data.summary   || { present: 0, absent: 0, late: 0, onLeave: 0 });
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDayPress = (dateStr) => {
    const record = records.find((r) => r.date === dateStr);
    if (record) { setSelectedDay(record); setShowDetail(true); }
  };

  const prevMonth = () => setMonth((m) => m.subtract(1, 'month'));
  const nextMonth = () => setMonth((m) => m.add(1, 'month'));
  const canGoNext = month.isBefore(dayjs(), 'month') || month.isSame(dayjs(), 'month');

  const SummaryStrip = () => (
    <View style={styles.strip}>
      {[
        { label: 'Present', count: summary.present, color: colors.success },
        { label: 'Absent',  count: summary.absent,  color: colors.danger  },
        { label: 'Late',    count: summary.late,     color: colors.warning },
        { label: 'Leave',   count: summary.onLeave,  color: colors.info    },
      ].map(({ label, count, color }) => (
        <View key={label} style={styles.statBox}>
          <Text style={[styles.statNum, { color }]}>{count}</Text>
          <Text style={styles.statLabel}>{label}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Month picker */}
      <View style={styles.monthRow}>
        <TouchableOpacity onPress={prevMonth} style={styles.arrow}>
          <Text style={styles.arrowText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{formatMonthYear(month.toDate())}</Text>
        <TouchableOpacity
          onPress={nextMonth}
          style={styles.arrow}
          disabled={!canGoNext}
        >
          <Text style={[styles.arrowText, !canGoNext && styles.arrowDim]}>›</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ListHeaderComponent={
          <>
            <SummaryStrip />
            <AttendanceCalendar
              month={month.toDate()}
              attendanceMap={attendanceMap}
              onDayPress={handleDayPress}
            />
            <Text style={styles.listHeading}>Daily Records</Text>
          </>
        }
        data={records}
        keyExtractor={(r) => r.date}
        renderItem={({ item }) => (
          <DayRow
            record={item}
            onPress={() => handleDayPress(item.date)}
          />
        )}
        ListEmptyComponent={
          !isLoading && (
            <EmptyState
              emoji="📅"
              title="No records this month"
              subtitle="Your attendance history will appear here"
            />
          )
        }
        ListFooterComponent={
          isLoading && <ActivityIndicator color={colors.accent} style={{ margin: spacing.xl }} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing['4xl'] }}
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Regularisation', {
          date: selectedDay?.date || undefined,
        })}
      >
        <Text style={styles.fabText}>✎</Text>
      </TouchableOpacity>

      {/* Day detail sheet */}
      <DayDetailSheet
        visible={showDetail}
        record={selectedDay}
        onClose={() => setShowDetail(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPrimary },

  monthRow: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical:  spacing.base,
    backgroundColor: colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  arrow:    { padding: spacing.sm },
  arrowText: {
    fontFamily: typography.fontBold,
    fontSize:   typography['2xl'],
    color:      colors.accent,
  },
  arrowDim: { color: colors.border },
  monthLabel: {
    fontFamily: typography.fontSemiBold,
    fontSize:   typography.md,
    color:      colors.textPrimary,
  },

  strip: {
    flexDirection:   'row',
    justifyContent:  'space-around',
    backgroundColor: colors.bgSurface,
    paddingVertical: spacing.base,
    marginBottom:    spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statBox:   { alignItems: 'center' },
  statNum: {
    fontFamily: typography.fontBold,
    fontSize:   typography.xl,
  },
  statLabel: {
    fontFamily: typography.fontRegular,
    fontSize:   typography.xs,
    color:      colors.textMuted,
    marginTop:  2,
  },

  listHeading: {
    fontFamily:       typography.fontSemiBold,
    fontSize:         typography.sm,
    color:            colors.textMuted,
    letterSpacing:    0.8,
    textTransform:    'uppercase',
    marginHorizontal: spacing.base,
    marginBottom:     spacing.sm,
    marginTop:        spacing.base,
  },

  fab: {
    position:        'absolute',
    bottom:          spacing.xl,
    right:           spacing.xl,
    width:           52,
    height:          52,
    borderRadius:    26,
    backgroundColor: colors.accent,
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     colors.accent,
    shadowOffset:    { width: 0, height: 6 },
    shadowOpacity:   0.3,
    shadowRadius:    12,
    elevation:       8,
  },
  fabText: {
    fontSize:   22,
    color:      colors.textInverse,
    lineHeight: 26,
  },
});

export default HistoryScreen;
