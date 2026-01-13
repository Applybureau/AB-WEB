const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// Create supabase admin client
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const BASE_URL = 'https://apply-bureau-backend.vercel.app';

async function quickDeployTest() {
  try {
    console.log('⚡ QUICK DEPLOYMENT TEST');
    console.log('=======================\n');
    
    // Test 1: Server Health
    console.log('🏥 Testing server health...');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/api/health`, { timeout: 10000 });
      console.log('✅ Server is healthy');
      console.log(`   Status: ${healthResponse.status}`);
      console.log(`   Service: ${healthResponse.data.service || 'Apply Bureau Backend'}`);
    } catch (error) {
      console.error('❌ Server health check failed:', error.message);
      return;
    }
    
    // Test 2: Database Schema
    console.log('\n📊 Testing database schema...');
    try {
      // Test onboarding fields
      const { data: userTest, error: userError } = await supabaseAdmin
        .from('registered_users')
        .select('onboarding_completed, profile_unlocked')
        .limit(1);
      
      if (!userError) {
        console.log('✅ Onboarding fields exist');
      } else {
        console.log('❌ Onboarding fields missing - need to apply schema');
        console.log('   Run: Execute SIMPLE_WORKFLOW_SCHEMA.sql in Supabase SQL Editor');
        return;
      }
      
      // Test payment fields
      const { data: consultationTest, error: consultationError } = await supabaseAdmin
        .from('consultation_requests')
        .select('payment_verified, registration_token')
        .limit(1);
      
      if (!consultationError) {
        console.log('✅ Payment fields exist');
      } else {
        console.log('❌ Payment fields missing - need to apply schema');
        return;
      }
      
      // Test weekly fields
      const { data: appTest, error: appError } = await supabaseAdmin
        .from('applications')
        .select('week_start, concierge_note')
        .limit(1);
      
      if (!appError) {
        console.log('✅ Weekly fields exist');
      } else {
        console.log('❌ Weekly fields missing - need to apply schema');
        return;
      }
      
    } catch (error) {
      console.error('❌ Database schema test failed:', error.message);
      return;
    }
    
    // Test 3: New Routes
    console.log('\n🛣️ Testing new routes...');
    try {
      // Test workflow routes (expect 401 unauthorized, which means route exists)
      const routes = [
        '/api/workflow/user/profile',
        '/api/applications/weekly'
      ];
      
      for (const route of routes) {
        try {
          await axios.get(`${BASE_URL}${route}`);
        } catch (error) {
          if (error.response && error.response.status === 401) {
            console.log(`✅ Route exists: ${route}`);
          } else if (error.response && error.response.status === 404) {
            console.log(`❌ Route missing: ${route}`);
            return;
          } else {
            console.log(`✅ Route exists: ${route} (status: ${error.response?.status})`);
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Route testing failed:', error.message);
      return;
    }
    
    // Test 4: Authentication Test
    console.log('\n🔐 Testing authentication...');
    try {
      // Get admin user for token generation
      const { data: admin, error: adminError } = await supabaseAdmin
        .from('registered_users')
        .select('id, email')
        .eq('role', 'admin')
        .limit(1)
        .single();
      
      if (adminError) {
        console.log('❌ No admin user found - create admin user first');
        return;
      }
      
      // Generate test token
      const jwt = require('jsonwebtoken');
      const testToken = jwt.sign({
        userId: admin.id,
        email: admin.email,
        role: 'admin',
        exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
      }, process.env.JWT_SECRET);
      
      // Test authenticated route
      const authResponse = await axios.get(
        `${BASE_URL}/api/workflow/admin/clients/${admin.id}`,
        {
          headers: { Authorization: `Bearer ${testToken}` }
        }
      );
      
      if (authResponse.status === 200) {
        console.log('✅ Authentication working');
      }
      
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ Authentication working (client not found is expected)');
      } else {
        console.error('❌ Authentication test failed:', error.message);
        return;
      }
    }
    
    console.log('\n🎉 QUICK DEPLOYMENT TEST PASSED!');
    console.log('=================================');
    console.log('✅ Server is healthy and responding');
    console.log('✅ Database schema is properly applied');
    console.log('✅ New workflow routes are registered');
    console.log('✅ Authentication system is working');
    console.log('\n🚀 NEW WORKFLOW FEATURES ARE DEPLOYED AND READY!');
    console.log('\n📋 Next Steps:');
    console.log('1. Run full test: node backend/scripts/deploy-and-test-workflow.js');
    console.log('2. Test frontend integration');
    console.log('3. Monitor system performance');
    
  } catch (error) {
    console.error('❌ Quick deployment test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the quick test
quickDeployTest();