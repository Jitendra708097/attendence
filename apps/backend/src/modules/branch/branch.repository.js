/**
 * @module branch.repository
 * @description Database operations for branches.
 * Called by: branch.service
 */
const db = require('../../models/index.js');

const { Branch, Employee } = db;

const findBranchById = async (orgId, branchId) => {
  return await Branch.findOne({
    where: { id: branchId, org_id: orgId, deleted_at: null },
  });
};

const listBranchesPaginated = async (orgId, options) => {
  const { offset, limit, search } = options;
  const where = { org_id: orgId, deleted_at: null };

  if (search) {
    where[db.Sequelize.Op.or] = [
      { name: { [db.Sequelize.Op.iLike]: `%${search}%` } },
      { city: { [db.Sequelize.Op.iLike]: `%${search}%` } },
    ];
  }

  const { rows: branches, count: total } = await Branch.findAndCountAll({
    where,
    offset,
    limit,
    order: [['created_at', 'DESC']],
  });

  return { branches, total };
};

const createBranch = async (branchData) => {
  return await Branch.create(branchData);
};

const updateBranch = async (orgId, branchId, updateData) => {
  const branch = await Branch.findOne({
    where: { id: branchId, org_id: orgId, deleted_at: null },
  });
  if (!branch) return null;
  return await branch.update(updateData);
};

const deleteBranch = async (orgId, branchId) => {
  const branch = await Branch.findOne({
    where: { id: branchId, org_id: orgId, deleted_at: null },
  });
  if (!branch) return null;
  return await branch.destroy();
};

const countEmployeesByBranch = async (orgId, branchId) => {
  return await Employee.count({
    where: { org_id: orgId, branch_id: branchId, deleted_at: null },
  });
};

module.exports = {
  findBranchById,
  listBranchesPaginated,
  createBranch,
  updateBranch,
  deleteBranch,
  countEmployeesByBranch,
};