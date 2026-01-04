#!/usr/bin/env node

/**
 * Production Deployment Readiness Check
 * Verifies all requirements for production deployment
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Production Deployment Readiness Check\n');

let checks = [];
let warnings = [];
let errors = [];

// Check Node.js version
function checkNodeVersion() {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion >= 16) {
    checks.push('✅ Node.js version compatible (v' + nodeVersion + ')');
  } else {
    errors.push('❌ Node.js version too old (v' + nodeVersion + '). Requires v16+');
  }
}

// Check environment variables
function checkEnvironmentVariables() {
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_KEY',
    'RESEND_API_KEY',
    'JWT_SECRET',
    'FRONTEND_URL'
  ];

  const productionVars = [
    'NODE_ENV'
  ];

  let missingRequired = [];
  let missingProduction = [];

  requiredVars.forEach(varName => {
    if (!process.env[varName] || process.env[varName].includes('<') || process.env[varName].includes('your_')) {
      missingRequired.push(varName);
    }
  });

  productionVars.forEach(varName => {
    if (!process.env[varName]) {
      missingProduction.push(varName);
    }
  });

  if (missingRequired.length === 0) {
    checks.push('✅ All required environment variables configured');
  } else {
    errors.push('❌ Missing required environment variables: ' + missingRequired.join(', '));
  }

  if (missingProduction.length === 0) {
    checks.push('✅ Production environment variables configured');
  } else {
    warnings.push('⚠️  Missing production environment variables: ' + missingProduction.join(', '));
  }

  // Check JWT secret strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32) {
    checks.push('✅ JWT secret is sufficiently strong');
  } else {
    errors.push('❌ JWT secret should be at least 32 characters long');
  }

  // Check NODE_ENV
  if (process.env.NODE_ENV === 'production') {
    checks.push('✅ NODE_ENV set to production');
  } else {
    warnings.push('⚠️  NODE_ENV not set to production');
  }
}

// Check dependencies
function checkDependencies() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (packageJson.dependencies && Object.keys(packageJson.dependencies).length > 0) {
      checks.push('✅ Dependencies defined in package.json');
    } else {
      errors.push('❌ No dependencies found in package.json');
    }

    // Check if node_modules exists
    if (fs.existsSync('node_modules')) {
      checks.push('✅ Dependencies installed');
    } else {
      errors.push('❌ Dependencies not installed. Run: npm install');
    }

    // Check for security vulnerabilities
    try {
      execSync('npm audit --audit-level=high', { stdio: 'pipe' });
      checks.push('✅ No high-severity security vulnerabilities');
    } catch (error) {
      warnings.push('⚠️  Security vulnerabilities detected. Run: npm audit fix');
    }

  } catch (error) {
    errors.push('❌ Cannot read package.json');
  }
}

// Check required files
function checkRequiredFiles() {
  const requiredFiles = [
    'server.js',
    'package.json',
    '.env',
    'routes/auth.js',
    'routes/dashboard.js',
    'routes/consultations.js',
    'routes/applications.js',
    'routes/notifications.js',
    'routes/upload.js',
    'utils/supabase.js',
    'utils/auth.js',
    'utils/email.js',
    'utils/validation.js',
    'utils/upload.js',
    'emails/templates/signup_invite.html',
    'emails/templates/consultation_scheduled.html',
    'emails/templates/application_status_update.html',
    'emails/templates/onboarding_completion.html'
  ];

  let missingFiles = [];

  requiredFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      missingFiles.push(file);
    }
  });

  if (missingFiles.length === 0) {
    checks.push('✅ All required files present');
  } else {
    errors.push('❌ Missing required files: ' + missingFiles.join(', '));
  }

  // Check logo file
  if (fs.existsSync('emails/assets/logo.png')) {
    checks.push('✅ Logo file present');
  } else {
    warnings.push('⚠️  Logo file missing (emails/assets/logo.png)');
  }
}

// Check database setup
async function checkDatabaseSetup() {
  try {
    const { supabaseAdmin } = require('../utils/supabase');
    
    // Test connection
    const { data, error } = await supabaseAdmin
      .from('clients')
      .select('count')
      .limit(1);
    
    if (error) {
      errors.push('❌ Database connection failed: ' + error.message);
      errors.push('💡 Make sure you have run the SQL setup scripts');
    } else {
      checks.push('✅ Database connection successful');
    }

    // Check if tables exist
    const tables = ['clients', 'consultations', 'applications', 'notifications', 'audit_logs'];
    for (const table of tables) {
      try {
        const { error: tableError } = await supabaseAdmin
          .from(table)
          .select('*')
          .limit(1);
        
        if (tableError && tableError.code === '42P01') {
          errors.push(`❌ Table '${table}' does not exist`);
        }
      } catch (err) {
        // Table might not exist
      }
    }

  } catch (error) {
    errors.push('❌ Cannot test database connection: ' + error.message);
  }
}

// Check email service
async function checkEmailService() {
  try {
    const { getEmailTemplate } = require('../utils/email');
    
    // Test template loading
    await getEmailTemplate('signup_invite');
    checks.push('✅ Email templates accessible');
    
    // Check Resend API key format
    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith('re_')) {
      checks.push('✅ Resend API key format valid');
    } else {
      warnings.push('⚠️  Resend API key format may be invalid');
    }
    
  } catch (error) {
    errors.push('❌ Email template test failed: ' + error.message);
  }
}

// Check port availability
function checkPort() {
  const port = process.env.PORT || 3000;
  
  try {
    const net = require('net');
    const server = net.createServer();
    
    server.listen(port, () => {
      server.close();
      checks.push(`✅ Port ${port} is available`);
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        warnings.push(`⚠️  Port ${port} is already in use`);
      } else {
        warnings.push(`⚠️  Port ${port} check failed: ${err.message}`);
      }
    });
    
  } catch (error) {
    warnings.push('⚠️  Cannot check port availability');
  }
}

// Check SSL/HTTPS configuration
function checkSSLConfiguration() {
  if (process.env.FRONTEND_URL && process.env.FRONTEND_URL.startsWith('https://')) {
    checks.push('✅ Frontend URL uses HTTPS');
  } else {
    warnings.push('⚠️  Frontend URL should use HTTPS in production');
  }
}

// Check memory and performance
function checkPerformance() {
  const memoryUsage = process.memoryUsage();
  const memoryMB = Math.round(memoryUsage.rss / 1024 / 1024);
  
  checks.push(`✅ Memory usage: ${memoryMB}MB`);
  
  if (memoryMB > 512) {
    warnings.push('⚠️  High memory usage detected');
  }
}

// Main check function
async function runChecks() {
  console.log('Running deployment readiness checks...\n');

  checkNodeVersion();
  checkEnvironmentVariables();
  checkDependencies();
  checkRequiredFiles();
  await checkDatabaseSetup();
  await checkEmailService();
  checkPort();
  checkSSLConfiguration();
  checkPerformance();

  // Display results
  console.log('\n📊 Deployment Readiness Report:\n');

  if (checks.length > 0) {
    console.log('✅ PASSED CHECKS:');
    checks.forEach(check => console.log('  ' + check));
    console.log('');
  }

  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    warnings.forEach(warning => console.log('  ' + warning));
    console.log('');
  }

  if (errors.length > 0) {
    console.log('❌ ERRORS:');
    errors.forEach(error => console.log('  ' + error));
    console.log('');
  }

  // Summary
  const total = checks.length + warnings.length + errors.length;
  const score = Math.round((checks.length / total) * 100);

  console.log(`📈 Readiness Score: ${score}%`);
  console.log(`✅ Passed: ${checks.length}`);
  console.log(`⚠️  Warnings: ${warnings.length}`);
  console.log(`❌ Errors: ${errors.length}`);

  if (errors.length === 0) {
    console.log('\n🎉 Ready for production deployment!');
    
    if (warnings.length > 0) {
      console.log('💡 Consider addressing warnings for optimal performance.');
    }
    
    console.log('\n📋 Deployment Commands:');
    console.log('  Heroku: git push heroku main');
    console.log('  Railway: railway up');
    console.log('  Render: git push origin main');
    console.log('  Docker: docker build -t apply-bureau-backend .');
    
  } else {
    console.log('\n❌ Not ready for deployment. Please fix the errors above.');
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help')) {
  console.log('Apply Bureau Backend Deployment Readiness Check');
  console.log('');
  console.log('Usage: node scripts/deploy-check.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --help     Show this help message');
  process.exit(0);
}

// Run checks
runChecks().catch(error => {
  console.error('❌ Deployment check failed:', error);
  process.exit(1);
});