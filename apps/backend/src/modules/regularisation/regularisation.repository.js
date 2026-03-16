/**
 * @module regularisation.repository
 * @description Database operations for regularisation requests.
 * Called by: regularisation.service
 */
const { models  } = require('../../models/index.js');
const { Op  } = require('sequelize');

/**
 * Find regularisations with pagination and filtering
 */
const findRegularisationsPaginated = async (orgId, options) => {
  const { offset, limit, where, startDate, endDate } = options;

  const dateWhere = {};
  if (startDate) dateWhere.created_at = { [Op.gte]: new Date(startDate) };
  if (endDate) {
    dateWhere.created_at = dateWhere.created_at ? { ...dateWhere.created_at, [Op.lte]: new Date(endDate) } : { [Op.lte]: new Date(endDate) };
  }

  const { rows, count } = await models.Regularisation.findAndCountAll({
    where: { ...where, ...dateWhere },
    offset,
    limit,
    order: [['created_at', 'DESC']],
    include: [
      { model: models.Employee, as: 'employee', attributes: ['id', 'first_name', 'last_name', 'email'] },
      { model: models.Attendance, as: 'attendance', attributes: ['id', 'date', 'total_worked_minutes'] },
    ],
  });

  return {
    regularisations: rows,
    total: count,
  };
};

/**
 * Find regularisation by ID
 */
const findById = async (orgId, id) => {
  return await models.Regularisation.findOne({
    where: { id, org_id: orgId },
    include: [
      { model: models.Employee, as: 'employee', attributes: ['id', 'first_name', 'last_name', 'email'] },
      { model: models.Attendance, as: 'attendance', attributes: ['id', 'date', 'total_worked_minutes'] },
    ],
  });
};

/**
 * Find regularisation by attendance ID
 */
const findByAttendanceId = async (orgId, attendanceId) => {
  return await models.Regularisation.findOne({
    where: { org_id: orgId, attendance_id: attendanceId },
  });
};

/**
 * Create new regularisation
 */
const create = async (orgId, data) => {
  const regularisation = await models.Regularisation.create({
    org_id: orgId,
    ...data,
  });

  return await findById(orgId, regularisation.id);
};

/**
 * Update regularisation
 */
const update = async (orgId, id, data) => {
  await models.Regularisation.update(data, {
    where: { id, org_id: orgId },
  });

  return await findById(orgId, id);
};

/**
 * Delete (soft delete) regularisation
 */
const deleteById = async (orgId, id) => {
  await models.Regularisation.destroy({
    where: { id, org_id: orgId },
  });
};

/**
 * Find attendance by ID
 */
const findAttendanceById = async (orgId, attendanceId) => {
  return await models.Attendance.findOne({
    where: { id: attendanceId, org_id: orgId },
  });
};

/**
 * Find employee by ID
 */
const findEmployeeById = async (orgId, empId) => {
  return await models.Employee.findOne({
    where: { id: empId, org_id: orgId },
  });
};

module.exports = {
  findRegularisationsPaginated,
  findById,
  findByAttendanceId,
  create,
  update,
  deleteById,
  findAttendanceById,
  findEmployeeById,
};