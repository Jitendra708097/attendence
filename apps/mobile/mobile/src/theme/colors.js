/**
 * @module colors
 * @description Single source of truth for all colors in AttendEase mobile app.
 *              Import this everywhere — never hardcode hex values.
 *              Palette: clean minimal, deep teal accent, calm and trustworthy.
 */

export const colors = {
  // ─── Backgrounds ────────────────────────────────────────────────────────────
  bgPrimary:    '#f8f9fa',   // app background
  bgSurface:    '#ffffff',   // card / panel background
  bgSubtle:     '#f1f3f5',   // subtle section bg

  // ─── Brand ──────────────────────────────────────────────────────────────────
  accent:       '#0d7377',   // deep teal — primary action
  accentLight:  '#e8f4f4',   // teal tint for backgrounds
  accentDark:   '#0a5d60',   // pressed / active state

  // ─── Status ─────────────────────────────────────────────────────────────────
  success:      '#2d9e5f',   // checked in, present
  successLight: '#e8f7ef',
  warning:      '#d97706',   // late, cooldown, half-day
  warningLight: '#fef3c7',
  danger:       '#dc2626',   // check out, absent, error
  dangerLight:  '#fee2e2',
  info:         '#2563eb',   // informational, on-leave
  infoLight:    '#eff6ff',

  // ─── Text ───────────────────────────────────────────────────────────────────
  textPrimary:   '#111827',  // headings, important text
  textSecondary: '#6b7280',  // labels, descriptions
  textMuted:     '#9ca3af',  // timestamps, hints
  textInverse:   '#ffffff',  // text on dark backgrounds

  // ─── Borders ────────────────────────────────────────────────────────────────
  border:      '#e5e7eb',
  borderFocus: '#0d7377',

  // ─── Check-in Button States ─────────────────────────────────────────────────
  checkInGreen: '#16a34a',   // check-in button (confident green)
  checkOutRed:  '#dc2626',   // check-out button
  cooldownGrey: '#6b7280',   // cooldown button text
  capGrey:      '#9ca3af',   // cap reached button text

  // ─── Misc ───────────────────────────────────────────────────────────────────
  transparent:  'transparent',
  overlay:      'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.2)',
  white:        '#ffffff',
  black:        '#000000',
};
