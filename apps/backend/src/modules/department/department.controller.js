/**
 * @module department.controller
 * @description Handles department CRUD operations.
 */
const deptService = require('./department.service.js');
const deptRepository = require('./department.repository.js');
const { AppError  } = require('../../utils/AppError.js');
const { logAudit  } = {};  // TODO: Import from utils/auditLogger

/**
 * GET /api/v1/departments
 * List all departments with pagination and optional filters
 */
const listDepartments = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const { page = 1, limit = 20, search, parentId } = req.query;

    const result = await deptService.listDepartments(orgId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search,
      parentId,
    }, deptRepository);

    res.status(200).json({
      success: true,
      message: 'Departments retrieved',
      data: {
        departments: result.departments,
        pagination: result.pagination,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/departments
 * Create new department
 */
const createDepartment = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const { name, parentId, headEmpId } = req.body;

    const department = await deptService.createDepartment(orgId, {
      name,
      parentId,
      headEmpId,
    }, deptRepository);

    await logAudit(req, 'DEPARTMENT_CREATED', 'Department', department.id, { name });

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: department,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/departments/:id
 * Get single department by ID
 */
const getDepartmentById = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const { id } = req.params;

    const department = await deptService.getDepartmentById(orgId, id, deptRepository);

    res.status(200).json({
      success: true,
      message: 'Department retrieved',
      data: department,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/departments/:id
 * Update department
 */
const updateDepartment = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const { id } = req.params;
    const { name, parentId, headEmpId } = req.body;

    const department = await deptService.updateDepartment(orgId, id, {
      name,
      parentId,
      headEmpId,
    }, deptRepository);

    await logAudit(req, 'DEPARTMENT_UPDATED', 'Department', id, { name });

    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: department,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/departments/:id
 * Soft delete department
 */
const deleteDepartment = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const { id } = req.params;

    await deptService.deleteDepartment(orgId, id, deptRepository);

    await logAudit(req, 'DEPARTMENT_DELETED', 'Department', id, {});

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listDepartments,
  createDepartment,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
};