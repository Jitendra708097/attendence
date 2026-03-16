/**
 * @module shift.controller
 * @description Handles shift CRUD operations.
 */
const shiftService = require('./shift.service.js');
const shiftRepository = require('./shift.repository.js');
const { logAudit } = {};  // TODO: Implement audit logging

const listShifts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const result = await shiftService.listShifts(req.org_id, {
      page: parseInt(page),
      limit: parseInt(limit),
      search,
    }, shiftRepository);
    res.status(200).json({
      success: true,
      message: 'Shifts fetched',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const createShift = async (req, res, next) => {
  try {
    const shift = await shiftService.createShift(req.org_id, req.body, shiftRepository);
    logAudit(req, 'CREATE', 'Shift', shift.id, { name: shift.name });
    res.status(201).json({
      success: true,
      message: 'Shift created',
      data: shift,
    });
  } catch (err) {
    next(err);
  }
};

const getShiftById = async (req, res, next) => {
  try {
    const shift = await shiftService.getShiftById(req.org_id, req.params.id, shiftRepository);
    res.status(200).json({
      success: true,
      message: 'Shift fetched',
      data: shift,
    });
  } catch (err) {
    next(err);
  }
};

const updateShift = async (req, res, next) => {
  try {
    const shift = await shiftService.updateShift(req.org_id, req.params.id, req.body, shiftRepository);
    logAudit(req, 'UPDATE', 'Shift', req.params.id, { changes: Object.keys(req.body) });
    res.status(200).json({
      success: true,
      message: 'Shift updated',
      data: shift,
    });
  } catch (err) {
    next(err);
  }
};

const deleteShift = async (req, res, next) => {
  try {
    await shiftService.deleteShift(req.org_id, req.params.id, shiftRepository);
    logAudit(req, 'DELETE', 'Shift', req.params.id, {});
    res.status(200).json({
      success: true,
      message: 'Shift deleted',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listShifts,
  createShift,
  getShiftById,
  updateShift,
  deleteShift,
};