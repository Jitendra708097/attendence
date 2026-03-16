#!/bin/bash
# Script to create stub modules
# Run: bash create-stubs.sh

modules=(
"branch"
"department"
"employee"
"shift"
"attendance"
"leave"
"regularisation"
"holiday"
"notification"
"face"
"geofence"
"billing"
"superadmin"
)

MODULE_TEMPLATE='/**
 * @module MODULE_NAME.routes
 */
import { Router } from "express";
import { verifyJWT } from "../../middleware/verifyJWT.js";
import { orgGuard } from "../../middleware/orgGuard.js";

const router = Router();

// TODO: Implement MODULE_NAME endpoints
router.get("/", verifyJWT, orgGuard, (req, res) => {
  res.json({ success: true, message: "MODULE_NAME module coming soon" });
});

export default router;
'

for module in "${modules[@]}"; do
  echo "Creating stub for: $module"
  
  # Create routes stub
  echo "${MODULE_TEMPLATE//MODULE_NAME/$module}" > "src/modules/$module/${module}.routes.js"
  
  # Create other files as empty stubs
  echo "export {};" > "src/modules/$module/${module}.controller.js"
  echo "export {};" > "src/modules/$module/${module}.service.js"
  echo "export {};" > "src/modules/$module/${module}.repository.js"
  echo "export {};" > "src/modules/$module/${module}.validator.js"
done

echo "✅ All module stubs created!"
