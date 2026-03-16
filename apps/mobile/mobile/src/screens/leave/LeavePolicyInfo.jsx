/**
 * @module LeavePolicyInfo
 * @description Displays the organisation's leave policy rules.
 *              Fetched from the backend on mount.
 *              Shows: accrual rules, carry-forward policy, restrictions,
 *              notice period required per leave type.
 *              Called by: LeaveScreen (info icon / policy tab).
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';

import api           from '../../api/axiosInstance.js';
import AppCard       from '../../components/common/AppCard.jsx';
import { EmptyState } from '../../components/common/CommonComponents.jsx';
import { colors }    from '../../theme/colors.js';
import { typography }from '../../theme/typography.js';
import { spacing }   from '../../theme/spacing.js';
import { LEAVE_TYPE_LABELS } from '../../utils/constants.js';

/** Fallback static policy data when API is unavailable */
const FALLBACK_POLICY = {
  carryForward:  true,
  maxCarryDays:  10,
  noticePeriod:  { casual: 1, sick: 0, earned: 7, optional: 3 },
  accrualType:   'monthly',
  encashable:    ['earned'],
  restrictions:  [
    'Casual leave cannot exceed 3 consecutive days.',
    'Sick leave requires a medical certificate for > 2 days.',
    'Earned leave requires 7 days advance notice.',
    'Leave cannot be applied for past dates.',
    'Optional leave is based on the government holiday list.',
  ],
};

const PolicyRow = ({ label, value }) => (
  <View style={styles.policyRow}>
    <Text style={styles.policyLabel}>{label}</Text>
    <Text style={styles.policyValue}>{value}</Text>
  </View>
);

const LeavePolicyInfo = () => {
  const [policy,   setPolicy]   = useState(null);
  const [isLoading,setLoading]  = useState(true);

  useEffect(() => {
    fetchPolicy();
  }, []);

  const fetchPolicy = async () => {
    try {
      const res = await api.get('/leave/policy');
      setPolicy(res.data.data);
    } catch {
      setPolicy(FALLBACK_POLICY);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const p = policy || FALLBACK_POLICY;

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/* Notice period per type */}
      <Text style={styles.sectionHeading}>Notice Period Required</Text>
      <AppCard style={styles.card}>
        {Object.entries(LEAVE_TYPE_LABELS).map(([k, v]) => (
          <PolicyRow
            key={k}
            label={v}
            value={
              p.noticePeriod?.[k] === 0
                ? 'Same day'
                : `${p.noticePeriod?.[k] || 1} day${p.noticePeriod?.[k] > 1 ? 's' : ''} advance`
            }
          />
        ))}
      </AppCard>

      {/* General policy */}
      <Text style={styles.sectionHeading}>General Policy</Text>
      <AppCard style={styles.card}>
        <PolicyRow
          label="Carry Forward"
          value={p.carryForward ? `Yes — up to ${p.maxCarryDays} days` : 'No carry forward'}
        />
        <PolicyRow
          label="Accrual"
          value={p.accrualType === 'monthly' ? 'Monthly' : 'Yearly'}
        />
        <PolicyRow
          label="Encashable Types"
          value={p.encashable?.map((t) => LEAVE_TYPE_LABELS[t] || t).join(', ') || 'None'}
        />
      </AppCard>

      {/* Restrictions */}
      <Text style={styles.sectionHeading}>Rules & Restrictions</Text>
      <AppCard style={styles.card}>
        {p.restrictions?.map((rule, i) => (
          <View key={i} style={styles.ruleRow}>
            <Text style={styles.ruleBullet}>•</Text>
            <Text style={styles.ruleText}>{rule}</Text>
          </View>
        ))}
      </AppCard>

      <Text style={styles.footer}>
        For specific queries, contact your HR department.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    minHeight:      200,
  },
  scroll: {
    padding:       spacing.base,
    paddingBottom: spacing['3xl'],
  },
  sectionHeading: {
    fontFamily:    typography.fontSemiBold,
    fontSize:      typography.sm,
    color:         colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom:  spacing.sm,
    marginTop:     spacing.base,
  },
  card: {
    marginBottom: spacing.sm,
    padding:      spacing.base,
  },
  policyRow: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  policyLabel: {
    fontFamily: typography.fontRegular,
    fontSize:   typography.sm,
    color:      colors.textSecondary,
    flex:       1,
  },
  policyValue: {
    fontFamily: typography.fontMedium,
    fontSize:   typography.sm,
    color:      colors.textPrimary,
    textAlign:  'right',
    flex:       1,
  },
  ruleRow: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    paddingVertical: spacing.xs,
  },
  ruleBullet: {
    fontFamily:  typography.fontBold,
    fontSize:    typography.base,
    color:       colors.accent,
    marginRight: spacing.sm,
    lineHeight:  typography.base * typography.normal,
  },
  ruleText: {
    fontFamily: typography.fontRegular,
    fontSize:   typography.sm,
    color:      colors.textSecondary,
    flex:       1,
    lineHeight: typography.sm * typography.relaxed,
  },
  footer: {
    fontFamily: typography.fontRegular,
    fontSize:   typography.xs,
    color:      colors.textMuted,
    textAlign:  'center',
    marginTop:  spacing.xl,
    fontStyle:  'italic',
  },
});

export default LeavePolicyInfo;
