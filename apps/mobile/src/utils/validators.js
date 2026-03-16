/**
 * @module validators
 * @description Form validation helpers for all input screens.
 *              Returns { valid: boolean, message: string }.
 *              Called by: LoginScreen, SetPasswordScreen, ApplyLeaveSheet,
 *              RegularisationModal, ChangePasswordSheet.
 */

/**
 * Validate an email address.
 * @param {string} email
 * @returns {{ valid: boolean, message: string }}
 */
export const validateEmail = (email) => {
  if (!email || email.trim().length === 0) {
    return { valid: false, message: 'Email is required.' };
  }
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(email.trim())) {
    return { valid: false, message: 'Please enter a valid email address.' };
  }
  return { valid: true, message: '' };
};

/**
 * Validate a password (login — just non-empty).
 * @param {string} password
 * @returns {{ valid: boolean, message: string }}
 */
export const validateLoginPassword = (password) => {
  if (!password || password.length === 0) {
    return { valid: false, message: 'Password is required.' };
  }
  return { valid: true, message: '' };
};

/**
 * Validate a new password against requirements.
 * Requirements: 8+ chars, 1 uppercase, 1 number.
 * @param {string} password
 * @returns {{ valid: boolean, message: string, checks: object }}
 */
export const validateNewPassword = (password) => {
  const checks = {
    minLength:  password.length >= 8,
    uppercase:  /[A-Z]/.test(password),
    number:     /[0-9]/.test(password),
  };

  if (!checks.minLength) {
    return { valid: false, message: 'Password must be at least 8 characters.', checks };
  }
  if (!checks.uppercase) {
    return { valid: false, message: 'Password must contain at least one uppercase letter.', checks };
  }
  if (!checks.number) {
    return { valid: false, message: 'Password must contain at least one number.', checks };
  }
  return { valid: true, message: '', checks };
};

/**
 * Check that two password fields match.
 * @param {string} password
 * @param {string} confirm
 * @returns {{ valid: boolean, message: string }}
 */
export const validatePasswordMatch = (password, confirm) => {
  if (password !== confirm) {
    return { valid: false, message: 'Passwords do not match.' };
  }
  return { valid: true, message: '' };
};

/**
 * Validate a required text field.
 * @param {string} value
 * @param {string} fieldName
 * @param {number} [minLength=1]
 * @returns {{ valid: boolean, message: string }}
 */
export const validateRequired = (value, fieldName, minLength = 1) => {
  if (!value || value.trim().length < minLength) {
    return { valid: false, message: `${fieldName} is required.` };
  }
  return { valid: true, message: '' };
};

/**
 * Validate a leave date range.
 * @param {string} fromDate - YYYY-MM-DD
 * @param {string} toDate   - YYYY-MM-DD
 * @returns {{ valid: boolean, message: string }}
 */
export const validateDateRange = (fromDate, toDate) => {
  if (!fromDate) return { valid: false, message: 'Start date is required.' };
  if (!toDate)   return { valid: false, message: 'End date is required.' };
  if (new Date(fromDate) > new Date(toDate)) {
    return { valid: false, message: 'End date must be after start date.' };
  }
  return { valid: true, message: '' };
};

/**
 * Check if leave balance is sufficient.
 * @param {number} requested
 * @param {number} remaining
 * @returns {{ valid: boolean, message: string }}
 */
export const validateLeaveBalance = (requested, remaining) => {
  if (requested > remaining) {
    return {
      valid: false,
      message: `Insufficient balance. You have ${remaining} days remaining.`,
    };
  }
  return { valid: true, message: '' };
};

/**
 * Get password strength checks object for display.
 * @param {string} password
 * @returns {{ minLength: boolean, uppercase: boolean, number: boolean }}
 */
export const getPasswordChecks = (password) => ({
  minLength: (password || '').length >= 8,
  uppercase: /[A-Z]/.test(password || ''),
  number:    /[0-9]/.test(password || ''),
});
