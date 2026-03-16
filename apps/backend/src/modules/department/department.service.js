/**
 * @module department.service
 * @description Business logic for department management.
 * Called by: department.controller
 * Calls: department.repository
 */
const { AppError  } = require('../../utils/AppError.js');
const { v4: uuidv4 } = require('uuid');

/**
 * List departments with pagination and filters
 */
const listDepartments = async (orgId, filters, deptRepository) => {
  const { page, limit, search, parentId } = filters;
  const offset = (page - 1) * limit;

  const result = await deptRepository.listDepartmentsPaginated(orgId, {
    offset,
    limit,
    search,
    parentId,
  });

  const totalPages = Math.ceil(result.total / limit);

  return {
    departments: result.departments.map(d => formatDepartment(d)),
    pagination: { page, limit, total: result.total, totalPages },
  };
};

/**
 * Create single department
 */
const createDepartment = async (orgId, data, deptRepository) => {
  const { name, parentId, headEmpId } = data;

  if (!name || !name.trim()) {
    throw new AppError('VAL_001', 'Department name is required', 400);
  }

  // If setting parent department, verify it exists in same org
  if (parentId) {
    const parent = await deptRepository.findDepartmentById(orgId, parentId);
    if (!parent) {
      throw new AppError('DEPT_001', 'Parent department not found', 404);
    }
  }

  // If setting department head, verify employee exists in same org
  if (headEmpId) {
    const emp = await deptRepository.findEmployeeById(orgId, headEmpId);
    if (!emp) {
      throw new AppError('EMP_001', 'Department head not found', 404);
    }
  }

  const department = await deptRepository.createDepartment({
    id: uuidv4(),
    org_id: orgId,
    name: name.trim(),
    parent_id: parentId || null,
    head_emp_id: headEmpId || null,
  });

  return formatDepartment(department);
};

/**
 * Get department by ID
 */
const getDepartmentById = async (orgId, deptId, deptRepository) => {
  const department = await deptRepository.findDepartmentById(orgId, deptId);
  if (!department) {
    throw new AppError('DEPT_001', 'Department not found', 404);
  }
  return formatDepartment(department);
};

/**
 * Update department
 */
const updateDepartment = async (orgId, deptId, data, deptRepository) => {
  const department = await deptRepository.findDepartmentById(orgId, deptId);
  if (!department) {
    throw new AppError('DEPT_001', 'Department not found', 404);
  }

  const { name, parentId, headEmpId } = data;
  const updateData = {};

  if (name !== undefined && name.trim() !== '') {
    updateData.name = name.trim();
  }

  if (parentId !== undefined) {
    if (parentId === deptId) {
      throw new AppError('DEPT_002', 'Cannot set department as its own parent', 400);
    }
    if (parentId) {
      const parent = await deptRepository.findDepartmentById(orgId, parentId);
      if (!parent) {
        throw new AppError('DEPT_001', 'Parent department not found', 404);
      }
    }
    updateData.parent_id = parentId || null;
  }

  if (headEmpId !== undefined) {
    if (headEmpId) {
      const emp = await deptRepository.findEmployeeById(orgId, headEmpId);
      if (!emp) {
        throw new AppError('EMP_001', 'Department head not found', 404);
      }
    }
    updateData.head_emp_id = headEmpId || null;
  }

  const updated = await deptRepository.updateDepartment(orgId, deptId, updateData);
  return formatDepartment(updated);
};

/**
 * Delete department (soft delete)
 */
const deleteDepartment = async (orgId, deptId, deptRepository) => {
  const department = await deptRepository.findDepartmentById(orgId, deptId);
  if (!department) {
    throw new AppError('DEPT_001', 'Department not found', 404);
  }

  // Check if department has employees
  const empCount = await deptRepository.countEmployeesByDepartment(orgId, deptId);
  if (empCount > 0) {
    throw new AppError('DEPT_003', 'Cannot delete department with employees', 409);
  }

  // Check if department has sub-departments
  const subDeptCount = await deptRepository.countSubDepartments(orgId, deptId);
  if (subDeptCount > 0) {
    throw new AppError('DEPT_004', 'Cannot delete department with sub-departments', 409);
  }

  await deptRepository.deleteDepartment(orgId, deptId);
};

const formatDepartment = (dept) => ({
  id: dept.id,
  name: dept.name,
  parentId: dept.parent_id,
  headEmpId: dept.head_emp_id,
  createdAt: dept.created_at,
  updatedAt: dept.updated_at,
});

module.exports = {
  listDepartments,
  createDepartment,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
};