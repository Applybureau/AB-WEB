#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * Validates all required environment variables for DigitalOcean deployment
 */

const validateEnvironmentVariables = () => {
  console.log('🔍 Validating Environment Variables...\n');

  // Critical environment variables (app won't start without these)
  const critical = [
    { name: 'SUPABASE_URL', description: 'Supabase project URL' },
    { name: 'SUPABASE_ANON_KEY', description: 'Supabase anonymous key' },
    { name: 'SUPABASE_SERVICE_KEY', description: 'Supabase service role key' },
    { name: 'RESEND_API_KEY', description: 'Resend email service API key' },
    { name: 'JWT_SECRET', description: 'JWT token signing secret' }
  ];

  // Important environment variables (app will work but with limited functionality)
  const important = [
    { name: 'FRONTEND_URL', description: 'Frontend application URL' },
    { name: 'BACKEND_URL', description: 'Backend application URL' }
  ];

  // System environment variables (usually set automatically)
  const system = [
    { name: 'NODE_ENV', description: 'Node.js environment' },
    { name: 'PORT', description: 'Server port number' }
  ];

  let hasErrors = false;
  let hasWarnings = false;

  // Check critical variables
  console.log('🚨 CRITICAL VARIABLES (Required for startup):');
  const missingCritical = [];
  
  critical.forEach(({ name, description }) => {
    if (process.env[name]) {
      console.log(`   ✅ ${name}: Set`);
    } else {
      console.log(`   ❌ ${name}: MISSING - ${description}`);
      missingCritical.push(name);
      hasErrors = true;
    }
  });

  // Check important variables
  console.log('\n⚠️  IMPORTANT VARIABLES (Recommended):');
  const missingImportant = [];
  
  important.forEach(({ name, description }) => {
    if (process.env[name]) {
      console.log(`   ✅ ${name}: Set`);
    } else {
      console.log(`   ⚠️  ${name}: MISSING - ${description}`);
      missingImportant.push(name);
      hasWarnings = true;
    }
  });

  // Check system variables
  console.log('\n⚙️  SYSTEM VARIABLES:');
  
  system.forEach(({ name, description }) => {
    if (process.env[name]) {
      console.log(`   ✅ ${name}: ${process.env[name]}`);
    } else {
      console.log(`   ⚠️  ${name}: Not set - ${description}`);
    }
  });

  // Summary
  console.log('\n📋 VALIDATION SUMMARY:');
  
  if (hasErrors) {
    console.log(`   ❌ ${missingCritical.length} critical variables missing`);
    console.log(`   🚫 Application CANNOT start`);
  } else {
    console.log('   ✅ All critical variables present');
    console.log('   🚀 Application CAN start');
  }

  if (hasWarnings) {
    console.log(`   ⚠️  ${missingImportant.length} important variables missing`);
    console.log('   📝 Some features may not work correctly');
  }

  // DigitalOcean instructions
  if (hasErrors || hasWarnings) {
    console.log('\n🔧 DIGITALOCEAN SETUP INSTRUCTIONS:');
    console.log('   1. Go to: https://cloud.digitalocean.com/apps');
    console.log('   2. Select your app → Settings → App-Level Environment Variables');
    console.log('   3. Add missing variables:');
    
    [...missingCritical, ...missingImportant].forEach(name => {
      console.log(`      • ${name}`);
    });
    
    console.log('   4. Click "Save" and redeploy');
  }

  return !hasErrors;
};

// Run validation if called directly
if (require.main === module) {
  const isValid = validateEnvironmentVariables();
  process.exit(isValid ? 0 : 1);
}

module.exports = { validateEnvironmentVariables };