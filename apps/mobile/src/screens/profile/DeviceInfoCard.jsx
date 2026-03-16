/**
 * @module DeviceInfoCard
 * @description Standalone card displaying the employee's registered check-in device.
 *              Shows: model, platform, OS version, registration date.
 *              Informs employee this is their authorised device for attendance.
 *              Called by: ProfileScreen device section.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { colors }    from '../../theme/colors.js';
import { typography }from '../../theme/typography.js';
import { spacing }   from '../../theme/spacing.js';
import { getDeviceInfo } from '../../services/deviceService.js';
import { formatDate } from '../../utils/formatters.js';

/**
 * @param {object} props
 * @param {string} [props.registeredAt] - ISO string of when device was registered
 */
const DeviceInfoCard = ({ registeredAt }) => {
  const info = getDeviceInfo();

  const Row = ({ label, value }) => (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value || '—'}</Text>
    </View>
  );

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.deviceIcon}>📱</Text>
        <Text style={styles.heading}>Registered Device</Text>
      </View>

      <Row label="Model"      value={info.deviceModel} />
      <Row label="Platform"   value={`${info.platform} ${info.osVersion}`} />
      <Row label="Brand"      value={info.brand} />
      {registeredAt && (
        <Row label="Registered" value={formatDate(registeredAt)} />
      )}

      {/* Trust note */}
      <View style={styles.note}>
        <Text style={styles.noteIcon}>🔒</Text>
        <Text style={styles.noteText}>
          Attendance can only be marked from this device.
          Contact your admin if you need to change it.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgSubtle,
    borderRadius:    14,
    padding:         spacing.base,
    borderWidth:     1,
    borderColor:     colors.border,
  },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    marginBottom:   spacing.base,
  },
  deviceIcon: {
    fontSize:    20,
    marginRight: spacing.sm,
  },
  heading: {
    fontFamily: typography.fontSemiBold,
    fontSize:   typography.base,
    color:      colors.textPrimary,
  },
  row: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: {
    fontFamily: typography.fontRegular,
    fontSize:   typography.sm,
    color:      colors.textMuted,
  },
  rowValue: {
    fontFamily: typography.fontMonoMed,
    fontSize:   typography.sm,
    color:      colors.textPrimary,
    maxWidth:   '60%',
    textAlign:  'right',
  },
  note: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    marginTop:      spacing.base,
    backgroundColor: colors.accentLight,
    borderRadius:   10,
    padding:        spacing.sm,
  },
  noteIcon: {
    fontSize:    14,
    marginRight: spacing.sm,
    marginTop:   1,
  },
  noteText: {
    fontFamily: typography.fontRegular,
    fontSize:   typography.xs,
    color:      colors.accent,
    flex:       1,
    lineHeight: typography.xs * typography.relaxed,
  },
});

export default DeviceInfoCard;
