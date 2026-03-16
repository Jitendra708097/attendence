# AttendEase Copilot Instructions

This is a production-grade monorepo for AttendEase � a multi-tenant SaaS Employee Attendance Management System.

## Tech Stack
- Backend: Node.js + Express (JavaScript ES2022, ESM imports)
- Mobile: React Native + Expo Managed
- Admin Web: React.js + Ant Design
- Super Admin Web: React.js + Ant Design
- Database: PostgreSQL via Sequelize ORM
- Cache: Redis
- Queue: Bull Queue
- Monorepo: npm workspaces
- NO TypeScript anywhere

## Architecture
- Multi-tenant SaaS with organisation-level data isolation
- JWT authentication with refresh tokens
- Face recognition for attendance
- Geofencing for location validation
- Real-time notifications via sockets
- Background job processing with queues

## Coding Standards
- JavaScript ES2022 only � NO TypeScript
- ESM syntax (import/export) for fronted  for backed require()
- Every file gets a JSDoc @module + @description header
- Use AppError for all errors
- Use scopedModel for tenant data access
- Follow the existing file structure and patterns
