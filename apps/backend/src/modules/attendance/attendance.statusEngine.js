/**
 * @module attendance.statusEngine
 * @description Logic for computing attendance status (present, late, absent, half_day).
 */

const calculateStatus = async (empId, checkInTime, checkOutTime, shift) => {
  if (!shift || !checkInTime) {
    return {
      finalStatus: 'absent',
      isLate: false,
      isOvertime: false,
      remarks: 'Missing check-in or shift data',
    };
  }

  const shiftStart = parseTimeString(shift.start_time);
  const shiftEnd = parseTimeString(shift.end_time);
  const checkInDate = new Date(checkInTime);
  const checkOutDate = checkOutTime ? new Date(checkOutTime) : null;

  const graceMinutes = shift.grace_minutes_checkin || 15;
  const halfDayThreshold = shift.half_day_after_minutes || 240;
  const absentThreshold = shift.absent_after_minutes || 120;
  const overtimeThreshold = shift.overtime_after_minutes || 480;

  const checkInMinutesAfterShiftStart = getMinutesDifference(shiftStart, checkInDate);
  const isLate = checkInMinutesAfterShiftStart > graceMinutes;

  if (!checkOutDate) {
    return {
      finalStatus: 'present',
      isLate,
      isOvertime: false,
      remarks: 'Still checked in',
    };
  }

  const totalWorkedMinutes = getMinutesDifference(checkInDate, checkOutDate);

  let finalStatus = 'present';
  let isOvertime = false;

  if (totalWorkedMinutes < absentThreshold) {
    finalStatus = 'absent';
  } else if (totalWorkedMinutes < halfDayThreshold) {
    finalStatus = 'half_day';
  } else {
    finalStatus = 'present';
    if (totalWorkedMinutes > overtimeThreshold) {
      isOvertime = true;
    }
  }

  return {
    finalStatus,
    isLate,
    isOvertime,
    remarks: `Worked ${totalWorkedMinutes} minutes`,
  };
};

const parseTimeString = (timeStr) => {
  if (!timeStr) return new Date('1970-01-01T00:00:00Z');
  
  if (typeof timeStr === 'string') {
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    const today = new Date();
    today.setHours(hours, minutes, seconds || 0, 0);
    return today;
  }
  
  return new Date(timeStr);
};

const getMinutesDifference = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.floor((end - start) / (1000 * 60));
};

module.exports = {
  calculateStatus,
};