/**
 * @module constants
 * @description Status enums, role enums, and plan limits.
 */
export const STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  HALF_DAY: 'half_day',
  ON_LEAVE: 'on_leave',
  CHECKED_IN: 'checked_in',
  CHECKED_OUT: 'checked_out',
  LATE: 'late',
  OVERTIME: 'overtime',
  HOLIDAY: 'holiday',
};

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
};

export const LEAVE_TYPES = {
  CASUAL: 'casual',
  SICK: 'sick',
  EARNED: 'earned',
  OPTIONAL: 'optional',
};

export const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const REPORT_TYPES = {
  ATTENDANCE: 'attendance',
  MONTHLY_SUMMARY: 'monthly_summary',
  LATE: 'late',
  ABSENT: 'absent',
};
