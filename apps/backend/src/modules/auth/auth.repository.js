/**
 * @module auth.repository
 * @description Database operations for authentication (employees, refresh tokens, organisations).
 * CRITICAL: Never use findByPk on tenant-scoped data - always use scoped queries.
 */
const { models } = require('../../models/index.js');
const { scopedModel } = require('../../utils/scopedModel.js');

/**
 * Find employee by email (across all orgs - used during login/signup)
 * Includes password_hash in attributes
 */
const findEmployeeByEmail = async (email) => {
  return models.Employee.findOne({
    where: { email },
    attributes: {
      include: ['password_hash', 'is_active'],
    },
  });
};

/**
 * Find employee by ID within specific org (scoped)
 * NEVER use findByPk - always scope by org_id first
 */
const findEmployeeByIdInOrg = async (empId, orgId) => {
  return models.Employee.findOne({
    where: {
      id: empId,
      org_id: orgId,
    },
    attributes: {
      include: ['password_hash'],
    },
  });
};

/**
 * Get organisation by ID
 */
const getOrganisationById = async (orgId) => {
  return models.Organisation.findByPk(orgId);
};

/**
 * Create organisation
 */
const createOrganisation = async (data) => {
  return models.Organisation.create(data);
};

/**
 * Create employee
 */
const createEmployee = async (data) => {
  return models.Employee.create(data);
};

/**
 * Update employee
 */
const updateEmployee = async (empId, orgId, data) => {
  return models.Employee.update(data, {
    where: { id: empId, org_id: orgId },
  });
};

/**
 * Create refresh token  (STORED AS HASH)
 */
const createRefreshToken = async (data) => {
  return models.RefreshToken.create(data);
};

/**
 * Find active refresh token by employee (simplified - real impl would use token hints)
 */
const findActiveRefreshTokens = async (empId, orgId) => {
  return models.RefreshToken.findAll({
    where: {
      emp_id: empId,
      org_id: orgId,
      status: 'active',
    },
    order: [['created_at', 'DESC']],
  });
};

/**
 * Mark refresh token as 'used' after successful rotation
 */
const markTokenAsUsed = async (tokenId) => {
  return models.RefreshToken.update(
    { status: 'used' },
    { where: { id: tokenId } }
  );
};

/**
 * Revoke ALL refresh tokens for employee (on logout or password change)
 */
const revokeAllRefreshTokens = async (empId, orgId) => {
  return models.RefreshToken.update(
    { status: 'revoked' },
    {
      where: {
        emp_id: empId,
        org_id: orgId,
        status: ['active', 'used'],
      },
    }
  );
};

/**
 * Update refresh token status
 */
const updateRefreshTokenStatus = async (tokenId, status) => {
  return models.RefreshToken.update(
    { status },
    { where: { id: tokenId } }
  );
};

/**
 * Update employee password
 */
const updateEmployeePassword = async (empId, password_hash) => {
  return models.Employee.update(
    { password_hash },
    { where: { id: empId } }
  );
};

/**
 * Get employee profile (without password)
 */
const getEmployeeProfile = async (empId, orgId) => {
  const Employee = scopedModel(models.Employee, orgId);
  return Employee.findByPk(empId, {
    attributes: {
      exclude: ['password_hash'],
    },
    include: [
      { model: models.Organisation, as: 'organisation', attributes: ['id', 'name', 'plan', 'timezone'] },
      { model: models.Branch, as: 'branch', attributes: ['id', 'name', 'city'] },
      { model: models.Shift, as: 'shift', attributes: ['id', 'name'] },
    ],
  });
};

module.exports = {
  findEmployeeByEmail,
  findEmployeeByIdInOrg,
  getOrganisationById,
  createOrganisation,
  createEmployee,
  updateEmployee,
  createRefreshToken,
  findActiveRefreshTokens,
  markTokenAsUsed,
  revokeAllRefreshTokens,
  updateRefreshTokenStatus,
  updateEmployeePassword,
  getEmployeeProfile,
};
