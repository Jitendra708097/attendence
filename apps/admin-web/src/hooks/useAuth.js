/**
 * @module useAuth
 * @description Custom hook for auth state and role checks.
 */
import { useSelector } from 'react-redux';

export const useAuth = () => {
  const auth = useSelector((state) => state.auth);

  return {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    accessToken: auth.accessToken,
    orgInfo: auth.orgInfo,
    isAdmin: auth.user?.role === 'admin',
    isManager: auth.user?.role === 'manager',
    isEmployee: auth.user?.role === 'employee',
    org: auth.orgInfo,
  };
};
