/**
 * @module useCountdown
 * @description Countdown timer hook. Counts down from a target end time.
 *              Updates every second via setInterval.
 *              Returns seconds remaining, formatted string, and completion flag.
 *              Called by: CooldownTimer component, UndoCheckoutBar.
 */

import { useState, useEffect, useRef } from 'react';
import { formatCountdown } from '../utils/formatters.js';

/**
 * @param {string|Date|null} endsAt - ISO string or Date when countdown ends
 * @returns {{
 *   secondsLeft: number,
 *   formatted: string,
 *   isComplete: boolean,
 *   progress: number   // 0.0 → 1.0, fraction of total elapsed
 * }}
 */
const useCountdown = (endsAt, totalDurationSeconds = null) => {
  const getSecondsLeft = () => {
    if (!endsAt) return 0;
    const diff = Math.max(0, Math.floor((new Date(endsAt) - Date.now()) / 1000));
    return diff;
  };

  const [secondsLeft, setSecondsLeft] = useState(getSecondsLeft);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!endsAt) {
      setSecondsLeft(0);
      return;
    }

    // Immediately calculate
    setSecondsLeft(getSecondsLeft());

    intervalRef.current = setInterval(() => {
      const remaining = getSecondsLeft();
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(intervalRef.current);
      }
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [endsAt]);

  const isComplete = secondsLeft <= 0;

  // Progress fraction: how much of total has elapsed (0 = just started, 1 = done)
  const progress = totalDurationSeconds
    ? Math.min(1, 1 - secondsLeft / totalDurationSeconds)
    : 0;

  return {
    secondsLeft,
    formatted:  formatCountdown(secondsLeft),
    isComplete,
    progress,
  };
};

export default useCountdown;
