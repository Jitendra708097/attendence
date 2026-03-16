/**
 * @module tests/geofence.test
 * @description Test suite for geofencing algorithms and location validation
 * Tests: Ray Casting, Haversine, mock location detection, 4-layer validation
 */

// Import geofence service algorithms
// Note: We'll need to extract and test the algorithms independently

/**
 * HAVERSINE DISTANCE TEST
 * Distance formula between two geo coordinates
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
 * RAY CASTING TEST
 * Point-in-polygon detection
 */
const isInsidePolygon = (point, polygon) => {
  if (!polygon || polygon.length < 3) {
    return false;
  }

  const { lat: px, lng: py } = point;
  let inside = false;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].lat;
    const yi = polygon[i].lng;
    const xj = polygon[j].lat;
    const yj = polygon[j].lng;

    const intersect =
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
};

/**
 * MOCK LOCATION DETECTION TEST
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

  if (accuracy > 100) {
    result.layers.accuracy = true;
    result.isMocked = true;
  }

  if (altitude !== undefined && altitude < -100) {
    result.layers.altitude = true;
    result.isMocked = true;
  }

  if (speed !== undefined && speed > 83.3) {
    result.layers.speed = true;
    result.isMocked = true;
  }

  if (previousLocation && altitude !== undefined && previousLocation.altitude !== undefined) {
    const altitudeDelta = Math.abs(altitude - previousLocation.altitude);
    const timeDelta = (timestamp - previousLocation.timestamp) / 1000;

    if (timeDelta > 0 && altitudeDelta > 100 && timeDelta < 60) {
      result.layers.altitudeJump = true;
      result.isMocked = true;
    }
  }

  return result;
};

// ============================================
// TEST CASES
// ============================================

console.log('🧪 GEOFENCE TEST SUITE\n');
console.log('═'.repeat(60));

// TEST 1: Haversine - Known Distance
console.log('\n✅ TEST 1: Haversine Distance (Known Distance)');
const branchLat = 28.6139;  // Delhi, India
const branchLng = 77.2090;
const empLat = 28.6142;     // ~300m away
const empLng = 77.2120;
const distance = calculateHaversine(branchLat, branchLng, empLat, empLng);
console.log(`   Branch: (${branchLat}, ${branchLng})`);
console.log(`   Employee: (${empLat}, ${empLng})`);
console.log(`   Distance: ${Math.round(distance)}m`);
console.log(`   ✓ Expected ~300m: ${distance > 250 && distance < 400 ? 'PASS' : 'FAIL'}`);

// TEST 2: Haversine - Same Location (0 distance)
console.log('\n✅ TEST 2: Haversine - Same Location');
const sameLoc = calculateHaversine(28.6139, 77.2090, 28.6139, 77.2090);
console.log(`   Distance: ${Math.round(sameLoc)}m`);
console.log(`   ✓ Expected ~0m: ${sameLoc < 1 ? 'PASS' : 'FAIL'}`);

// TEST 3: Haversine - 200m threshold
console.log('\n✅ TEST 3: Haversine - Within 200m Radius');
const latDelta = 0.0018; // ~200m at equator
const testDist = calculateHaversine(28.6139, 77.2090, 28.6139 + latDelta, 77.2090);
console.log(`   Distance: ${Math.round(testDist)}m`);
console.log(`   ✓ Expected ~200m: ${testDist > 150 && testDist < 250 ? 'PASS' : 'FAIL'}`);

// TEST 4: Ray Casting - Point Inside Square Polygon
console.log('\n✅ TEST 4: Ray Casting - Point Inside Polygon');
const squarePolygon = [
  { lat: 0, lng: 0 },
  { lat: 0, lng: 10 },
  { lat: 10, lng: 10 },
  { lat: 10, lng: 0 },
];
const pointInside = { lat: 5, lng: 5 };
const inside = isInsidePolygon(pointInside, squarePolygon);
console.log(`   Point: (${pointInside.lat}, ${pointInside.lng})`);
console.log(`   Polygon: Square (0,0) to (10,10)`);
console.log(`   Result: ${inside ? 'INSIDE' : 'OUTSIDE'}`);
console.log(`   ✓ Expected INSIDE: ${inside ? 'PASS' : 'FAIL'}`);

// TEST 5: Ray Casting - Point Outside Square Polygon
console.log('\n✅ TEST 5: Ray Casting - Point Outside Polygon');
const pointOutside = { lat: 15, lng: 15 };
const outside = isInsidePolygon(pointOutside, squarePolygon);
console.log(`   Point: (${pointOutside.lat}, ${pointOutside.lng})`);
console.log(`   Result: ${outside ? 'INSIDE' : 'OUTSIDE'}`);
console.log(`   ✓ Expected OUTSIDE: ${!outside ? 'PASS' : 'FAIL'}`);

// TEST 6: Ray Casting - Point on Edge (Edge Case)
console.log('\n✅ TEST 6: Ray Casting - Point on Edge');
const pointEdge = { lat: 5, lng: 0 };
const onEdge = isInsidePolygon(pointEdge, squarePolygon);
console.log(`   Point on edge: (${pointEdge.lat}, ${pointEdge.lng})`);
console.log(`   Result: ${onEdge ? 'INSIDE' : 'OUTSIDE'}`);
console.log(`   ℹ️  Edge cases are implementation-dependent`);

// TEST 7: Ray Casting - Less than 3 points (Invalid Polygon)
console.log('\n✅ TEST 7: Ray Casting - Invalid Polygon (<3 points)');
const invalidPolygon = [{ lat: 0, lng: 0 }, { lat: 1, lng: 1 }];
const invalid = isInsidePolygon(pointInside, invalidPolygon);
console.log(`   Result: ${invalid ? 'INSIDE' : 'OUTSIDE'}`);
console.log(`   ✓ Expected OUTSIDE (invalid polygon): ${!invalid ? 'PASS' : 'FAIL'}`);

// TEST 8: Mock Location - High Accuracy (Good GPS)
console.log('\n✅ TEST 8: Mock Location Detection - Good Accuracy');
const goodLocation = {
  lat: 28.6139,
  lng: 77.2090,
  accuracy: 10, // <100m = good
  altitude: 250,
  speed: 5, // <83.3 = reasonable
  timestamp: Date.now(),
};
const mockCheck1 = detectMockLocation(goodLocation);
console.log(`   Accuracy: ${goodLocation.accuracy}m (threshold: 100m)`);
console.log(`   Speed: ${goodLocation.speed} m/s (threshold: 83.3 m/s)`);
console.log(`   Altitude: ${goodLocation.altitude}m (threshold: -100m)`);
console.log(`   Mocked: ${mockCheck1.isMocked}`);
console.log(`   ✓ Expected NOT mocked: ${!mockCheck1.isMocked ? 'PASS' : 'FAIL'}`);

// TEST 9: Mock Location - Poor Accuracy (High Error)
console.log('\n✅ TEST 9: Mock Location Detection - Poor Accuracy');
const poorLocation = {
  lat: 28.6139,
  lng: 77.2090,
  accuracy: 150, // >100m = poor
  altitude: 250,
  speed: 5,
  timestamp: Date.now(),
};
const mockCheck2 = detectMockLocation(poorLocation);
console.log(`   Accuracy: ${poorLocation.accuracy}m (threshold: 100m)`);
console.log(`   Mocked: ${mockCheck2.isMocked}`);
console.log(`   Layers triggered: ${Object.keys(mockCheck2.layers).filter(k => mockCheck2.layers[k]).join(', ')}`);
console.log(`   ✓ Expected accuracy flag: ${mockCheck2.layers.accuracy ? 'PASS' : 'FAIL'}`);

// TEST 10: Mock Location - Unrealistic Speed
console.log('\n✅ TEST 10: Mock Location Detection - Unrealistic Speed');
const fastLocation = {
  lat: 28.6139,
  lng: 77.2090,
  accuracy: 10,
  altitude: 250,
  speed: 300, // 300 m/s = 1080 km/h (unrealistic)
  timestamp: Date.now(),
};
const mockCheck3 = detectMockLocation(fastLocation);
console.log(`   Speed: ${fastLocation.speed} m/s (threshold: 83.3 m/s)`);
console.log(`   Equivalent: ${(fastLocation.speed * 3.6).toFixed(1)} km/h`);
console.log(`   Mocked: ${mockCheck3.isMocked}`);
console.log(`   ✓ Expected mocked: ${mockCheck3.isMocked ? 'PASS' : 'FAIL'}`);

// TEST 11: Mock Location - Invalid Altitude
console.log('\n✅ TEST 11: Mock Location Detection - Invalid Altitude');
const altLocation = {
  lat: 28.6139,
  lng: 77.2090,
  accuracy: 10,
  altitude: -500, // Below sea level (impossible on land)
  speed: 5,
  timestamp: Date.now(),
};
const mockCheck4 = detectMockLocation(altLocation);
console.log(`   Altitude: ${altLocation.altitude}m (threshold: -100m)`);
console.log(`   Mocked: ${mockCheck4.isMocked}`);
console.log(`   ✓ Expected mocked: ${mockCheck4.isMocked ? 'PASS' : 'FAIL'}`);

// TEST 12: Mock Location - Altitude Jump
console.log('\n✅ TEST 12: Mock Location Detection - Rapid Altitude Change');
const baseTime = Date.now();
const altJumpCheck = detectMockLocation(
  {
    lat: 28.6139,
    lng: 77.2090,
    accuracy: 10,
    altitude: 500, // Jump from 250m to 500m
    speed: 5,
    timestamp: baseTime,
  },
  {
    lat: 28.6139,
    lng: 77.2090,
    accuracy: 10,
    altitude: 250,
    speed: 5,
    timestamp: baseTime - 30000, // 30 seconds ago
  }
);
console.log(`   Previous altitude: 250m, Current: 500m`);
console.log(`   Time delta: 30 seconds`);
console.log(`   Altitude jump: 250m in 30s`);
console.log(`   Flagged: ${altJumpCheck.layers.altitudeJump}`);
console.log(`   ✓ Expected flagged: ${altJumpCheck.layers.altitudeJump ? 'PASS' : 'FAIL'}`);

// TEST 13: Complex Polygon (Real Office Layout)
console.log('\n✅ TEST 13: Ray Casting - Complex Polygon (Office Layout)');
const officePolygon = [
  { lat: 28.6139, lng: 77.2090 }, // Bottom-left
  { lat: 28.6139, lng: 77.2100 }, // Bottom-right
  { lat: 28.6149, lng: 77.2100 }, // Top-right
  { lat: 28.6149, lng: 77.2095 }, // Top-middle (indentation)
  { lat: 28.6145, lng: 77.2095 }, // Middle
  { lat: 28.6149, lng: 77.2090 }, // Top-left
];
const pointInOffice = { lat: 28.6144, lng: 77.2095 };
const inOffice = isInsidePolygon(pointInOffice, officePolygon);
console.log(`   Polygon vertices: ${officePolygon.length}`);
console.log(`   Test point: (${pointInOffice.lat}, ${pointInOffice.lng})`);
console.log(`   Result: ${inOffice ? 'INSIDE' : 'OUTSIDE'}`);
console.log(`   ℹ️  Complex polygon tested`);

console.log('\n' + '═'.repeat(60));
console.log('✅ GEOFENCE TESTS COMPLETED\n');
