/**
 * @module regularisation.service
 * @description Business logic for regularisation management.
 * Called by: regularisation.controller
 * Calls: regularisation.repository
 */
const { AppError  } = require('../../utils/AppError.js');
// const { scopedModel  } = require('../../packages/shared-utils/src/scopedModel.js');
const { models  } = require('../../models/index.js');

const VALID_ISSUE_TYPES = ['late_checkin', 'early_checkout', 'missing_attendance', 'incomplete_session'];
const VALID_EVIDENCE_TYPES = ['email_reply', 'message', 'document', 'verbal', 'other'];

/**
 * List regularisations with pagination and filters
 */
const listRegularisations = async (orgId, filters, repository) => {
  const { page, limit, status, issueType, empId, startDate, endDate, isAdmin, userId } = filters;
  const offset = (page - 1) * limit;

  const where = { org_id: orgId };
  if (status) where.status = status;
  if (issueType && VALID_ISSUE_TYPES.includes(issueType)) where.issue_type = issueType;
  if (empId) where.emp_id = empId;

  const result = await repository.findRegularisationsPaginated(orgId, {
    offset,
    limit,
    where,
    startDate,
    endDate,
  });

  const totalPages = Math.ceil(result.total / limit);

  return {
    regularisations: result.regularisations.map(reg => formatRegularisation(reg)),
    pagination: { page, limit, total: result.total, totalPages },
  };
};

/**
 * Create new regularisation request
 * Employee submits request after attendance
 */
const createRegularisation = async (orgId, empId, data, repository) => {
  const { attendanceId, issueType, evidenceType, evidenceUrl, reason } = data;

  // Validate issue type
  if (!VALID_ISSUE_TYPES.includes(issueType)) {
    throw new AppError('VAL_001', 'Invalid issue type', 400);
  }

  // Validate evidence type (mandatory)
  if (!evidenceType || !VALID_EVIDENCE_TYPES.includes(evidenceType)) {
    throw new AppError('VAL_001', 'Valid evidence type is required', 400);
  }

  // Ensure reason is provided
  if (!reason || reason.trim().length === 0) {
    throw new AppError('VAL_001', 'Reason is required', 400);
  }

  // Verify attendance belongs to employee and org
  const attendance = await repository.findAttendanceById(orgId, attendanceId);
  if (!attendance || attendance.emp_id !== empId) {
    throw new AppError('ATT_001', 'Attendance not found', 404);
  }

  // Check if regularisation already exists for this attendance
  const existing = await repository.findByAttendanceId(orgId, attendanceId);
  if (existing) {
    throw new AppError('GEN_002', 'Regularisation already exists for this attendance', 409);
  }

  // Create regularisation
  const regularisation = await repository.create(orgId, {
    emp_id: empId,
    attendance_id: attendanceId,
    issue_type: issueType,
    evidence_type: evidenceType,
    evidence_url: evidenceUrl || null,
    reason,
    status: 'pending_manager',
  });

  return formatRegularisation(regularisation);
};

/**
 * Get regularisation details by ID
 */
const getRegularisationById = async (orgId, id, userId, userRole, repository) => {
  const regularisation = await repository.findById(orgId, id);
  if (!regularisation) {
    throw new AppError('GEN_001', 'Regularisation not found', 404);
  }

  // Access control: employee can only see their own, admin can see all
  if (userRole !== 'admin' && regularisation.emp_id !== userId) {
    throw new AppError('GEN_001', 'Regularisation not found', 404);
  }

  return formatRegularisation(regularisation);
};

/**
 * Update regularisation (only if pending and owned by employee)
 */
const updateRegularisation = async (orgId, empId, id, data, repository) => {
  const { issueType, evidenceType, evidenceUrl, reason } = data;

  const regularisation = await repository.findById(orgId, id);
  if (!regularisation) {
    throw new AppError('GEN_001', 'Regularisation not found', 404);
  }

  // Only employee can update their own pending request
  if (regularisation.emp_id !== empId) {
    throw new AppError('GEN_001', 'Regularisation not found', 404);
  }

  if (regularisation.status !== 'pending_manager') {
    throw new AppError('GEN_002', 'Can only update pending regularisations', 400);
  }

  const updateData = {};
  if (issueType && VALID_ISSUE_TYPES.includes(issueType)) updateData.issue_type = issueType;
  if (evidenceType && VALID_EVIDENCE_TYPES.includes(evidenceType)) updateData.evidence_type = evidenceType;
  if (evidenceUrl !== undefined) updateData.evidence_url = evidenceUrl;
  if (reason) updateData.reason = reason;

  const updated = await repository.update(orgId, id, updateData);
  return formatRegularisation(updated);
};

/**
 * Delete regularisation (only if pending and owned by employee)
 */
const deleteRegularisation = async (orgId, empId, id, repository) => {
  const regularisation = await repository.findById(orgId, id);
  if (!regularisation) {
    throw new AppError('GEN_001', 'Regularisation not found', 404);
  }

  // Only employee can delete their own pending request
  if (regularisation.emp_id !== empId) {
    throw new AppError('GEN_001', 'Regularisation not found', 404);
  }

  if (regularisation.status !== 'pending_manager') {
    throw new AppError('GEN_002', 'Can only delete pending regularisations', 400);
  }

  await repository.delete(orgId, id);
};

/**
 * Approve regularisation (manager or admin)
 * Manager approves first (pending_manager -> pending_admin)
 * Admin approves second (pending_admin -> approved)
 */
const approveRegularisation = async (orgId, approverId, id, approvalNotes, repository) => {
  const regularisation = await repository.findById(orgId, id);
  if (!regularisation) {
    throw new AppError('GEN_001', 'Regularisation not found', 404);
  }

  // Approver must be manager or admin
  const approver = await repository.findEmployeeById(orgId, approverId);
  if (!approver) {
    throw new AppError('EMP_001', 'Approver not found', 404);
  }

  let newStatus = regularisation.status;
  const updateData = { approval_notes: approvalNotes || null };

  if (regularisation.status === 'pending_manager') {
    // Manager approval - verify approver is manager or admin
    if (!['manager', 'admin'].includes(approver.role)) {
      throw new AppError('AUTH_004', 'Only managers and admins can approve manager-level regularisations', 403);
    }
    newStatus = 'pending_admin';
    updateData.manager_id = approverId;
    updateData.manager_approved_at = new Date();
  } else if (regularisation.status === 'pending_admin') {
    // Admin approval - verify approver is admin
    if (approver.role !== 'admin') {
      throw new AppError('AUTH_004', 'Only admins can approve admin-level regularisations', 403);
    }
    newStatus = 'approved';
    updateData.admin_id = approverId;
    updateData.admin_approved_at = new Date();
  } else {
    throw new AppError('GEN_002', 'Cannot approve regularisation in current status', 400);
  }

  updateData.status = newStatus;
  const updated = await repository.update(orgId, id, updateData);

  return formatRegularisation(updated);
};

/**
 * Reject regularisation (manager or admin)
 */
const rejectRegularisation = async (orgId, rejecterId, id, rejectionReason, repository) => {
  const regularisation = await repository.findById(orgId, id);
  if (!regularisation) {
    throw new AppError('GEN_001', 'Regularisation not found', 404);
  }

  if (!rejectionReason || rejectionReason.trim().length === 0) {
    throw new AppError('VAL_001', 'Rejection reason is required', 400);
  }

  const updateData = { status: 'rejected' };

  if (regularisation.status === 'pending_manager') {
    updateData.manager_id = rejecterId;
    updateData.manager_rejection_reason = rejectionReason;
  } else if (regularisation.status === 'pending_admin') {
    updateData.admin_id = rejecterId;
    updateData.admin_rejection_reason = rejectionReason;
  } else {
    throw new AppError('GEN_002', 'Cannot reject regularisation in current status', 400);
  }

  const updated = await repository.update(orgId, id, updateData);
  return formatRegularisation(updated);
};

/**
 * Format regularisation for API response
 */
const formatRegularisation = (reg) => {
  if (!reg) return null;

  return {
    id: reg.id,
    orgId: reg.org_id,
    empId: reg.emp_id,
    attendanceId: reg.attendance_id,
    issueType: reg.issue_type,
    evidenceType: reg.evidence_type,
    evidenceUrl: reg.evidence_url,
    reason: reg.reason,
    status: reg.status,
    managerId: reg.manager_id,
    managerApprovedAt: reg.manager_approved_at,
    managerRejectionReason: reg.manager_rejection_reason,
    adminId: reg.admin_id,
    adminApprovedAt: reg.admin_approved_at,
    adminRejectionReason: reg.admin_rejection_reason,
    createdAt: reg.created_at,
    updatedAt: reg.updated_at,
  };
};

module.exports = {
  listRegularisations,
  createRegularisation,
  getRegularisationById,
  updateRegularisation,
  deleteRegularisation,
  approveRegularisation,
  rejectRegularisation,
};