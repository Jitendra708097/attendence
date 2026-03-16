/**
 * @module geofence.service
 * @description Geofencing logic for location validation and attendance.
 * Called by: attendance.service, geofence.controller
 * Calls: geofence.repository
 */
const { AppError  } = require('../../utils/AppError.js');
const { v4: uuidv4 } = require('uuid');

// Utility function from shared-utils
const haversineFromPackage = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * List geofences with pagination and optional filters
 */
const listGeofences = async (orgId, filters, geofenceRepository) => {
  const { page, limit, branchId } = filters;
  const offset = (page - 1) * limit;

  const result = await geofenceRepository.listGeofencesPaginated(orgId, {
    offset,
    limit,
    branchId,
  });

  const totalPages = Math.ceil(result.total / limit);

  return {
    geofences: result.geofences.map(g => formatGeofence(g)),
    pagination: { page, limit, total: result.total, totalPages },
  };
};

/**
 * Create geofence
 */
const createGeofence = async (orgId, data, geofenceRepository) => {
  const { name, branchId, latitude, longitude, radiusMeters, description } = data;

  if (!name || !branchId || latitude === undefined || longitude === undefined || !radiusMeters) {
    throw new AppError('VAL_001', 'name, branchId, latitude, longitude, and radiusMeters are required', 400);
  }

  // Validate coordinates
  if (latitude < -90 || latitude > 90) {
    throw new AppError('VAL_001', 'Latitude must be between -90 and 90', 400);
  }
  if (longitude < -180 || longitude > 180) {
    throw new AppError('VAL_001', 'Longitude must be between -180 and 180', 400);
  }
  if (radiusMeters < 1 || radiusMeters > 10000) {
    throw new AppError('VAL_001', 'Radius must be between 1 and 10000 meters', 400);
  }

  const geofence = await geofenceRepository.createGeofence({
    id: uuidv4(),
    org_id: orgId,
    name: name.trim(),
    branch_id: branchId,
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    radius_meters: parseInt(radiusMeters, 10),
    description: description || null,
  });

  return formatGeofence(geofence);
};

/**
 * Get geofence by ID
 */
const getGeofenceById = async (orgId, geofenceId, geofenceRepository) => {
  const geofence = await geofenceRepository.findGeofenceById(orgId, geofenceId);
  if (!geofence) {
    throw new AppError('GEO_001', 'Geofence not found', 404);
  }
  return formatGeofence(geofence);
};

/**
 * Update geofence
 */
const updateGeofence = async (orgId, geofenceId, data, geofenceRepository) => {
  const geofence = await geofenceRepository.findGeofenceById(orgId, geofenceId);
  if (!geofence) {
    throw new AppError('GEO_001', 'Geofence not found', 404);
  }

  const { name, latitude, longitude, radiusMeters, description } = data;
  const updateData = {};

  if (name !== undefined) {
    updateData.name = name.trim();
  }
  if (latitude !== undefined) {
    if (latitude < -90 || latitude > 90) {
      throw new AppError('VAL_001', 'Latitude must be between -90 and 90', 400);
    }
    updateData.latitude = parseFloat(latitude);
  }
  if (longitude !== undefined) {
    if (longitude < -180 || longitude > 180) {
      throw new AppError('VAL_001', 'Longitude must be between -180 and 180', 400);
    }
    updateData.longitude = parseFloat(longitude);
  }
  if (radiusMeters !== undefined) {
    if (radiusMeters < 1 || radiusMeters > 10000) {
      throw new AppError('VAL_001', 'Radius must be between 1 and 10000 meters', 400);
    }
    updateData.radius_meters = parseInt(radiusMeters, 10);
  }
  if (description !== undefined) {
    updateData.description = description || null;
  }

  const updated = await geofenceRepository.updateGeofence(orgId, geofenceId, updateData);
  return formatGeofence(updated);
};

/**
 * Delete geofence
 */
const deleteGeofence = async (orgId, geofenceId, geofenceRepository) => {
  const geofence = await geofenceRepository.findGeofenceById(orgId, geofenceId);
  if (!geofence) {
    throw new AppError('GEO_001', 'Geofence not found', 404);
  }

  await geofenceRepository.deleteGeofence(orgId, geofenceId);
};

/**
 * Validate if location is within geofence(s)
 * Called by: attendance.service, geofence.controller
 */
const validateLocation = async (orgId, data, geofenceRepository) => {
  const { branchId, latitude, longitude } = data;

  if (latitude === undefined || longitude === undefined) {
    throw new AppError('VAL_001', 'latitude and longitude are required', 400);
  }

  // Validate latitude and longitude are valid numbers
  if (isNaN(latitude) || isNaN(longitude)) {
    throw new AppError('VAL_001', 'latitude and longitude must be valid numbers', 400);
  }

  // Validate latitude range: -90 to 90
  if (latitude < -90 || latitude > 90) {
    throw new AppError('VAL_001', 'latitude must be between -90 and 90', 400);
  }

  // Validate longitude range: -180 to 180
  if (longitude < -180 || longitude > 180) {
    throw new AppError('VAL_001', 'longitude must be between -180 and 180', 400);
  }

  // Get applicable geofences
  let geofences;
  if (branchId) {
    geofences = await geofenceRepository.findGeofencesByBranch(orgId, branchId);
  } else {
    // Get all org geofences if no branch specified
    const result = await geofenceRepository.listGeofencesPaginated(orgId, { offset: 0, limit: 1000 });
    geofences = result.geofences;
  }

  if (!geofences || geofences.length === 0) {
    return {
      withinGeofence: true, // No geofences configured, allow by default
      matchedGeofences: [],
      message: 'No geofences configured',
    };
  }

  // Check if location is within any geofence
  const matchedGeofences = [];
  for (const geofence of geofences) {
    const distance = haversineFromPackage(latitude, longitude, geofence.latitude, geofence.longitude);
    if (distance <= geofence.radius_meters) {
      matchedGeofences.push({
        geofenceId: geofence.id,
        name: geofence.name,
        distance,
      });
    }
  }

  return {
    withinGeofence: matchedGeofences.length > 0,
    matchedGeofences,
    message: matchedGeofences.length > 0 ? 'Location is within geofence' : 'Location is outside geofence',
  };
};

const formatGeofence = (geo) => ({
  id: geo.id,
  name: geo.name,
  branchId: geo.branch_id,
  latitude: geo.latitude,
  longitude: geo.longitude,
  radiusMeters: geo.radius_meters,
  description: geo.description,
  createdAt: geo.created_at,
  updatedAt: geo.updated_at,
});

module.exports = {
  listGeofences,
  createGeofence,
  getGeofenceById,
  updateGeofence,
  deleteGeofence,
  validateLocation,
};