/**
 * @module geofence.controller
 * @description Handles geofence CRUD operations.
 */
const geofenceService = require('./geofence.service.js');
const geofenceRepository = require('./geofence.repository.js');
const { logAudit  } = require('../../utils/auditLogger.js');

/**
 * GET /api/v1/geofences
 * List all geofences for organization
 */
const listGeofences = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const { page = 1, limit = 20, branchId } = req.query;

    const result = await geofenceService.listGeofences(orgId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      branchId,
    }, geofenceRepository);

    res.status(200).json({
      success: true,
      message: 'Geofences retrieved',
      data: {
        geofences: result.geofences,
        pagination: result.pagination,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/geofences
 * Create new geofence
 */
const createGeofence = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const { name, branchId, latitude, longitude, radiusMeters, description } = req.body;

    const geofence = await geofenceService.createGeofence(orgId, {
      name,
      branchId,
      latitude,
      longitude,
      radiusMeters,
      description,
    }, geofenceRepository);

    await logAudit(req, 'GEOFENCE_CREATED', 'Geofence', geofence.id, { name });

    res.status(201).json({
      success: true,
      message: 'Geofence created successfully',
      data: geofence,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/geofences/:id
 * Get single geofence by ID
 */
const getGeofenceById = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const { id } = req.params;

    const geofence = await geofenceService.getGeofenceById(orgId, id, geofenceRepository);

    res.status(200).json({
      success: true,
      message: 'Geofence retrieved',
      data: geofence,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/geofences/:id
 * Update geofence
 */
const updateGeofence = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const { id } = req.params;
    const { name, latitude, longitude, radiusMeters, description } = req.body;

    const geofence = await geofenceService.updateGeofence(orgId, id, {
      name,
      latitude,
      longitude,
      radiusMeters,
      description,
    }, geofenceRepository);

    await logAudit(req, 'GEOFENCE_UPDATED', 'Geofence', id, { name });

    res.status(200).json({
      success: true,
      message: 'Geofence updated successfully',
      data: geofence,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/geofences/:id
 * Delete geofence
 */
const deleteGeofence = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const { id } = req.params;

    await geofenceService.deleteGeofence(orgId, id, geofenceRepository);

    await logAudit(req, 'GEOFENCE_DELETED', 'Geofence', id, {});

    res.status(200).json({
      success: true,
      message: 'Geofence deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/geofences/validate-location
 * Validate if location is within any geofence
 */
const validateLocation = async (req, res, next) => {
  try {
    const orgId = req.org_id;
    const { branchId, latitude, longitude } = req.body;

    const validation = await geofenceService.validateLocation(
      orgId,
      { branchId, latitude, longitude },
      geofenceRepository
    );

    res.status(200).json({
      success: true,
      message: 'Location validated',
      data: validation,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listGeofences,
  createGeofence,
  getGeofenceById,
  updateGeofence,
  deleteGeofence,
  validateLocation,
};