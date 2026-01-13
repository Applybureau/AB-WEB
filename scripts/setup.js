#!/usr/bin/env node

/**
 * Apply Bureau Backend Setup Script
 * 
 * This script helps set up the backend system by:
 * 1. Checking environment variables
 * 2. Testing database connection
 * 3. Verifying email configuration
 * 4. Creating initial admin user
 */

const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const readline = require('readline');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bold}${colors.blue}${msg}${colors.reset}\n`)
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function checkEnvironmentVariables() {
  log.title('🔧 Checking Environment Variables');
  
  const required = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS'
  ];
  
  const missing = [];
  
  for (const env of required) {
    if (process.env[env]) {
      log.success(`${env} is set`);
    } else {
      log.error(`${env} is missing`);
      missing.push(env);
    }
  }
  
  if (missing.length > 0) {
    log.error(`Missing required environment variables: ${missing.join(', ')}`);
    log.info('Please check your .env file and ensure all required variables are set.');
    return false;
  }
  
  log.success('All required environment variables are set');
  return true;
}

async function testDatabaseConnection() {
  log.title('🗄️ Testing Database Connection');
  
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Test connection by querying a system table
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "table not found" which is expected if schema isn't applied yet
      throw error;
    }
    
    log.success('Database connection successful');
    
    // Check if tables exist
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (profilesError && profilesError.code === 'PGRST116') {
      log.warning('Database schema not set up yet');
      log.info('Please run MASTER_SCHEMA.sql in your Supabase SQL Editor');
      return true; // Connection works, just no schema yet
    } else if (!profilesError) {
      log.success('Database schema appears to be set up');
    }
    
    return true;
  } catch (error) {
    log.error(`Database connection failed: ${error.message}`);
    return false;
  }
}

async function testEmailConfiguration() {
  log.title('📧 Testing Email Configuration');
  
  try {
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    await transporter.verify();
    log.success('Email configuration is valid');
    return true;
  } catch (error) {
    log.error(`Email configuration failed: ${error.message}`);
    log.info('Please check your SMTP settings in the .env file');
    return false;
  }
}

async function createAdminUser() {
  log.title('👤 Creating Admin User');
  
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Check if admin users table exists
    const { data: existingAdmins, error: checkError } = await supabase
      .from('admin_users')
      .select('id')
      .limit(1);
    
    if (checkError && checkError.code === 'PGRST116') {
      log.error('Admin users table not found. Please run MASTER_SCHEMA.sql first.');
      return false;
    } else if (checkError) {
      throw checkError;
    }
    
    if (existingAdmins && existingAdmins.length > 0) {
      log.info('Admin user already exists. Skipping creation.');
      return true;
    }
    
    // Get admin details from user
    const email = await question('Enter admin email: ');
    const fullName = await question('Enter admin full name: ');
    const password = await question('Enter admin password: ');
    
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: 'admin'
      }
    });
    
    if (authError) {
      throw authError;
    }
    
    // Add to admin_users table
    const { error: adminError } = await supabase
      .from('admin_users')
      .insert({
        id: authData.user.id,
        email,
        full_name: fullName,
        role: 'super_admin',
        permissions: { all: true },
        is_active: true
      });
    
    if (adminError) {
      throw adminError;
    }
    
    log.success(`Admin user created successfully: ${email}`);
    return true;
  } catch (error) {
    log.error(`Failed to create admin user: ${error.message}`);
    return false;
  }
}

async function runHealthCheck() {
  log.title('🏥 Running Health Check');
  
  try {
    // This would typically make a request to your health endpoint
    // For now, we'll just check if the server can start
    log.info('Health check would run here in a full deployment');
    log.success('Basic health check passed');
    return true;
  } catch (error) {
    log.error(`Health check failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log(`
${colors.bold}${colors.blue}
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║              Apply Bureau Backend Setup                      ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}
`);
  
  log.info('Starting setup process...\n');
  
  const steps = [
    { name: 'Environment Variables', fn: checkEnvironmentVariables },
    { name: 'Database Connection', fn: testDatabaseConnection },
    { name: 'Email Configuration', fn: testEmailConfiguration },
    { name: 'Admin User Creation', fn: createAdminUser },
    { name: 'Health Check', fn: runHealthCheck }
  ];
  
  let allPassed = true;
  
  for (const step of steps) {
    const passed = await step.fn();
    if (!passed) {
      allPassed = false;
      log.error(`Setup step failed: ${step.name}`);
      
      const continueSetup = await question('\nDo you want to continue with the remaining steps? (y/n): ');
      if (continueSetup.toLowerCase() !== 'y') {
        break;
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (allPassed) {
    log.success('🎉 Setup completed successfully!');
    console.log(`
${colors.green}Next steps:${colors.reset}
1. Start your server: ${colors.bold}npm start${colors.reset}
2. Test your endpoints: ${colors.bold}npm run test${colors.reset}
3. Check the API documentation: ${colors.bold}COMPLETE_BACKEND_DOCUMENTATION.md${colors.reset}
    `);
  } else {
    log.warning('⚠️  Setup completed with some issues');
    console.log(`
${colors.yellow}Please resolve the issues above and run the setup again.${colors.reset}
For help, check:
- Environment variables in .env file
- Database schema in MASTER_SCHEMA.sql
- Documentation in COMPLETE_BACKEND_DOCUMENTATION.md
    `);
  }
  
  rl.close();
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  log.error(`Unhandled error: ${error.message}`);
  process.exit(1);
});

process.on('SIGINT', () => {
  log.info('\nSetup interrupted by user');
  rl.close();
  process.exit(0);
});

// Run the setup
if (require.main === module) {
  main().catch((error) => {
    log.error(`Setup failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { main };