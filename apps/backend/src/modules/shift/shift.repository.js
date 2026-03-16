/**
 * @module shift.repository
 * @description Database operations for shifts.
 * Called by: shift.service
 */
const db = require('../../models/index.js');

const { Shift, Employee } = db;

const findShiftById = async (orgId, shiftId) => {
  return await Shift.findOne({
    where: { id: shiftId, org_id: orgId, deleted_at: null },
  });
};

const listShiftsPaginated = async (orgId, options) => {
  const { offset, limit, search } = options;
  const where = { org_id: orgId, deleted_at: null };

  if (search) {
    where.name = { [db.Sequelize.Op.iLike]: `%${search}%` };
  }

  const { rows: shifts, count: total } = await Shift.findAndCountAll({
    where,
    offset,
    limit,
    order: [['created_at', 'DESC']],
  });

  return { shifts, total };
};

const createShift = async (shiftData) => {
  return await Shift.create(shiftData);
};

const updateShift = async (orgId, shiftId, updateData) => {
  const shift = await Shift.findOne({
    where: { id: shiftId, org_id: orgId, deleted_at: null },
  });
  if (!shift) return null;
  return await shift.update(updateData);
};

const deleteShift = async (orgId, shiftId) => {
  const shift = await Shift.findOne({
    where: { id: shiftId, org_id: orgId, deleted_at: null },
  });
  if (!shift) return null;
  return await shift.destroy();
};

const countEmployeesByShift = async (orgId, shiftId) => {
  return await Employee.count({
    where: { org_id: orgId, shift_id: shiftId, deleted_at: null },
  });
};

module.exports = {
  findShiftById,
  listShiftsPaginated,
  createShift,
  updateShift,
  deleteShift,
  countEmployeesByShift,
};