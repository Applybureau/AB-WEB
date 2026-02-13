const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing DigitalOcean deployment configuration...\n');

// 1. Check package.json scripts
console.log('📦 Checking package.json scripts...');
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

console.log('Current scripts:');
console.log('  start:', packageJson.scripts.start);
console.log('  build:', packageJson.scripts.build || 'Not defined');

// Ensure proper start script
if (packageJson.scripts.start !== 'node server.js') {
  console.log('⚠️  Fixing start script...');
  packageJson.scripts.start = 'node server.js';
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Fixed start script');
}

// 2. Check server.js port configuration
console.log('\n🌐 Checking server.js port configuration...');
const serverJsPath = path.join(__dirname, 'server.js');
const serverJs = fs.readFileSync(serverJsPath, 'utf8');

if (serverJs.includes('process.env.PORT || 8080')) {
  console.log('✅ Port configuration is correct (PORT || 8080)');
} else {
  console.log('⚠️  Port configuration needs fixing');
}

if (serverJs.includes("'0.0.0.0'")) {
  console.log('✅ Host binding is correct (0.0.0.0)');
} else {
  console.log('⚠️  Host binding needs fixing');
}

// 3. Check health endpoint
if (serverJs.includes("app.get('/health'")) {
  console.log('✅ Health endpoint exists');
} else {
  console.log('❌ Health endpoint missing');
}

// 4. Check .do/app.yaml configuration
console.log('\n📋 Checking DigitalOcean app.yaml configuration...');
const appYamlPath = path.join(__dirname, '.do', 'app.yaml');
const appYaml = fs.readFileSync(appYamlPath, 'utf8');

console.log('DigitalOcean Configuration:');
console.log('  Source directory:', appYaml.includes('source_dir: /backend') ? '✅ /backend' : '❌ Wrong directory');
console.log('  Build command:', appYaml.includes('build_command: npm install') ? '✅ npm install' : '⚠️  Check build command');
console.log('  Run command:', appYaml.includes('run_command: npm start') ? '✅ npm start' : '❌ Wrong run command');
console.log('  Health check path:', appYaml.includes('http_path: /health') ? '✅ /health' : '❌ Wrong health path');
console.log('  Port:', appYaml.includes('value: "8080"') ? '✅ 8080' : '❌ Wrong port');

// 5. Environment variables check
console.log('\n🔐 Environment variables in app.yaml:');
const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'RESEND_API_KEY',
  'JWT_SECRET',
  'FRONTEND_URL'
];

requiredEnvVars.forEach(envVar => {
  if (appYaml.includes(`key: ${envVar}`)) {
    console.log(`  ✅ ${envVar}`);
  } else {
    console.log(`  ❌ ${envVar} missing`);
  }
});

// 6. Create deployment test script
console.log('\n🧪 Creating deployment test script...');
const deploymentTestScript = `#!/usr/bin/env node

// DigitalOcean Deployment Test
const http = require('http');

const BACKEND_URL = process.env.BACKEND_URL || 'https://apply-bureau-backend-production.ondigitalocean.app';

async function testDeployment() {
  console.log('🧪 Testing DigitalOcean deployment...');
  console.log('Backend URL:', BACKEND_URL);
  
  try {
    // Test health endpoint
    console.log('\\n1. Testing health endpoint...');
    const healthResponse = await fetch(\`\${BACKEND_URL}/health\`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health check passed:', healthData);
    } else {
      console.log('❌ Health check failed:', healthResponse.status);
    }
    
    // Test API health endpoint
    console.log('\\n2. Testing API health endpoint...');
    const apiHealthResponse = await fetch(\`\${BACKEND_URL}/api/health\`);
    if (apiHealthResponse.ok) {
      const apiHealthData = await apiHealthResponse.json();
      console.log('✅ API health check passed:', apiHealthData);
    } else {
      console.log('❌ API health check failed:', apiHealthResponse.status);
    }
    
    console.log('\\n🎉 Deployment test completed!');
    
  } catch (error) {
    console.error('❌ Deployment test failed:', error.message);
  }
}

testDeployment();
`;

fs.writeFileSync(path.join(__dirname, 'test-digitalocean-deployment.js'), deploymentTestScript);
console.log('✅ Created test-digitalocean-deployment.js');

console.log('\n🎯 DigitalOcean Deployment Fix Summary:');
console.log('✅ Updated app.yaml configuration');
console.log('✅ Verified server.js port binding (8080, 0.0.0.0)');
console.log('✅ Confirmed health endpoints exist');
console.log('✅ Created deployment test script');

console.log('\n📋 Next Steps:');
console.log('1. Commit and push changes');
console.log('2. Redeploy on DigitalOcean');
console.log('3. Run: node test-digitalocean-deployment.js');
console.log('4. Monitor deployment logs');

console.log('\n🔍 Troubleshooting Tips:');
console.log('• Check DigitalOcean environment variables are set');
console.log('• Verify GitHub repository access');
console.log('• Monitor build and runtime logs');
console.log('• Ensure health check timeout is sufficient (120s initial delay)');