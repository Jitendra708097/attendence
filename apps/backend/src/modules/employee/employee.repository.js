/**
 * @module employee.repository
 * @description Database operations for employees.
 * Called by: employee.service
 */
const db = require('../../models/index.js');

const { Employee, Branch, Department, Shift } = db;

/**
 * Find employee by ID within organisation
 */
const findEmployeeById = async (orgId, empId) => {
  return await Employee.findOne({
    where: { id: empId, org_id: orgId, deleted_at: null },
    include: [
      { model: Branch, as: 'branch', attributes: ['id', 'name'] },
      { model: Department, as: 'department', attributes: ['id', 'name'] },
      { model: Shift, as: 'shift', attributes: ['id', 'name'] },
    ],
  });
};

/**
 * Find employee by email within organisation
 */
const findByEmailInOrg = async (orgId, email) => {
  return await Employee.findOne({
    where: { org_id: orgId, email: email.toLowerCase(), deleted_at: null },
  });
};

/**
 * List employees with pagination and filters
 */
const listEmployeesPaginated = async (orgId, options) => {
  const { offset, limit, branchId, shiftId, deptId, status, search } = options;

  const where = { org_id: orgId, deleted_at: null };
  if (branchId) where.branch_id = branchId;
  if (shiftId) where.shift_id = shiftId;
  if (deptId) where.department_id = deptId;
  if (status) where.status = status;

  if (search) {
    where[db.Sequelize.Op.or] = [
      { first_name: { [db.Sequelize.Op.iLike]: `%${search}%` } },
      { last_name: { [db.Sequelize.Op.iLike]: `%${search}%` } },
      { email: { [db.Sequelize.Op.iLike]: `%${search}%` } },
      { phone: { [db.Sequelize.Op.iLike]: `%${search}%` } },
    ];
  }

  const { rows: employees, count: total } = await Employee.findAndCountAll({
    where,
    include: [
      { model: Branch, as: 'branch', attributes: ['id', 'name'] },
      { model: Shift, as: 'shift', attributes: ['id', 'name'] },
      { model: Department, as: 'department', attributes: ['id', 'name'] },
    ],
    offset,
    limit,
    order: [['created_at', 'DESC']],
  });

  return { employees, total };
};

/**
 * Create employee
 */
const createEmployee = async (empData) => {
  return await Employee.create(empData);
};

/**
 * Update employee
 */
const updateEmployee = async (orgId, empId, updateData) => {
  const employee = await Employee.findOne({
    where: { id: empId, org_id: orgId, deleted_at: null },
  });

  if (!employee) return null;
  return await employee.update(updateData);
};

/**
 * Soft delete employee
 */
const deleteEmployee = async (orgId, empId) => {
  const employee = await Employee.findOne({
    where: { id: empId, org_id: orgId, deleted_at: null },
  });

  if (!employee) return null;
  return await employee.destroy();
};

module.exports = {
  findEmployeeById,
  findByEmailInOrg,
  listEmployeesPaginated,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};