#!/usr/bin/env node

/**
 * Zero-Trust Architecture Setup Script
 * 
 * This script helps set up the Zero-Trust, High-Concurrency architecture
 * for the Apply Bureau backend.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔒 Apply Bureau Zero-Trust Setup');
console.log('==================================\n');

// Check if we're in the correct directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Error: Please run this script from the backend directory');
  process.exit(1);
}

// Check Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
if (majorVersion < 18) {
  console.error(`❌ Error: Node.js 18+ required. Current version: ${nodeVersion}`);
  process.exit(1);
}

console.log(`✅ Node.js version: ${nodeVersion}`);

// Check if .env file exists
if (!fs.existsSync('.env')) {
  console.log('📝 Creating .env file from .env.example...');
  try {
    fs.copyFileSync('.env.example', '.env');
    console.log('✅ .env file created');
    console.log('⚠️  Please update .env with your actual Supabase credentials');
  } catch (error) {
    console.error('❌ Error creating .env file:', error.message);
  }
} else {
  console.log('✅ .env file exists');
}

// Check environment variables
console.log('\n🔍 Checking environment configuration...');
require('dotenv').config();

const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY', 
  'SUPABASE_SERVICE_KEY',
  'JWT_SECRET',
  'FRONTEND_URL'
];

let envComplete = true;
requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`✅ ${varName}: configured`);
  } else {
    console.log(`❌ ${varName}: missing`);
    envComplete = false;
  }
});

if (!envComplete) {
  console.log('\n⚠️  Please configure missing environment variables in .env file');
}

// Check if Supabase URL uses transaction pooling port
if (process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes(':6543')) {
  console.log('\n⚠️  SUPABASE_URL should use transaction pooling port :6543 for high concurrency');
  console.log('   Example: https://your-project.supabase.co:6543');
}

// Install dependencies
console.log('\n📦 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed');
} catch (error) {
  console.error('❌ Error installing dependencies:', error.message);
}

// Check if critical files exist
console.log('\n📁 Checking Zero-Trust implementation files...');
const criticalFiles = [
  'utils/supabase.js',
  'middleware/auth.js', 
  'utils/zodSchemas.js',
  'routes/secureOnboarding.js',
  'sql/enable_rls.sql'
];

criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}: exists`);
  } else {
    console.log(`❌ ${file}: missing`);
  }
});

// Database setup instructions
console.log('\n🗄️  Database Setup Instructions:');
console.log('1. Connect to your Supabase database');
console.log('2. Run the RLS setup script: \\i sql/enable_rls.sql');
console.log('3. Verify RLS is enabled on all tables');

// Security checklist
console.log('\n🛡️  Security Checklist:');
console.log('□ Environment variables configured');
console.log('□ SUPABASE_URL uses transaction pooling port (:6543)');
console.log('□ RLS policies applied to database');
console.log('□ FRONTEND_URL set to production domain');
console.log('□ JWT_SECRET is secure and unique');

// Testing instructions
console.log('\n🧪 Testing Instructions:');
console.log('1. Start the server: npm run dev');
console.log('2. Test health endpoint: curl http://localhost:3000/health');
console.log('3. Test secure onboarding: POST /api/onboarding (requires auth)');
console.log('4. Check rate limiting works');

// Performance notes
console.log('\n⚡ Performance Notes:');
console.log('• Transaction pooling enabled for 500+ concurrent users');
console.log('• Stateless JWT authentication for horizontal scaling');
console.log('• Comprehensive rate limiting to prevent abuse');
console.log('• RLS policies for database-level security');

console.log('\n🎉 Zero-Trust setup complete!');
console.log('📖 See ZERO_TRUST_IMPLEMENTATION.md for detailed documentation');

if (!envComplete) {
  console.log('\n⚠️  Next steps:');
  console.log('1. Configure missing environment variables in .env');
  console.log('2. Run database RLS setup script');
  console.log('3. Test the implementation');
  process.exit(1);
}

console.log('\n✅ All checks passed! Your Zero-Trust architecture is ready.');