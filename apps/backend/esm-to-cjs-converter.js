#!/usr/bin/env node

/**
 * ESM to CommonJS Converter for Backend Modules
 * Converts all module files from ESM to CommonJS syntax
 */

const fs = require('fs');
const path = require('path');

// Statistics
const stats = {
  filesProcessed: 0,
  filesSkipped: 0,
  filesModified: 0,
  errors: []
};

const modulesPath = path.join(__dirname, 'src', 'modules');

/**
 * Convert imports to requires
 */
function convertImports(content) {
  // import * as X from 'file.js' -> const X = require('file.js')
  content = content.replace(/import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g, 
    "const $1 = require('$2')");
  
  // import { X, Y, Z } from 'file.js' -> const { X, Y, Z } = require('file.js')
  content = content.replace(/import\s+\{\s*([^}]+)\s*\}\s+from\s+['"]([^'"]+)['"]/g,
    "const { $1 } = require('$2')");
  
  // import X from 'file.js' -> const X = require('file.js')
  content = content.replace(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g,
    "const $1 = require('$2')");
  
  return content;
}

/**
 * Convert exports to module.exports
 */
function convertExports(content, filename) {
  // Detect file type
  const isRoutes = filename.includes('.routes.js');
  const isValidator = filename.includes('.validator.js');
  const isService = filename.includes('.service.js');
  const isRepository = filename.includes('.repository.js');
  const isController = filename.includes('.controller.js');
  const isStatusEngine = filename.includes('.statusEngine.js');
  const isCloudService = filename.includes('.cloudService.js');
  const isLocalModel = filename.includes('.localModel.js');
  
  let exportedFunctions = [];
  
  if (isRoutes) {
    // Routes: export default router -> module.exports = router;
    content = content.replace(/export\s+default\s+router/g, 'module.exports = router');
  } else if (isValidator) {
    // Find all exported items in validator
    const exportMatches = content.match(/export\s+const\s+(\w+)/g) || [];
    exportedFunctions = exportMatches.map(m => m.replace('export const ', ''));
    
    // Replace all "export const" with "const"
    content = content.replace(/export\s+const\s+/g, 'const ');
    
    // Add module.exports at the end if there are exported functions
    if (exportedFunctions.length > 0 && !content.includes('module.exports')) {
      content = content.trimRight() + `\n\nmodule.exports = {\n  ${exportedFunctions.join(',\n  ')},\n};`;
    }
  } else {
    // For controllers, services, repositories, statusEngine, etc.
    const exportMatches = content.match(/export\s+(?:const|function|async\s+function|class)\s+(\w+)/g) || [];
    exportedFunctions = exportMatches.map(m => {
      const match = m.match(/(\w+)$/);
      return match ? match[1] : '';
    }).filter(f => f);
    
    // Replace "export const/function" with "const/function"
    content = content.replace(/export\s+const\s+/g, 'const ');
    content = content.replace(/export\s+async\s+const\s+/g, 'const ');
    content = content.replace(/export\s+(async\s+)?function\s+/g, '$1function ');
    content = content.replace(/export\s+class\s+/g, 'class ');
    
    // Replace "export default {" with appropriate pattern
    content = content.replace(/export\s+default\s+({[\s\S]*})/g, 'module.exports = $1');
    
    // Replace empty exports
    content = content.replace(/export\s+{}\s*;/g, 'module.exports = {};');
    
    // Add module.exports if we found exported functions and don't already have module.exports
    if (exportedFunctions.length > 0 && !content.includes('module.exports')) {
      content = content.trimRight() + `\n\nmodule.exports = {\n  ${exportedFunctions.join(',\n  ')},\n};`;
    }
  }
  
  return content;
}

/**
 * Convert a single file
 */
function convertFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Check if file is already CommonJS
    if (content.includes('module.exports') && !content.match(/^\s*import\s+/m)) {
      stats.filesSkipped++;
      return;
    }
    
    // Check if file has ESM exports
    if (!content.match(/^\s*(import|export)\s+/m)) {
      stats.filesSkipped++;
      return;
    }
    
    // Convert imports
    content = convertImports(content);
    
    // Convert exports
    content = convertExports(content, filePath);
    
    // Write back
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      stats.filesModified++;
    }
    
    stats.filesProcessed++;
  } catch (err) {
    stats.errors.push(`${filePath}: ${err.message}`);
  }
}

/**
 * Process all module files
 */
function processModules() {
  if (!fs.existsSync(modulesPath)) {
    console.error(`Modules path not found: ${modulesPath}`);
    process.exit(1);
  }
  
  // Get all module directories
  const modules = fs.readdirSync(modulesPath).filter(f => {
    return fs.statSync(path.join(modulesPath, f)).isDirectory();
  });
  
  console.log(`Found ${modules.length} modules\n`);
  
  let batchNum = 1;
  modules.forEach(module => {
    const modulePath = path.join(modulesPath, module);
    const files = fs.readdirSync(modulePath).filter(f => f.endsWith('.js'));
    
    console.log(`[${batchNum}/${modules.length}] Converting ${module}/ (${files.length} files)...`);
    
    files.forEach(file => {
      const filePath = path.join(modulePath, file);
      convertFile(filePath);
    });
    
    batchNum++;
  });
}

/**
 * Main
 */
console.log('🚀 ESM to CommonJS Converter - Backend Modules\n');
console.log(`Working directory: ${process.cwd()}\n`);

processModules();

console.log(`\n✅ Conversion Complete!\n`);
console.log(`Summary:`);
console.log(`  Total Processed: ${stats.filesProcessed}`);
console.log(`  Modified: ${stats.filesModified}`);
console.log(`  Skipped: ${stats.filesSkipped}`);

if (stats.errors.length > 0) {
  console.log(`\n❌ Errors:`);
  stats.errors.forEach(err => console.log(`  - ${err}`));
}

console.log(`\nDone!`);
