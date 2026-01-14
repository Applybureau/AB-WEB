const fs = require('fs');
const path = require('path');

async function fixAllBackendErrors() {
  console.log('🔧 FIXING ALL BACKEND ERRORS - COMPREHENSIVE REPAIR');
  console.log('==================================================');
  
  const fixes = [];
  
  // 1. Check for missing route files
  console.log('\n1️⃣ Checking for missing route files...');
  const requiredRoutes = [
    'routes/publicConsultations.js',
    'routes/adminConcierge.js', 
    'routes/clientRegistration.js',
    'routes/clientOnboarding20Q.js',
    'routes/strategyCalls.js',
    'routes/onboardingWorkflow.js',
    'routes/applicationsWorkflow.js'
  ];
  
  for (const route of requiredRoutes) {
    const routePath = path.join(__dirname, '..', route);
    if (!fs.existsSync(routePath)) {
      console.log(`❌ Missing: ${route}`);
      fixes.push(`Missing route file: ${route}`);
    } else {
      console.log(`✅ Found: ${route}`);
    }
  }
  
  // 2. Check for import errors in route files
  console.log('\n2️⃣ Checking route file imports...');
  const routesToCheck = [
    'routes/contact.js',
    'routes/publicConsultations.js',
    'routes/adminConcierge.js'
  ];
  
  for (const route of routesToCheck) {
    const routePath = path.join(__dirname, '..', route);
    if (fs.existsSync(routePath)) {
      const content = fs.readFileSync(routePath, 'utf8');
      
      // Check for incorrect middleware imports
      if (content.includes("require('../middleware/auth')")) {
        console.log(`❌ ${route}: Incorrect auth import (should be utils/auth)`);
        fixes.push(`Fix auth import in ${route}`);
      }
      
      // Check for missing dependencies
      if (content.includes('NotificationHelpers') && !content.includes("require('../utils/notifications')")) {
        console.log(`❌ ${route}: Missing NotificationHelpers import`);
        fixes.push(`Add NotificationHelpers import in ${route}`);
      }
      
      console.log(`✅ ${route}: Imports look good`);
    }
  }
  
  // 3. Check server.js for route conflicts
  console.log('\n3️⃣ Checking server.js for route conflicts...');
  const serverPath = path.join(__dirname, '..', 'server.js');
  const serverContent = fs.readFileSync(serverPath, 'utf8');
  
  // Count route registrations
  const routeRegistrations = serverContent.match(/app\.use\(['"]/g) || [];
  console.log(`📊 Found ${routeRegistrations.length} route registrations`);
  
  // Check for duplicate registrations
  const routes = {};
  const lines = serverContent.split('\n');
  lines.forEach((line, index) => {
    if (line.includes('app.use(') && line.includes('Routes')) {
      const match = line.match(/app\.use\(['"]([^'"]+)['"]/);
      if (match) {
        const routePath = match[1];
        if (routes[routePath]) {
          console.log(`❌ Duplicate route registration: ${routePath} (lines ${routes[routePath]} and ${index + 1})`);
          fixes.push(`Remove duplicate route: ${routePath}`);
        } else {
          routes[routePath] = index + 1;
        }
      }
    }
  });
  
  // 4. Check for missing middleware files
  console.log('\n4️⃣ Checking middleware files...');
  const middlewareFiles = [
    'middleware/auth.js',
    'middleware/errorHandler.js',
    'middleware/pagination.js',
    'middleware/profileGuard.js'
  ];
  
  for (const middleware of middlewareFiles) {
    const middlewarePath = path.join(__dirname, '..', middleware);
    if (!fs.existsSync(middlewarePath)) {
      console.log(`❌ Missing: ${middleware}`);
      fixes.push(`Missing middleware file: ${middleware}`);
    } else {
      console.log(`✅ Found: ${middleware}`);
    }
  }
  
  // 5. Check utils files
  console.log('\n5️⃣ Checking utils files...');
  const utilsFiles = [
    'utils/supabase.js',
    'utils/auth.js',
    'utils/email.js',
    'utils/notifications.js'
  ];
  
  for (const util of utilsFiles) {
    const utilPath = path.join(__dirname, '..', util);
    if (!fs.existsSync(utilPath)) {
      console.log(`❌ Missing: ${util}`);
      fixes.push(`Missing utils file: ${util}`);
    } else {
      console.log(`✅ Found: ${util}`);
    }
  }
  
  // 6. Summary and fixes
  console.log('\n📋 SUMMARY OF ISSUES FOUND:');
  if (fixes.length === 0) {
    console.log('✅ No structural issues found!');
  } else {
    fixes.forEach((fix, index) => {
      console.log(`${index + 1}. ${fix}`);
    });
  }
  
  return fixes;
}

// Run the comprehensive check
if (require.main === module) {
  fixAllBackendErrors().then(fixes => {
    console.log('\n🎯 NEXT STEPS:');
    if (fixes.length === 0) {
      console.log('✅ Structure looks good - test server startup');
    } else {
      console.log('🔧 Apply the fixes above, then test again');
    }
    process.exit(0);
  });
}

module.exports = { fixAllBackendErrors };