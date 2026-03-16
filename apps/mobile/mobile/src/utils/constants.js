/**
 * @module constants
 * @description App-wide constants: button states, status values, leave types.
 *              Single source of truth for all string enums.
 *              Called by: stores, components, screens.
 */

// ─── Check-In Button States ──────────────────────────────────────────────────
export const BUTTON_STATES = {
  CHECK_IN:    'CHECK_IN',     // green — ready to check in
  CHECKED_IN:  'CHECKED_IN',  // red   — session open, can check out
  COOLDOWN:    'COOLDOWN',     // grey  — wait for cooldown
  CAP_REACHED: 'CAP_REACHED', // grey  — max sessions hit
};

// ─── Attendance Status ───────────────────────────────────────────────────────
export const ATTENDANCE_STATUS = {
  PRESENT:         'present',
  ABSENT:          'absent',
  HALF_DAY:        'half_day',
  HALF_DAY_EARLY:  'half_day_early',
  ON_LEAVE:        'on_leave',
  HOLIDAY:         'holiday',
  WEEKEND:         'weekend',
  OVERTIME:        'overtime',
  NOT_MARKED:      'not_marked',
};

// ─── Leave Types ─────────────────────────────────────────────────────────────
export const LEAVE_TYPES = {
  CASUAL:   'casual',
  SICK:     'sick',
  EARNED:   'earned',
  OPTIONAL: 'optional',
};

export const LEAVE_TYPE_LABELS = {
  casual:   'Casual Leave',
  sick:     'Sick Leave',
  earned:   'Earned Leave',
  optional: 'Optional Leave',
};

// ─── Leave Request Status ────────────────────────────────────────────────────
export const LEAVE_STATUS = {
  PENDING:   'pending',
  APPROVED:  'approved',
  REJECTED:  'rejected',
  CANCELLED: 'cancelled',
};

// ─── Regularisation Types ────────────────────────────────────────────────────
export const REGULARISATION_TYPES = {
  MISSED_CHECKIN:    'missed_checkin',
  MISSED_CHECKOUT:   'missed_checkout',
  WRONG_TIME:        'wrong_time',
  ABSENT_CORRECTION: 'absent_correction',
};

export const REGULARISATION_TYPE_LABELS = {
  missed_checkin:    'Missed Check-in',
  missed_checkout:   'Missed Check-out',
  wrong_time:        'Wrong Time Recorded',
  absent_correction: 'Absent Correction',
};

// ─── Evidence Types ──────────────────────────────────────────────────────────
export const EVIDENCE_TYPES = {
  MANAGER_CONFIRMATION: 'manager_confirmation',
  EMAIL:                'email',
  PHOTO:                'photo',
  OTHER:                'other',
};

export const EVIDENCE_TYPE_LABELS = {
  manager_confirmation: 'Manager Confirmation',
  email:                'Email Proof',
  photo:                'Photo Evidence',
  other:                'Other',
};

// ─── Notification Types ──────────────────────────────────────────────────────
export const NOTIFICATION_TYPES = {
  LEAVE_APPROVED:        'leave_approved',
  LEAVE_REJECTED:        'leave_rejected',
  REGULARISATION_APPROVED: 'regularisation_approved',
  REGULARISATION_REJECTED: 'regularisation_rejected',
  CHECKIN_REMINDER:      'checkin_reminder',
  CHECKOUT_REMINDER:     'checkout_reminder',
  GENERAL:               'general',
};

// ─── Liveness Challenges ─────────────────────────────────────────────────────
export const LIVENESS_CHALLENGES = {
  BLINK:      'blink',
  TURN_LEFT:  'turn_left',
  TURN_RIGHT: 'turn_right',
  SMILE:      'smile',
};

export const LIVENESS_CHALLENGE_LABELS = {
  blink:      'Please BLINK',
  turn_left:  'Turn LEFT slowly',
  turn_right: 'Turn RIGHT slowly',
  smile:      'Please SMILE',
};

// ─── Session Constants ───────────────────────────────────────────────────────
export const SESSION = {
  MIN_SESSION_MINUTES:  30,
  COOLDOWN_MINUTES:     15,
  MAX_SESSIONS_PER_DAY: 3,
  UNDO_WINDOW_MINUTES:  10,
  CHALLENGE_TIMEOUT_MS: 15000,  // 15 seconds
  TOKEN_EXPIRY_MS:      30000,  // 30 seconds
};

// ─── GPS Accuracy Thresholds (metres) ────────────────────────────────────────
export const GPS = {
  GOOD_ACCURACY:  50,    // proceed normally
  FLAG_ACCURACY:  100,   // allow + flag
  REJECT_ACCURACY: 100,  // reject if > 100
  MAX_SPEED_MS:   83.33, // 300 km/h in m/s
  MIN_ALTITUDE:   -100,  // metres
};

// ─── Storage Keys ────────────────────────────────────────────────────────────
export const STORAGE_KEYS = {
  ACCESS_TOKEN:  'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  DEVICE_ID:     'deviceId',
  USER_DATA:     'userData',
};

// ─── API Routes ──────────────────────────────────────────────────────────────
export const API_ROUTES = {
  LOGIN:              '/auth/login',
  REFRESH:            '/auth/refresh',
  LOGOUT:             '/auth/logout',
  SET_PASSWORD:       '/auth/set-password',
  FACE_ENROLL:        '/face/enroll',
  FACE_ENROLL_STATUS: '/face/enroll-status',
  REQUEST_CHECKIN:    '/attendance/request-checkin',
  CHECKIN:            '/attendance/checkin',
  CHECKOUT:           '/attendance/checkout',
  CHECKOUT_UNDO:      '/attendance/checkout/undo',
  ATTENDANCE_STATUS:  '/attendance/status',
  ATTENDANCE_HISTORY: '/attendance/history',
  LEAVE_BALANCE:      '/leave/balance',
  LEAVE_APPLY:        '/leave/apply',
  LEAVE_HISTORY:      '/leave/history',
  LEAVE_CANCEL:       '/leave/:id/cancel',
  NOTIFICATIONS:      '/notifications',
  NOTIFICATIONS_READ: '/notifications/mark-read',
  PROFILE:            '/employees/profile',
  CHANGE_PASSWORD:    '/auth/change-password',
  REGISTER_DEVICE:    '/auth/register-device',
  REGULARISATION:     '/regularisations',
};
