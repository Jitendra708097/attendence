/**
 * @module holiday.service
 * @description Business logic for holiday management.
 * Called by: holiday.controller
 * Calls: holiday.repository
 */
const { AppError  } = require('../../utils/AppError.js');
const { v4: uuidv4 } = require('uuid');

/**
 * List holidays with pagination and optional filters
 */
const listHolidays = async (orgId, filters, holidayRepository) => {
  const { page, limit, branchId, year, month } = filters;
  const offset = (page - 1) * limit;

  const result = await holidayRepository.listHolidaysPaginated(orgId, {
    offset,
    limit,
    branchId,
    year,
    month,
  });

  const totalPages = Math.ceil(result.total / limit);

  return {
    holidays: result.holidays.map(h => formatHoliday(h)),
    pagination: { page, limit, total: result.total, totalPages },
  };
};

/**
 * Create new holiday
 */
const createHoliday = async (orgId, data, holidayRepository) => {
  const { holidayDate, name, description, branchId, isOptional, isRecurring, recurringPattern, impactOnLeave } = data;

  if (!holidayDate || !name) {
    throw new AppError('VAL_001', 'Holiday date and name are required', 400);
  }

  // Validate recurring pattern if needed
  if (isRecurring && recurringPattern && !['yearly', 'monthly'].includes(recurringPattern)) {
    throw new AppError('VAL_001', 'Recurring pattern must be yearly or monthly', 400);
  }

  // Validate impact on leave
  if (impactOnLeave && !['full_day', 'half_day', 'no_deduction'].includes(impactOnLeave)) {
    throw new AppError('VAL_001', 'Invalid impact on leave value', 400);
  }

  // If branch-specific, verify branch exists
  if (branchId) {
    const branch = await holidayRepository.findBranchById(orgId, branchId);
    if (!branch) {
      throw new AppError('BRN_001', 'Branch not found', 404);
    }
  }

  const holiday = await holidayRepository.createHoliday({
    id: uuidv4(),
    org_id: orgId,
    branch_id: branchId || null,
    holiday_date: new Date(holidayDate),
    name: name.trim(),
    description: description || null,
    is_optional: isOptional === true,
    is_recurring: isRecurring === true,
    recurring_pattern: recurringPattern || null,
    impact_on_leave: impactOnLeave || 'full_day',
  });

  return formatHoliday(holiday);
};

/**
 * Get holiday by ID
 */
const getHolidayById = async (orgId, holidayId, holidayRepository) => {
  const holiday = await holidayRepository.findHolidayById(orgId, holidayId);
  if (!holiday) {
    throw new AppError('HOL_001', 'Holiday not found', 404);
  }
  return formatHoliday(holiday);
};

/**
 * Update holiday
 */
const updateHoliday = async (orgId, holidayId, data, holidayRepository) => {
  const holiday = await holidayRepository.findHolidayById(orgId, holidayId);
  if (!holiday) {
    throw new AppError('HOL_001', 'Holiday not found', 404);
  }

  const { holidayDate, name, description, branchId, isOptional, isRecurring, recurringPattern, impactOnLeave } = data;
  const updateData = {};

  if (holidayDate) updateData.holiday_date = new Date(holidayDate);
  if (name) updateData.name = name.trim();
  if (description !== undefined) updateData.description = description || null;
  if (isOptional !== undefined) updateData.is_optional = isOptional;
  if (isRecurring !== undefined) updateData.is_recurring = isRecurring;
  if (recurringPattern !== undefined) {
    if (isRecurring && recurringPattern && !['yearly', 'monthly'].includes(recurringPattern)) {
      throw new AppError('VAL_001', 'Recurring pattern must be yearly or monthly', 400);
    }
    updateData.recurring_pattern = recurringPattern || null;
  }
  if (impactOnLeave !== undefined) {
    if (!['full_day', 'half_day', 'no_deduction'].includes(impactOnLeave)) {
      throw new AppError('VAL_001', 'Invalid impact on leave value', 400);
    }
    updateData.impact_on_leave = impactOnLeave;
  }
  if (branchId !== undefined) {
    if (branchId) {
      const branch = await holidayRepository.findBranchById(orgId, branchId);
      if (!branch) {
        throw new AppError('BRN_001', 'Branch not found', 404);
      }
    }
    updateData.branch_id = branchId || null;
  }

  const updated = await holidayRepository.updateHoliday(orgId, holidayId, updateData);
  return formatHoliday(updated);
};

/**
 * Delete holiday
 */
const deleteHoliday = async (orgId, holidayId, holidayRepository) => {
  const holiday = await holidayRepository.findHolidayById(orgId, holidayId);
  if (!holiday) {
    throw new AppError('HOL_001', 'Holiday not found', 404);
  }

  await holidayRepository.deleteHoliday(orgId, holidayId);
};

const formatHoliday = (holiday) => ({
  id: holiday.id,
  holidayDate: holiday.holiday_date,
  name: holiday.name,
  description: holiday.description,
  branchId: holiday.branch_id,
  isOptional: holiday.is_optional,
  isRecurring: holiday.is_recurring,
  recurringPattern: holiday.recurring_pattern,
  impactOnLeave: holiday.impact_on_leave,
  createdAt: holiday.created_at,
  updatedAt: holiday.updated_at,
});

module.exports = {
  listHolidays,
  createHoliday,
  getHolidayById,
  updateHoliday,
  deleteHoliday,
};