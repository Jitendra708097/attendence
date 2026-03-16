/**
 * @module organisation.repository
 * @description Database operations for organisations.
 * Called by: organisation.service
 */
const db = require('../../models/index.js');

const { Organisation, Employee, Attendance, LeaveRequest, Regularisation } = db;

/**
 * Find organisation by ID
 */
const findOrgById = async (orgId) => {
  return await Organisation.findByPk(orgId, {
    attributes: [
      'id',
      'name',
      'slug',
      'plan',
      'status',
      'timezone',
      'logo_url',
      'trial_ends_at',
      'settings',
      'created_at',
    ],
  });
};

/**
 * Update organisation
 */
const updateOrg = async (orgId, updateData) => {
  const org = await Organisation.findByPk(orgId);
  if (!org) return null;

  return await org.update(updateData);
};

/**
 * Get dashboard statistics for organisation
 */
const getDashboardStats = async (orgId) => {
  // Today's date in UTC
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  try {
    // Total employees
    const totalEmployees = await Employee.count({
      where: { org_id: orgId, deleted_at: null },
    });

    // Checked in today
    const activeToday = await Attendance.count({
      where: {
        org_id: orgId,
        date: { [db.Sequelize.Op.between]: [today, tomorrow] },
        status: { [db.Sequelize.Op.in]: ['present', 'late', 'half_day'] },
      },
    });

    // Absent today
    const absentToday = await Attendance.count({
      where: {
        org_id: orgId,
        date: { [db.Sequelize.Op.between]: [today, tomorrow] },
        status: 'absent',
      },
    });

    // Late arrivals today
    const lateToday = await Attendance.count({
      where: {
        org_id: orgId,
        date: { [db.Sequelize.Op.between]: [today, tomorrow] },
        is_late: true,
      },
    });

    // On leave today
    const onLeaveToday = await Attendance.count({
      where: {
        org_id: orgId,
        date: { [db.Sequelize.Op.between]: [today, tomorrow] },
        status: 'on_leave',
      },
    });

    // Pending leave requests
    const pendingLeaveRequests = await LeaveRequest.count({
      where: {
        org_id: orgId,
        status: 'pending',
      },
    });

    // Pending regularisations
    const pendingRegularisations = await Regularisation.count({
      where: {
        org_id: orgId,
        status: 'pending',
      },
    });

    return {
      totalEmployees,
      activeToday,
      absentToday,
      lateToday,
      onLeaveToday,
      pendingLeaveRequests,
      pendingRegularisations,
    };
  } catch (err) {
    console.error('Dashboard stats error:', err);
    return {
      totalEmployees: 0,
      activeToday: 0,
      absentToday: 0,
      lateToday: 0,
      onLeaveToday: 0,
      pendingLeaveRequests: 0,
      pendingRegularisations: 0,
    };
  }
};

module.exports = {
  findOrgById,
  updateOrg,
  getDashboardStats,
};