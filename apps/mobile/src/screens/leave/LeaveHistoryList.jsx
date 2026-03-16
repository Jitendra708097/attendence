/**
 * @module LeaveHistoryList
 * @description Paginated list of the employee's leave requests.
 *              Each item: type badge, status badge, date range, reason, cancel button.
 *              Cancel button only shown for pending requests (with bottom-sheet confirm).
 *              Called by: LeaveScreen Tab 3 (History).
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, useRef,
} from 'react-native';
import { useRef as useRefReact } from 'react';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

import api        from '../../api/axiosInstance.js';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import AppButton   from '../../components/common/AppButton.jsx';
import { EmptyState } from '../../components/common/CommonComponents.jsx';
import { colors }    from '../../theme/colors.js';
import { typography }from '../../theme/typography.js';
import { spacing }   from '../../theme/spacing.js';
import { LEAVE_TYPE_LABELS, API_ROUTES } from '../../utils/constants.js';
import { formatDateRange } from '../../utils/formatters.js';

/**
 * @param {object}   props
 * @param {function} [props.onRefreshBalance] - Called after cancel so balance updates
 */
const LeaveHistoryList = ({ onRefreshBalance }) => {
  const [requests,  setRequests]  = useState([]);
  const [isLoading, setLoading]   = useState(false);
  const [page,      setPage]      = useState(1);
  const [hasMore,   setHasMore]   = useState(true);
  const [cancelId,  setCancelId]  = useState(null);
  const [cancelling,setCancelling]= useState(false);

  const cancelSheetRef = useRefReact(null);

  useEffect(() => { fetchHistory(1, true); }, []);

  const fetchHistory = async (pageNum = 1, reset = false) => {
    if (isLoading) return;
    setLoading(true);
    try {
      const res = await api.get(API_ROUTES.LEAVE_HISTORY, {
        params: { page: pageNum, limit: 15 },
      });
      const { requests: newItems, hasMore: more } = res.data.data;
      setRequests((prev) => reset ? newItems : [...prev, ...newItems]);
      setHasMore(more);
      setPage(pageNum + 1);
    } catch {
      // silently fail — show existing list
    } finally {
      setLoading(false);
    }
  };

  const confirmCancel = (id) => {
    setCancelId(id);
    cancelSheetRef.current?.expand();
  };

  const handleCancelConfirmed = async () => {
    if (!cancelId) return;
    setCancelling(true);
    try {
      await api.post(`/leave/${cancelId}/cancel`);
      // Optimistic remove + refresh balance
      setRequests((prev) => prev.filter((r) => r.id !== cancelId));
      onRefreshBalance?.();
    } catch {
      // Non-critical
    } finally {
      setCancelling(false);
      setCancelId(null);
      cancelSheetRef.current?.close();
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {/* Top row: type + status + days */}
      <View style={styles.topRow}>
        <View style={styles.topLeft}>
          <Text style={styles.leaveType}>{LEAVE_TYPE_LABELS[item.leaveType] || item.leaveType}</Text>
          <StatusBadge status={item.status} size="sm" />
        </View>
        <Text style={styles.daysCount}>
          {item.daysCount} day{item.daysCount !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Date range */}
      <Text style={styles.dateRange}>
        📅 {formatDateRange(item.fromDate, item.toDate)}
      </Text>

      {/* Reason */}
      {item.reason && (
        <Text style={styles.reason} numberOfLines={2}>{item.reason}</Text>
      )}

      {/* Cancel (pending only) */}
      {item.status === 'pending' && (
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => confirmCancel(item.id)}
        >
          <Text style={styles.cancelText}>Cancel Request</Text>
        </TouchableOpacity>
      )}

      {/* Rejection reason */}
      {item.status === 'rejected' && item.rejectionReason && (
        <View style={styles.rejectBanner}>
          <Text style={styles.rejectText}>Reason: {item.rejectionReason}</Text>
        </View>
      )}
    </View>
  );

  return (
    <>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onEndReached={() => { if (hasMore && !isLoading) fetchHistory(page); }}
        onEndReachedThreshold={0.3}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading && (
            <EmptyState
              emoji="🏖️"
              title="No leave requests"
              subtitle="Your leave history will appear here once you submit a request."
            />
          )
        }
        ListFooterComponent={
          isLoading && (
            <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing.xl }} />
          )
        }
      />

      {/* Cancel confirmation sheet */}
      <BottomSheet
        ref={cancelSheetRef}
        index={-1}
        snapPoints={['34%']}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: colors.bgSurface }}
        handleIndicatorStyle={{ backgroundColor: colors.border, width: 40 }}
      >
        <BottomSheetView style={styles.cancelSheet}>
          <Text style={styles.cancelTitle}>Cancel Leave Request?</Text>
          <Text style={styles.cancelSub}>
            This will withdraw your request. You can reapply later.
          </Text>
          <View style={styles.cancelBtns}>
            <AppButton
              label="Keep Request"
              onPress={() => cancelSheetRef.current?.close()}
              variant="outline"
              style={{ flex: 1 }}
            />
            <AppButton
              label="Cancel Request"
              onPress={handleCancelConfirmed}
              variant="danger"
              loading={cancelling}
              style={{ flex: 1 }}
            />
          </View>
        </BottomSheetView>
      </BottomSheet>
    </>
  );
};

const styles = StyleSheet.create({
  list: {
    padding:       spacing.base,
    paddingBottom: spacing['3xl'],
  },
  card: {
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
  topRow: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'flex-start',
    marginBottom:    spacing.sm,
  },
  topLeft:   { gap: spacing.xs },
  leaveType: {
    fontFamily:   typography.fontSemiBold,
    fontSize:     typography.base,
    color:        colors.textPrimary,
    marginBottom: spacing.xs,
  },
  daysCount: {
    fontFamily: typography.fontMonoMed,
    fontSize:   typography.base,
    color:      colors.textSecondary,
  },
  dateRange: {
    fontFamily:   typography.fontRegular,
    fontSize:     typography.sm,
    color:        colors.textSecondary,
    marginBottom: spacing.xs,
  },
  reason: {
    fontFamily:   typography.fontRegular,
    fontSize:     typography.sm,
    color:        colors.textMuted,
    lineHeight:   typography.sm * typography.normal,
    marginBottom: spacing.xs,
  },
  cancelBtn: {
    alignSelf:         'flex-start',
    marginTop:         spacing.sm,
    backgroundColor:   colors.dangerLight,
    borderRadius:      8,
    paddingVertical:   spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  cancelText: {
    fontFamily: typography.fontMedium,
    fontSize:   typography.xs,
    color:      colors.danger,
  },
  rejectBanner: {
    marginTop:       spacing.sm,
    backgroundColor: colors.dangerLight,
    borderRadius:    8,
    padding:         spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
  },
  rejectText: {
    fontFamily: typography.fontRegular,
    fontSize:   typography.xs,
    color:      colors.danger,
  },

  // Cancel sheet
  cancelSheet: { padding: spacing.xl },
  cancelTitle: {
    fontFamily:   typography.fontBold,
    fontSize:     typography.lg,
    color:        colors.textPrimary,
    marginBottom: spacing.xs,
  },
  cancelSub: {
    fontFamily:   typography.fontRegular,
    fontSize:     typography.base,
    color:        colors.textSecondary,
    marginBottom: spacing.xl,
    lineHeight:   typography.base * typography.normal,
  },
  cancelBtns: { flexDirection: 'row', gap: spacing.sm },
});

export default LeaveHistoryList;
