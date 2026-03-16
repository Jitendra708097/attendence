/**
 * @module attendance.controller
 * @description Handles attendance check-in, check-out, history endpoints.
 */
const attendanceService = require('./attendance.service.js');
const attendanceRepository = require('./attendance.repository.js');
const { AppError } = require('../../utils/AppError.js');

const requestCheckIn = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const empId = req.user.empId;
    const { latitude, longitude, photo_base64 } = req.body;

    const result = await attendanceService.requestCheckIn(
      orgId,
      empId,
      { latitude, longitude, photo_base64 },
      attendanceRepository
    );

    res.status(200).json({
      success: true,
      message: 'Check-in challenge issued',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const checkIn = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const empId = req.user.empId;
    const { challengeToken, challengeResponse } = req.body;

    const result = await attendanceService.checkIn(
      orgId,
      empId,
      { challengeToken, challengeResponse },
      attendanceRepository
    );

    res.status(201).json({
      success: true,
      message: 'Check-in successful',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const checkOut = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const empId = req.user.empId;
    const { attendanceId } = req.body;

    const result = await attendanceService.checkOut(
      orgId,
      empId,
      attendanceId,
      attendanceRepository
    );

    res.status(200).json({
      success: true,
      message: 'Check-out successful',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const undoCheckOut = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const empId = req.user.empId;
    const { attendanceId } = req.body;

    const result = await attendanceService.undoCheckOut(
      orgId,
      empId,
      attendanceId,
      attendanceRepository
    );

    res.status(200).json({
      success: true,
      message: 'Check-out undone successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const getTodayStatus = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const empId = req.user.empId;

    const result = await attendanceService.getTodayStatus(
      orgId,
      empId,
      attendanceRepository
    );

    res.status(200).json({
      success: true,
      message: 'Today status retrieved',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const empId = req.user.empId;
    let { page = 1, limit = 20, status, startDate, endDate } = req.query;

    // Validate and constrain pagination parameters
    page = Math.max(1, parseInt(page, 10) || 1);
    limit = Math.min(Math.max(1, parseInt(limit, 10) || 20), 100); // Max 100 records per page

    const result = await attendanceService.getHistory(
      orgId,
      empId,
      {
        page,
        limit,
        status,
        startDate,
        endDate,
      },
      attendanceRepository
    );

    res.status(200).json({
      success: true,
      message: 'Attendance history retrieved',
      data: {
        attendances: result.attendances,
        pagination: result.pagination,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getLiveBoard = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    let { page = 1, limit = 50, branch, status } = req.query;

    // Validate and constrain pagination parameters
    page = Math.max(1, parseInt(page, 10) || 1);
    limit = Math.min(Math.max(1, parseInt(limit, 10) || 50), 100); // Max 100 records per page

    const result = await attendanceService.getLiveBoard(
      orgId,
      {
        page,
        limit,
        branch,
        status,
      },
      attendanceRepository
    );

    res.status(200).json({
      success: true,
      message: 'Live board retrieved',
      data: {
        employees: result.employees,
        pagination: result.pagination,
      },
    });
  } catch (err) {
    next(err);
  }
};

const flagAnomaly = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const { attendanceId, reason, details } = req.body;

    const result = await attendanceService.flagAnomaly(
      orgId,
      { attendanceId, reason, details },
      attendanceRepository
    );

    res.status(201).json({
      success: true,
      message: 'Anomaly flagged',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const exportAttendance = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const { startDate, endDate, format, branchId } = req.body;

    const result = await attendanceService.exportAttendance(
      orgId,
      { startDate, endDate, format, branchId },
      attendanceRepository
    );

    res.status(200).json({
      success: true,
      message: 'Export initiated',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const offlineSync = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const empId = req.user.empId;
    const { records } = req.body;

    const result = await attendanceService.offlineSync(
      orgId,
      empId,
      records,
      attendanceRepository
    );

    res.status(200).json({
      success: true,
      message: 'Offline sync completed',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const getAttendanceById = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const { id } = req.params;

    const attendance = await attendanceRepository.findAttendanceById(orgId, id);
    if (!attendance) {
      throw new AppError('ATT_001', 'Attendance record not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Attendance record retrieved',
      data: attendance,
    });
  } catch (err) {
    next(err);
  }
};

const updateAttendanceStatus = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const { id } = req.params;
    const { status, reason } = req.body;

    const result = await attendanceService.updateAttendanceStatus(
      orgId,
      id,
      { status, reason },
      attendanceRepository
    );

    res.status(200).json({
      success: true,
      message: 'Attendance status updated',
      data: result,
    });
  } catch (err) {
    next(err);
  }
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
  getAttendanceById,
  updateAttendanceStatus,
};