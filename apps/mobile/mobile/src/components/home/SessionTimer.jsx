/**
 * @module SessionTimer
 * @description Live ticking session duration counter.
 *              Updates every minute. Displays in DM Mono green.
 *              Called by: CheckOutButton, HomeScreen.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors }     from '../../theme/colors.js';
import { typography } from '../../theme/typography.js';
import { formatSessionTimer } from '../../utils/formatters.js';

/**
 * @param {object} props
 * @param {string} props.startTime - ISO string of session start
 * @param {object} [props.style]
 */
const SessionTimer = ({ startTime, style }) => {
  const [display, setDisplay] = useState(formatSessionTimer(startTime));
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!startTime) return;

    setDisplay(formatSessionTimer(startTime));

    intervalRef.current = setInterval(() => {
      setDisplay(formatSessionTimer(startTime));
    }, 30000); // update every 30 seconds

    return () => clearInterval(intervalRef.current);
  }, [startTime]);

  return (
    <Text style={[styles.timer, style]}>{display}</Text>
  );
};

const styles = StyleSheet.create({
  timer: {
    fontFamily: typography.fontMonoMed,
    fontSize:   typography.base,
    color:      colors.success,
  },
});

export default SessionTimer;
