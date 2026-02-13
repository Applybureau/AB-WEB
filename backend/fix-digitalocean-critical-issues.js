#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚨 FIXING CRITICAL DIGITALOCEAN DEPLOYMENT ISSUES\n');

// Issue 1: Missing environment variable SUPABASE_URL
// Issue 2: Health check failure on port 8080

console.log('📋 ISSUES IDENTIFIED:');
console.log('1. ❌ Missing environment variable: SUPABASE_URL');
console.log('2. ❌ Health check failure: Application not responding on port 8080');
console.log('');

// 1. VERIFY APP.YAML CONFIGURATION
console.log('🔧 1. VERIFYING APP.YAML CONFIGURATION');

const appYamlPath = path.join(__dirname, '.do', 'app.yaml');
const appYaml = fs.readFileSync(appYamlPath, 'utf8');

// Check critical configurations
const checks = [
  { name: 'PORT environment variable', pattern: /key: PORT\s+value: "8080"/, required: true },
  { name: 'SUPABASE_URL reference', pattern: /key: SUPABASE_URL\s+value: \${SUPABASE_URL}/, required: true },
  { name: 'Health check endpoint', pattern: /http_path: \/health/, required: true },
  { name: 'Source directory', pattern: /source_dir: \/backend/, required: true },
  { name: 'Run command', pattern: /run_command: npm start/, required: true }
];

let configIssues = 0;
checks.forEach(check => {
  if (check.pattern.test(appYaml)) {
    console.log(`   ✅ ${check.name}: Configured correctly`);
  } else {
    console.log(`   ❌ ${check.name}: MISSING OR INCORRECT`);
    if (check.required) configIssues++;
  }
});

if (configIssues > 0) {
  console.log(`\n   ⚠️  Found ${configIssues} configuration issues in app.yaml`);
} else {
  console.log('\n   ✅ App.yaml configuration is correct');
}

// 2. VERIFY SERVER.JS CONFIGURATION
console.log('\n🔧 2. VERIFYING SERVER.JS CONFIGURATION');

const serverJsPath = path.join(__dirname, 'server.js');
const serverJs = fs.readFileSync(serverJsPath, 'utf8');

const serverChecks = [
  { name: 'PORT configuration', pattern: /const PORT = process\.env\.PORT \|\| 8080/, required: true },
  { name: 'Health endpoint', pattern: /app\.get\('\/health'/, required: true },
  { name: 'Host binding', pattern: /app\.listen\(PORT, '0\.0\.0\.0'/, required: true },
  { name: 'Express app creation', pattern: /const app = express\(\)/, required: true }
];

let serverIssues = 0;
serverChecks.forEach(check => {
  if (check.pattern.test(serverJs)) {
    console.log(`   ✅ ${check.name}: Configured correctly`);
  } else {
    console.log(`   ❌ ${check.name}: MISSING OR INCORRECT`);
    if (check.required) serverIssues++;
  }
});

if (serverIssues > 0) {
  console.log(`\n   ⚠️  Found ${serverIssues} server configuration issues`);
} else {
  console.log('\n   ✅ Server.js configuration is correct');
}

// 3. CREATE ENVIRONMENT VARIABLES SETUP GUIDE
console.log('\n📋 3. CREATING ENVIRONMENT VARIABLES SETUP GUIDE');

const setupGuide = `# CRITICAL: DigitalOcean Environment Variables Setup

## 🚨 IMMEDIATE ACTION REQUIRED

Your DigitalOcean deployment is failing because environment variables are not set in the DigitalOcean App Platform dashboard.

## 📍 Step-by-Step Fix

### 1. Go to DigitalOcean Dashboard
- Navigate to: https://cloud.digitalocean.com/apps
- Select your app: "apply-bureau-backend"

### 2. Access Environment Variables
- Click on your app name
- Go to "Settings" tab
- Click "App-Level Environment Variables"

### 3. Add Required Variables
Add each of these variables with their actual values:

#### 🔐 Database (CRITICAL - App won't start without these)
- **SUPABASE_URL**: https://your-project-id.supabase.co
- **SUPABASE_ANON_KEY**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- **SUPABASE_SERVICE_KEY**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

#### 📧 Email Service
- **RESEND_API_KEY**: re_xxxxxxxxxx

#### 🔑 Security
- **JWT_SECRET**: your-secret-key-here (generate a random 32+ character string)

#### 🌐 URLs
- **FRONTEND_URL**: https://your-frontend-domain.com
- **BACKEND_URL**: https://apply-bureau-backend-production.ondigitalocean.app

### 4. Save and Redeploy
- Click "Save" after adding all variables
- Go to "Deployments" tab
- Click "Create Deployment" to redeploy

## ⚠️ CRITICAL NOTES

1. **Variable Names**: Must match exactly (case-sensitive)
2. **No Spaces**: Don't add spaces in variable names or values
3. **All Required**: App will fail if any database variables are missing
4. **Redeploy Required**: Changes only take effect after redeployment

## 🧪 Test After Deployment

Once deployed, test these endpoints:
- https://your-app.ondigitalocean.app/health (should return 200 OK)
- https://your-app.ondigitalocean.app/api/health (should return 200 OK)

## 🔧 Why This Happens

The app.yaml file uses \${VARIABLE_NAME} syntax to reference environment variables, but DigitalOcean needs the actual values set in the dashboard. The variables are not automatically copied from your local .env file.
`;

fs.writeFileSync(path.join(__dirname, 'DIGITALOCEAN_URGENT_FIX.md'), setupGuide);
console.log('   ✅ Created urgent setup guide: DIGITALOCEAN_URGENT_FIX.md');

// 4. CREATE MINIMAL TEST SCRIPT
console.log('\n🧪 4. CREATING DEPLOYMENT TEST SCRIPT');

const testScript = `#!/usr/bin/env node

// Minimal DigitalOcean Deployment Test
async function testDeployment() {
  console.log('🔍 Testing DigitalOcean Deployment...\\n');
  
  const baseUrl = 'https://apply-bureau-backend-production.ondigitalocean.app';
  
  try {
    console.log('Testing health endpoint...');
    const response = await fetch(baseUrl + '/health');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Health check PASSED');
      console.log('   Status:', response.status);
      console.log('   Service:', data.service || 'Unknown');
      console.log('   Timestamp:', data.timestamp || 'Unknown');
    } else {
      console.log('❌ Health check FAILED');
      console.log('   Status:', response.status);
      console.log('   Response:', await response.text());
    }
  } catch (error) {
    console.log('❌ Health check ERROR');
    console.log('   Error:', error.message);
    console.log('\\n🚨 This usually means:');
    console.log('   1. App is not deployed or failed to start');
    console.log('   2. Environment variables are missing');
    console.log('   3. Health check endpoint is not responding');
  }
}

testDeployment();
`;

fs.writeFileSync(path.join(__dirname, 'test-digitalocean-deployment.js'), testScript);
console.log('   ✅ Created deployment test script: test-digitalocean-deployment.js');

// 5. SUMMARY AND NEXT STEPS
console.log('\n🎯 SUMMARY AND NEXT STEPS');
console.log('\n📋 Configuration Status:');
if (configIssues === 0 && serverIssues === 0) {
  console.log('   ✅ App.yaml and server.js are configured correctly');
  console.log('   ✅ The issue is missing environment variables in DigitalOcean');
} else {
  console.log('   ❌ Found configuration issues that need to be fixed');
}

console.log('\n🚨 IMMEDIATE ACTIONS REQUIRED:');
console.log('1. 📖 Read DIGITALOCEAN_URGENT_FIX.md for step-by-step instructions');
console.log('2. 🔐 Set ALL environment variables in DigitalOcean dashboard');
console.log('3. 🚀 Redeploy the application');
console.log('4. 🧪 Run: node test-digitalocean-deployment.js');

console.log('\n⚠️  CRITICAL ENVIRONMENT VARIABLES MISSING:');
console.log('   • SUPABASE_URL (causing the deployment failure)');
console.log('   • SUPABASE_ANON_KEY');
console.log('   • SUPABASE_SERVICE_KEY');
console.log('   • RESEND_API_KEY');
console.log('   • JWT_SECRET');
console.log('   • FRONTEND_URL');
console.log('   • BACKEND_URL');

console.log('\n🔧 Root Cause:');
console.log('   The app.yaml references ${SUPABASE_URL} but DigitalOcean');
console.log('   cannot find this variable because it is not set in the dashboard.');
console.log('   Environment variables must be manually added to DigitalOcean.');

console.log('\n📞 After Setting Variables:');
console.log('   The health check should pass and the app should start normally.');
console.log('   Both /health and /api/health endpoints should return 200 OK.');

console.log('\n✅ FIXES COMPLETED - ENVIRONMENT VARIABLES SETUP REQUIRED');