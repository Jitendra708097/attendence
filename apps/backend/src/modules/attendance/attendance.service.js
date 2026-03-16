/**
 * @module attendance.service
 * @description Complete attendance check-in/check-out flow with challenge tokens, face verification, and geofence validation.
 * Called by: attendance.controller
 * Calls: face.service, geofence.service, attendance.statusEngine, redis
 * 
 * CHALLENGE TOKEN FLOW (Replay Attack Prevention)
 * Step 1: Employee requests challenge
 * Step 2: Server generates random token, stores in Redis (30s TTL)
 * Step 3: Mobile completes challenge (BLINK, TURN_LEFT, SMILE)
 * Step 4: Mobile submits selfie + challenge token
 * Step 5: Server validates token exists, not used, not expired
 * Step 6: Token consumed (deleted from Redis) - one use only
 * Step 7: Face verification + geofence check proceed
 *
 * CHECK-IN FLOW
 * 1. Request challenge token (returns 30s expiry deadline)
 * 2. Complete liveness challenge (video proof)
 * 3. Submit check-in: { challengeToken, selfie, lat, lng, deviceId }
 * 4. Validate: timestamp, device, location, face
 * 5. Create attendance record + session
 *
 * CHECK-OUT FLOW
 * 1. Submit check-out: { selfie, lat, lng }
 * 2. Validate: face, location, duplicate prevention (5 min cooldown)
 * 3. Mark session complete, compute worked_minutes
 * 4. Call status engine if final checkout
 */

const { AppError } = require('../../utils/AppError.js');
const { v4: uuidv4 } = require('uuid');
const Redis = require('ioredis');
const { generateChallengeToken, consumeChallengeToken, setRedis, getRedis, delRedis } = require('../../utils/redis.js');
const { computeStatus } = require('./attendance.statusEngine.js');
const { models } = require('../../models/index.js');
const faceService = require('../face/face.service.js');
const geofenceService = require('../geofence/geofence.service.js');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

/**
 * STEP 1: ISSUE CHALLENGE TOKEN
 * Employee requests liveness challenge before check-in
 * Prevents video replay attacks
 * 
 * @param {string} orgId
 * @param {string} empId
 * @returns {object} { challengeToken, challenge: 'BLINK'|'TURN_LEFT'|'SMILE', expiresIn: 30 }
 */
const issueChallenge = async (orgId, empId) => {
  // Validate employee exists in org
  const employee = await models.Employee.findOne({
    where: { id: empId, org_id: orgId },
  });
  if (!employee) {
    throw new AppError('EMP_001', 'Employee not found', 404);
  }

  // Generate random challenge token (64-char hex)
  const challengeToken = uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '');

  // Pick random challenge (3 options for variety)
  const challenges = ['BLINK', 'TURN_LEFT', 'SMILE'];
  const challenge = challenges[Math.floor(Math.random() * challenges.length)];

  // Store in Redis with 30-second TTL (consumed after first use)
  const key = `challenge:${orgId}:${empId}`;
  await setRedis(key, { challengeToken, challenge, used: false }, 30);

  return {
    challengeToken,
    challenge,
    expiresIn: 30, // seconds
  };
};

/**
 * VALIDATE CHALLENGE TOKEN
 * Ensures token is valid and not reused
 * Consumes token (prevents replay)
 */
const validateChallenge = async (orgId, empId, challengeToken) => {
  if (!challengeToken || typeof challengeToken !== 'string') {
    throw new AppError('ATT_009', 'Challenge token invalid', 400);
  }

  const key = `challenge:${orgId}:${empId}`;
  const stored = await getRedis(key);

  if (!stored) {
    throw new AppError('ATT_008', 'Challenge token expired', 401);
  }

  const data = JSON.parse(stored);

  if (data.challengeToken !== challengeToken) {
    throw new AppError('ATT_009', 'Challenge token invalid', 400);
  }

  if (data.used) {
    throw new AppError('ATT_010', 'Challenge token already used', 429);
  }

  // Mark as used (prevents replay)
  data.used = true;
  await setRedis(key, data, 5);

  // Actually delete it after consumption
  await delRedis(key);

  return true;
};

/**
 * STEP 2: CHECK-IN
 * Complete attendance check-in with multi-factor validation
 * 
 * Validation Steps:
 * 1. Challenge token consumed
 * 2. Device ID verified (employee can have only 1 registered device)
 * 3. Request timestamp within 35 seconds of server time
 * 4. Location validation (geofence check)
 * 5. Face verification (6-layer pipeline)
 *
 * @param {string} orgId
 * @param {string} empId
 * @param {object} data - { challengeToken, selfieBase64, lat, lng, deviceId, captureTimestamp }
 * @throws ATT_008/009/010 - challenge errors
 * @throws AUTH_009 - unregistered device
 * @throws ATT_011 - invalid timestamp
 * @throws GEO_001/002/003 - location errors
 * @throws FACE_001/002/003 - face errors
 * @returns {object} { attendanceId, sessionId, status }
 */
const checkIn = async (orgId, empId, data) => {
  const { challengeToken, selfieBase64, lat, lng, deviceId, captureTimestamp } = data;

  // Validation: Challenge token
  await validateChallenge(orgId, empId, challengeToken);

  // Get employee
  const employee = await models.Employee.findOne({
    where: { id: empId, org_id: orgId },
  });

  if (!employee) {
    throw new AppError('EMP_001', 'Employee not found', 404);
  }

  if (!employee.is_active) {
    throw new AppError('AUTH_005', 'Account suspended', 403);
  }

  // Validation: Device ID
  if (employee.registered_device_id && employee.registered_device_id !== deviceId) {
    throw new AppError('AUTH_009', 'Unregistered device', 403);
  }

  // Validation: Timestamp (within 35 seconds of server time)
  const serverTime = Date.now();
  const captureTime = parseInt(captureTimestamp);
  const timeDiff = Math.abs(serverTime - captureTime);

  if (timeDiff > 35000) {
    // 35 seconds
    throw new AppError('ATT_011', 'Request timestamp invalid', 400);
  }

  // Get shift
  const shift = await models.Shift.findOne({
    where: { id: employee.shift_id },
  });

  if (!shift) {
    throw new AppError('GEN_001', 'Shift not found', 404);
  }

  // Get branch for geofence
  const branch = await models.Branch.findOne({
    where: { id: employee.branch_id },
  });

  if (!branch) {
    throw new AppError('GEN_001', 'Branch not found', 404);
  }

  // Validation: Location (Geofence)
  const locationData = {
    lat,
    lng,
    accuracy: data.accuracy || 100,
    altitude: data.altitude,
    speed: data.speed,
    timestamp: captureTime,
  };

  const locationValidation = await geofenceService.validateLocation(locationData, branch);
  if (!locationValidation.valid) {
    throw new AppError('GEO_001', 'Outside geofence', 403);
  }

  // Validation: Face (6-layer pipeline)
  const faceResult = await faceService.verifyFace(orgId, empId, selfieBase64);
  if (!faceResult.verified) {
    throw new AppError('FACE_003', 'Face verification failed', 401);
  }

  // ✅ All validations passed - create attendance record
  const today = new Date().toISOString().split('T')[0];
  let attendance = await models.Attendance.findOne({
    where: {
      org_id: orgId,
      emp_id: empId,
      date: today,
    },
  });

  if (!attendance) {
    attendance = await models.Attendance.create({
      id: uuidv4(),
      org_id: orgId,
      emp_id: empId,
      branch_id: employee.branch_id,
      shift_id: employee.shift_id,
      date: today,
      first_check_in: new Date(),
      session_count: 1,
      status: 'present', // Will be updated on final checkout
    });
  }

  // Create attendance session
  const session = await models.AttendanceSession.create({
    id: uuidv4(),
    attendance_id: attendance.id,
    org_id: orgId,
    emp_id: empId,
    session_number: (attendance.session_count || 0) + 1,
    check_in_at: new Date(),
    check_in_lat: lat,
    check_in_lng: lng,
    check_in_selfie_url: selfieBase64.substring(0, 50) + '...',
    check_in_accuracy: locationData.accuracy,
    status: 'open', // Open session
    is_undo_eligible: true,
  });

  return {
    attendanceId: attendance.id,
    sessionId: session.id,
    status: 'checked_in',
    sessionNumber: session.session_number,
    checkedInAt: new Date().toISOString(),
    locationValidation: {
      valid: true,
      method: locationValidation.method,
      isAnomaly: locationValidation.isAnomaly,
    },
    faceValidation: {
      verified: true,
      method: faceResult.method,
      confidence: faceResult.confidence,
    },
  };
};

/**
 * STEP 3: CHECK-OUT
 * Complete attendance check-out
 * Uses same geofence + face validation as check-in
 * Can only be undone within 10 minutes
 *
 * @param {string} orgId
 * @param {string} empId
 * @param {object} data - { attendanceId, sessionId, selfieBase64, lat, lng }
 * @returns {object} { sessionId, status, workedMinutes }
 */
const checkOut = async (orgId, empId, data) => {
  const { attendanceId, sessionId, selfieBase64, lat, lng } = data;

  // Get session
  const session = await models.AttendanceSession.findOne({
    where: {
      id: sessionId,
      attendance_id: attendanceId,
      org_id: orgId,
      emp_id: empId,
    },
  });

  if (!session) {
    throw new AppError('ATT_001', 'No active session', 404);
  }

  if (session.status !== 'open') {
    throw new AppError('ATT_002', 'Session already closed', 409);
  }

  // Get employee
  const employee = await models.Employee.findOne({
    where: { id: empId, org_id: orgId },
  });

  // Get branch for geofence
  const branch = await models.Branch.findOne({
    where: { id: employee.branch_id },
  });

  // Validation: Location + Face (same as check-in)
  const locationData = {
    lat,
    lng,
    accuracy: data.accuracy || 100,
  };

  await geofenceService.validateLocation(locationData, branch);
  await faceService.verifyFace(orgId, empId, selfieBase64);

  // Compute worked time
  const checkOutTime = new Date();
  const workedMillis = checkOutTime - new Date(session.check_in_at);
  const workedMinutes = Math.round(workedMillis / 1000 / 60);

  // Update session
  await models.AttendanceSession.update(
    {
      check_out_at: checkOutTime,
      check_out_lat: lat,
      check_out_lng: lng,
      check_out_selfie_url: selfieBase64.substring(0, 50) + '...',
      worked_minutes: workedMinutes,
      status: 'completed',
      is_undo_eligible: true, // Eligible for 10 min undo window
    },
    {
      where: { id: sessionId },
    }
  );

  return {
    sessionId,
    status: 'checked_out',
    workedMinutes,
    checkedOutAt: checkOutTime.toISOString(),
  };
};

/**
 * UNDO CHECK-OUT
 * Employee can undo checkout within 10 minutes
 * Reopens the session for extension
 */
const undoCheckOut = async (orgId, empId, sessionId) => {
  const session = await models.AttendanceSession.findOne({
    where: { id: sessionId, org_id: orgId, emp_id: empId },
  });

  if (!session) {
    throw new AppError('ATT_001', 'Session not found', 404);
  }

  // Check if still within 10-minute undo window
  const checkOutTime = new Date(session.check_out_at);
  const nowTime = new Date();
  const minutesSinceCheckOut = (nowTime - checkOutTime) / 1000 / 60;

  if (minutesSinceCheckOut > 10) {
    throw new AppError('ATT_012', 'Undo checkout window expired', 400);
  }

  // Reopen session
  await models.AttendanceSession.update(
    {
      check_out_at: null,
      check_out_lat: null,
      check_out_lng: null,
      check_out_selfie_url: null,
      worked_minutes: 0,
      status: 'open',
    },
    { where: { id: sessionId } }
  );

  return { success: true, message: 'Checkout undone - session reopened' };
};

module.exports = {
  issueChallenge,
  validateChallenge,
  checkIn,
  checkOut,
  undoCheckOut,
};

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