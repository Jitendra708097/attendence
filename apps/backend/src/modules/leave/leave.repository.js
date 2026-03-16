/**
 * @module leave.repository
 * @description Database operations for leave requests.
 * Called by: leave.service
 */
const db = require('../../models/index.js');

const { LeaveRequest, Employee, sequelize } = db;

const findLeaveById = async (orgId, leaveId) => {
  return await LeaveRequest.findOne({
    where: { id: leaveId, org_id: orgId, deleted_at: null },
    include: [{ model: Employee, as: 'employee', attributes: ['id', 'first_name', 'last_name', 'email'] }],
  });
};

const findLeavesPaginated = async (orgId, options) => {
  const { offset, limit, status, type, empId, startDate, endDate } = options;
  const where = { org_id: orgId, deleted_at: null };
  if (status) where.status = status;
  if (type) where.leave_type = type;
  if (empId) where.emp_id = empId;
  if (startDate || endDate) {
    where[sequelize.Op.or] = [];
    if (startDate) where[sequelize.Op.or].push({ end_date: { [sequelize.Op.gte]: startDate } });
    if (endDate) where[sequelize.Op.or].push({ start_date: { [sequelize.Op.lte]: endDate } });
  }
  const { rows, count: total } = await LeaveRequest.findAndCountAll({
    where,
    offset,
    limit,
    order: [['created_at', 'DESC']],
    include: [{ model: Employee, as: 'employee', attributes: ['id', 'first_name', 'last_name', 'email'] }],
  });
  return { leaves: rows, total };
};

const createLeave = async (leaveData) => {
  return await LeaveRequest.create(leaveData);
};

const updateLeave = async (orgId, leaveId, updateData) => {
  const leave = await LeaveRequest.findOne({ where: { id: leaveId, org_id: orgId, deleted_at: null } });
  if (!leave) return null;
  return await leave.update(updateData);
};

const deleteLeave = async (orgId, leaveId) => {
  const leave = await LeaveRequest.findOne({ where: { id: leaveId, org_id: orgId, deleted_at: null } });
  if (!leave) return null;
  return await leave.destroy();
};

const findOverlappingLeaves = async (orgId, empId, startDate, endDate, excludeLeaveId = null) => {
  const where = {
    org_id: orgId,
    emp_id: empId,
    status: { [sequelize.Op.in]: ['pending', 'approved'] },
    deleted_at: null,
    [sequelize.Op.or]: [{ start_date: { [sequelize.Op.lte]: new Date(endDate) }, end_date: { [sequelize.Op.gte]: new Date(startDate) } }],
  };
  if (excludeLeaveId) where.id = { [sequelize.Op.ne]: excludeLeaveId };
  return await LeaveRequest.findAll({ where });
};

const findEmployeeById = async (orgId, empId) => {
  return await Employee.findOne({
    where: { id: empId, org_id: orgId, deleted_at: null },
    attributes: ['id', 'first_name', 'last_name', 'email', 'leave_balance'],
  });
};

const updateLeaveBalance = async (orgId, empId, balanceUpdate) => {
  const employee = await Employee.findOne({ where: { id: empId, org_id: orgId, deleted_at: null } });
  if (!employee) return null;
  return await employee.update({ leave_balance: balanceUpdate });
};

module.exports = {
  findLeaveById,
  findLeavesPaginated,
  createLeave,
  updateLeave,
  deleteLeave,
  findOverlappingLeaves,
  findEmployeeById,
  updateLeaveBalance,
};