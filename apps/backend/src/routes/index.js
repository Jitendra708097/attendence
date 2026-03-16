/**
 * @module routes/index
 * @description Central route mounting for all modules.
 * Called by: app.js
 */
const express = require('express');
const authRoutes = require('../modules/auth/auth.routes.js');
const organisationRoutes = require('../modules/organisation/organisation.routes.js');
const branchRoutes = require('../modules/branch/branch.routes.js');
const departmentRoutes = require('../modules/department/department.routes.js');
const employeeRoutes = require('../modules/employee/employee.routes.js');
const shiftRoutes = require('../modules/shift/shift.routes.js');
const attendanceRoutes = require('../modules/attendance/attendance.routes.js');
const leaveRoutes = require('../modules/leave/leave.routes.js');
const regularisationRoutes = require('../modules/regularisation/regularisation.routes.js');
const holidayRoutes = require('../modules/holiday/holiday.routes.js');
const notificationRoutes = require('../modules/notification/notification.routes.js');
const billingRoutes = require('../modules/billing/billing.routes.js');
const superadminRoutes = require('../modules/superadmin/superadmin.routes.js');

const router = express.Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/organisations', organisationRoutes);
router.use('/branches', branchRoutes);
router.use('/departments', departmentRoutes);
router.use('/employees', employeeRoutes);
router.use('/shifts', shiftRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/leaves', leaveRoutes);
router.use('/regularisations', regularisationRoutes);
router.use('/holidays', holidayRoutes);
router.use('/notifications', notificationRoutes);
router.use('/billing', billingRoutes);
router.use('/superadmin', superadminRoutes);

module.exports = router;
