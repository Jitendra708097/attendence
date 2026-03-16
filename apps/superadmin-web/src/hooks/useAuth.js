/**
 * @module useAuth
 * @description Super admin auth state hook.
 *              Reads from Redux authSlice — provides user, token,
 *              isAuthenticated, and isLoading flags.
 */

import { useSelector } from 'react-redux';
import { selectAuth } from '@store/authSlice.js';

export const useAuth = () => {
  const { user, accessToken, isAuthenticated, isLoading } = useSelector(selectAuth);

  return {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    isSuperAdmin: user?.role === 'superadmin',
  };
};
