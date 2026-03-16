/**
 * @module AppLayout
 * @description Main application layout: dark sidebar + header + content area.
 *              Outlet renders the active route's page component.
 *              Alert banner renders above content when alerts exist.
 */

import { Outlet, useLocation } from 'react-router-dom';
import Sidebar     from './Sidebar.jsx';
import Header      from './Header.jsx';
import AlertBanner from './AlertBanner.jsx';

const PAGE_TITLES = {
  '/dashboard':     'Platform Control',
  '/organisations': 'Organisations',
  '/revenue':       'Revenue',
  '/impersonation': 'Impersonation',
  '/audit-logs':    'Audit Logs',
  '/health':        'Platform Health',
  '/analytics':     'Analytics',
  '/feature-flags': 'Feature Flags',
};

export default function AppLayout() {
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] || 'AttendEase';

  return (
    <div className="flex h-screen overflow-hidden bg-[#080810]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header title={title} />
        <AlertBanner />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="min-h-full p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
