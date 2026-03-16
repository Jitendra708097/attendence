/**
 * @module department.repository
 * @description Database operations for departments.
 * Called by: department.service
 */
const db = require('../../models/index.js');

const { Department, Employee } = db;

/**
 * Find department by ID within organisation
 */
const findDepartmentById = async (orgId, deptId) => {
  return await Department.findOne({
    where: { id: deptId, org_id: orgId, deleted_at: null },
  });
};

/**
 * List departments with pagination and filters
 */
const listDepartmentsPaginated = async (orgId, options) => {
  const { offset, limit, search, parentId } = options;

  const where = { org_id: orgId, deleted_at: null };
  if (parentId) {
    where.parent_id = parentId;
  }

  if (search) {
    where[db.Sequelize.Op.or] = [
      { name: { [db.Sequelize.Op.iLike]: `%${search}%` } },
    ];
  }

  const { count, rows } = await Department.findAndCountAll({
    where,
    offset,
    limit,
    order: [['name', 'ASC']],
  });

  return {
    departments: rows,
    total: count,
  };
};

/**
 * Create department
 */
const createDepartment = async (data) => {
  return await Department.create(data);
};

/**
 * Update department
 */
const updateDepartment = async (orgId, deptId, data) => {
  const result = await Department.update(data, {
    where: { id: deptId, org_id: orgId },
    returning: true,
  });
  return result[1][0] || null;
};

/**
 * Delete department (soft delete via paranoid)
 */
const deleteDepartment = async (orgId, deptId) => {
  return await Department.destroy({
    where: { id: deptId, org_id: orgId },
  });
};

/**
 * Count employees in department
 */
const countEmployeesByDepartment = async (orgId, deptId) => {
  return await Employee.count({
    where: { org_id: orgId, department_id: deptId, deleted_at: null },
  });
};

/**
 * Count sub-departments
 */
const countSubDepartments = async (orgId, parentDeptId) => {
  return await Department.count({
    where: { org_id: orgId, parent_id: parentDeptId, deleted_at: null },
  });
};

/**
 * Find employee by ID within organisation
 */
const findEmployeeById = async (orgId, empId) => {
  return await Employee.findOne({
    where: { id: empId, org_id: orgId, deleted_at: null },
  });
};

module.exports = {
  findDepartmentById,
  listDepartmentsPaginated,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  countEmployeesByDepartment,
  countSubDepartments,
  findEmployeeById,
};