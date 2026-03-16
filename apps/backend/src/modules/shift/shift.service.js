/**
 * @module shift.service
 * @description Business logic for shift management.
 * Called by: shift.controller
 * Calls: shift.repository
 */
const { AppError  } = require('../../utils/AppError.js');
const { v4: uuidv4 } = require('uuid');

const listShifts = async (orgId, filters, shiftRepository) => {
  const { page, limit, search } = filters;
  const offset = (page - 1) * limit;

  const result = await shiftRepository.listShiftsPaginated(orgId, {
    offset,
    limit,
    search,
  });

  const totalPages = Math.ceil(result.total / limit);

  return {
    shifts: result.shifts.map(s => formatShift(s)),
    pagination: { page, limit, total: result.total, totalPages },
  };
};

const createShift = async (orgId, data, shiftRepository) => {
  const { name, startTime, endTime, workDays } = data;

  if (!name || !startTime || !endTime || !workDays) {
    throw new AppError('VAL_001', 'Name, startTime, endTime, workDays required', 400);
  }

  const thresholds = {
    grace_checkin: data.graceCheckin || 0,
    grace_checkout: data.graceCheckout || 0,
    half_day_threshold: data.halfDayThreshold || 240,
    absent_threshold: data.absentThreshold || 480,
    overtime_threshold: data.overtimeThreshold || 480,
    min_overtime_minutes: data.minOvertimeMinutes || 60,
    break_duration: data.breakDuration || 60,
    min_session_duration: data.minSessionDuration || 300,
    cooldown_between_sessions: data.cooldownBetweenSessions || 300,
    max_sessions_per_day: data.maxSessionsPerDay || 3,
  };

  const shift = await shiftRepository.createShift({
    id: uuidv4(),
    org_id: orgId,
    name,
    start_time: startTime,
    end_time: endTime,
    work_days: workDays,
    thresholds,
  });

  return formatShift(shift);
};

const getShiftById = async (orgId, shiftId, shiftRepository) => {
  const shift = await shiftRepository.findShiftById(orgId, shiftId);
  if (!shift) {
    throw new AppError('SHF_001', 'Shift not found', 404);
  }
  return formatShift(shift);
};

const updateShift = async (orgId, shiftId, data, shiftRepository) => {
  const shift = await shiftRepository.findShiftById(orgId, shiftId);
  if (!shift) {
    throw new AppError('SHF_001', 'Shift not found', 404);
  }

  const { name, startTime, endTime, workDays } = data;
  const updateData = {};

  if (name) updateData.name = name;
  if (startTime) updateData.start_time = startTime;
  if (endTime) updateData.end_time = endTime;
  if (workDays) updateData.work_days = workDays;

  if (data.graceCheckin !== undefined) {
    updateData.thresholds = { ...shift.thresholds, grace_checkin: data.graceCheckin };
  }

  const updated = await shiftRepository.updateShift(orgId, shiftId, updateData);
  return formatShift(updated);
};

const deleteShift = async (orgId, shiftId, shiftRepository) => {
  const shift = await shiftRepository.findShiftById(orgId, shiftId);
  if (!shift) {
    throw new AppError('SHF_001', 'Shift not found', 404);
  }

  const empCount = await shiftRepository.countEmployeesByShift(orgId, shiftId);
  if (empCount > 0) {
    throw new AppError('SHF_002', 'Cannot delete shift with employees', 409);
  }

  await shiftRepository.deleteShift(orgId, shiftId);
};

const formatShift = (shift) => ({
  id: shift.id,
  name: shift.name,
  startTime: shift.start_time,
  endTime: shift.end_time,
  workDays: shift.work_days,
  thresholds: shift.thresholds || {},
  createdAt: shift.created_at,
});

module.exports = {
  listShifts,
  createShift,
  getShiftById,
  updateShift,
  deleteShift,
};