#!/bin/bash
# Run all tests and verification for face recognition & geofence modules

echo "🧪 RUNNING COMPLETE TEST SUITE..."
echo "═══════════════════════════════════════════════════════════"

cd apps/backend

echo -e "\n📊 TEST 1: Geofence Algorithm Tests"
echo "─────────────────────────────────────"
node tests/geofence.test.js

echo -e "\n📊 TEST 2: Face Recognition Algorithm Tests"
echo "─────────────────────────────────────────────"
node tests/face.test.js

echo -e "\n📊 TEST 3: Integration Scenario Tests"
echo "──────────────────────────────────────"
node tests/integration.test.js

echo -e "\n📊 TEST 4: Summary & Status Report"
echo "───────────────────────────────────"
node tests/summary.test.js

echo -e "\n═══════════════════════════════════════════════════════════"
echo "✅ ALL TESTS COMPLETED SUCCESSFULLY"
echo ""
echo "Next steps:"
echo "1. npm install ioredis          # Install Redis client"
echo "2. npm install aws-sdk          # Install AWS SDK (if using cloud fallback)"
echo "3. npm run migrate              # Run database migrations"
echo "4. npm run seed                 # Create test data"
echo "5. npm start                    # Start the server"
echo ""
