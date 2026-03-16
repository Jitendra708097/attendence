/**
 * @module geofence.service
 * @description Geofencing service for location-based attendance validation.
 * Critical for: Check-in location validation
 * Called by: attendance.service (check-in), geofence.controller
 * 
 * ALGORITHMS:
 *   1. Ray Casting: O(n) polygon containment check ($0 per check-in)
 *   2. Haversine: Fallback radius check (200m default)
 *   3. Mock Location Detection: 4-layer security
 *
 * LOCATION VALIDATION FLOW:
 *   1. Validate GPS accuracy (<100m, >-100m altitude)
 *   2. Detect mock locations (speed >83m/s, unrealistic altitude)
 *   3. Check polygon (if exists) or radius fallback
 *   4. Flag anomalies for manual review
 */

const { AppError } = require('../../utils/AppError.js');
const { scopedModel } = require('../../utils/scopedModel.js');
const { models } = require('../../models/index.js');

/**
 * HAVERSINE DISTANCE - Calculate great-circle distance between two points
 * Used as fallback when geofence polygon is not defined
 * 
 * @param {number} lat1 - Employee latitude
 * @param {number} lng1 - Employee longitude
 * @param {number} lat2 - Branch center latitude
 * @param {number} lng2 - Branch center longitude
 * @returns {number} Distance in meters
 */
const calculateHaversine = (lat1, lng1, lat2, lng2) => {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lng2 - lng1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * RAY CASTING ALGORITHM - Check if point is inside polygon
 * Time complexity: O(n) where n = number of polygon vertices
 * Space complexity: O(1)
 * 
 * Algorithm:
 *   Cast a ray from point to infinity (east direction)
 *   Count intersections with polygon edges
 *   If odd: point is inside, if even: point is outside
 * 
 * @param {{ lat: number, lng: number }} point - Employee location
 * @param {Array<{lat: number, lng: number}>} polygon - Geofence vertices
 * @returns {boolean} true if point is inside polygon
 */
const isInsidePolygon = (point, polygon) => {
  if (!polygon || polygon.length < 3) {
    return false;
  }

  const { lat: px, lng: py } = point;
  let inside = false;
  const n = polygon.length;

  // Ray casting: cast ray east and count edge intersections
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].lat;
    const yi = polygon[i].lng;
    const xj = polygon[j].lat;
    const yj = polygon[j].lng;

    // Check if ray crosses this edge
    const intersect =
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;

    if (intersect) {
      inside = !inside; // Toggle inside flag
    }
  }

  return inside;
};

/**
 * MOCK LOCATION DETECTION - 4-Layer Security Check
 * Detects GPS spoofing and unrealistic data
 * 
 * Layer 1: Accuracy check (>100m = poor quality)
 * Layer 2: Altitude check (<-100m = invalid)
 * Layer 3: Speed check (>83.3 m/s = 300 km/h, unrealistic)
 * Layer 4: Altitude jump check (>100m in 1 minute = suspicious)
 * 
 * @param {object} location - { lat, lng, accuracy, altitude, speed, timestamp }
 * @param {object} previousLocation - Last known location for speed check
 * @returns {object} { isMocked, layers: { accuracy, altitude, speed, jump } }
 */
const detectMockLocation = (location, previousLocation = null) => {
  const result = {
    isMocked: false,
    layers: {
      accuracy: false,
      altitude: false,
      speed: false,
      altitudeJump: false,
    },
  };

  const { accuracy, altitude, speed, timestamp } = location;

  // Layer 1: Accuracy check (>100m indicates GPS noise)
  if (accuracy > 100) {
    result.layers.accuracy = true;
    result.isMocked = true; // Flag as anomaly (not necessarily mock)
  }

  // Layer 2: Altitude check (<-100m is impossible on land)
  if (altitude !== undefined && altitude < -100) {
    result.layers.altitude = true;
    result.isMocked = true;
  }

  // Layer 3: Speed check (>83.3 m/s = 300 km/h)
  if (speed !== undefined && speed > 83.3) {
    result.layers.speed = true;
    result.isMocked = true;
  }

  // Layer 4: Altitude jump check (if previous location available)
  if (previousLocation && altitude !== undefined && previousLocation.altitude !== undefined) {
    const altitudeDelta = Math.abs(altitude - previousLocation.altitude);
    const timeDelta = (timestamp - previousLocation.timestamp) / 1000; // seconds

    // >100m change in <1 minute = suspicious
    if (timeDelta > 0 && altitudeDelta > 100 && timeDelta < 60) {
      result.layers.altitudeJump = true;
      result.isMocked = true;
    }
  }

  return result;
};

/**
 * MAIN LOCATION VALIDATION FUNCTION
 * Called during check-in to validate employee is at correct branch
 * 
 * Step 1: Detect mock locations (returns error for definite spoofing)
 * Step 2: Check polygon if exists, otherwise radius fallback
 * Step 3: Return validation result with anomaly flag
 * 
 * @param {object} empLocation - Employee's GPS location
 * @param {object} branch - Branch record with geo_fence_polygons
 * @returns {object} { valid, code, isAnomaly, method, distance }
 * @throws {AppError} GEO_001 (outside), GEO_002 (accuracy), GEO_003 (mocked)
 */
const validateLocation = async (empLocation, branch) => {
  if (!branch) {
    throw new AppError('GEN_001', 'Branch not found', 404);
  }

  const { lat, lng, accuracy, altitude, speed, timestamp } = empLocation;

  // Step 1: Validate basic location data
  if (lat === undefined || lng === undefined) {
    throw new AppError('GEO_004', 'GPS unavailable', 400);
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new AppError('VAL_003', 'Invalid GPS coordinates', 400);
  }

  // Step 2: Detect mock locations
  const mockDetection = detectMockLocation(empLocation);

  if (mockDetection.layers.speed || mockDetection.layers.altitude) {
    // Definite mock detection
    throw new AppError('GEO_003', 'Mock location detected', 403);
  }

  // Step 3: Check if inside geofence (polygon or radius)
  let insideFence = false;
  let distance = null;
  let method = 'none';

  const point = { lat, lng };

  // Polygon check (polygon takes priority if defined)
  if (branch.geo_fence_polygons && Array.isArray(branch.geo_fence_polygons) && branch.geo_fence_polygons.length >= 3) {
    insideFence = isInsidePolygon(point, branch.geo_fence_polygons);
    method = 'polygon';
  } else {
    // Radius fallback (Haversine)
    const fallbackRadius = branch.fallback_radius_meters || 200; // 200m default
    const centerLat = branch.latitude || 0;
    const centerLng = branch.longitude || 0;

    distance = calculateHaversine(lat, lng, centerLat, centerLng);
    insideFence = distance <= fallbackRadius;
    method = 'radius';
  }

  if (!insideFence) {
    throw new AppError('GEO_001', 'Outside geofence', 403);
  }

  // Step 4: Flag anomalies for audit
  const isAnomaly = mockDetection.layers.accuracy || mockDetection.isMocked;

  return {
    valid: true,
    isAnomaly,
    method,
    distance,
    accuracy: mockDetection.layers.accuracy ? 'poor' : 'good',
  };
};

/**
 * GET BRANCH GEOFENCE - Fetch geofence polygon and settings
 * Used during check-in to get branch location config
 */
const getBranchGeofence = async (orgId, branchId) => {
  const branchModel = scopedModel(models.Branch, orgId);

  const branch = await branchModel.findOne({
    where: { id: branchId },
    attributes: ['id', 'name', 'geo_fence_polygons', 'fallback_radius_meters', 'latitude', 'longitude'],
  });

  if (!branch) {
    throw new AppError('GEN_001', 'Branch not found', 404);
  }

  return {
    branchId: branch.id,
    name: branch.name,
    polygon: branch.geo_fence_polygons,
    fallbackRadius: branch.fallback_radius_meters || 200,
  };
};

/**
 * UPDATE GEOFENCE POLYGON - Admin endpoint to draw/update polygon
 */
const updateGeofencePolygon = async (orgId, branchId, polygon) => {
  if (!Array.isArray(polygon) || polygon.length < 3) {
    throw new AppError('VAL_001', 'Polygon must have at least 3 points', 400);
  }

  // Validate polygon points
  for (const point of polygon) {
    if (point.lat < -90 || point.lat > 90 || point.lng < -180 || point.lng > 180) {
      throw new AppError('VAL_003', 'Invalid polygon coordinates', 400);
    }
  }

  const branchModel = scopedModel(models.Branch, orgId);

  await branchModel.update(
    { geo_fence_polygons: polygon },
    { where: { id: branchId } }
  );

  return { success: true, pointsCount: polygon.length };
};

/**
 * SET FALLBACK RADIUS - Admin endpoint to set radius for branches without polygon
 */
const setFallbackRadius = async (orgId, branchId, radiusMeters) => {
  if (radiusMeters < 50 || radiusMeters > 5000) {
    throw new AppError('VAL_001', 'Radius must be 50-5000 meters', 400);
  }

  const branchModel = scopedModel(models.Branch, orgId);

  await branchModel.update(
    { fallback_radius_meters: radiusMeters },
    { where: { id: branchId } }
  );

  return { success: true, radiusMeters };
};

module.exports = {
  calculateHaversine,
  isInsidePolygon,
  detectMockLocation,
  validateLocation,
  getBranchGeofence,
  updateGeofencePolygon,
  setFallbackRadius,
};