#!/usr/bin/env node

/**
 * Create First Admin User Script
 * 
 * This script helps create the first admin user after running the schema.
 * It will:
 * 1. Create a user in Supabase Auth
 * 2. Add them to the admin_users table
 */

const { createClient } = require('@supabase/supabase-js');
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

async function main() {
  console.log(`
${colors.bold}${colors.blue}
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║              Create First Admin User                         ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}
`);

  try {
    // Check environment variables
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      log.error('Missing required environment variables:');
      log.error('- SUPABASE_URL');
      log.error('- SUPABASE_SERVICE_ROLE_KEY');
      process.exit(1);
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Check if schema is set up
    log.info('Checking database schema...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (profilesError && profilesError.code === 'PGRST116') {
      log.error('Database schema not found. Please run SIMPLE_MASTER_SCHEMA.sql first.');
      process.exit(1);
    }

    const { data: adminUsers, error: adminError } = await supabase
      .from('admin_users')
      .select('count')
      .limit(1);

    if (adminError && adminError.code === 'PGRST116') {
      log.error('Admin users table not found. Please run SIMPLE_MASTER_SCHEMA.sql first.');
      process.exit(1);
    }

    log.success('Database schema verified');

    // Check if admin already exists
    const { data: existingAdmins, error: checkError } = await supabase
      .from('admin_users')
      .select('id, email')
      .limit(1);

    if (checkError) {
      throw checkError;
    }

    if (existingAdmins && existingAdmins.length > 0) {
      log.warning(`Admin user already exists: ${existingAdmins[0].email}`);
      const proceed = await question('Do you want to create another admin? (y/n): ');
      if (proceed.toLowerCase() !== 'y') {
        log.info('Exiting...');
        process.exit(0);
      }
    }

    // Get admin details
    log.title('Enter Admin Details');
    const email = await question('Admin email: ');
    const fullName = await question('Admin full name: ');
    const password = await question('Admin password (min 6 characters): ');

    if (password.length < 6) {
      log.error('Password must be at least 6 characters long');
      process.exit(1);
    }

    // Create user in Supabase Auth
    log.info('Creating user in Supabase Auth...');
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

    log.success(`User created in Auth: ${authData.user.id}`);

    // Add to admin_users table
    log.info('Adding to admin_users table...');
    const { error: insertError } = await supabase
      .from('admin_users')
      .insert({
        id: authData.user.id,
        email,
        full_name: fullName,
        role: 'super_admin',
        permissions: { all: true },
        is_active: true
      });

    if (insertError) {
      throw insertError;
    }

    log.success('Admin user created successfully!');
    
    console.log(`
${colors.green}✅ Setup Complete!${colors.reset}

Admin Details:
- Email: ${email}
- Name: ${fullName}
- Role: Super Admin
- User ID: ${authData.user.id}

${colors.yellow}Next Steps:${colors.reset}
1. Test login with these credentials
2. Start your backend server: ${colors.bold}npm start${colors.reset}
3. Test the admin endpoints
4. Create additional admin users if needed

${colors.blue}Admin Login URL:${colors.reset} ${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/login
    `);

  } catch (error) {
    log.error(`Failed to create admin user: ${error.message}`);
    
    if (error.message.includes('User already registered')) {
      log.info('A user with this email already exists. Try a different email or use the existing user.');
    }
    
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  log.error(`Unhandled error: ${error.message}`);
  process.exit(1);
});

process.on('SIGINT', () => {
  log.info('\nOperation cancelled by user');
  rl.close();
  process.exit(0);
});

if (require.main === module) {
  main();
}

module.exports = { main };