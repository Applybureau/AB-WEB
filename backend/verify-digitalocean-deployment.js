#!/usr/bin/env node

// DigitalOcean Deployment Verification Script with Environment Check

async function checkEnvironmentVariables() {
  console.log('🔍 Checking Environment Variables...');
  
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_KEY',
    'RESEND_API_KEY',
    'JWT_SECRET',
    'FRONTEND_URL',
    'BACKEND_URL'
  ];
  
  const missingVars = [];
  
  requiredEnvVars.forEach(envVar => {
    if (process.env[envVar]) {
      console.log(`✅ ${envVar}: Set`);
    } else {
      console.log(`❌ ${envVar}: MISSING`);
      missingVars.push(envVar);
    }
  });
  
  if (missingVars.length > 0) {
    console.log(`\n⚠️  Missing ${missingVars.length} environment variables:`);
    missingVars.forEach(envVar => {
      console.log(`   • ${envVar}`);
    });
    console.log('\nPlease set these in DigitalOcean App Platform dashboard.');
    return false;
  }
  
  console.log('\n✅ All environment variables are set!');
  return true;
}

async function verifyDeployment() {
  console.log('🔍 Verifying DigitalOcean deployment...\n');
  
  // First check environment variables
  const envCheck = await checkEnvironmentVariables();
  if (!envCheck) {
    console.log('\n❌ Environment variables check failed. Fix these before testing endpoints.');
    return;
  }
  
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
  
  console.log(`\n🌐 Testing endpoints at: ${baseUrl}\n`);
  
  for (const check of checks) {
    try {
      console.log(`Testing ${check.name}...`);
      
      const options = {
        method: check.method || 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      const response = await fetch(`${baseUrl}${check.url}`, options);
      
      if (response.status === check.expected) {
        console.log(`✅ ${check.name}: PASSED (${response.status})`);
      } else {
        console.log(`❌ ${check.name}: FAILED (${response.status}, expected ${check.expected})`);
        
        // Try to get response body for debugging
        try {
          const body = await response.text();
          console.log(`   Response: ${body.substring(0, 200)}...`);
        } catch (e) {
          console.log(`   Could not read response body`);
        }
      }
      
    } catch (error) {
      console.log(`❌ ${check.name}: ERROR - ${error.message}`);
    }
  }
  
  console.log('\n🎯 Deployment verification completed!');
  
  if (!envCheck) {
    console.log('\n📋 Next Steps:');
    console.log('1. Set missing environment variables in DigitalOcean dashboard');
    console.log('2. Redeploy the application');
    console.log('3. Run this script again to verify');
  }
}

// Run if called directly
if (require.main === module) {
  verifyDeployment();
}

module.exports = { verifyDeployment, checkEnvironmentVariables };
