/**
 * @module formatters
 * @description Utility formatters for currency (INR), dates, durations,
 *              uptime, and file sizes used across the super admin portal.
 */

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import duration from 'dayjs/plugin/duration.js';
import utc from 'dayjs/plugin/utc.js';

dayjs.extend(relativeTime);
dayjs.extend(duration);
dayjs.extend(utc);

// ─── Currency ─────────────────────────────────────────────────────────────────

/**
 * Format number as Indian Rupees (₹)
 * @param {number} value
 * @param {object} opts
 * @param {boolean} [opts.compact=false] - use 1K, 1L, 1Cr notation
 * @param {number}  [opts.decimals=0]
 */
export function formatINR(value, { compact = false, decimals = 0 } = {}) {
  if (value == null || isNaN(value)) return '₹0';

  if (compact) {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
    if (value >= 100000)   return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000)     return `₹${(value / 1000).toFixed(1)}K`;
  }

  return new Intl.NumberFormat('en-IN', {
    style:                 'currency',
    currency:              'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format MRR — compact INR with 1 decimal
 */
export function formatMRR(value) {
  return formatINR(value, { compact: true, decimals: 1 });
}

// ─── Numbers ──────────────────────────────────────────────────────────────────

/**
 * Format a number with Indian comma separators
 */
export function formatNumber(value) {
  if (value == null || isNaN(value)) return '0';
  return new Intl.NumberFormat('en-IN').format(value);
}

/**
 * Format percentage
 */
export function formatPercent(value, decimals = 1) {
  if (value == null || isNaN(value)) return '0%';
  return `${Number(value).toFixed(decimals)}%`;
}

// ─── Dates & Times ────────────────────────────────────────────────────────────

/**
 * Format as "15 Mar 2026, 10:32 AM"
 */
export function formatDateTime(date) {
  if (!date) return '—';
  return dayjs(date).format('DD MMM YYYY, hh:mm A');
}

/**
 * Format as "15 Mar 2026"
 */
export function formatDate(date) {
  if (!date) return '—';
  return dayjs(date).format('DD MMM YYYY');
}

/**
 * Format as "10:32 AM"
 */
export function formatTime(date) {
  if (!date) return '—';
  return dayjs(date).format('hh:mm A');
}

/**
 * Format as relative time — "3 hours ago", "2 days ago"
 */
export function formatTimeAgo(date) {
  if (!date) return '—';
  return dayjs(date).fromNow();
}

/**
 * Format trial end date with urgency
 * @returns {{ text: string, isUrgent: boolean, daysLeft: number }}
 */
export function formatTrialEnd(date) {
  if (!date) return { text: '—', isUrgent: false, daysLeft: 999 };
  const daysLeft = dayjs(date).diff(dayjs(), 'day');
  return {
    text:     daysLeft <= 0 ? 'Expired' : `${daysLeft}d left`,
    isUrgent: daysLeft <= 2,
    daysLeft,
  };
}

// ─── Duration ─────────────────────────────────────────────────────────────────

/**
 * Format minutes into human-readable duration
 * @param {number} minutes
 * @returns {string} e.g. "8h 30m"
 */
export function formatDuration(minutes) {
  if (!minutes || minutes < 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Format elapsed seconds as MM:SS
 */
export function formatElapsed(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Format impersonation session duration
 */
export function formatSessionDuration(startedAt) {
  if (!startedAt) return '—';
  const seconds = dayjs().diff(dayjs(startedAt), 'second');
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// ─── Uptime ───────────────────────────────────────────────────────────────────

/**
 * Format uptime percentage with color class
 */
export function formatUptime(value) {
  if (value == null) return { text: '—', color: 'text-[#6b6b8a]' };
  const pct = Number(value).toFixed(2);
  let color = 'text-[#00ff88]';
  if (value < 99)   color = 'text-[#ffaa00]';
  if (value < 95)   color = 'text-[#ff3366]';
  return { text: `${pct}%`, color };
}

// ─── File Size ────────────────────────────────────────────────────────────────

export function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ─── Org Slug ─────────────────────────────────────────────────────────────────

export function formatSlug(slug) {
  return slug ? `@${slug}` : '—';
}
