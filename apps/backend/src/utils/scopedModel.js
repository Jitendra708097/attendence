/**
 * @module scopedModel
 * @description Returns a Sequelize model scoped to a specific organisation.
 * ALWAYS use this instead of raw model on tenant data.
 * CRITICAL: Never call findByPk() on scoped models - always use findOne with org_id check.
 * 
 * Usage: const Employee = scopedModel(models.Employee, req.org_id)
 *        const emp = await Employee.findOne({ where: { id: empId } })
 */

const scopedModel = (Model, orgId) => {
  return {
    findAll: (options = {}) =>
      Model.findAll({
        ...options,
        where: {
          org_id: orgId,
          ...(options.where || {}),
        },
      }),

    findOne: (options = {}) =>
      Model.findOne({
        ...options,
        where: {
          org_id: orgId,
          ...(options.where || {}),
        },
      }),

    create: (values, options = {}) =>
      Model.create({ ...values, org_id: orgId }, options),

    update: (values, options = {}) =>
      Model.update(values, {
        ...options,
        where: {
          org_id: orgId,
          ...(options.where || {}),
        },
      }),

    count: (options = {}) =>
      Model.count({
        ...options,
        where: {
          org_id: orgId,
          ...(options.where || {}),
        },
      }),

    destroy: (options = {}) =>
      Model.destroy({
        ...options,
        where: {
          org_id: orgId,
          ...(options.where || {}),
        },
      }),
  };
};

module.exports = { scopedModel };
