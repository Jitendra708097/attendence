# AttendEase Admin Portal - Frontend

This is the complete **Admin Portal frontend** for AttendEase — a multi-tenant SaaS Employee Attendance Management System.

## 🎯 Overview

The Admin Portal lives at `app.attendease.com` and is used exclusively by **Org Admins** to manage their employees, attendance, leaves, regularisations, shifts, branches, reports, and notifications.

## 📚 Tech Stack

- **Framework**: React.js 18 with Vite
- **UI Library**: Ant Design 5.x
- **State Management**: Redux Toolkit + RTK Query
- **HTTP Client**: Axios with interceptors
- **Real-time**: Socket.io client
- **Charts**: Recharts
- **Maps**: @react-google-maps/api (for geofence drawing)
- **Date/Time**: dayjs
- **CSS**: Ant Design tokens + CSS modules

## 📁 Project Structure

```
apps/admin-web/
├── public/                    # Static assets
├── src/
│   ├── api/                  # Axios configuration
│   ├── store/                # Redux store + RTK Query
│   │   └── api/             # API slices
│   ├── pages/               # Page components
│   ├── components/
│   │   ├── Layout/         # App layout, sidebar, header
│   │   ├── common/         # Reusable components
│   │   └── charts/         # Chart components
│   ├── hooks/              # Custom hooks
│   ├── utils/              # Utilities & constants
│   ├── routes/             # Router configuration
│   ├── sockets/            # Socket.io handlers
│   ├── theme/              # Ant Design theme config
│   ├── App.jsx             # Root component
│   └── main.jsx            # Vite entry point
├── package.json
├── vite.config.js
├── index.html
├── .env.example
└── .eslintrc.js
```

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd apps/admin-web
npm install
```

### 2. Environment Setup

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_MAPS_KEY=your_google_maps_api_key_here
VITE_SOCKET_URL=http://localhost:3000
```

### 3. Start Development Server

```bash
npm run dev
```

The app will start at `http://localhost:3001`

### 4. Build for Production

```bash
npm run build
npm run preview
```

## 📖 Pages & Features

### Auth Pages
- **Login**: Email + password authentication
- **Forgot Password**: Password recovery (placeholder)
- **Reset Password**: Token-based password reset (placeholder)

### Dashboard
- **Stats Cards**: Total employees, checked in, absent, late counts
- **Attendance Trend Chart**: Last 7 days visualization
- **Status Distribution**: Present/absent/leave pie chart
- **Pending Approvals**: Leave, regularisation, device exception counts

### Attendance Management
- **Attendance List**: Filtered by date range, branch, shift, status
- **Live Board**: Real-time check-in/out updates via Socket.io
- **Anomaly Detection**: Flag suspicious attendance records
- **Export**: CSV export functionality

### Employee Management
- **Employee List**: Search, filter, bulk upload
- **Employee Detail**: Profile, attendance history, leave balance
- **Leave Balance**: Adjust casual/sick/earned leaves
- **Resend Invite**: Re-invite employees

### Leave Management
- **Leave Requests**: List with approval/rejection
- **Leave Approval**: View balance before approving
- **Leave Calendar**: Team leave visualization

### Regularisation
- **Regularisation Requests**: List with evidence preview
- **Approval Workflow**: Level 1 (Manager) & Level 2 (Admin)

### Setup Pages
- **Shifts**: CRUD with thresholds (grace, half day, OT)
- **Branches**: CRUD with geofence drawing
- **Departments**: Hierarchy tree view
- **Holidays**: Calendar with bulk import

### Reports & Admin
- **Reports**: Attendance, monthly summary, late, absent
- **Notifications**: Full notification list with read status
- **Device Exceptions**: Approve/reject device auth failures
- **Billing**: Plan info, invoices, upgrade
- **Settings**: Org profile, attendance settings, change password

## 🔧 Development Guidelines

### File Headers

Every file must have a JSDoc header:

```javascript
/**
 * @module ComponentName
 * @description What this component/file does.
 */
```

### Coding Standards

- **JavaScript**: ES2022 with ESM imports (NO TypeScript, NO require)
- **Naming**: camelCase for files & variables, PascalCase for components
- **Components**: Functional components with hooks only
- **Forms**: Ant Design Form with validation rules
- **State**: Redux for global, useState for local

### API Communication

All API calls use RTK Query with Axios:

```javascript
// Example API slice
export const myApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getItems: builder.query({
      query: (params) => ({ url: '/items', params }),
      providesTags: ['Items'],
    }),
    createItem: builder.mutation({
      query: (body) => ({ url: '/items', method: 'POST', body }),
      invalidatesTags: ['Items'],
    }),
  }),
});

export const { useGetItemsQuery, useCreateItemMutation } = myApi;
```

### Error Handling

```javascript
import { parseApiError } from '@/utils/errorHandler.js';
import { message } from 'antd';

try {
  // API call
} catch (error) {
  message.error(parseApiError(error));
}
```

### Custom Hooks

Available custom hooks:

- `useAuth()`: Get auth state & role checks
- `useNotifications()`: Notification polling
- `useSocket()`: Socket.io connection
- `useDebounce()`: Debounced values
- `usePagination()`: Pagination state
- `useOrgTimezone()`: Org timezone formatting

## 🎨 Components

### Common Components

- `PageHeader`: Page title + breadcrumb + actions
- `StatusBadge`: Present/absent/late/leave badges
- `RoleBadge`: Admin/manager/employee badges
- `EmptyState`: Empty list state
- `LoadingSpinner`: Centered loader
- `ConfirmModal`: Reusable confirm dialog
- `DateRangePicker`: Date range input
- `SearchInput`: Debounced search

### Charts

- `AttendanceLineChart`: 7/30 day trend
- `StatusPieChart`: Status distribution
- `LateBarChart`: Late employees by count

## 🔐 Authentication

Auth flow:

1. User logs in with email + password
2. Backend returns `accessToken`, `refreshToken`, user, org info
3. Redux stores tokens in state + localStorage
4. Axios interceptor adds token to all requests
5. On 401 error, auto-refresh token is attempted
6. If refresh fails, user is redirected to `/login`

## 🔔 Real-time Updates

Socket.io listens for:

- `attendance:checkin`: Employee checked in
- `attendance:checkout`: Employee checked out
- `live-update`: General attendance updates

Subscribe with `useSocket()` hook:

```javascript
useSocket(
  (data) => console.log('Checked in:', data),
  (data) => console.log('Checked out:', data)
);
```

## 📦 Dependencies

- `react@18.2.0`: UI framework
- `antd@5.14.0`: Component library
- `@reduxjs/toolkit@2.2.0`: State management
- `axios@1.6.0`: HTTP client
- `recharts@2.12.0`: Charts
- `socket.io-client@4.7.0`: Real-time
- `dayjs@1.11.0`: Date formatting
- `@react-google-maps/api@2.19.0`: Maps

## 🚨 Important Notes

### NO TypeScript
This project uses **plain JavaScript ES2022**. Do NOT add TypeScript.

### ESM Only
All imports use ESM syntax (`import/export`). NO `require()`.

### Vite Build
Uses Vite for fast development & production builds. Production bundle is optimized with code splitting.

## 📝 TODO - Coming Soon

These pages have placeholder implementations:

- [ ] Employee List & Detail (full CRUD)
- [ ] Bulk Employee Upload
- [ ] Live Attendance Board
- [ ] Attendance Filters & Export
- [ ] Leave Calendar
- [ ] Regularisation Approval Workflow
- [ ] Shifts Form
- [ ] Branches & Geofence Drawing
- [ ] Departments Tree
- [ ] Holidays Management
- [ ] Reports Generation
- [ ] Device Exceptions Approval
- [ ] Billing & Invoices
- [ ] Settings Tabs

## 🤝 Contributing

When adding new features:

1. Follow existing patterns & conventions
2. Add JSDoc headers to all files
3. Use ESM imports only
4. Add reusable components to `components/common`
5. Keep business logic in hooks & stores
6. Use RTK Query for all API calls
7. Run linter: `npm run lint`

## 📞 Support

For API specification, see backend documentation.
For UI patterns, refer to Ant Design docs: https://ant.design/

---

**Built with ❤️ for AttendEase**
