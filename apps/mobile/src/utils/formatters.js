/**
 * @module formatters
 * @description Date, time, and duration formatting helpers.
 *              All times displayed in org timezone (converted from UTC).
 *              Uses dayjs for lightweight date manipulation.
 *              Called by: all screens displaying time/date values.
 */

import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration.js';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Format a UTC ISO string to a local time string.
 * @param {string} isoString - UTC ISO date string
 * @param {string} [tz='Asia/Kolkata'] - Org timezone
 * @returns {string} e.g. "09:02 AM"
 */
export const formatTime = (isoString, tz = 'Asia/Kolkata') => {
  if (!isoString) return '--:--';
  return dayjs(isoString).tz(tz).format('hh:mm A');
};

/**
 * Format a UTC ISO string to a short date.
 * @param {string} isoString
 * @param {string} [tz='Asia/Kolkata']
 * @returns {string} e.g. "15 Mar 2026"
 */
export const formatDate = (isoString, tz = 'Asia/Kolkata') => {
  if (!isoString) return '—';
  return dayjs(isoString).tz(tz).format('D MMM YYYY');
};

/**
 * Format a UTC ISO string to day + date.
 * @param {string} isoString
 * @param {string} [tz='Asia/Kolkata']
 * @returns {string} e.g. "Sunday, 15 Mar"
 */
export const formatDayDate = (isoString, tz = 'Asia/Kolkata') => {
  if (!isoString) return '—';
  return dayjs(isoString).tz(tz).format('dddd, D MMM');
};

/**
 * Format a date string for the calendar (YYYY-MM-DD).
 * @param {string} isoString
 * @returns {string} e.g. "2026-03-15"
 */
export const formatDateKey = (isoString) => {
  if (!isoString) return '';
  return dayjs(isoString).format('YYYY-MM-DD');
};

/**
 * Convert total minutes into "Xh Ym" display string.
 * @param {number} totalMinutes
 * @returns {string} e.g. "8h 30m" or "45m"
 */
export const formatDuration = (totalMinutes) => {
  if (!totalMinutes || totalMinutes <= 0) return '0m';
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

/**
 * Convert seconds into "MM:SS" countdown string.
 * @param {number} totalSeconds
 * @returns {string} e.g. "14:32"
 */
export const formatCountdown = (totalSeconds) => {
  if (totalSeconds <= 0) return '00:00';
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

/**
 * Format a live session timer from a start time ISO string.
 * @param {string} startIsoString
 * @param {string} [tz='Asia/Kolkata']
 * @returns {string} e.g. "2h 14m"
 */
export const formatSessionTimer = (startIsoString, tz = 'Asia/Kolkata') => {
  if (!startIsoString) return '0m';
  const startMs = dayjs(startIsoString).tz(tz).valueOf();
  const nowMs   = dayjs().valueOf();
  const diffMin = Math.floor((nowMs - startMs) / 60000);
  return formatDuration(diffMin);
};

/**
 * Get a human-readable "time ago" string.
 * @param {string} isoString
 * @returns {string} e.g. "2 hours ago"
 */
export const formatTimeAgo = (isoString) => {
  if (!isoString) return '';
  return dayjs(isoString).fromNow();
};

/**
 * Format month/year for calendar header.
 * @param {string|Date} date
 * @returns {string} e.g. "March 2026"
 */
export const formatMonthYear = (date) => {
  return dayjs(date).format('MMMM YYYY');
};

/**
 * Get greeting based on current hour.
 * @returns {string} "Good Morning" | "Good Afternoon" | "Good Evening"
 */
export const getGreeting = () => {
  const hour = dayjs().hour();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

/**
 * Format shift time range.
 * @param {string} startTime - "HH:MM" format
 * @param {string} endTime   - "HH:MM" format
 * @returns {string} e.g. "09:00 AM – 06:00 PM"
 */
export const formatShiftRange = (startTime, endTime) => {
  if (!startTime || !endTime) return '—';
  const fmt = (t) => dayjs(`2000-01-01T${t}`).format('hh:mm A');
  return `${fmt(startTime)} – ${fmt(endTime)}`;
};

/**
 * Format a date range for leave display.
 * @param {string} fromDate
 * @param {string} toDate
 * @returns {string} e.g. "15 Mar – 17 Mar 2026"
 */
export const formatDateRange = (fromDate, toDate) => {
  if (!fromDate) return '—';
  const from = dayjs(fromDate).format('D MMM');
  const to   = dayjs(toDate).format('D MMM YYYY');
  if (fromDate === toDate) return dayjs(fromDate).format('D MMM YYYY');
  return `${from} – ${to}`;
};

/**
 * Count working days between two date strings (Mon–Sat, no Sundays).
 * @param {string} fromDate - YYYY-MM-DD
 * @param {string} toDate   - YYYY-MM-DD
 * @returns {number}
 */
export const countWorkingDays = (fromDate, toDate) => {
  let count = 0;
  let current = dayjs(fromDate);
  const end = dayjs(toDate);
  while (current.isBefore(end) || current.isSame(end, 'day')) {
    if (current.day() !== 0) count++; // skip Sunday
    current = current.add(1, 'day');
  }
  return count;
};
