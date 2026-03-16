/**
 * @module attendance.repository
 * @description Database operations for attendance records with multi-tenancy scoping.
 */
const db = require('../../models/index.js');

const { Attendance, AttendanceSession, Employee, Shift, Branch, Organisation, sequelize } = db;

const findTodayAttendance = async (orgId, empId) => {
  const today = new Date().toISOString().split('T')[0];
  
  return await Attendance.findOne({
    where: {
      org_id: orgId,
      emp_id: empId,
      date: today,
      deleted_at: null,
    },
  });
};

const findAttendanceById = async (orgId, attendanceId) => {
  return await Attendance.findOne({
    where: {
      id: attendanceId,
      org_id: orgId,
      deleted_at: null,
    },
    include: [
      { model: Employee, as: 'employee', attributes: ['id', 'first_name', 'last_name'] },
      { model: Shift, as: 'shift', attributes: ['id', 'name', 'start_time', 'end_time'] },
    ],
  });
};

const findAttendanceByDate = async (orgId, empId, date) => {
  return await Attendance.findOne({
    where: {
      org_id: orgId,
      emp_id: empId,
      date,
      deleted_at: null,
    },
  });
};

const createAttendance = async (data) => {
  return await Attendance.create(data);
};

const updateAttendance = async (orgId, attendanceId, updateData) => {
  const attendance = await Attendance.findOne({
    where: {
      id: attendanceId,
      org_id: orgId,
      deleted_at: null,
    },
  });

  if (!attendance) return null;
  return await attendance.update(updateData);
};

const findOpenSession = async (orgId, attendanceId) => {
  return await AttendanceSession.findOne({
    where: {
      attendance_id: attendanceId,
      org_id: orgId,
      status: 'open',
      deleted_at: null,
    },
  });
};

const createSession = async (data) => {
  return await AttendanceSession.create(data);
};

const updateSession = async (orgId, sessionId, updateData) => {
  const session = await AttendanceSession.findOne({
    where: {
      id: sessionId,
      org_id: orgId,
      deleted_at: null,
    },
  });

  if (!session) return null;
  return await session.update(updateData);
};

const findLastSession = async (orgId, attendanceId) => {
  return await AttendanceSession.findOne({
    where: {
      attendance_id: attendanceId,
      org_id: orgId,
      deleted_at: null,
    },
    order: [['created_at', 'DESC']],
  });
};

const calculateTotalWorked = async (orgId, attendanceId) => {
  const sessions = await AttendanceSession.findAll({
    where: {
      attendance_id: attendanceId,
      org_id: orgId,
      deleted_at: null,
    },
  });

  return sessions.reduce((total, session) => total + (session.worked_minutes || 0), 0);
};

const findEmployeeById = async (orgId, empId) => {
  return await Employee.findOne({
    where: {
      id: empId,
      org_id: orgId,
      deleted_at: null,
    },
    include: [
      { model: Shift, as: 'shift', attributes: ['id', 'name', 'start_time', 'end_time', 'grace_minutes_checkin'] },
      { model: Branch, as: 'branch', attributes: ['id', 'name'] },
    ],
  });
};

const findShiftById = async (orgId, shiftId) => {
  return await Shift.findOne({
    where: {
      id: shiftId,
      org_id: orgId,
      deleted_at: null,
    },
  });
};

const findAttendanceHistory = async (orgId, empId, filters) => {
  const { offset, limit, status, startDate, endDate } = filters;

  const where = {
    org_id: orgId,
    emp_id: empId,
    deleted_at: null,
  };

  if (status) {
    where.status = status;
  }

  if (startDate && endDate) {
    where.date = {
      [sequelize.Op.between]: [
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
      ],
    };
  }

  const { rows: attendances, count: total } = await Attendance.findAndCountAll({
    where,
    include: [
      { model: Shift, as: 'shift', attributes: ['id', 'name'] },
    ],
    offset,
    limit,
    order: [['date', 'DESC']],
  });

  return { attendances, total };
};

const findLiveBoard = async (orgId, filters) => {
  const { offset, limit, branch, status } = filters;

  const where = {
    org_id: orgId,
    deleted_at: null,
  };

  if (branch) {
    where.branch_id = branch;
  }

  const today = new Date().toISOString().split('T')[0];

  const { rows: employees, count: total } = await Employee.findAndCountAll({
    where,
    include: [
      {
        model: Attendance,
        as: 'attendances',
        where: { date: today, deleted_at: null },
        required: false,
        include: [
          { model: Shift, as: 'shift', attributes: ['id', 'name'] },
        ],
      },
      { model: Branch, as: 'branch', attributes: ['id', 'name'] },
    ],
    offset,
    limit,
    order: [['first_name', 'ASC']],
  });

  return { employees, total };
};

const flagAnomaly = async (orgId, attendanceId, flagData) => {
  const attendance = await Attendance.findOne({
    where: {
      id: attendanceId,
      org_id: orgId,
      deleted_at: null,
    },
  });

  if (!attendance) return null;

  await attendance.update({
    is_anomaly: true,
  });

  return flagData;
};

const findAttendanceForExport = async (orgId, filters) => {
  const { startDate, endDate, branchId } = filters;

  const where = {
    org_id: orgId,
    deleted_at: null,
    date: {
      [sequelize.Op.between]: [
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
      ],
    },
  };

  const includeSettings = [
    { model: Employee, as: 'employee', attributes: ['id', 'first_name', 'last_name', 'email'] },
    { model: Shift, as: 'shift', attributes: ['id', 'name'] },
  ];

  if (branchId) {
    includeSettings[0].where = { branch_id: branchId };
    includeSettings[0].required = true;
  }

  return await Attendance.findAll({
    where,
    include: includeSettings,
    order: [['date', 'DESC']],
  });
};

module.exports = {
  findTodayAttendance,
  findAttendanceById,
  findAttendanceByDate,
  createAttendance,
  updateAttendance,
  findOpenSession,
  createSession,
  updateSession,
  findLastSession,
  calculateTotalWorked,
  findEmployeeById,
  findShiftById,
  findAttendanceHistory,
  findLiveBoard,
  flagAnomaly,
  findAttendanceForExport,
};