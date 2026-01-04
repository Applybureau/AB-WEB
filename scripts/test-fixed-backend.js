#!/usr/bin/env node

/**
 * Test Fixed Backend
 * Test all the fixes we made to the backend
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const axios = require('axios');
const { supabaseAdmin } = require('../utils/supabase');

const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;
const TEST_EMAIL = 'israelloko65@gmail.com';

let adminToken = null;
let testClientId = null;

async function apiRequest(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`,
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 0
    };
  }
}

async function testFixedBackend() {
  console.log('🔧 Testing Fixed Apply Bureau Backend\n');

  try {
    // 1. Test admin login
    console.log('1. Testing admin login...');
    const loginResult = await apiRequest('POST', '/auth/login', {
      email: 'admin@applybureau.com',
      password: 'admin123'
    });

    if (!loginResult.success) {
      console.log('❌ Admin login failed:', loginResult.error);
      return;
    }

    adminToken = loginResult.data.token;
    console.log('✅ Admin login successful');

    // 2. Clean up existing test client
    console.log('\n2. Cleaning up existing test client...');
    await supabaseAdmin
      .from('clients')
      .delete()
      .eq('email', TEST_EMAIL);
    console.log('✅ Cleanup completed');

    // 3. Test client invitation with fixed email templates
    console.log('\n3. Testing client invitation with fixed email templates...');
    const inviteResult = await apiRequest('POST', '/auth/invite', {
      email: TEST_EMAIL,
      full_name: 'Israel Test User'
    }, adminToken);

    if (!inviteResult.success) {
      console.log('❌ Client invitation failed:', inviteResult.error);
      return;
    }

    testClientId = inviteResult.data.client_id;
    console.log('✅ Client invitation sent successfully');
    console.log('📧 Check your email for the professionally styled invitation with green/blue branding!');

    // 4. Test consultation creation with fixed database schema
    console.log('\n4. Testing consultation creation...');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const consultationResult = await apiRequest('POST', '/consultations', {
      client_id: testClientId,
      scheduled_at: futureDate.toISOString(),
      notes: 'Test consultation - Career guidance session with fixed schema'
    }, adminToken);

    if (!consultationResult.success) {
      console.log('❌ Consultation creation failed:', consultationResult.error);
    } else {
      console.log('✅ Consultation created successfully');
      console.log('📧 Check your email for the consultation confirmation with proper branding!');
    }

    // 5. Test application creation with fixed database schema
    console.log('\n5. Testing application creation...');
    const applicationResult = await apiRequest('POST', '/applications', {
      client_id: testClientId,
      job_title: 'Senior Full-Stack Developer',
      company: 'Tech Innovations Ltd',
      job_link: 'https://example.com/job/senior-fullstack-developer',
      status: 'applied'
    }, adminToken);

    if (!applicationResult.success) {
      console.log('❌ Application creation failed:', applicationResult.error);
    } else {
      console.log('✅ Application created successfully');

      // Test application status update
      const updateResult = await apiRequest('PATCH', `/applications/${applicationResult.data.application.id}`, {
        status: 'interview'
      }, adminToken);

      if (updateResult.success) {
        console.log('✅ Application status updated successfully');
        console.log('📧 Check your email for the status update with proper branding!');
      } else {
        console.log('❌ Application status update failed:', updateResult.error);
      }
    }

    // 6. Test dashboard functionality
    console.log('\n6. Testing dashboard functionality...');
    const dashboardResult = await apiRequest('GET', '/dashboard', null, adminToken);

    if (dashboardResult.success) {
      console.log('✅ Dashboard data retrieved successfully');
    } else {
      console.log('❌ Dashboard retrieval failed:', dashboardResult.error);
    }

    // 7. Test notifications
    console.log('\n7. Testing notifications...');
    const notificationsResult = await apiRequest('GET', '/notifications', null, adminToken);

    if (notificationsResult.success) {
      console.log('✅ Notifications retrieved successfully');
      console.log(`📊 Found ${notificationsResult.data.notifications?.length || 0} notifications`);
    } else {
      console.log('❌ Notifications retrieval failed:', notificationsResult.error);
    }

    console.log('\n🎉 Backend testing completed!');
    console.log('\n📧 Email Summary:');
    console.log('   1. Welcome/Invitation email with green/blue branding');
    console.log('   2. Consultation scheduled email (if consultation creation succeeded)');
    console.log('   3. Application status update email (if application update succeeded)');
    console.log('\n🎨 All emails should now display:');
    console.log('   - Apply Bureau logo (fixed path)');
    console.log('   - Green and light blue brand colors');
    console.log('   - White text on buttons');
    console.log('   - Professional responsive design');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testFixedBackend();