/**
 * @module LeaveScreen
 * @description Leave management screen with 3 tabs: Balance, Apply, History.
 *              Tab 1 — Balance: 4 leave type cards with progress bars.
 *              Tab 2 — Apply:   Date picker, type, reason, submit form.
 *              Tab 3 — History: Paginated leave request list with cancel.
 *              Called by: MainNavigator (Tab 3 — Leave).
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useRef } from 'react';

import api        from '../../api/axiosInstance.js';
import AppButton  from '../../components/common/AppButton.jsx';
import AppInput   from '../../components/common/AppInput.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import { EmptyState, ErrorMessage } from '../../components/common/CommonComponents.jsx';
import { colors }    from '../../theme/colors.js';
import { typography }from '../../theme/typography.js';
import { spacing }   from '../../theme/spacing.js';
import {
  LEAVE_TYPES,
  LEAVE_TYPE_LABELS,
  API_ROUTES,
} from '../../utils/constants.js';
import { formatDateRange, formatDate, countWorkingDays } from '../../utils/formatters.js';

// ── Leave Balance Card ───────────────────────────────────────────────────────
const BalanceCard = ({ type, balance }) => {
  const { total = 0, used = 0, remaining = 0 } = balance || {};
  const progress = total > 0 ? (used / total) : 0;

  const TYPE_COLORS = {
    casual:   colors.info,
    sick:     colors.danger,
    earned:   colors.success,
    optional: colors.warning,
  };
  const color = TYPE_COLORS[type] || colors.accent;

  return (
    <View style={[bStyles.card, { borderTopColor: color }]}>
      <Text style={bStyles.typeLabel}>{LEAVE_TYPE_LABELS[type]}</Text>
      <Text style={[bStyles.remaining, { color }]}>{remaining}</Text>
      <Text style={bStyles.unit}>days left</Text>
      <View style={bStyles.track}>
        <View style={[bStyles.fill, { width: `${Math.round(progress * 100)}%`, backgroundColor: color }]} />
      </View>
      <Text style={bStyles.detail}>{used} used of {total}</Text>
    </View>
  );
};

const bStyles = StyleSheet.create({
  card: {
    flex:            1,
    backgroundColor: colors.bgSurface,
    borderRadius:    14,
    padding:         spacing.base,
    borderTopWidth:  4,
    marginBottom:    spacing.sm,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.06,
    shadowRadius:    8,
    elevation:       2,
  },
  typeLabel: {
    fontFamily:   typography.fontSemiBold,
    fontSize:     typography.sm,
    color:        colors.textSecondary,
    marginBottom: spacing.sm,
  },
  remaining: {
    fontFamily: typography.fontBold,
    fontSize:   typography['3xl'],
    lineHeight: typography['3xl'],
  },
  unit: {
    fontFamily:   typography.fontRegular,
    fontSize:     typography.xs,
    color:        colors.textMuted,
    marginBottom: spacing.sm,
  },
  track: {
    height:          4,
    backgroundColor: colors.border,
    borderRadius:    2,
    overflow:        'hidden',
    marginBottom:    spacing.xs,
  },
  fill: { height: 4, borderRadius: 2 },
  detail: {
    fontFamily: typography.fontRegular,
    fontSize:   typography.xs,
    color:      colors.textMuted,
  },
});

// ── Main Screen ──────────────────────────────────────────────────────────────
const TABS = ['Balance', 'Apply', 'History'];

const LeaveScreen = () => {
  const [activeTab,  setActiveTab]  = useState(0);
  const [balances,   setBalances]   = useState({});
  const [history,    setHistory]    = useState([]);
  const [isLoading,  setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');

  // Apply form
  const [leaveType, setLeaveType] = useState(LEAVE_TYPES.CASUAL);
  const [fromDate,  setFromDate]  = useState('');
  const [toDate,    setToDate]    = useState('');
  const [reason,    setReason]    = useState('');
  const [isHalfDay, setIsHalfDay] = useState(false);

  useEffect(() => { fetchBalance(); fetchHistory(); }, []);

  const fetchBalance = async () => {
    try {
      const res = await api.get(API_ROUTES.LEAVE_BALANCE);
      setBalances(res.data.data);
    } catch { setBalances({}); }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_ROUTES.LEAVE_HISTORY, { params: { limit: 20 } });
      setHistory(res.data.data.requests || []);
    } catch { setHistory([]); }
    finally { setLoading(false); }
  };

  const handleApply = async () => {
    if (!fromDate || !toDate) { setError('Please select dates.'); return; }
    if (!reason.trim())       { setError('Reason is required.'); return; }
    setError(''); setLoading(true);
    try {
      await api.post(API_ROUTES.LEAVE_APPLY, {
        leaveType, fromDate, toDate, reason: reason.trim(), isHalfDay,
      });
      setSuccess('Leave request submitted successfully! ✅');
      setReason(''); setFromDate(''); setToDate('');
      fetchBalance(); fetchHistory();
      setTimeout(() => { setSuccess(''); setActiveTab(2); }, 1800);
    } catch (e) {
      setError(e.response?.data?.error?.message || 'Failed to submit leave request.');
    } finally { setLoading(false); }
  };

  const handleCancel = async (id) => {
    try {
      await api.post(`/leave/${id}/cancel`);
      fetchHistory();
    } catch { /* non-critical */ }
  };

  const workingDays = fromDate && toDate ? countWorkingDays(fromDate, toDate) : 0;
  const selectedBalance = balances[leaveType];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map((tab, i) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === i && styles.tabActive]}
            onPress={() => setActiveTab(i)}
          >
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Tab 0: Balance ── */}
      {activeTab === 0 && (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.grid}>
            {[LEAVE_TYPES.CASUAL, LEAVE_TYPES.SICK, LEAVE_TYPES.EARNED, LEAVE_TYPES.OPTIONAL].map((type) => (
              <View key={type} style={styles.cardWrap}>
                <BalanceCard type={type} balance={balances[type]} />
              </View>
            ))}
          </View>
          <AppButton
            label="Apply for Leave"
            onPress={() => setActiveTab(1)}
            fullWidth
            style={{ marginHorizontal: spacing.base, marginTop: spacing.base }}
          />
        </ScrollView>
      )}

      {/* ── Tab 1: Apply ── */}
      {activeTab === 1 && (
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {success && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>{success}</Text>
            </View>
          )}
          {error && <ErrorMessage message={error} style={{ marginHorizontal: spacing.base }} />}

          {/* Leave type pills */}
          <Text style={styles.sectionLabel}>Leave Type</Text>
          <View style={styles.pillRow}>
            {Object.entries(LEAVE_TYPE_LABELS).map(([k, v]) => (
              <TouchableOpacity
                key={k}
                style={[styles.pill, leaveType === k && styles.pillActive]}
                onPress={() => setLeaveType(k)}
              >
                <Text style={[styles.pillText, leaveType === k && styles.pillTextActive]}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.formPad}>
            <AppInput
              label="From Date (YYYY-MM-DD)"
              value={fromDate}
              onChangeText={setFromDate}
              placeholder="2026-03-20"
              keyboardType="numbers-and-punctuation"
            />
            <AppInput
              label="To Date (YYYY-MM-DD)"
              value={toDate}
              onChangeText={setToDate}
              placeholder="2026-03-21"
              keyboardType="numbers-and-punctuation"
            />

            {/* Half day toggle */}
            <TouchableOpacity
              style={[styles.halfDayRow, isHalfDay && styles.halfDayActive]}
              onPress={() => setIsHalfDay((p) => !p)}
            >
              <Text style={styles.halfDayText}>Half Day</Text>
              <Text style={styles.halfDayCheck}>{isHalfDay ? '✓' : '○'}</Text>
            </TouchableOpacity>

            {/* Preview */}
            {workingDays > 0 && (
              <View style={styles.previewBox}>
                <Text style={styles.previewDays}>{isHalfDay ? 0.5 : workingDays} working day{workingDays !== 1 ? 's' : ''}</Text>
                {selectedBalance && (
                  <Text style={styles.previewBalance}>
                    Remaining: {selectedBalance.remaining} days {selectedBalance.remaining >= workingDays ? '✅' : '⚠️'}
                  </Text>
                )}
              </View>
            )}

            <AppInput
              label="Reason *"
              value={reason}
              onChangeText={setReason}
              placeholder="Reason for leave..."
              multiline
              numberOfLines={3}
            />

            <AppButton
              label="Submit Leave Request"
              onPress={handleApply}
              loading={isLoading}
              fullWidth
            />
          </View>
        </ScrollView>
      )}

      {/* ── Tab 2: History ── */}
      {activeTab === 2 && (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.base, paddingBottom: spacing['3xl'] }}
          renderItem={({ item }) => (
            <View style={styles.historyItem}>
              <View style={styles.historyTop}>
                <StatusBadge status={item.status} size="sm" />
                <Text style={styles.historyDays}>{item.daysCount} day{item.daysCount !== 1 ? 's' : ''}</Text>
              </View>
              <Text style={styles.historyType}>{LEAVE_TYPE_LABELS[item.leaveType]}</Text>
              <Text style={styles.historyDates}>{formatDateRange(item.fromDate, item.toDate)}</Text>
              <Text style={styles.historyReason} numberOfLines={2}>{item.reason}</Text>
              {item.status === 'pending' && (
                <TouchableOpacity
                  onPress={() => handleCancel(item.id)}
                  style={styles.cancelBtn}
                >
                  <Text style={styles.cancelText}>Cancel Request</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          ListEmptyComponent={
            !isLoading && (
              <EmptyState emoji="🏖" title="No leave requests" subtitle="Your leave history will appear here" />
            )
          }
          ListFooterComponent={
            isLoading && <ActivityIndicator color={colors.accent} style={{ margin: spacing.xl }} />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.bgPrimary },
  scroll: { padding: spacing.base, paddingBottom: spacing['2xl'] },

  tabBar: {
    flexDirection:   'row',
    backgroundColor: colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex:            1,
    paddingVertical: spacing.base,
    alignItems:      'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
  },
  tabText: {
    fontFamily: typography.fontMedium,
    fontSize:   typography.base,
    color:      colors.textMuted,
  },
  tabTextActive: { color: colors.accent, fontFamily: typography.fontSemiBold },

  grid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           spacing.sm,
  },
  cardWrap: { width: '48%' },

  sectionLabel: {
    fontFamily:      typography.fontMedium,
    fontSize:        typography.sm,
    color:           colors.textSecondary,
    marginBottom:    spacing.sm,
    marginHorizontal: spacing.base,
    marginTop:       spacing.base,
  },
  pillRow: {
    flexDirection:   'row',
    flexWrap:        'wrap',
    gap:             spacing.sm,
    marginHorizontal: spacing.base,
    marginBottom:    spacing.base,
  },
  pill: {
    borderRadius:      20,
    paddingHorizontal: spacing.base,
    paddingVertical:   spacing.sm,
    backgroundColor:   colors.bgSubtle,
    borderWidth:       1,
    borderColor:       colors.border,
  },
  pillActive: { backgroundColor: colors.accentLight, borderColor: colors.accent },
  pillText:   { fontFamily: typography.fontMedium, fontSize: typography.sm, color: colors.textSecondary },
  pillTextActive: { color: colors.accent },

  formPad:  { paddingHorizontal: spacing.base },
  halfDayRow: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
    backgroundColor: colors.bgSubtle,
    borderRadius:    12,
    padding:         spacing.base,
    marginBottom:    spacing.base,
    borderWidth:     1,
    borderColor:     colors.border,
  },
  halfDayActive: { borderColor: colors.accent, backgroundColor: colors.accentLight },
  halfDayText:   { fontFamily: typography.fontMedium, fontSize: typography.base, color: colors.textPrimary },
  halfDayCheck:  { fontFamily: typography.fontBold,   fontSize: typography.lg,   color: colors.accent },

  previewBox: {
    backgroundColor: colors.accentLight,
    borderRadius:    12,
    padding:         spacing.base,
    marginBottom:    spacing.base,
  },
  previewDays: {
    fontFamily: typography.fontBold,
    fontSize:   typography.md,
    color:      colors.accent,
  },
  previewBalance: {
    fontFamily: typography.fontRegular,
    fontSize:   typography.sm,
    color:      colors.textSecondary,
    marginTop:  spacing.xs,
  },

  successBox: {
    backgroundColor: colors.successLight,
    borderRadius:    12,
    padding:         spacing.base,
    margin:          spacing.base,
    alignItems:      'center',
  },
  successText: { fontFamily: typography.fontSemiBold, fontSize: typography.base, color: colors.success },

  historyItem: {
    backgroundColor: colors.bgSurface,
    borderRadius:    14,
    padding:         spacing.base,
    marginBottom:    spacing.sm,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.05,
    shadowRadius:    6,
    elevation:       1,
  },
  historyTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  historyDays: { fontFamily: typography.fontMonoMed, fontSize: typography.sm, color: colors.textSecondary },
  historyType: { fontFamily: typography.fontSemiBold, fontSize: typography.base, color: colors.textPrimary, marginBottom: 2 },
  historyDates: { fontFamily: typography.fontRegular, fontSize: typography.sm, color: colors.textSecondary, marginBottom: spacing.xs },
  historyReason: { fontFamily: typography.fontRegular, fontSize: typography.sm, color: colors.textMuted },
  cancelBtn: {
    marginTop:    spacing.sm,
    alignSelf:    'flex-start',
    borderRadius: 8,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.dangerLight,
  },
  cancelText: { fontFamily: typography.fontMedium, fontSize: typography.xs, color: colors.danger },
});

export default LeaveScreen;
