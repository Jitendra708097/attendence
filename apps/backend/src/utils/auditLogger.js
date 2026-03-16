/**
 * @module auditLogger
 * @description Audit logging utility for tracking changes.
 */
const logger = require('./logger.js');
const { models } = require('../models/index.js');

/**
 * Log an audit event
 * @param {object} req - Express request
 * @param {string} action - Action performed (e.g., 'CREATE_EMPLOYEE')
 * @param {string} resourceType - Resource affected (e.g., 'Employee')
 * @param {string} resourceId - ID of affected resource
 * @param {object} changes - What changed (before/after)
 * @param {boolean} success - Operation success
 * @param {string|null} impersonatedBy - If superadmin impersonating
 */
const logAudit = async (req, action, resourceType, resourceId, changes = {}, success = true, impersonatedBy = null) => {
  try {
    // Validate required request fields
    if (!req.org_id) {
      logger.warn('Audit log missing org_id', { action, resourceType, resourceId });
      return;
    }

    if (!req.user?.empId) {
      logger.warn('Audit log missing user context', { action, resourceType, resourceId, org_id: req.org_id });
    }

    await models.AuditLog.create({
      org_id: req.org_id,
      emp_id: req.user?.empId || null,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      changes,
      success,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
      impersonated_by: impersonatedBy,
    });
  } catch (err) {
    logger.error('Audit log creation failed', {
      error: err.message,
      action,
      resourceType,
      resourceId,
    });
  }
};

module.exports = { logAudit };
