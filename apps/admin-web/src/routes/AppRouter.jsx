/**
 * @module AppRouter
 * @description Main application router with all routes and protected routes.
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute.jsx';
import AppLayout from '../components/Layout/AppLayout.jsx';
import LoginPage from '../pages/Auth/LoginPage.jsx';
import ForgotPasswordPage from '../pages/Auth/ForgotPasswordPage.jsx';
import ResetPasswordPage from '../pages/Auth/ResetPasswordPage.jsx';
import DashboardPage from '../pages/Dashboard/index.jsx';
import AttendancePage from '../pages/Attendance/index.jsx';
import LiveBoardPage from '../pages/Attendance/LiveBoard.jsx';
import EmployeesPage from '../pages/Employees/index.jsx';
import EmployeeDetailPage from '../pages/Employees/EmployeeDetail.jsx';
import LeavesPage from '../pages/Leaves/index.jsx';
import RegularisationsPage from '../pages/Regularisations/index.jsx';
import ShiftsPage from '../pages/Shifts/index.jsx';
import BranchesPage from '../pages/Branches/index.jsx';
import DepartmentsPage from '../pages/Departments/index.jsx';
import HolidaysPage from '../pages/Holidays/index.jsx';
import ReportsPage from '../pages/Reports/index.jsx';
import NotificationsPage from '../pages/Notifications/index.jsx';
import DeviceExceptionsPage from '../pages/DeviceExceptions/index.jsx';
import BillingPage from '../pages/Billing/index.jsx';
import SettingsPage from '../pages/Settings/index.jsx';
import NotFoundPage from '../pages/NotFound/index.jsx';

export default function AppRouter() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/attendance/live" element={<LiveBoardPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/employees/:id" element={<EmployeeDetailPage />} />
          <Route path="/leaves" element={<LeavesPage />} />
          <Route path="/regularisations" element={<RegularisationsPage />} />
          <Route path="/shifts" element={<ShiftsPage />} />
          <Route path="/branches" element={<BranchesPage />} />
          <Route path="/departments" element={<DepartmentsPage />} />
          <Route path="/holidays" element={<HolidaysPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/device-exceptions" element={<DeviceExceptionsPage />} />
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Fallback Routes */}
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
