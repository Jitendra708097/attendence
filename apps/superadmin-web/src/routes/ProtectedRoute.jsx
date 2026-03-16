/**
 * @module ProtectedRoute
 * @description Guards routes — redirects to /login if not authenticated.
 *              Also blocks non-superadmin roles.
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth.js';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, isSuperAdmin } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-sm text-text-secondary">Authenticating...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isSuperAdmin) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
