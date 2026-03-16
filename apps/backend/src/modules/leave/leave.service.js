/**
 * @module leave.service
 * @description Business logic for leave management.
 * Called by: leave.controller
 * Calls: leave.repository
 */
const { AppError  } = require('../../utils/AppError.js');
const { v4: uuidv4 } = require('uuid');

const LEAVE_TYPES = ['casual', 'sick', 'earned'];

const listLeaves = async (orgId, filters, repository) => {
  const { page, limit, status, type, empId, startDate, endDate, isAdmin } = filters;
  const offset = (page - 1) * limit;
  const result = await repository.findLeavesPaginated(orgId, { offset, limit, status, type: type && LEAVE_TYPES.includes(type) ? type : null, empId: isAdmin ? empId : null, startDate, endDate });
  const totalPages = Math.ceil(result.total / limit);
  return { leaves: result.leaves.map(leave => formatLeave(leave)), pagination: { page, limit, total: result.total, totalPages } };
};

const createLeave = async (orgId, empId, data, repository) => {
  const { startDate, endDate, type, reason, alternateEmpId } = data;
  if (!LEAVE_TYPES.includes(type)) throw new AppError('VAL_001', 'Invalid leave type', 400);
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end <= start) throw new AppError('LV_004', 'Invalid date range', 400);
  const employee = await repository.findEmployeeById(orgId, empId);
  if (!employee) throw new AppError('EMP_001', 'Employee not found', 404);
  const overlapping = await repository.findOverlappingLeaves(orgId, empId, startDate, endDate);
  if (overlapping && overlapping.length > 0) throw new AppError('LV_006', 'Overlapping leave request exists', 409);
  const balance = employee.leave_balance || { casual: 0, sick: 0, earned: 0 };
  const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  if (balance[type] < daysDiff) throw new AppError('LV_001', 'Insufficient leave balance', 400);
  const leave = await repository.createLeave({
    id: uuidv4(),
    org_id: orgId,
    emp_id: empId,
    leave_type: type,
    start_date: startDate,
    end_date: endDate,
    days_count: daysDiff,
    reason,
    status: 'pending',
    alternate_emp_id: alternateEmpId || null,
  });
  return formatLeave(leave);
};

const getLeaveById = async (orgId, leaveId, empId, role, repository) => {
  const leave = await repository.findLeaveById(orgId, leaveId);
  if (!leave) throw new AppError('LV_005', 'Leave request not found', 404);
  if (role !== 'admin' && leave.emp_id !== empId) throw new AppError('AUTH_004', 'Insufficient permissions', 403);
  return formatLeave(leave);
};

const updateLeave = async (orgId, leaveId, empId, data, repository) => {
  const leave = await repository.findLeaveById(orgId, leaveId);
  if (!leave) throw new AppError('LV_005', 'Leave request not found', 404);
  if (leave.emp_id !== empId) throw new AppError('AUTH_004', 'Insufficient permissions', 403);
  if (leave.status !== 'pending') throw new AppError('LV_002', 'Cannot modify leave request', 400);
  const { startDate, endDate, type, reason } = data;
  const updateData = {};
  if (startDate) updateData.start_date = startDate;
  if (endDate) updateData.end_date = endDate;
  if (type) {
    if (!LEAVE_TYPES.includes(type)) throw new AppError('VAL_001', 'Invalid leave type', 400);
    updateData.leave_type = type;
  }
  if (reason) updateData.reason = reason;
  if (startDate || endDate) {
    const start = startDate ? new Date(startDate) : new Date(leave.start_date);
    const end = endDate ? new Date(endDate) : new Date(leave.end_date);
    if (end <= start) throw new AppError('LV_004', 'Invalid date range', 400);
    updateData.days_count = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const overlapping = await repository.findOverlappingLeaves(orgId, empId, startDate || leave.start_date, endDate || leave.end_date, leaveId);
    if (overlapping && overlapping.length > 0) throw new AppError('LV_006', 'Overlapping leave request exists', 409);
  }
  const updated = await repository.updateLeave(orgId, leaveId, updateData);
  return formatLeave(updated);
};

const deleteLeave = async (orgId, leaveId, empId, repository) => {
  const leave = await repository.findLeaveById(orgId, leaveId);
  if (!leave) throw new AppError('LV_005', 'Leave request not found', 404);
  if (leave.emp_id !== empId) throw new AppError('AUTH_004', 'Insufficient permissions', 403);
  if (leave.status !== 'pending') throw new AppError('LV_003', 'Cannot withdraw approved/rejected leave', 400);
  await repository.deleteLeave(orgId, leaveId);
};

const approveLeave = async (orgId, leaveId, adminId, data, repository) => {
  const leave = await repository.findLeaveById(orgId, leaveId);
  if (!leave) {
    throw new AppError('LV_005', 'Leave request not found', 404);
  }

  // Verify leave is still in pending status (prevent double approval)
  if (leave.status !== 'pending') {
    throw new AppError('LV_002', `Cannot approve leave with status '${leave.status}'`, 400);
  }

  const employee = await repository.findEmployeeById(orgId, leave.emp_id);
  if (!employee) {
    throw new AppError('EMP_001', 'Employee not found', 404);
  }

  const balance = employee.leave_balance || { casual: 0, sick: 0, earned: 0 };
  const leaveType = leave.leave_type;

  if (balance[leaveType] < leave.days_count) {
    throw new AppError('LV_007', 'Insufficient balance for approval', 400);
  }

  // Use transaction to ensure atomicity of balance update and leave status update
  const newBalance = { ...balance };
  newBalance[leaveType] = balance[leaveType] - leave.days_count;
  newBalance.last_updated = new Date().toISOString();

  // Update balance first
  await repository.updateLeaveBalance(orgId, leave.emp_id, newBalance);

  // Then update leave status
  const updated = await repository.updateLeave(orgId, leaveId, {
    status: 'approved',
    approved_by: adminId,
    approved_at: new Date(),
    approval_comments: data.comments || null,
  });

  return formatLeave(updated);
};

const rejectLeave = async (orgId, leaveId, adminId, data, repository) => {
  const leave = await repository.findLeaveById(orgId, leaveId);
  if (!leave) {
    throw new AppError('LV_005', 'Leave request not found', 404);
  }

  // Verify leave is still in pending status (prevent double rejection)
  if (leave.status !== 'pending') {
    throw new AppError('LV_002', `Cannot reject leave with status '${leave.status}'`, 400);
  }

  const updated = await repository.updateLeave(orgId, leaveId, {
    status: 'rejected',
    rejected_by: adminId,
    rejected_at: new Date(),
    rejection_comments: data.comments || null,
  });

  return formatLeave(updated);
};

const formatLeave = (leave) => ({
  id: leave.id,
  empId: leave.emp_id,
  startDate: leave.start_date,
  endDate: leave.end_date,
  type: leave.leave_type,
  daysCount: leave.days_count,
  reason: leave.reason,
  status: leave.status,
  alternateEmpId: leave.alternate_emp_id || null,
  approvedBy: leave.approved_by || null,
  approvedAt: leave.approved_at ? leave.approved_at.toISOString() : null,
  approvalComments: leave.approval_comments || null,
  rejectedBy: leave.rejected_by || null,
  rejectedAt: leave.rejected_at ? leave.rejected_at.toISOString() : null,
  rejectionComments: leave.rejection_comments || null,
  createdAt: leave.created_at.toISOString(),
  updatedAt: leave.updated_at.toISOString(),
});

module.exports = {
  listLeaves,
  createLeave,
  getLeaveById,
  updateLeave,
  deleteLeave,
  approveLeave,
  rejectLeave,
};