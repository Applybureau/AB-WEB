#!/usr/bin/env node

/**
 * Setup script for Apply Bureau Backend
 * This script helps with initial setup and verification
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

console.log('🚀 Apply Bureau Backend Setup\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found. Please create one based on the template.');
  process.exit(1);
}

// Load environment variables
require('dotenv').config({ path: envPath });

// Check required environment variables
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_KEY',
  'RESEND_API_KEY',
  'JWT_SECRET'
];

console.log('📋 Checking environment variables...');
let missingVars = [];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName] || process.env[varName].includes('<') || process.env[varName].includes('your_')) {
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  console.error('❌ Missing or incomplete environment variables:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\nPlease update your .env file with actual values.');
  process.exit(1);
}

console.log('✅ Environment variables configured');

// Test Supabase connection
console.log('\n🔗 Testing Supabase connection...');
const { supabaseAdmin } = require('../utils/supabase');

async function testSupabase() {
  try {
    const { data, error } = await supabaseAdmin
      .from('clients')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      console.log('💡 Make sure you have run the SQL setup scripts in your Supabase dashboard');
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection error:', error.message);
    return false;
  }
}

// Generate admin password hash
function generateAdminHash(password) {
  return bcrypt.hashSync(password, 10);
}

// Main setup function
async function setup() {
  const supabaseOk = await testSupabase();
  
  if (!supabaseOk) {
    console.log('\n📝 Setup Steps:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the contents of supabase-setup.sql');
    console.log('4. Run the contents of supabase-storage-setup.sql');
    console.log('5. Update the admin user in the SQL with your details');
    console.log('6. Run this setup script again');
    return;
  }

  // Check if logo file exists
  const logoPath = path.join(__dirname, '..', 'emails', 'assets', 'logo.png');
  if (fs.existsSync(logoPath)) {
    console.log('✅ Logo file found');
  } else {
    console.log('⚠️  Logo file not found at emails/assets/logo.png');
    console.log('   Email templates will use a placeholder');
  }

  // Check email templates
  const templatesDir = path.join(__dirname, '..', 'emails', 'templates');
  const requiredTemplates = [
    'signup_invite.html',
    'consultation_scheduled.html',
    'application_status_update.html',
    'onboarding_completion.html'
  ];

  console.log('\n📧 Checking email templates...');
  let allTemplatesExist = true;

  requiredTemplates.forEach(template => {
    const templatePath = path.join(templatesDir, template);
    if (fs.existsSync(templatePath)) {
      console.log(`✅ ${template}`);
    } else {
      console.log(`❌ ${template} missing`);
      allTemplatesExist = false;
    }
  });

  if (!allTemplatesExist) {
    console.error('\n❌ Some email templates are missing');
    return;
  }

  console.log('\n🎉 Setup completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Install dependencies: npm install');
  console.log('2. Start the server: npm run dev');
  console.log('3. Test the health endpoint: GET /health');
  console.log('4. Create your first admin user via SQL or API');
  
  console.log('\n🔧 Admin Password Hash Generator:');
  console.log('If you need to create an admin user, use this hash for password "admin123":');
  console.log(generateAdminHash('admin123'));
  console.log('\n⚠️  Remember to change the default password after first login!');
}

// Run setup
setup().catch(error => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});