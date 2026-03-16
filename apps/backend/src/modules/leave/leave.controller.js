/**
 * @module leave.controller
 * @description Handles leave management endpoints.
 */
const leaveService = require('./leave.service.js');
const leaveRepository = require('./leave.repository.js');
const { AppError  } = require('../../utils/AppError.js');
const { logAudit  } = require('../../utils/auditLogger.js');

const listLeaves = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const empId = req.user.empId;
    const isAdmin = req.user.role === 'admin';
    const { page = 1, limit = 20, status, type, empId: filterEmpId, startDate, endDate } = req.query;
    const filters = { page: parseInt(page), limit: parseInt(limit), status, type, empId: isAdmin ? filterEmpId : empId, startDate, endDate, isAdmin };
    const result = await leaveService.listLeaves(orgId, filters, leaveRepository);
    res.status(200).json({ success: true, message: 'Leaves retrieved successfully', data: result });
  } catch (err) { next(err); }
};

const createLeave = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const empId = req.user.empId;
    const { startDate, endDate, type, reason, alternateEmpId } = req.body;
    const leave = await leaveService.createLeave(orgId, empId, { startDate, endDate, type, reason, alternateEmpId }, leaveRepository);
    await logAudit({ orgId, userId: empId, action: 'CREATE_LEAVE', resourceId: leave.id, details: { type, startDate, endDate } });
    res.status(201).json({ success: true, message: 'Leave request created successfully', data: leave });
  } catch (err) { next(err); }
};

const getLeaveById = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const empId = req.user.empId;
    const { id } = req.params;
    const leave = await leaveService.getLeaveById(orgId, id, empId, req.user.role, leaveRepository);
    res.status(200).json({ success: true, message: 'Leave request retrieved successfully', data: leave });
  } catch (err) { next(err); }
};

const updateLeave = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const empId = req.user.empId;
    const { id } = req.params;
    const { startDate, endDate, type, reason } = req.body;
    const updated = await leaveService.updateLeave(orgId, id, empId, { startDate, endDate, type, reason }, leaveRepository);
    await logAudit({ orgId, userId: empId, action: 'UPDATE_LEAVE', resourceId: id });
    res.status(200).json({ success: true, message: 'Leave request updated successfully', data: updated });
  } catch (err) { next(err); }
};

const deleteLeave = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const empId = req.user.empId;
    const { id } = req.params;
    await leaveService.deleteLeave(orgId, id, empId, leaveRepository);
    await logAudit({ orgId, userId: empId, action: 'DELETE_LEAVE', resourceId: id });
    res.status(200).json({ success: true, message: 'Leave request withdrawn successfully' });
  } catch (err) { next(err); }
};

const approveLeave = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const adminId = req.user.empId;
    const { id } = req.params;
    const { comments } = req.body;
    const approved = await leaveService.approveLeave(orgId, id, adminId, { comments }, leaveRepository);
    await logAudit({ orgId, userId: adminId, action: 'APPROVE_LEAVE', resourceId: id, details: { comments } });
    res.status(200).json({ success: true, message: 'Leave request approved successfully', data: approved });
  } catch (err) { next(err); }
};

const rejectLeave = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const adminId = req.user.empId;
    const { id } = req.params;
    const { comments } = req.body;
    const rejected = await leaveService.rejectLeave(orgId, id, adminId, { comments }, leaveRepository);
    await logAudit({ orgId, userId: adminId, action: 'REJECT_LEAVE', resourceId: id, details: { comments } });
    res.status(200).json({ success: true, message: 'Leave request rejected successfully', data: rejected });
  } catch (err) { next(err); }
};

module.exports = {
  listLeaves,
  createLeave,
  getLeaveById,
  updateLeave,
  deleteLeave,
  approveLeave,
  rejectLeave,
};