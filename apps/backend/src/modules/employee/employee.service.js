/**
 * @module employee.service
 * @description Business logic for employee management.
 * Called by: employee.controller
 * Calls: employee.repository
 */
const { AppError  } = require('../../utils/AppError.js');
const { v4, uuidv4  } = require('uuid');

/**
 * List employees with pagination and filters
 */
const listEmployees = async (orgId, filters, empRepository) => {
  const { page, limit, branchId, shiftId, deptId, status, search } = filters;
  const offset = (page - 1) * limit;

  const result = await empRepository.listEmployeesPaginated(orgId, {
    offset,
    limit,
    branchId,
    shiftId,
    deptId,
    status,
    search,
  });

  const totalPages = Math.ceil(result.total / limit);

  return {
    employees: result.employees.map(emp => formatEmployee(emp)),
    pagination: { page, limit, total: result.total, totalPages },
  };
};

/**
 * Create single employee
 */
const createEmployee = async (orgId, data, empRepository) => {
  const { firstName, lastName, email, phone, branchId, shiftId, deptId, role, sendInvite } = data;

  if (!firstName || !email) {
    throw new AppError('VAL_001', 'First name and email are required', 400);
  }

  const existing = await empRepository.findByEmailInOrg(orgId, email);
  if (existing) {
    throw new AppError('EMP_002', 'Email already exists in organisation', 409);
  }

  const employee = await empRepository.createEmployee({
    id: uuidv4(),
    org_id: orgId,
    first_name: firstName,
    last_name: lastName || '',
    email,
    phone: phone || null,
    branch_id: branchId || null,
    shift_id: shiftId || null,
    department_id: deptId || null,
    role: role || 'employee',
    status: 'active',
  });

  if (sendInvite) {
    await sendEmployeeInvite(employee);
  }

  return formatEmployee(employee);
};

/**
 * Bulk upload employees
 */
const bulkUploadEmployees = async (orgId, data, empRepository) => {
  const { employees, sendInvites } = data;

  if (!Array.isArray(employees) || employees.length === 0) {
    throw new AppError('VAL_001', 'Employees array is required', 400);
  }

  if (employees.length > 1000) {
    throw new AppError('VAL_001', 'Maximum 1000 employees per upload', 400);
  }

  const results = { successful: 0, failed: 0, errors: [] };
  const validRoles = ['employee', 'manager', 'admin'];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[0-9]{10,15}$/;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i];
    try {
      // Validate required fields
      if (!emp.firstName || !emp.email) {
        results.errors.push({ row: i + 2, error: 'First name and email required' });
        results.failed++;
        continue;
      }

      // Validate email format
      if (!emailRegex.test(emp.email)) {
        results.errors.push({ row: i + 2, email: emp.email, error: 'Invalid email format' });
        results.failed++;
        continue;
      }

      // Validate phone format if provided
      if (emp.phone && !phoneRegex.test(emp.phone)) {
        results.errors.push({ row: i + 2, email: emp.email, error: 'Invalid phone format (10-15 digits required)' });
        results.failed++;
        continue;
      }

      // Validate branch ID if provided
      if (emp.branchId && !uuidRegex.test(emp.branchId)) {
        results.errors.push({ row: i + 2, email: emp.email, error: 'Invalid branchId format' });
        results.failed++;
        continue;
      }

      // Validate shift ID if provided
      if (emp.shiftId && !uuidRegex.test(emp.shiftId)) {
        results.errors.push({ row: i + 2, email: emp.email, error: 'Invalid shiftId format' });
        results.failed++;
        continue;
      }

      // Validate department ID if provided
      if (emp.deptId && !uuidRegex.test(emp.deptId)) {
        results.errors.push({ row: i + 2, email: emp.email, error: 'Invalid deptId format' });
        results.failed++;
        continue;
      }

      // Validate role if provided
      if (emp.role && !validRoles.includes(emp.role)) {
        results.errors.push({ row: i + 2, email: emp.email, error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
        results.failed++;
        continue;
      }

      // Check for duplicate email
      const existing = await empRepository.findByEmailInOrg(orgId, emp.email);
      if (existing) {
        results.errors.push({ row: i + 2, email: emp.email, error: 'Email already exists' });
        results.failed++;
        continue;
      }

      const created = await empRepository.createEmployee({
        id: uuidv4(),
        org_id: orgId,
        first_name: emp.firstName,
        last_name: emp.lastName || '',
        email: emp.email,
        phone: emp.phone || null,
        branch_id: emp.branchId || null,
        shift_id: emp.shiftId || null,
        department_id: emp.deptId || null,
        role: emp.role || 'employee',
        status: 'active',
      });

      if (sendInvites) {
        await sendEmployeeInvite(created);
      }

      results.successful++;
    } catch (err) {
      results.errors.push({ row: i + 2, email: emp.email, error: err.message });
      results.failed++;
    }
  }

  return results;
};

/**
 * Update employee
 */
const updateEmployee = async (orgId, empId, data, empRepository) => {
  const employee = await empRepository.findEmployeeById(orgId, empId);
  if (!employee) {
    throw new AppError('EMP_001', 'Employee not found', 404);
  }

  const { firstName, lastName, email, phone, branchId, shiftId, deptId, status } = data;

  const updateData = {};
  if (firstName) updateData.first_name = firstName;
  if (lastName !== undefined) updateData.last_name = lastName;
  if (email && email !== employee.email) {
    const existing = await empRepository.findByEmailInOrg(orgId, email);
    if (existing && existing.id !== empId) {
      throw new AppError('EMP_002', 'Email already exists', 409);
    }
    updateData.email = email;
  }
  if (phone !== undefined) updateData.phone = phone;
  if (branchId !== undefined) updateData.branch_id = branchId;
  if (shiftId !== undefined) updateData.shift_id = shiftId;
  if (deptId !== undefined) updateData.department_id = deptId;
  if (status) updateData.status = status;

  const updated = await empRepository.updateEmployee(orgId, empId, updateData);
  return formatEmployee(updated);
};

/**
 * Delete employee (soft delete)
 */
const deleteEmployee = async (orgId, empId, empRepository) => {
  const employee = await empRepository.findEmployeeById(orgId, empId);
  if (!employee) {
    throw new AppError('EMP_001', 'Employee not found', 404);
  }

  await empRepository.deleteEmployee(orgId, empId);
};

/**
 * Resend invite to employee
 */
const resendInvite = async (orgId, empId, empRepository) => {
  const employee = await empRepository.findEmployeeById(orgId, empId);
  if (!employee) {
    throw new AppError('EMP_001', 'Employee not found', 404);
  }

  await sendEmployeeInvite(employee);
};

/**
 * Update employee leave balance
 */
const updateLeaveBalance = async (orgId, empId, balanceData, empRepository) => {
  const employee = await empRepository.findEmployeeById(orgId, empId);
  if (!employee) {
    throw new AppError('EMP_001', 'Employee not found', 404);
  }

  const { casual, sick, earned } = balanceData;

  if ((casual !== undefined && casual < 0) || (sick !== undefined && sick < 0) || (earned !== undefined && earned < 0)) {
    throw new AppError('VAL_001', 'Leave balance cannot be negative', 400);
  }

  const currentBalance = employee.leave_balance || { casual: 0, sick: 0, earned: 0 };
  const newBalance = {
    casual: casual !== undefined ? casual : currentBalance.casual,
    sick: sick !== undefined ? sick : currentBalance.sick,
    earned: earned !== undefined ? earned : currentBalance.earned,
    last_updated: new Date().toISOString(),
  };

  const updated = await empRepository.updateEmployee(orgId, empId, { leave_balance: newBalance });

  return { empId, leaveBalance: updated.leave_balance };
};

/**
 * Helper: Send employee invite
 * @param {object} employee - Employee object with email, first_name, etc.
 * @throws {AppError} If email service fails
 */
const sendEmployeeInvite = async (employee) => {
  try {
    // Check if email service is available
    const emailService = require('../../utils/emailService.js');
    
    if (!emailService || !emailService.sendEmployeeInvite) {
      console.warn(`Email service not available for employee ${employee.id}. Invite not sent.`);
      return;
    }

    // Send invite with temporary password or magic link
    // This should be implemented in emailService with proper templates
    await emailService.sendEmployeeInvite({
      email: employee.email,
      firstName: employee.first_name,
      employeeId: employee.id,
      // Could include temporary password or sign-up link here
    });

    console.log(`Invite sent to ${employee.email}`);
  } catch (error) {
    // Log error but don't throw - don't block employee creation if email fails
    console.error(`Failed to send invite to ${employee.email}:`, error.message);
  }
};

/**
 * Helper: Format employee response
 */
const formatEmployee = (emp) => {
  return {
    id: emp.id,
    firstName: emp.first_name,
    lastName: emp.last_name,
    email: emp.email,
    phone: emp.phone,
    role: emp.role,
    status: emp.status,
    branchId: emp.branch_id,
    shiftId: emp.shift_id,
    deptId: emp.department_id,
    leaveBalance: emp.leave_balance,
    createdAt: emp.created_at,
  };
};

module.exports = {
  listEmployees,
  createEmployee,
  bulkUploadEmployees,
  updateEmployee,
  deleteEmployee,
  resendInvite,
  updateLeaveBalance,
  formatEmployee,
};