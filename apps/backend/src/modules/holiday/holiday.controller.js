/**
 * @module holiday.controller
 * @description Handles holiday management operations.
 */
const holidayService = require('./holiday.service.js');
const holidayRepository = require('./holiday.repository.js');
const { logAudit  } = require('../../utils/auditLogger.js');

/**
 * GET /api/v1/holidays
 * List all holidays with pagination and optional filters
 */
const listHolidays = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const { page = 1, limit = 20, branchId, year, month } = req.query;

    const result = await holidayService.listHolidays(orgId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      branchId,
      year: year ? parseInt(year, 10) : null,
      month: month ? parseInt(month, 10) : null,
    }, holidayRepository);

    res.status(200).json({
      success: true,
      message: 'Holidays retrieved',
      data: {
        holidays: result.holidays,
        pagination: result.pagination,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/holidays
 * Create new holiday
 */
const createHoliday = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const { holidayDate, name, description, branchId, isOptional, isRecurring, recurringPattern, impactOnLeave } = req.body;

    const holiday = await holidayService.createHoliday(orgId, {
      holidayDate,
      name,
      description,
      branchId,
      isOptional,
      isRecurring,
      recurringPattern,
      impactOnLeave,
    }, holidayRepository);

    await logAudit(req, 'HOLIDAY_CREATED', 'Holiday', holiday.id, { name, date: holidayDate });

    res.status(201).json({
      success: true,
      message: 'Holiday created successfully',
      data: holiday,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/holidays/:id
 * Get single holiday by ID
 */
const getHolidayById = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const { id } = req.params;

    const holiday = await holidayService.getHolidayById(orgId, id, holidayRepository);

    res.status(200).json({
      success: true,
      message: 'Holiday retrieved',
      data: holiday,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/holidays/:id
 * Update holiday
 */
const updateHoliday = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const { id } = req.params;
    const { holidayDate, name, description, branchId, isOptional, isRecurring, recurringPattern, impactOnLeave } = req.body;

    const holiday = await holidayService.updateHoliday(orgId, id, {
      holidayDate,
      name,
      description,
      branchId,
      isOptional,
      isRecurring,
      recurringPattern,
      impactOnLeave,
    }, holidayRepository);

    await logAudit(req, 'HOLIDAY_UPDATED', 'Holiday', id, { name });

    res.status(200).json({
      success: true,
      message: 'Holiday updated successfully',
      data: holiday,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/holidays/:id
 * Delete holiday
 */
const deleteHoliday = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const { id } = req.params;

    await holidayService.deleteHoliday(orgId, id, holidayRepository);

    await logAudit(req, 'HOLIDAY_DELETED', 'Holiday', id, {});

    res.status(200).json({
      success: true,
      message: 'Holiday deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listHolidays,
  createHoliday,
  getHolidayById,
  updateHoliday,
  deleteHoliday,
};