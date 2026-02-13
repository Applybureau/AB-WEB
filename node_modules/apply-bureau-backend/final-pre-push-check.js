require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('\n🔍 Final Pre-Push Verification...\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

let allChecks = true;

// Check 1: Verify critical files exist
console.log('1️⃣ Checking critical files...');
const criticalFiles = [
  'routes/adminDashboardComplete.js',
  'routes/clientDashboardNew.js',
  'routes/strategyCalls.js',
  'routes/clientUploads.js',
  'sql/add_missing_features_schema.sql',
  'sql/client_dashboard_schema_fixed.sql',
  'FINAL_COMPLETE_SYSTEM.md',
  'PUSH_TO_GITHUB_NOW.md',
  'READY_FOR_GITHUB_PUSH.md'
];

criticalFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ MISSING: ${file}`);
    allChecks = false;
  }
});

// Check 2: Verify server.js has routes registered
console.log('\n2️⃣ Checking server.js route registration...');
const serverPath = path.join(__dirname, 'server.js');
const serverContent = fs.readFileSync(serverPath, 'utf8');

const requiredRoutes = [
  'adminDashboardCompleteRoutes',
  'clientDashboardRoutes',
  'strategyCallsRoutes',
  'clientUploadsRoutes'
];

requiredRoutes.forEach(route => {
  if (serverContent.includes(route)) {
    console.log(`   ✅ ${route} registered`);
  } else {
    console.log(`   ❌ MISSING: ${route}`);
    allChecks = false;
  }
});

// Check 3: Verify environment variables
console.log('\n3️⃣ Checking environment variables...');
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_KEY',
  'RESEND_API_KEY',
  'JWT_SECRET',
  'FRONTEND_URL',
  'BACKEND_URL'
];

requiredEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    console.log(`   ✅ ${envVar}`);
  } else {
    console.log(`   ❌ MISSING: ${envVar}`);
    allChecks = false;
  }
});

// Check 4: Verify package.json has required dependencies
console.log('\n4️⃣ Checking package.json dependencies...');
const packagePath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

const requiredDeps = [
  'express',
  '@supabase/supabase-js',
  'resend',
  'jsonwebtoken',
  'dotenv',
  'cors',
  'helmet',
  'morgan',
  'compression'
];

requiredDeps.forEach(dep => {
  if (packageJson.dependencies[dep]) {
    console.log(`   ✅ ${dep}`);
  } else {
    console.log(`   ❌ MISSING: ${dep}`);
    allChecks = false;
  }
});

// Check 5: Verify SQL migration files are valid
console.log('\n5️⃣ Checking SQL migration files...');
const sqlFiles = [
  'sql/client_dashboard_schema_fixed.sql',
  'sql/add_missing_features_schema.sql'
];

sqlFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('CREATE TABLE') || content.includes('ALTER TABLE') || content.includes('DO $')) {
      console.log(`   ✅ ${file} (valid SQL)`);
    } else {
      console.log(`   ⚠️  ${file} (no CREATE/ALTER statements)`);
    }
  } else {
    console.log(`   ❌ MISSING: ${file}`);
    allChecks = false;
  }
});

// Check 6: Verify documentation files
console.log('\n6️⃣ Checking documentation...');
const docFiles = [
  'FINAL_COMPLETE_SYSTEM.md',
  'PUSH_TO_GITHUB_NOW.md',
  'READY_FOR_GITHUB_PUSH.md',
  'CLIENT_ADMIN_DASHBOARD_FLOW.md'
];

docFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.length > 100) {
      console.log(`   ✅ ${file} (${Math.round(content.length / 1024)}KB)`);
    } else {
      console.log(`   ⚠️  ${file} (too short)`);
    }
  } else {
    console.log(`   ❌ MISSING: ${file}`);
    allChecks = false;
  }
});

// Check 7: Verify .gitignore
console.log('\n7️⃣ Checking .gitignore...');
const gitignorePath = path.join(__dirname, '.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  const requiredIgnores = ['node_modules', '.env', 'logs'];
  let allIgnored = true;
  
  requiredIgnores.forEach(ignore => {
    if (gitignoreContent.includes(ignore)) {
      console.log(`   ✅ ${ignore} ignored`);
    } else {
      console.log(`   ⚠️  ${ignore} not in .gitignore`);
      allIgnored = false;
    }
  });
  
  if (!allIgnored) {
    console.log('   ⚠️  Some items should be in .gitignore');
  }
} else {
  console.log('   ❌ .gitignore not found');
  allChecks = false;
}

// Final summary
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (allChecks) {
  console.log('✅ ALL CHECKS PASSED!\n');
  console.log('🚀 Ready to push to GitHub!\n');
  console.log('Next steps:');
  console.log('   1. git add .');
  console.log('   2. git commit -m "Complete system: Admin dashboard, client dashboard, token registration, strategy calls, 20Q management, notifications, client card"');
  console.log('   3. git push origin main');
  console.log('\n📦 DigitalOcean will auto-deploy in ~2-3 minutes\n');
} else {
  console.log('❌ SOME CHECKS FAILED!\n');
  console.log('Please fix the issues above before pushing.\n');
  process.exit(1);
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
