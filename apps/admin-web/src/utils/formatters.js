/**
 * @module formatters
 * @description Date, time, duration, and currency formatting utilities.
 */
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

export const formatDate = (date, format = 'DD MMM YYYY') => {
  return dayjs(date).format(format);
};

export const formatTime = (time, format = 'HH:mm') => {
  return dayjs(time, 'HH:mm').format(format);
};

export const formatDateTime = (datetime, format = 'DD MMM YYYY, HH:mm') => {
  return dayjs(datetime).format(format);
};

export const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatPercent = (value) => {
  return `${value.toFixed(1)}%`;
};

export const getRelativeTime = (date) => {
  return dayjs(date).fromNow();
};
