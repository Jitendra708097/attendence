/**
 * @module errorHandler
 * @description Parse API error codes to user-friendly messages.
 */
const ERROR_MESSAGES = {
  AUTH_001: 'Invalid email or password.',
  AUTH_006: 'Your account has been suspended.',
  AUTH_007: 'Your organisation account has been suspended.',
  AUTH_009: 'Check-in from unregistered device.',
  EMP_002: 'An employee with this email already exists.',
  ATT_003: 'This employee already has an open session.',
  GEO_003: 'Employee is outside office premises.',
  GEN_001: 'Something went wrong. Please try again.',
};

export const parseApiError = (error) => {
  const code = error?.data?.error?.code;
  return ERROR_MESSAGES[code] || error?.data?.error?.message || 'Something went wrong.';
};
