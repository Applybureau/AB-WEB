#!/usr/bin/env node

/**
 * Quick verification that the database is set up correctly
 * Run this after applying the schema
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const API_URL = `${BASE_URL}/api`;

async function verifyDatabaseSetup() {
  console.log('🔍 Verifying Apply Bureau Database Setup');
  console.log('=========================================');

  try {
    // Test 1: Health Check
    console.log('\n1. Server Health Check...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is running and healthy');

    // Test 2: Admin Login (verifies admin user exists)
    console.log('\n2. Admin User Verification...');
    const login = await axios.post(`${API_URL}/auth/login`, {
      email: 'israelloko65@gmail.com',
      password: 'admin123'
    });
    console.log('✅ Admin user exists and can login');
    console.log(`   Admin: ${login.data.user.full_name} (${login.data.user.email})`);

    // Test 3: Database Tables Check
    console.log('\n3. Database Structure Check...');
    const dashboard = await axios.get(`${API_URL}/admin/dashboard/stats`, {
      headers: { Authorization: `Bearer ${login.data.token}` }
    });
    console.log('✅ Database tables are accessible');
    console.log(`   Clients: ${dashboard.data.clients.total}`);
    console.log(`   Consultations: ${dashboard.data.consultations.total}`);

    // Test 4: Packages Endpoint
    console.log('\n4. Public API Endpoints...');
    const packages = await axios.get(`${API_URL}/public/packages`);
    console.log('✅ Public endpoints working');
    console.log(`   Available packages: ${packages.data.packages.length}`);

    console.log('\n🎉 DATABASE SETUP VERIFICATION COMPLETE!');
    console.log('=========================================');
    console.log('✅ All systems ready');
    console.log('✅ Admin user configured');
    console.log('✅ Database tables accessible');
    console.log('✅ API endpoints working');
    console.log('\n🚀 Ready to test consultation booking!');
    console.log('   Run: node test-consultation-flow.js');

  } catch (error) {
    console.log('\n❌ Verification failed:', error.response?.data?.error || error.message);
    if (error.response?.status === 401) {
      console.log('   👉 Admin user might not exist - check database setup');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('   👉 Server not running - run: npm start');
    } else {
      console.log('   👉 Database might not be set up correctly');
    }
    process.exit(1);
  }
}

verifyDatabaseSetup();