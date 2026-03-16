/**
 * @module constants
 * @description Platform-wide enums, status maps, plan configs,
 *              and storage keys. Single source of truth for all
 *              constant values used across the super admin portal.
 */

// ─── Storage Keys ─────────────────────────────────────────────────────────────
export const STORAGE_KEYS = {
  ACCESS_TOKEN:  'ae_sa_access_token',
  REFRESH_TOKEN: 'ae_sa_refresh_token',
  USER:          'ae_sa_user',
  SIDEBAR:       'ae_sa_sidebar_collapsed',
};

// ─── Organisation Status ──────────────────────────────────────────────────────
export const ORG_STATUS = {
  ACTIVE:    'active',
  SUSPENDED: 'suspended',
  TRIAL:     'trial',
  CANCELLED: 'cancelled',
};

export const ORG_STATUS_LABELS = {
  active:    'Active',
  suspended: 'Suspended',
  trial:     'Trial',
  cancelled: 'Cancelled',
};

export const ORG_STATUS_COLORS = {
  active:    '#00ff88',
  suspended: '#ff3366',
  trial:     '#ffaa00',
  cancelled: '#6b6b8a',
};

// ─── Plan Tiers ───────────────────────────────────────────────────────────────
export const PLAN_TIERS = {
  TRIAL:      'trial',
  STARTER:    'starter',
  GROWTH:     'growth',
  ENTERPRISE: 'enterprise',
};

export const PLAN_LABELS = {
  trial:      'Trial',
  starter:    'Starter',
  growth:     'Growth',
  enterprise: 'Enterprise',
};

export const PLAN_COLORS = {
  trial:      { bg: '#ffaa0020', text: '#ffaa00', border: '#ffaa0040' },
  starter:    { bg: '#00d4ff20', text: '#00d4ff', border: '#00d4ff40' },
  growth:     { bg: '#00ff8820', text: '#00ff88', border: '#00ff8840' },
  enterprise: { bg: '#a855f720', text: '#a855f7', border: '#a855f740' },
};

export const PLAN_PRICES = {
  starter:    50,   // ₹ per employee per month
  growth:     75,
  enterprise: 120,
};

// ─── Service Health ───────────────────────────────────────────────────────────
export const HEALTH_STATUS = {
  HEALTHY:  'healthy',
  DEGRADED: 'degraded',
  DOWN:     'down',
};

// ─── Bull Queue Names ─────────────────────────────────────────────────────────
export const QUEUE_NAMES = [
  'attendance',
  'notification',
  'face',
  'report',
  'offline_sync',
];

// ─── Audit Action Types ───────────────────────────────────────────────────────
export const AUDIT_ACTIONS = {
  ORG_SUSPENDED:        'ORG_SUSPENDED',
  ORG_ACTIVATED:        'ORG_ACTIVATED',
  PLAN_CHANGED:         'PLAN_CHANGED',
  TRIAL_EXTENDED:       'TRIAL_EXTENDED',
  IMPERSONATION_START:  'IMPERSONATION_START',
  IMPERSONATION_END:    'IMPERSONATION_END',
  MANUAL_ATTENDANCE:    'MANUAL_ATTENDANCE',
  EMPLOYEE_DELETED:     'EMPLOYEE_DELETED',
  ORG_CREATED:          'ORG_CREATED',
  FEATURE_FLAG_CHANGED: 'FEATURE_FLAG_CHANGED',
};

export const AUDIT_ACTION_COLORS = {
  ORG_SUSPENDED:        '#ff3366',
  ORG_ACTIVATED:        '#00ff88',
  PLAN_CHANGED:         '#00d4ff',
  TRIAL_EXTENDED:       '#00ff88',
  IMPERSONATION_START:  '#a855f7',
  IMPERSONATION_END:    '#a855f780',
  MANUAL_ATTENDANCE:    '#ffaa00',
  EMPLOYEE_DELETED:     '#ff3366',
  ORG_CREATED:          '#00ff88',
  FEATURE_FLAG_CHANGED: '#00d4ff',
};

// ─── Feature Flags ────────────────────────────────────────────────────────────
export const FEATURE_FLAGS = [
  {
    key:         'wifi_bssid_verification',
    label:       'WiFi BSSID Verification',
    description: 'V2 location check — must be on office WiFi to check in.',
    tier:        'V2',
  },
  {
    key:         'rekognition_liveness',
    label:       'AWS Rekognition Liveness',
    description: 'Gold-standard liveness check. Enterprise plan only.',
    tier:        'V3',
  },
  {
    key:         'payroll_webhook',
    label:       'Payroll Webhook',
    description: 'Push attendance data to Darwinbox / Keka / GreytHR.',
    tier:        'V2',
  },
  {
    key:         'multi_challenge_liveness',
    label:       'Multi-Challenge Liveness',
    description: '2–3 random challenges in sequence. V2 security layer.',
    tier:        'V2',
  },
  {
    key:         'texture_antispoofing',
    label:       'Texture Anti-Spoofing',
    description: 'Detects screen pixels vs real skin texture.',
    tier:        'V2',
  },
  {
    key:         'ble_beacon_accuracy',
    label:       'BLE Beacon Floor Accuracy',
    description: 'Enterprise: knows which floor employee is on.',
    tier:        'V3',
  },
  {
    key:         'beta_dashboard',
    label:       'Beta Dashboard',
    description: 'New admin dashboard UI in beta. Internal testing only.',
    tier:        'Internal',
  },
];

// ─── Pagination Defaults ──────────────────────────────────────────────────────
export const PAGE_SIZE        = 20;
export const PAGE_SIZE_SMALL  = 10;

// ─── Polling Intervals (ms) ───────────────────────────────────────────────────
export const POLL_DASHBOARD  = 30000;
export const POLL_HEALTH     = 15000;
export const POLL_QUEUES     = 10000;

// ─── Face Recognition Thresholds ─────────────────────────────────────────────
export const FACE_THRESHOLDS = {
  PROBATIONARY: 0.88,
  DEFAULT:      0.84,
  TRUSTED:      0.80,
  FLAGGED:      0.95,
};
