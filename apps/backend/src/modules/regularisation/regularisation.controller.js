/**
 * @module regularisation.controller
 * @description Handles regularisation requests for attendance corrections.
 */
const regService = require('./regularisation.service.js');
const regRepository = require('./regularisation.repository.js');
const { AppError  } = require('../../utils/AppError.js');
const { logAudit  } = require('../../utils/auditLogger.js');

/**
 * GET /api/v1/regularisations
 * List all regularisations with pagination and filters
 */
const listRegularisations = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const userId = req.user.id;
    const userRole = req.user.role;
    const { page = 1, limit = 20, status, issueType, empId, startDate, endDate } = req.query;

    const result = await regService.listRegularisations(orgId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      status,
      issueType,
      empId: userRole === 'admin' ? empId : userId,
      startDate,
      endDate,
      isAdmin: userRole === 'admin',
      userId,
    }, regRepository);

    res.status(200).json({
      success: true,
      message: 'Regularisations retrieved',
      data: {
        regularisations: result.regularisations,
        pagination: result.pagination,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/regularisations
 * Create a new regularisation request
 */
const createRegularisation = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const empId = req.user.id;
    const { attendanceId, issueType, evidenceType, evidenceUrl, reason } = req.body;

    const regularisation = await regService.createRegularisation(
      orgId,
      empId,
      {
        attendanceId,
        issueType,
        evidenceType,
        evidenceUrl,
        reason,
      },
      regRepository
    );

    await logAudit(req, 'REGULARISATION_CREATED', 'Regularisation', regularisation.id, {
      attendanceId,
      issueType,
    });

    res.status(201).json({
      success: true,
      message: 'Regularisation request created',
      data: regularisation,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/regularisations/:id
 * Get regularisation details
 */
const getRegularisationById = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const userId = req.user.id;
    const userRole = req.user.role;
    const { id } = req.params;

    const regularisation = await regService.getRegularisationById(
      orgId,
      id,
      userId,
      userRole,
      regRepository
    );

    res.status(200).json({
      success: true,
      message: 'Regularisation retrieved',
      data: regularisation,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/regularisations/:id
 * Update regularisation (before any approval)
 */
const updateRegularisation = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const empId = req.user.id;
    const { id } = req.params;
    const { issueType, evidenceType, evidenceUrl, reason } = req.body;

    const regularisation = await regService.updateRegularisation(
      orgId,
      empId,
      id,
      {
        issueType,
        evidenceType,
        evidenceUrl,
        reason,
      },
      regRepository
    );

    await logAudit(req, 'REGULARISATION_UPDATED', 'Regularisation', id, {
      issueType,
    });

    res.status(200).json({
      success: true,
      message: 'Regularisation updated',
      data: regularisation,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/regularisations/:id
 * Delete regularisation (before any approval)
 */
const deleteRegularisation = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const empId = req.user.id;
    const { id } = req.params;

    await regService.deleteRegularisation(orgId, empId, id, regRepository);

    await logAudit(req, 'REGULARISATION_DELETED', 'Regularisation', id, {});

    res.status(200).json({
      success: true,
      message: 'Regularisation deleted',
      data: null,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/regularisations/:id/approve
 * Manager or admin approves regularisation
 */
const approveRegularisation = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const approverId = req.user.id;
    const { id } = req.params;
    const { approvalNotes } = req.body;

    const regularisation = await regService.approveRegularisation(
      orgId,
      approverId,
      id,
      approvalNotes,
      regRepository
    );

    await logAudit(req, 'REGULARISATION_APPROVED', 'Regularisation', id, {
      status: regularisation.status,
    });

    res.status(200).json({
      success: true,
      message: 'Regularisation approved',
      data: regularisation,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/regularisations/:id/reject
 * Manager or admin rejects regularisation
 */
const rejectRegularisation = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const rejecterId = req.user.id;
    const { id } = req.params;
    const { rejectionReason } = req.body;

    const regularisation = await regService.rejectRegularisation(
      orgId,
      rejecterId,
      id,
      rejectionReason,
      regRepository
    );

    await logAudit(req, 'REGULARISATION_REJECTED', 'Regularisation', id, {
      status: regularisation.status,
    });

    res.status(200).json({
      success: true,
      message: 'Regularisation rejected',
      data: regularisation,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listRegularisations,
  createRegularisation,
  getRegularisationById,
  updateRegularisation,
  deleteRegularisation,
  approveRegularisation,
  rejectRegularisation,
};