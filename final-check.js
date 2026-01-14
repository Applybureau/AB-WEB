#!/usr/bin/env node

/**
 * Apply Bureau Backend - Final System Check
 * Comprehensive validation before deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Apply Bureau Backend - Final System Check');
console.log('='.repeat(50));
console.log('');

let errors = [];
let warnings = [];
let passed = 0;

// Check 1: Environment file
console.log('1. Checking environment configuration...');
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
    'RESEND_API_KEY',
    'JWT_SECRET',
    'FRONTEND_URL'
  ];
  
  const missingVars = requiredVars.filter(v => !envContent.includes(v));
  
  if (missingVars.length > 0) {
    errors.push(`Missing environment variables: ${missingVars.join(', ')}`);
  } else {
    console.log('   ✓ All required environment variables present');
    passed++;
  }
} else {
  errors.push('.env file not found');
}

// Check 2: Dependencies
console.log('2. Checking dependencies...');
if (fs.existsSync('node_modules')) {
  console.log('   ✓ node_modules directory exists');
  passed++;
} else {
  errors.push('node_modules not found - run npm install');
}

// Check 3: Core files
console.log('3. Checking core files...');
const coreFiles = [
  'server.js',
  'package.json',
  'MASTER_DATABASE_SCHEMA.sql',
  'README.md',
  'API_DOCUMENTATION.md'
];

const missingFiles = coreFiles.filter(f => !fs.existsSync(f));
if (missingFiles.length > 0) {
  errors.push(`Missing core files: ${missingFiles.join(', ')}`);
} else {
  console.log('   ✓ All core files present');
  passed++;
}

// Check 4: Routes
console.log('4. Checking route files...');
const routesDir = 'routes';
if (fs.existsSync(routesDir)) {
  const routes = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));
  console.log(`   ✓ Found ${routes.length} route files`);
  passed++;
} else {
  errors.push('routes directory not found');
}

// Check 5: Controllers
console.log('5. Checking controller files...');
const controllersDir = 'controllers';
if (fs.existsSync(controllersDir)) {
  const controllers = fs.readdirSync(controllersDir).filter(f => f.endsWith('.js'));
  console.log(`   ✓ Found ${controllers.length} controller files`);
  passed++;
} else {
  errors.push('controllers directory not found');
}

// Check 6: Utils
console.log('6. Checking utility files...');
const utilsDir = 'utils';
if (fs.existsSync(utilsDir)) {
  const utils = fs.readdirSync(utilsDir).filter(f => f.endsWith('.js'));
  console.log(`   ✓ Found ${utils.length} utility files`);
  passed++;
} else {
  errors.push('utils directory not found');
}

// Check 7: Tests
console.log('7. Checking test files...');
const testsDir = 'tests';
if (fs.existsSync(testsDir)) {
  const tests = fs.readdirSync(testsDir).filter(f => f.endsWith('.test.js'));
  console.log(`   ✓ Found ${tests.length} test files`);
  passed++;
} else {
  warnings.push('tests directory not found');
}

// Check 8: Email templates
console.log('8. Checking email templates...');
const emailsDir = 'emails/templates';
if (fs.existsSync(emailsDir)) {
  const templates = fs.readdirSync(emailsDir).filter(f => f.endsWith('.html'));
  console.log(`   ✓ Found ${templates.length} email templates`);
  passed++;
} else {
  warnings.push('email templates directory not found');
}

// Check 9: .gitignore
console.log('9. Checking .gitignore...');
if (fs.existsSync('.gitignore')) {
  const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
  if (gitignoreContent.includes('.env') && gitignoreContent.includes('node_modules')) {
    console.log('   ✓ .gitignore properly configured');
    passed++;
  } else {
    warnings.push('.gitignore may be incomplete');
  }
} else {
  warnings.push('.gitignore not found');
}

// Check 10: Package.json scripts
console.log('10. Checking package.json scripts...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredScripts = ['start', 'dev', 'test'];
const missingScripts = requiredScripts.filter(s => !packageJson.scripts[s]);

if (missingScripts.length > 0) {
  warnings.push(`Missing scripts: ${missingScripts.join(', ')}`);
} else {
  console.log('   ✓ All required scripts present');
  passed++;
}

// Summary
console.log('');
console.log('='.repeat(50));
console.log('📊 Summary');
console.log('='.repeat(50));
console.log(`✓ Passed: ${passed}/10 checks`);

if (warnings.length > 0) {
  console.log(`⚠️  Warnings: ${warnings.length}`);
  warnings.forEach(w => console.log(`   - ${w}`));
}

if (errors.length > 0) {
  console.log(`❌ Errors: ${errors.length}`);
  errors.forEach(e => console.log(`   - ${e}`));
  console.log('');
  console.log('❌ System check FAILED');
  console.log('Please fix the errors above before deploying');
  process.exit(1);
} else {
  console.log('');
  console.log('✅ System check PASSED');
  console.log('Backend is ready for deployment!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Run: npm test');
  console.log('2. Run: npm run health-check');
  console.log('3. Deploy to your hosting platform');
  process.exit(0);
}
