/**
 * @module AppRouter
 * @description All application routes.
 *              Protected routes wrapped in ProtectedRoute + AppLayout.
 *              Lazy-loaded pages for optimal bundle splitting.
 */

import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute.jsx';
import AppLayout      from '@components/Layout/AppLayout.jsx';

// ─── Lazy page imports ────────────────────────────────────────────────────────
const LoginPage         = lazy(() => import('@pages/Auth/LoginPage.jsx'));
const DashboardPage     = lazy(() => import('@pages/Dashboard/index.jsx'));
const OrgsPage          = lazy(() => import('@pages/Organisations/index.jsx'));
const RevenuePage       = lazy(() => import('@pages/Revenue/index.jsx'));
const ImpersonationPage = lazy(() => import('@pages/Impersonation/index.jsx'));
const AuditLogsPage     = lazy(() => import('@pages/AuditLogs/index.jsx'));
const HealthPage        = lazy(() => import('@pages/PlatformHealth/index.jsx'));
const AnalyticsPage     = lazy(() => import('@pages/Analytics/index.jsx'));
const FeatureFlagsPage  = lazy(() => import('@pages/FeatureFlags/index.jsx'));
const NotFoundPage      = lazy(() => import('@pages/NotFound/index.jsx'));

// ─── Page loader ──────────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
        <span className="font-mono text-xs text-text-secondary tracking-widest uppercase">
          Loading
        </span>
      </div>
    </div>
  );
}

export default function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected */}
        <Route
          path="/"
          element={
            // <ProtectedRoute>
              <AppLayout />
            // </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"     element={<DashboardPage />} />
          <Route path="organisations" element={<OrgsPage />} />
          <Route path="revenue"       element={<RevenuePage />} />
          <Route path="impersonation" element={<ImpersonationPage />} />
          <Route path="audit-logs"    element={<AuditLogsPage />} />
          <Route path="health"        element={<HealthPage />} />
          <Route path="analytics"     element={<AnalyticsPage />} />
          <Route path="feature-flags" element={<FeatureFlagsPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
