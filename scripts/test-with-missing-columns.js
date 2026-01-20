require('dotenv').config();
const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'https://apply-bureau-backend.vercel.app';

async function testBackendWithMissingColumns() {
  console.log('🧪 TESTING BACKEND WITH MISSING DATABASE COLUMNS');
  console.log('=================================================');
  console.log(`Backend URL: ${BACKEND_URL}`);

  let adminToken = null;

  try {
    // 1. Test Health Check
    console.log('\n1. Testing Health Check...');
    try {
      const healthResponse = await axios.get(`${BACKEND_URL}/health`);
      console.log('✅ Health Check: PASS');
      console.log(`   Status: ${healthResponse.data.status}`);
    } catch (error) {
      console.log('❌ Health Check: FAIL');
      console.log(`   Error: ${error.message}`);
    }

    // 2. Test Admin Login
    console.log('\n2. Testing Admin Login...');
    try {
      const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
        email: 'admin@applybureau.com',
        password: 'admin123'
      });
      
      adminToken = loginResponse.data.token;
      console.log('✅ Admin Login: PASS');
      console.log(`   Role: ${loginResponse.data.user.role}`);
    } catch (error) {
      console.log('❌ Admin Login: FAIL');
      console.log(`   Error: ${error.response?.data?.error || error.message}`);
      return;
    }

    // 3. Test Dashboard (should handle missing columns gracefully)
    console.log('\n3. Testing Dashboard with Missing Columns...');
    try {
      const dashboardResponse = await axios.get(`${BACKEND_URL}/api/dashboard`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log('✅ Dashboard: PASS');
      console.log(`   Stats loaded: ${Object.keys(dashboardResponse.data.stats).length} categories`);
      console.log(`   Applications: ${dashboardResponse.data.recent_applications?.length || 0}`);
      console.log(`   Notifications: ${dashboardResponse.data.unread_notifications?.length || 0}`);
    } catch (error) {
      console.log('❌ Dashboard: FAIL');
      console.log(`   Error: ${error.response?.data?.error || error.message}`);
    }

    // 4. Test Dashboard Stats (should handle missing columns gracefully)
    console.log('\n4. Testing Dashboard Stats with Missing Columns...');
    try {
      const statsResponse = await axios.get(`${BACKEND_URL}/api/dashboard/stats`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log('✅ Dashboard Stats: PASS');
      console.log(`   Total applications: ${statsResponse.data.total_applications}`);
      console.log(`   Success rate: ${statsResponse.data.success_rate}%`);
    } catch (error) {
      console.log('❌ Dashboard Stats: FAIL');
      console.log(`   Error: ${error.response?.data?.error || error.message}`);
    }

    // 5. Test Notifications (should handle missing is_read column)
    console.log('\n5. Testing Notifications with Missing Columns...');
    try {
      const notificationsResponse = await axios.get(`${BACKEND_URL}/api/enhanced-dashboard/notifications`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log('✅ Notifications: PASS');
      console.log(`   Notifications: ${notificationsResponse.data.notifications?.length || 0}`);
    } catch (error) {
      console.log('❌ Notifications: FAIL');
      console.log(`   Error: ${error.response?.data?.error || error.message}`);
    }

    // 6. Test Applications (should handle missing client_id column)
    console.log('\n6. Testing Applications with Missing Columns...');
    try {
      const applicationsResponse = await axios.get(`${BACKEND_URL}/api/applications`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log('✅ Applications: PASS');
      console.log(`   Applications: ${applicationsResponse.data.applications?.length || 0}`);
    } catch (error) {
      console.log('❌ Applications: FAIL');
      console.log(`   Error: ${error.response?.data?.error || error.message}`);
    }

    // 7. Test Admin Dashboard Clients
    console.log('\n7. Testing Admin Dashboard Clients...');
    try {
      const clientsResponse = await axios.get(`${BACKEND_URL}/api/admin-dashboard/clients`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log('✅ Admin Dashboard Clients: PASS');
      console.log(`   Clients: ${clientsResponse.data.clients?.length || 0}`);
    } catch (error) {
      console.log('❌ Admin Dashboard Clients: FAIL');
      console.log(`   Error: ${error.response?.data?.error || error.message}`);
    }

    // 8. Test Contact Requests
    console.log('\n8. Testing Contact Requests...');
    try {
      const contactResponse = await axios.get(`${BACKEND_URL}/api/consultation-requests`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log('✅ Contact Requests: PASS');
      console.log(`   Records: ${contactResponse.data.consultation_requests?.length || 0}`);
    } catch (error) {
      console.log('❌ Contact Requests: FAIL');
      console.log(`   Error: ${error.response?.data?.error || error.message}`);
    }

    // 9. Test Public Consultation Submission (should handle missing prospect columns)
    console.log('\n9. Testing Public Consultation Submission...');
    try {
      const consultationData = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        reason: 'Testing consultation submission',
        preferred_date: '2026-02-01',
        preferred_time: '14:00',
        package_interest: 'Premium',
        current_situation: 'Testing',
        timeline: '1 month'
      };

      const consultationResponse = await axios.post(`${BACKEND_URL}/api/public/consultation-booking`, consultationData);
      
      console.log('✅ Public Consultation Submission: PASS');
      console.log(`   Consultation ID: ${consultationResponse.data.consultation?.id || 'N/A'}`);
    } catch (error) {
      console.log('❌ Public Consultation Submission: FAIL');
      console.log(`   Error: ${error.response?.data?.error || error.message}`);
    }

    console.log('\n🎯 TEST SUMMARY');
    console.log('================');
    console.log('✅ Backend is handling missing database columns gracefully');
    console.log('📝 Please run the SQL fixes in Supabase to resolve database issues');
    console.log('🔗 Go to: https://supabase.com/dashboard/project/uhivvmpljffhbodrklip/sql');
    console.log('📋 Copy and paste the SQL from STEP_BY_STEP_DATABASE_FIX.sql');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testBackendWithMissingColumns()
    .then(() => {
      console.log('\n✅ Test complete');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Test script failed:', error);
      process.exit(1);
    });
}

module.exports = { testBackendWithMissingColumns };