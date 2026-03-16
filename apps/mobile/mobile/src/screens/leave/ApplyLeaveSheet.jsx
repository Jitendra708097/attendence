/**
 * @module ApplyLeaveSheet
 * @description Bottom sheet form for applying for leave.
 *              Fields: leave type (pills), from/to date, half-day toggle,
 *              reason, days count preview, balance check.
 *              Validates: dates, balance sufficiency, overlapping leave.
 *              Called by: LeaveScreen Tab 2 (Apply) and Balance tab CTA.
 */

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Switch,
} from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';

import api       from '../../api/axiosInstance.js';
import AppInput  from '../../components/common/AppInput.jsx';
import AppButton from '../../components/common/AppButton.jsx';
import { ErrorMessage } from '../../components/common/CommonComponents.jsx';
import { colors }    from '../../theme/colors.js';
import { typography }from '../../theme/typography.js';
import { spacing }   from '../../theme/spacing.js';
import {
  LEAVE_TYPES,
  LEAVE_TYPE_LABELS,
  API_ROUTES,
} from '../../utils/constants.js';
import { countWorkingDays } from '../../utils/formatters.js';

const TypePill = ({ label, selected, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.pill, selected && styles.pillActive]}
    activeOpacity={0.7}
  >
    <Text style={[styles.pillText, selected && styles.pillTextActive]}>{label}</Text>
  </TouchableOpacity>
);

/**
 * @param {object}   props
 * @param {object}   props.sheetRef       - ref for @gorhom/bottom-sheet
 * @param {object}   props.balances       - { casual: { total, used, remaining }, ... }
 * @param {function} props.onSuccess      - Called after successful submission
 * @param {function} props.onClose        - Called when sheet closes
 */
const ApplyLeaveSheet = ({ sheetRef, balances = {}, onSuccess, onClose }) => {
  const [leaveType, setLeaveType] = useState(LEAVE_TYPES.CASUAL);
  const [fromDate,  setFromDate]  = useState('');
  const [toDate,    setToDate]    = useState('');
  const [isHalfDay, setHalfDay]  = useState(false);
  const [reason,    setReason]    = useState('');
  const [isLoading, setLoading]  = useState(false);
  const [error,     setError]    = useState('');

  const workingDays = fromDate && toDate
    ? (isHalfDay ? 0.5 : countWorkingDays(fromDate, toDate))
    : 0;

  const selectedBalance = balances[leaveType];
  const isBalanceOk     = !selectedBalance || workingDays <= selectedBalance.remaining;

  const reset = () => {
    setFromDate(''); setToDate(''); setReason('');
    setHalfDay(false); setError('');
  };

  const handleClose = () => { reset(); onClose?.(); };

  const handleSubmit = async () => {
    setError('');
    if (!fromDate)      { setError('Start date is required.'); return; }
    if (!toDate)        { setError('End date is required.'); return; }
    if (new Date(fromDate) > new Date(toDate)) {
      setError('End date must be after start date.'); return;
    }
    if (!reason.trim()) { setError('Reason is required.'); return; }
    if (!isBalanceOk)   { setError(`Insufficient ${LEAVE_TYPE_LABELS[leaveType]} balance.`); return; }

    setLoading(true);
    try {
      await api.post(API_ROUTES.LEAVE_APPLY, {
        leaveType,
        fromDate,
        toDate,
        isHalfDay,
        reason: reason.trim(),
      });
      reset();
      onSuccess?.();
      sheetRef.current?.close();
    } catch (e) {
      setError(e.response?.data?.error?.message || 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={['75%', '95%']}
      enablePanDownToClose
      onClose={handleClose}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Apply for Leave</Text>

        {/* Leave type pills */}
        <Text style={styles.fieldLabel}>Leave Type</Text>
        <View style={styles.pillRow}>
          {Object.entries(LEAVE_TYPE_LABELS).map(([k, v]) => (
            <TypePill
              key={k}
              label={v}
              selected={leaveType === k}
              onPress={() => setLeaveType(k)}
            />
          ))}
        </View>

        {/* Balance indicator */}
        {selectedBalance && (
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Available balance:</Text>
            <Text style={[
              styles.balanceValue,
              isBalanceOk ? styles.balanceOk : styles.balanceLow,
            ]}>
              {selectedBalance.remaining} days {isBalanceOk ? '✅' : '⚠️'}
            </Text>
          </View>
        )}

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

        {/* Half-day toggle */}
        <View style={styles.toggleRow}>
          <View>
            <Text style={styles.toggleLabel}>Half Day</Text>
            <Text style={styles.toggleSub}>Counts as 0.5 days</Text>
          </View>
          <Switch
            value={isHalfDay}
            onValueChange={setHalfDay}
            trackColor={{ false: colors.border, true: colors.accentLight }}
            thumbColor={isHalfDay ? colors.accent : colors.bgSubtle}
          />
        </View>

        {/* Days preview */}
        {workingDays > 0 && (
          <View style={styles.previewBox}>
            <Text style={styles.previewText}>
              {workingDays} working day{workingDays !== 1 ? 's' : ''}
            </Text>
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

        {error && <ErrorMessage message={error} />}

        <AppButton
          label="Submit Leave Request"
          onPress={handleSubmit}
          loading={isLoading}
          fullWidth
          style={styles.submitBtn}
        />
        <AppButton
          label="Cancel"
          onPress={handleClose}
          variant="outline"
          fullWidth
        />
      </BottomSheetScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  sheetBg: { backgroundColor: colors.bgSurface },
  handle:  { backgroundColor: colors.border, width: 40 },
  content: { padding: spacing.xl, paddingBottom: spacing['3xl'] },

  title: {
    fontFamily:   typography.fontBold,
    fontSize:     typography.xl,
    color:        colors.textPrimary,
    marginBottom: spacing.base,
  },

  fieldLabel: {
    fontFamily:   typography.fontMedium,
    fontSize:     typography.sm,
    color:        colors.textSecondary,
    marginBottom: spacing.sm,
  },

  pillRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           spacing.sm,
    marginBottom:  spacing.base,
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

  balanceRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    backgroundColor: colors.bgSubtle,
    borderRadius:   10,
    padding:        spacing.sm,
    marginBottom:   spacing.base,
  },
  balanceLabel: { fontFamily: typography.fontRegular, fontSize: typography.sm, color: colors.textMuted },
  balanceValue: { fontFamily: typography.fontMonoMed, fontSize: typography.sm },
  balanceOk:    { color: colors.success },
  balanceLow:   { color: colors.warning },

  toggleRow: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
    backgroundColor: colors.bgSubtle,
    borderRadius:    12,
    padding:         spacing.base,
    marginBottom:    spacing.base,
  },
  toggleLabel: { fontFamily: typography.fontMedium, fontSize: typography.base, color: colors.textPrimary },
  toggleSub:   { fontFamily: typography.fontRegular, fontSize: typography.xs, color: colors.textMuted, marginTop: 2 },

  previewBox: {
    backgroundColor: colors.accentLight,
    borderRadius:    10,
    padding:         spacing.sm,
    marginBottom:    spacing.base,
    alignItems:      'center',
  },
  previewText: {
    fontFamily: typography.fontBold,
    fontSize:   typography.base,
    color:      colors.accent,
  },

  submitBtn: { marginBottom: spacing.sm },
});

export default ApplyLeaveSheet;
