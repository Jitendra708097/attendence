/**
 * @module employee.controller
 * @description Handles employee CRUD operations.
 */
const empService = require('./employee.service.js');
const empRepository = require('./employee.repository.js');
const { AppError  } = require('../../utils/AppError.js');
const { logAudit  } = {};  // TODO: Import from utils/auditLogger

/**
 * GET /api/v1/employees
 * List all employees with pagination and filters
 */
const listEmployees = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const { page = 1, limit = 20, branchId, shiftId, deptId, status, search } = req.query;

    const result = await empService.listEmployees(orgId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      branchId,
      shiftId,
      deptId,
      status,
      search,
    }, empRepository);

    res.status(200).json({
      success: true,
      message: 'Employees retrieved',
      data: {
        employees: result.employees,
        pagination: result.pagination,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/employees
 * Create single employee and send invite
 */
const createEmployee = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const { firstName, lastName, email, phone, branchId, shiftId, deptId, role, sendInvite } = req.body;

    const employee = await empService.createEmployee(
      orgId,
      {
        firstName,
        lastName,
        email,
        phone,
        branchId,
        shiftId,
        deptId,
        role: role || 'employee',
        sendInvite: sendInvite !== false,
      },
      empRepository
    );

    await logAudit(req, 'EMPLOYEE_CREATED', 'Employee', employee.id, { email });

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: employee,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/employees/bulk
 * Bulk upload employees from Excel/CSV
 */
const bulkUploadEmployees = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const { employees, sendInvites = true } = req.body;

    const result = await empService.bulkUploadEmployees(
      orgId,
      { employees, sendInvites },
      empRepository
    );

    await logAudit(req, 'EMPLOYEES_BULK_UPLOADED', 'Employee', orgId, { count: result.successful });

    res.status(201).json({
      success: true,
      message: 'Bulk employees uploaded',
      data: {
        successful: result.successful,
        failed: result.failed,
        errors: result.errors,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/employees/me
 * Get own employee profile
 */
const getOwnProfile = async (req, res, next) => {
  try {
    const empId = req.user.empId;
    const orgId = req.org_id;

    if (!empId) {
      throw new AppError('EMP_001', 'Employee ID not found', 401);
    }

    const employee = await empRepository.findEmployeeById(orgId, empId);
    if (!employee) {
      throw new AppError('EMP_001', 'Employee not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Own profile retrieved',
      data: empService.formatEmployee(employee),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/employees/:id
 * Get single employee details
 */
const getEmployeeById = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const { id } = req.params;

    const employee = await empRepository.findEmployeeById(orgId, id);
    if (!employee) {
      throw new AppError('EMP_001', 'Employee not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Employee retrieved',
      data: empService.formatEmployee(employee),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/employees/:id
 * Update employee details
 */
const updateEmployee = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const { id } = req.params;
    const { firstName, lastName, email, phone, branchId, shiftId, deptId, status } = req.body;

    const result = await empService.updateEmployee(
      orgId,
      id,
      { firstName, lastName, email, phone, branchId, shiftId, deptId, status },
      empRepository
    );

    await logAudit(req, 'EMPLOYEE_UPDATED', 'Employee', id, {});

    res.status(200).json({
      success: true,
      message: 'Employee updated',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/employees/:id
 * Soft delete employee and revoke tokens
 */
const deleteEmployee = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const { id } = req.params;

    await empService.deleteEmployee(orgId, id, empRepository);

    await logAudit(req, 'EMPLOYEE_DELETED', 'Employee', id, {});

    res.status(200).json({
      success: true,
      message: 'Employee deleted',
      data: { id },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/employees/:id/resend-invite
 * Resend SMS/email invite to employee
 */
const resendInvite = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const { id } = req.params;

    await empService.resendInvite(orgId, id, empRepository);

    await logAudit(req, 'EMPLOYEE_INVITE_RESENT', 'Employee', id, {});

    res.status(200).json({
      success: true,
      message: 'Invite sent to employee',
      data: { id },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/employees/:id/leave-balance
 * Update employee leave balance
 */
const updateLeaveBalance = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const { id } = req.params;
    const { casual, sick, earned } = req.body;

    const result = await empService.updateLeaveBalance(
      orgId,
      id,
      { casual, sick, earned },
      empRepository
    );

    await logAudit(req, 'LEAVE_BALANCE_UPDATED', 'Employee', id, {});

    res.status(200).json({
      success: true,
      message: 'Leave balance updated',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/employees/:id/leave-balance
 * Get employee leave balance
 */
const getLeaveBalance = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const { id } = req.params;

    const employee = await empRepository.findEmployeeById(orgId, id);
    if (!employee) {
      throw new AppError('EMP_001', 'Employee not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Leave balance retrieved',
      data: {
        empId: id,
        leaveBalance: employee.leave_balance || { casual: 0, sick: 0, earned: 0 },
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listEmployees,
  createEmployee,
  bulkUploadEmployees,
  getOwnProfile,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  resendInvite,
  updateLeaveBalance,
  getLeaveBalance,
};