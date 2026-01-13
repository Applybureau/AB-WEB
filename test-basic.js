// Basic test to verify the system is working
console.log('🚀 Testing Apply Bureau Backend...');

// Test 1: Check Node.js version
console.log('✅ Node.js version:', process.version);

// Test 2: Check if main dependencies can be loaded
try {
  require('express');
  console.log('✅ Express.js loaded successfully');
} catch (e) {
  console.log('❌ Express.js failed to load:', e.message);
}

try {
  require('@supabase/supabase-js');
  console.log('✅ Supabase client loaded successfully');
} catch (e) {
  console.log('❌ Supabase client failed to load:', e.message);
}

try {
  require('nodemailer');
  console.log('✅ Nodemailer loaded successfully');
} catch (e) {
  console.log('❌ Nodemailer failed to load:', e.message);
}

// Test 3: Check if environment variables are loaded
require('dotenv').config();
console.log('✅ Environment variables loaded');

// Test 4: Check if basic utilities can be loaded
try {
  const logger = require('./utils/logger');
  console.log('✅ Logger utility loaded successfully');
} catch (e) {
  console.log('❌ Logger utility failed to load:', e.message);
}

try {
  const auth = require('./utils/auth');
  console.log('✅ Auth utility loaded successfully');
} catch (e) {
  console.log('❌ Auth utility failed to load:', e.message);
}

// Test 5: Check if basic routes can be loaded
try {
  const authRoutes = require('./routes/auth');
  console.log('✅ Auth routes loaded successfully');
} catch (e) {
  console.log('❌ Auth routes failed to load:', e.message);
}

console.log('\n🎉 Basic system test completed!');
console.log('📋 Next steps:');
console.log('1. Set up your environment variables in .env file');
console.log('2. Run MASTER_SCHEMA.sql in your Supabase SQL Editor');
console.log('3. Create your first admin user with: npm run create-first-admin');
console.log('4. Start the server with: npm start');