/**
 * @module attendance.service
 * @description Business logic for attendance check-in, check-out, status computation.
 */
const { AppError  } = require('../../utils/AppError.js');
const { v4: uuidv4 } = require('uuid');
const { generateChallengeToken, consumeChallengeToken, setRedis, getRedis  } = require('../../utils/redis.js');
const { calculateStatus  } = require('./attendance.statusEngine.js');
const db = require('../../models/index.js');

const { Attendance, AttendanceSession, Employee, Shift, Organisation } = db;

const requestCheckIn = async (orgId, empId, data, repository) => {
  const { latitude, longitude, photo_base64 } = data;

  const employee = await repository.findEmployeeById(orgId, empId);
  if (!employee) {
    throw new AppError('EMP_001', 'Employee not found', 404);
  }

  const challengeToken = await generateChallengeToken(empId, 300);

  return {
    challengeToken,
    expiresIn: 300,
  };
};

const checkIn = async (orgId, empId, data, repository) => {
  const { challengeToken, challengeResponse } = data;

  const challengeData = await consumeChallengeToken(challengeToken);
  if (!challengeData || challengeData.empId !== empId) {
    throw new AppError('ATT_002', 'Invalid or expired challenge token', 401);
  }

  const today = new Date().toISOString().split('T')[0];
  
  const existingAttendance = await repository.findTodayAttendance(orgId, empId);
  if (existingAttendance && existingAttendance.first_check_in) {
    const openSession = await repository.findOpenSession(orgId, existingAttendance.id);
    if (openSession) {
      throw new AppError('ATT_003', 'Already checked in', 409);
    }
  }

  const employee = await repository.findEmployeeById(orgId, empId);
  if (!employee) {
    throw new AppError('EMP_001', 'Employee not found', 404);
  }

  const shift = await repository.findShiftById(orgId, employee.shift_id);
  if (!shift) {
    throw new AppError('SHIFT_001', 'Shift not found', 404);
  }

  const attendanceId = uuidv4();
  const sessionId = uuidv4();
  const checkInTime = new Date();

  let attendance = existingAttendance;
  if (!attendance) {
    attendance = await repository.createAttendance({
      id: attendanceId,
      org_id: orgId,
      emp_id: empId,
      date: today,
      shift_id: employee.shift_id,
      first_check_in: checkInTime,
      session_count: 1,
      status: 'present',
    });
  } else {
    attendanceId = attendance.id;
  }

  await repository.createSession({
    id: sessionId,
    attendance_id: attendanceId,
    org_id: orgId,
    session_number: (attendance.session_count || 0) + 1,
    check_in_time: checkInTime,
    status: 'open',
  });

  return {
    attendanceId: attendance.id,
    sessionId,
    status: 'checked_in',
    checkedInAt: checkInTime.toISOString(),
  };
};

const checkOut = async (orgId, empId, attendanceId, repository) => {
  const attendance = await repository.findAttendanceById(orgId, attendanceId);
  if (!attendance) {
    throw new AppError('ATT_001', 'Attendance record not found', 404);
  }

  if (attendance.emp_id !== empId) {
    throw new AppError('AUTH_004', 'Insufficient permissions', 403);
  }

  const openSession = await repository.findOpenSession(orgId, attendanceId);
  if (!openSession) {
    throw new AppError('ATT_006', 'No open check-in session', 400);
  }

  const checkOutTime = new Date();
  const workedMinutes = Math.floor((checkOutTime - openSession.check_in_time) / 60000);

  await repository.updateSession(orgId, openSession.id, {
    check_out_time: checkOutTime,
    worked_minutes: workedMinutes,
    status: 'completed',
  });

  const shift = await repository.findShiftById(orgId, attendance.shift_id);
  if (!shift) {
    throw new AppError('SHIFT_001', 'Shift not found for attendance record', 404);
  }

  const statusResult = await calculateStatus(
    empId,
    attendance.first_check_in,
    checkOutTime,
    shift
  );

  const totalWorkedMinutes = await repository.calculateTotalWorked(orgId, attendanceId);

  const updatedAttendance = await repository.updateAttendance(orgId, attendanceId, {
    last_check_out: checkOutTime,
    total_worked_minutes: totalWorkedMinutes,
    status: statusResult.finalStatus,
    is_late: statusResult.isLate || false,
    is_overtime: statusResult.isOvertime || false,
  });

  return {
    attendanceId,
    status: 'checked_out',
    checkedOutAt: checkOutTime.toISOString(),
    sessionDuration: `${Math.floor(workedMinutes / 60)}h ${workedMinutes % 60}m`,
    attendanceStatus: statusResult.finalStatus,
  };
};

const undoCheckOut = async (orgId, empId, attendanceId, repository) => {
  const attendance = await repository.findAttendanceById(orgId, attendanceId);
  if (!attendance) {
    throw new AppError('ATT_001', 'Attendance record not found', 404);
  }

  if (attendance.emp_id !== empId) {
    throw new AppError('AUTH_004', 'Insufficient permissions', 403);
  }

  const lastSession = await repository.findLastSession(orgId, attendanceId);
  if (!lastSession || lastSession.status !== 'completed') {
    throw new AppError('ATT_006', 'No completed session to undo', 400);
  }

  const undoWindow = 5 * 60 * 1000;
  const timeSinceCheckOut = Date.now() - lastSession.check_out_time.getTime();
  
  if (timeSinceCheckOut > undoWindow) {
    throw new AppError('ATT_007', 'Undo window expired (5 minutes)', 400);
  }

  await repository.updateSession(orgId, lastSession.id, {
    check_out_time: null,
    worked_minutes: 0,
    status: 'open',
  });

  await repository.updateAttendance(orgId, attendanceId, {
    last_check_out: null,
    status: 'present',
    is_late: false,
    is_overtime: false,
  });

  return {
    attendanceId,
    status: 'checked_in',
    message: 'Check-out undone successfully',
  };
};

const getTodayStatus = async (orgId, empId, repository) => {
  const attendance = await repository.findTodayAttendance(orgId, empId);
  
  if (!attendance) {
    return {
      attendanceId: null,
      status: 'absent',
      checkedInAt: null,
      checkedOutAt: null,
      duration: null,
    };
  }

  const duration = attendance.last_check_out && attendance.first_check_in
    ? Math.floor((attendance.last_check_out - attendance.first_check_in) / 60000)
    : null;

  return {
    attendanceId: attendance.id,
    status: attendance.status,
    checkedInAt: attendance.first_check_in?.toISOString() || null,
    checkedOutAt: attendance.last_check_out?.toISOString() || null,
    duration: duration ? `${Math.floor(duration / 60)}h ${duration % 60}m` : null,
  };
};

const getHistory = async (orgId, empId, filters, repository) => {
  const { page, limit, status, startDate, endDate } = filters;
  const offset = (page - 1) * limit;

  const result = await repository.findAttendanceHistory(
    orgId,
    empId,
    {
      offset,
      limit,
      status,
      startDate,
      endDate,
    }
  );

  const totalPages = Math.ceil(result.total / limit);

  return {
    attendances: result.attendances.map(att => ({
      id: att.id,
      date: att.date,
      status: att.status,
      checkedInAt: att.first_check_in?.toISOString() || null,
      checkedOutAt: att.last_check_out?.toISOString() || null,
      duration: att.total_worked_minutes ? `${Math.floor(att.total_worked_minutes / 60)}h ${att.total_worked_minutes % 60}m` : null,
    })),
    pagination: { page, limit, total: result.total, totalPages },
  };
};

const getLiveBoard = async (orgId, filters, repository) => {
  const { page, limit, branch, status } = filters;
  const offset = (page - 1) * limit;

  const result = await repository.findLiveBoard(
    orgId,
    { offset, limit, branch, status }
  );

  const employees = result.employees.map(emp => {
    const duration = emp.Attendances?.[0]?.last_check_out && emp.Attendances?.[0]?.first_check_in
      ? Math.floor((emp.Attendances[0].last_check_out - emp.Attendances[0].first_check_in) / 60000)
      : null;

    return {
      empId: emp.id,
      name: `${emp.first_name} ${emp.last_name || ''}`.trim(),
      status: emp.Attendances?.[0]?.status || 'absent',
      checkedInAt: emp.Attendances?.[0]?.first_check_in?.toISOString() || null,
      duration: duration ? `${Math.floor(duration / 60)}h ${duration % 60}m` : null,
    };
  });

  const totalPages = Math.ceil(result.total / limit);

  return {
    employees,
    pagination: { page, limit, total: result.total, totalPages },
  };
};

const flagAnomaly = async (orgId, data, repository) => {
  const { attendanceId, reason, details } = data;

  const attendance = await repository.findAttendanceById(orgId, attendanceId);
  if (!attendance) {
    throw new AppError('ATT_001', 'Attendance record not found', 404);
  }

  const flagId = uuidv4();
  const flagData = {
    id: flagId,
    attendance_id: attendanceId,
    org_id: orgId,
    reason,
    details,
    flagged_at: new Date(),
  };

  await repository.flagAnomaly(orgId, attendanceId, flagData);

  return {
    flagId,
    attendanceId,
    flaggedAt: flagData.flagged_at.toISOString(),
  };
};

const exportAttendance = async (orgId, data, repository) => {
  const { startDate, endDate, format, branchId } = data;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    throw new AppError('VAL_001', 'Start date must be before end date', 400);
  }

  const attendances = await repository.findAttendanceForExport(
    orgId,
    { startDate: start, endDate: end, branchId }
  );

  const jobId = uuidv4();
  await setRedis(`export_job:${jobId}`, {
    status: 'processing',
    orgId,
    format,
    count: attendances.length,
    createdAt: new Date(),
  }, 3600);

  return {
    jobId,
    status: 'processing',
    estimatedRecords: attendances.length,
  };
};

const offlineSync = async (orgId, empId, records, repository) => {
  if (!Array.isArray(records) || records.length === 0) {
    throw new AppError('VAL_001', 'Records array required', 400);
  }

  const results = { synced: 0, failed: 0, errors: [] };

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    try {
      const timestamp = new Date(record.timestamp);
      const date = timestamp.toISOString().split('T')[0];

      let attendance = await repository.findAttendanceByDate(orgId, empId, date);
      
      if (!attendance) {
        attendance = await repository.createAttendance({
          id: uuidv4(),
          org_id: orgId,
          emp_id: empId,
          date,
          shift_id: null,
          status: record.status === 'checked_in' ? 'present' : attendance?.status || 'absent',
        });
      }

      if (record.status === 'checked_in' && !attendance.first_check_in) {
        await repository.updateAttendance(orgId, attendance.id, {
          first_check_in: timestamp,
        });
      } else if (record.status === 'checked_out' && !attendance.last_check_out) {
        await repository.updateAttendance(orgId, attendance.id, {
          last_check_out: timestamp,
        });
      }

      results.synced++;
    } catch (err) {
      results.errors.push({
        index: i,
        error: err.message,
      });
      results.failed++;
    }
  }

  return results;
};

const updateAttendanceStatus = async (orgId, attendanceId, data, repository) => {
  const { status, reason } = data;

  const attendance = await repository.findAttendanceById(orgId, attendanceId);
  if (!attendance) {
    throw new AppError('ATT_001', 'Attendance record not found', 404);
  }

  const validStatuses = ['present', 'absent', 'half_day', 'half_day_early', 'on_leave'];
  if (!validStatuses.includes(status)) {
    throw new AppError('VAL_001', 'Invalid status', 400);
  }

  const updated = await repository.updateAttendance(orgId, attendanceId, {
    status,
    is_manual: true,
    marked_by: orgId,
  });

  const reasonData = {
    status,
    updatedAt: new Date(),
    reason: reason || 'Manual update',
  };
  
  await setRedis(`attendance_reason:${attendanceId}`, reasonData, 86400 * 30);

  return {
    id: updated.id,
    status: updated.status,
    updatedAt: updated.updated_at.toISOString(),
  };
};

module.exports = {
  requestCheckIn,
  checkIn,
  checkOut,
  undoCheckOut,
  getTodayStatus,
  getHistory,
  getLiveBoard,
  flagAnomaly,
  exportAttendance,
  offlineSync,
  updateAttendanceStatus,
};