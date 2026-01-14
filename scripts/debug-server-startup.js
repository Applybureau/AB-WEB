require('dotenv').config();

async function debugServerStartup() {
  console.log('🔍 DEBUGGING SERVER STARTUP ISSUES');
  console.log('==================================');
  
  try {
    console.log('1️⃣ Testing problematic imports from server.js...');
    
    // Test imports that might be causing issues
    const problematicImports = [
      '../utils/logger',
      '../utils/cache', 
      '../utils/security',
      '../utils/monitoring',
      '../utils/realtime'
    ];
    
    for (const importPath of problematicImports) {
      try {
        require(importPath);
        console.log(`✅ ${importPath} - OK`);
      } catch (error) {
        console.log(`❌ ${importPath} - ERROR: ${error.message}`);
      }
    }
    
    console.log('\n2️⃣ Testing route imports that might fail...');
    
    const routeImports = [
      '../routes/consultations',
      '../routes/applications', 
      '../routes/notifications',
      '../routes/dashboard',
      '../routes/enhancedDashboard',
      '../routes/adminManagement',
      '../routes/fileManagement'
    ];
    
    for (const routePath of routeImports) {
      try {
        require(routePath);
        console.log(`✅ ${routePath} - OK`);
      } catch (error) {
        console.log(`❌ ${routePath} - ERROR: ${error.message}`);
      }
    }
    
    console.log('\n3️⃣ Testing new concierge routes...');
    
    const conciergeRoutes = [
      '../routes/clientRegistration',
      '../routes/clientOnboarding20Q', 
      '../routes/strategyCalls',
      '../routes/onboardingWorkflow',
      '../routes/applicationsWorkflow'
    ];
    
    for (const routePath of conciergeRoutes) {
      try {
        require(routePath);
        console.log(`✅ ${routePath} - OK`);
      } catch (error) {
        console.log(`❌ ${routePath} - ERROR: ${error.message}`);
      }
    }
    
    console.log('\n4️⃣ Testing middleware that might cause issues...');
    
    const middlewareImports = [
      '../middleware/errorHandler',
      '../middleware/pagination',
      '../middleware/profileGuard'
    ];
    
    for (const middlewarePath of middlewareImports) {
      try {
        require(middlewarePath);
        console.log(`✅ ${middlewarePath} - OK`);
      } catch (error) {
        console.log(`❌ ${middlewarePath} - ERROR: ${error.message}`);
      }
    }
    
    return true;
  } catch (error) {
    console.log('\n❌ DEBUGGING FAILED');
    console.log('Error:', error.message);
    return false;
  }
}

debugServerStartup().then(success => {
  console.log('\n🎯 Debug complete - check errors above');
  process.exit(0);
});