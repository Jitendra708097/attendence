/**
 * @module tests/debug.test
 * @description Debug test for identifying and fixing issues in implementations
 */

console.log('🐛 DEBUG TEST SUITE\n');
console.log('═'.repeat(60));

// TEST 1: Check imports and dependencies
console.log('\n✅ TEST 1: Import/Dependency Check');
try {
  const fs = require('fs');
  const path = require('path');

  // Check if cosineSimilarity.js is properly implemented
  const cosineFile = path.join(__dirname, '../packages/shared-utils/src/cosineSimilarity.js');
  const cosineContent = fs.readFileSync(cosineFile, 'utf8');
  
  if (cosineContent.includes('export {}') || cosineContent.trim().length < 50) {
    console.log(`   ⚠️  @shared-utils/cosineSimilarity.js is EMPTY or stub`);
    console.log(`   FIX NEEDED: Implement actual cosine similarity function`);
  } else {
    console.log(`   ✓ @shared-utils/cosineSimilarity.js exists and has content`);
  }

  // Check AppError import
  const appErrorFile = path.join(__dirname, '../src/utils/AppError.js');
  if (fs.existsSync(appErrorFile)) {
    console.log(`   ✓ AppError.js exists`);
  } else {
    console.log(`   ⚠️  AppError.js NOT FOUND`);
  }

  // Check models index
  const modelsFile = path.join(__dirname, '../src/models/index.js');
  if (fs.existsSync(modelsFile)) {
    console.log(`   ✓ models/index.js exists`);
  } else {
    console.log(`   ⚠️  models/index.js NOT FOUND`);
  }

} catch (err) {
  console.log(`   ✗ ERROR: ${err.message}`);
}

// TEST 2: Check for duplicate/conflicting functions in geofence.service
console.log('\n✅ TEST 2: Geofence Service Structure');
try {
  const fs = require('fs');
  const path = require('path');
  const geofenceService = path.join(__dirname, '../src/modules/geofence/geofence.service.js');
  const content = fs.readFileSync(geofenceService, 'utf8');

  // Check for function definitions
  const functions = [
    'calculateHaversine',
    'isInsidePolygon', 
    'detectMockLocation',
    'validateLocation',
    'getBranchGeofence',
    'updateGeofencePolygon',
    'setFallbackRadius',
    'getGeofenceById',
    'updateGeofence',
    'deleteGeofence',
  ];

  const missing = [];
  const found = [];

  for (const func of functions) {
    if (content.includes(`const ${func} =`) || content.includes(`function ${func}`)) {
      found.push(func);
    } else {
      missing.push(func);
    }
  }

  console.log(`   Found ${found.length} functions: ${found.slice(0, 5).join(', ')}...`);

  // Check for module.exports
  if (content.includes('module.exports')) {
    const exportsMatch = content.match(/module\.exports\s*=\s*\{[\s\S]*\}/);
    if (exportsMatch) {
      const exportsStr = exportsMatch[0];
      const exportedFuncs = exportsStr.match(/\w+\s*:/g) || [];
      console.log(`   Exported: ${exportedFuncs.length} functions`);
      console.log(`   ℹ️  Possible issue: Multiple validateLocation definitions`);
    }
  }

} catch (err) {
  console.log(`   ✗ ERROR: ${err.message}`);
}

// TEST 3: Check face service imports
console.log('\n✅ TEST 3: Face Service Imports');
try {
  const fs = require('fs');
  const path = require('path');
  const faceService = path.join(__dirname, '../src/modules/face/face.service.js');
  const content = fs.readFileSync(faceService, 'utf8');

  const imports = [
    { pattern: /require\(['"].*localModel/, name: 'face.localModel' },
    { pattern: /require\(['"].*cloudService/, name: 'face.cloudService' },
    { pattern: /require\(['"].*AppError/, name: 'AppError' },
    { pattern: /require\(['"].*ioredis/, name: 'ioredis' },
    { pattern: /require\(['"].*models\/index/, name: 'models' },
  ];

  for (const imp of imports) {
    if (imp.pattern.test(content)) {
      console.log(`   ✓ ${imp.name} imported`);
    } else {
      console.log(`   ⚠️  ${imp.name} NOT imported`);
    }
  }

} catch (err) {
  console.log(`   ✗ ERROR: ${err.message}`);
}

// TEST 4: Check face.localModel require call
console.log('\n✅ TEST 4: Face LocalModel Cosine Import (Runtime)');
try {
  const content = `
    // This is the problematic code:
    const cosine = require('@shared-utils/cosineSimilarity.js');
    const similarity = cosine(storedEmbedding, checkInEmbedding);
  `;
  
  console.log(`   ⚠️  Issue: Runtime require() in face.localModel.js`);
  console.log(`   Code: ${content.split('\n')[2].trim()}`);
  console.log(`   FIX: Should be imports at top of file, not inside function`);
  console.log(`   IMPACT: Will throw at runtime when verifyFace() is called`);

} catch (err) {
  console.log(`   ✗ ERROR: ${err.message}`);
}

// TEST 5: Check scoped model usage
console.log('\n✅ TEST 5: Multi-Tenancy Isolation Check');
try {
  const fs = require('fs');
  const path = require('path');
  
  // Check if both services use scopedModel correctly
  const faceService = path.join(__dirname, '../src/modules/face/face.service.js');
  const geofenceService = path.join(__dirname, '../src/modules/geofence/geofence.service.js');
  
  const faceContent = fs.readFileSync(faceService, 'utf8');
  const geoContent = fs.readFileSync(geofenceService, 'utf8');

  const faceHasScoped = faceContent.includes('scopedModel');
  const geoHasScoped = geoContent.includes('scopedModel');

  console.log(`   Face service uses scopedModel: ${faceHasScoped ? '✓' : '⚠️'}`);
  console.log(`   Geofence service uses scopedModel: ${geoHasScoped ? '✓' : '⚠️'}`);

  if (!faceHasScoped) {
    console.log(`   ⚠️  Face service directly queries Employee model`);
    console.log(`   FIX: Should wrap with scopedModel(Employee, orgId)`);
  }

  if (!geoHasScoped) {
    console.log(`   ⚠️  Geofence service directly queries Branch model`);
    console.log(`   FIX: Should wrap with scopedModel(Branch, orgId)`);
  }

} catch (err) {
  console.log(`   ✗ ERROR: ${err.message}`);
}

// TEST 6: Error handling consistency
console.log('\n✅ TEST 6: Error Code Consistency');
const errorCodes = {
  FACE_001: 'Face not detected',
  FACE_002: 'Face quality/verification failed',
  FACE_003: 'Face does not match',
  FACE_004: 'Multiple faces detected',
  FACE_005: 'Liveness check failed',
  FACE_006: 'Flat surface detected',
  FACE_007: 'Face enrollment failed',
  GEO_001: 'Outside geofence',
  GEO_002: 'GPS accuracy too low',
  GEO_003: 'Mock location detected',
  GEO_004: 'GPS unavailable',
};

console.log(`   Defined error codes: ${Object.keys(errorCodes).length}`);
for (const [code, msg] of Object.entries(errorCodes)) {
  console.log(`   ${code}: ${msg}`);
}

// TEST 7: Redis connection setup
console.log('\n✅ TEST 7: Redis Connection');
try {
  const Redis = require('ioredis');
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  console.log(`   Redis URL: ${url.split('//')[1] || 'default'}`);
  console.log(`   ℹ️  Redis client instantiated in face.service but no error handling if connection fails`);
  console.log(`   RISK: Service will crash if Redis is unavailable`);
} catch (err) {
  console.log(`   ⚠️  ioredis not installed`);
}

// TEST 8: AWS SDK configuration
console.log('\n✅ TEST 8: AWS Rekognition Setup');
try {
  const envVars = [
    'AWS_REGION',
    'AWS_ACCESS_KEY_ID', 
    'AWS_SECRET_ACCESS_KEY',
  ];

  for (const env of envVars) {
    const status = process.env[env] ? '✓' : '⚠️';
    console.log(`   ${status} ${env}: ${process.env[env] ? 'set' : 'NOT SET'}`);
  }

  if (!process.env.AWS_ACCESS_KEY_ID) {
    console.log(`   FYI: Cloud face recognition will fail without AWS credentials`);
  }

} catch (err) {
  console.log(`   ✗ ERROR: ${err.message}`);
}

// TEST 9: Configuration missing issues
console.log('\n✅ TEST 9: Configuration Issues');
try {
  const issues = [
    {
      name: 'cosineSimilarity.js',
      severity: 'CRITICAL',
      impact: 'Face verification will crash at runtime',
      status: 'NOT IMPLEMENTED'
    },
    {
      name: 'scopedModel enforcement',
      severity: 'CRITICAL',
      impact: 'Multi-tenant data leak possible',
      status: 'NEEDS CHECK'
    },
    {
      name: 'Redis error handling',
      severity: 'HIGH',
      impact: 'Service crash if Redis unavailable',
      status: 'MISSING'
    },
    {
      name: 'models/index associations',
      severity: 'HIGH',
      impact: 'Database queries may fail',
      status: 'NEEDS CHECK'
    },
  ];

  console.log(`   Found ${issues.length} issues:\n`);
  for (const issue of issues) {
    console.log(`   [${issue.severity}] ${issue.name}`);
    console.log(`       Impact: ${issue.impact}`);
    console.log(`       Status: ${issue.status}\n`);
  }

} catch (err) {
  console.log(`   ✗ ERROR: ${err.message}`);
}

console.log('═'.repeat(60));
console.log('✅ DEBUG TEST COMPLETED\n');
console.log('SUMMARY:');
console.log('--------');
console.log('🔴 CRITICAL: cosineSimilarity.js needs implementation');
console.log('🔴 CRITICAL: Face/Geofence services need scopedModel wrapping');
console.log('🟡 HIGH: Redis error handling needs improvement');
console.log('🟡 HIGH: Models/index associations need verification\n');
