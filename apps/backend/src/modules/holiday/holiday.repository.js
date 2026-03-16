/**
 * @module holiday.repository
 * @description Database operations for holidays.
 * Called by: holiday.service
 */
const db = require('../../models/index.js');

const { Holiday, Branch } = db;

/**
 * Find holiday by ID within organisation
 */
const findHolidayById = async (orgId, holidayId) => {
  return await Holiday.findOne({
    where: { id: holidayId, org_id: orgId, deleted_at: null },
  });
};

/**
 * List holidays with pagination and optional filters
 */
const listHolidaysPaginated = async (orgId, options) => {
  const { offset, limit, branchId, year, month } = options;

  const where = { org_id: orgId, deleted_at: null };

  if (branchId) {
    where.branch_id = branchId;
  }

  if (year || month) {
    const startDate = new Date(year || new Date().getFullYear(), month ? month - 1 : 0, 1);
    const endDate = month
      ? new Date(year || new Date().getFullYear(), month, 0)
      : new Date(year || new Date().getFullYear(), 11, 31);

    where.holiday_date = {
      [db.Sequelize.Op.between]: [startDate, endDate],
    };
  }

  const { count, rows } = await Holiday.findAndCountAll({
    where,
    offset,
    limit,
    order: [['holiday_date', 'ASC']],
  });

  return {
    holidays: rows,
    total: count,
  };
};

/**
 * Create holiday
 */
const createHoliday = async (data) => {
  return await Holiday.create(data);
};

/**
 * Update holiday
 */
const updateHoliday = async (orgId, holidayId, data) => {
  const result = await Holiday.update(data, {
    where: { id: holidayId, org_id: orgId },
    returning: true,
  });
  return result[1][0] || null;
};

/**
 * Delete holiday (soft delete via paranoid)
 */
const deleteHoliday = async (orgId, holidayId) => {
  return await Holiday.destroy({
    where: { id: holidayId, org_id: orgId },
  });
};

/**
 * Find branch by ID within organisation
 */
const findBranchById = async (orgId, branchId) => {
  return await Branch.findOne({
    where: { id: branchId, org_id: orgId, deleted_at: null },
  });
};

module.exports = {
  findHolidayById,
  listHolidaysPaginated,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  findBranchById,
};