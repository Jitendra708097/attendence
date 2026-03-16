/**
 * @module errorHandler
 * @description Parses API error responses into human-readable messages.
 *              Handles Axios errors, RTK Query errors, and network failures.
 */

/**
 * Extract a user-facing error message from any error shape
 * @param {unknown} error
 * @returns {string}
 */
export function parseError(error) {
  if (!error) return 'An unexpected error occurred.';

  // RTK Query error shape
  if (error.data) {
    return (
      error.data?.error?.message ||
      error.data?.message ||
      'Request failed.'
    );
  }

  // Axios error shape
  if (error.response) {
    const data = error.response.data;
    return (
      data?.error?.message ||
      data?.message ||
      `Server error (${error.response.status})`
    );
  }

  // Network error
  if (error.request) {
    return 'Network error — check your connection.';
  }

  // Plain Error
  if (error.message) return error.message;

  return 'An unexpected error occurred.';
}

/**
 * Get the error code from an API error
 * @param {unknown} error
 * @returns {string|null}
 */
export function getErrorCode(error) {
  return (
    error?.data?.error?.code ||
    error?.response?.data?.error?.code ||
    null
  );
}

/**
 * Check if error is an authentication error (401)
 */
export function isAuthError(error) {
  return (
    error?.status === 401 ||
    error?.response?.status === 401
  );
}

/**
 * Check if error is a permission error (403)
 */
export function isPermissionError(error) {
  return (
    error?.status === 403 ||
    error?.response?.status === 403
  );
}

/**
 * Format RTK Query error for display in Ant Design message/notification
 */
export function formatRtkError(error) {
  const message = parseError(error);
  const code = getErrorCode(error);
  return code ? `[${code}] ${message}` : message;
}
