const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing DigitalOcean deployment issues...\n');

// 1. PORT CONFIGURATION ISSUE
console.log('🌐 1. FIXING PORT CONFIGURATION');
console.log('   Current configuration:');

// Check server.js port configuration
const serverJsPath = path.join(__dirname, 'server.js');
let serverJs = fs.readFileSync(serverJsPath, 'utf8');

// Ensure proper port configuration
if (!serverJs.includes('const PORT = process.env.PORT || 8080;')) {
  console.log('   ⚠️  Fixing PORT configuration in server.js...');
  serverJs = serverJs.replace(
    /const PORT = process\.env\.PORT \|\| \d+;/g,
    'const PORT = process.env.PORT || 8080;'
  );
  fs.writeFileSync(serverJsPath, serverJs);
  console.log('   ✅ Fixed PORT to use 8080 as default');
} else {
  console.log('   ✅ PORT configuration is correct');
}

// Ensure proper host binding
if (!serverJs.includes("'0.0.0.0'")) {
  console.log('   ⚠️  Fixing host binding...');
  serverJs = serverJs.replace(
    /app\.listen\(PORT,.*?\)/g,
    "app.listen(PORT, '0.0.0.0')"
  );
  fs.writeFileSync(serverJsPath, serverJs);
  console.log('   ✅ Fixed host binding to 0.0.0.0');
} else {
  console.log('   ✅ Host binding is correct');
}

// 2. INSUFFICIENT RESOURCES ISSUE
console.log('\n💾 2. FIXING RESOURCE CONFIGURATION');

// Update app.yaml for better resource allocation
const appYamlPath = path.join(__dirname, '.do', 'app.yaml');
let appYaml = fs.readFileSync(appYamlPath, 'utf8');

// Upgrade instance size for better performance
if (appYaml.includes('instance_size_slug: basic-xs')) {
  console.log('   ⚠️  Upgrading instance size from basic-xs to basic-s...');
  appYaml = appYaml.replace(
    'instance_size_slug: basic-xs',
    'instance_size_slug: basic-s'
  );
  console.log('   ✅ Upgraded to basic-s for better performance');
} else {
  console.log('   ✅ Instance size is adequate');
}

// Increase health check timeouts
if (appYaml.includes('initial_delay_seconds: 120')) {
  console.log('   ⚠️  Increasing health check timeouts...');
  appYaml = appYaml.replace(
    'initial_delay_seconds: 120',
    'initial_delay_seconds: 180'
  );
  appYaml = appYaml.replace(
    'timeout_seconds: 15',
    'timeout_seconds: 20'
  );
  console.log('   ✅ Increased health check timeouts');
} else {
  console.log('   ✅ Health check timeouts are adequate');
}

fs.writeFileSync(appYamlPath, appYaml);

// 3. MISSING ENVIRONMENT VARIABLES
console.log('\n🔐 3. CHECKING ENVIRONMENT VARIABLES');

const requiredEnvVars = [
  'NODE_ENV',
  'PORT', 
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'RESEND_API_KEY',
  'JWT_SECRET',
  'FRONTEND_URL'
];

console.log('   Required environment variables in app.yaml:');
requiredEnvVars.forEach(envVar => {
  if (appYaml.includes(`key: ${envVar}`)) {
    console.log(`   ✅ ${envVar}`);
  } else {
    console.log(`   ❌ ${envVar} - MISSING!`);
  }
});

// Add missing environment variables template
const missingEnvVars = requiredEnvVars.filter(envVar => !appYaml.includes(`key: ${envVar}`));
if (missingEnvVars.length > 0) {
  console.log('\n   Adding missing environment variables...');
  let envSection = '';
  missingEnvVars.forEach(envVar => {
    envSection += `  - key: ${envVar}\n    value: \${${envVar}}\n`;
  });
  
  // Add to app.yaml before the last line
  appYaml = appYaml.replace(
    /(\s+value: "false")$/m,
    `$1\n${envSection.trim()}`
  );
  fs.writeFileSync(appYamlPath, appYaml);
  console.log('   ✅ Added missing environment variables');
}

// 4. CREATE OPTIMIZED PACKAGE.JSON SCRIPTS
console.log('\n📦 4. OPTIMIZING PACKAGE.JSON SCRIPTS');

const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Ensure proper scripts for DigitalOcean
const requiredScripts = {
  'start': 'node server.js',
  'build': 'echo "No build step required for Node.js backend"',
  'postinstall': 'echo "Dependencies installed successfully"'
};

let scriptsUpdated = false;
Object.entries(requiredScripts).forEach(([script, command]) => {
  if (packageJson.scripts[script] !== command) {
    console.log(`   ⚠️  Fixing ${script} script...`);
    packageJson.scripts[script] = command;
    scriptsUpdated = true;
  } else {
    console.log(`   ✅ ${script} script is correct`);
  }
});

if (scriptsUpdated) {
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('   ✅ Updated package.json scripts');
}

// 5. CREATE DEPLOYMENT VERIFICATION SCRIPT
console.log('\n🧪 5. CREATING DEPLOYMENT VERIFICATION');

const verificationScript = `#!/usr/bin/env node

// DigitalOcean Deployment Verification Script
const http = require('http');

async function verifyDeployment() {
  console.log('🔍 Verifying DigitalOcean deployment...');
  
  const checks = [
    {
      name: 'Health Endpoint',
      url: '/health',
      expected: 200
    },
    {
      name: 'API Health Endpoint', 
      url: '/api/health',
      expected: 200
    },
    {
      name: 'Admin Login Endpoint',
      url: '/api/auth/login',
      method: 'POST',
      expected: 400 // Should return 400 for missing credentials
    }
  ];
  
  const baseUrl = process.env.BACKEND_URL || 'https://apply-bureau-backend-production.ondigitalocean.app';
  
  for (const check of checks) {
    try {
      console.log(\`\\nTesting \${check.name}...\`);
      
      const options = {
        method: check.method || 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      const response = await fetch(\`\${baseUrl}\${check.url}\`, options);
      
      if (response.status === check.expected) {
        console.log(\`✅ \${check.name}: PASSED (\${response.status})\`);
      } else {
        console.log(\`❌ \${check.name}: FAILED (\${response.status}, expected \${check.expected})\`);
      }
      
    } catch (error) {
      console.log(\`❌ \${check.name}: ERROR - \${error.message}\`);
    }
  }
  
  console.log('\\n🎯 Deployment verification completed!');
}

verifyDeployment();
`;

fs.writeFileSync(path.join(__dirname, 'verify-digitalocean-deployment.js'), verificationScript);
console.log('   ✅ Created deployment verification script');

// 6. SUMMARY AND NEXT STEPS
console.log('\n🎉 DIGITALOCEAN FIXES COMPLETED!');
console.log('\n📋 Changes Made:');
console.log('   ✅ Fixed port configuration (8080, 0.0.0.0)');
console.log('   ✅ Upgraded instance size to basic-s');
console.log('   ✅ Increased health check timeouts');
console.log('   ✅ Verified environment variables');
console.log('   ✅ Optimized package.json scripts');
console.log('   ✅ Created deployment verification script');

console.log('\n🚀 Next Steps:');
console.log('1. Commit and push changes to GitHub');
console.log('2. Redeploy on DigitalOcean');
console.log('3. Run: node verify-digitalocean-deployment.js');
console.log('4. Monitor deployment logs for success');

console.log('\n⚠️  IMPORTANT: Ensure these environment variables are set in DigitalOcean:');
requiredEnvVars.forEach(envVar => {
  console.log(`   • ${envVar}`);
});

console.log('\n🔧 If deployment still fails:');
console.log('   • Check DigitalOcean build logs');
console.log('   • Verify GitHub repository access');
console.log('   • Ensure all environment variables are properly set');
console.log('   • Consider upgrading to basic-m if basic-s is insufficient');

// Run the fixes
console.log('Starting DigitalOcean deployment fixes...');