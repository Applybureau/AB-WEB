#!/usr/bin/env node

/**
 * Test Dashboard Endpoints - Final Test
 * Test all dashboard endpoints with DigitalOcean backend
 */

const TEST_EMAIL = 'israelloko65@gmail.com';
const TEST_PASSWORD = 'SimplePass123!';
const BASE_URL = 'https://jellyfish-app-t4m35.ondigitalocean.app';

async function testDashboardEndpoints() {
  console.log('🧪 TESTING DASHBOARD ENDPOINTS WITH DIGITALOCEAN\n');
  console.log('='.repeat(60));
  console.log(`🌐 Backend URL: ${BASE_URL}`);
  console.log(`📧 Test Email: ${TEST_EMAIL}`);
  console.log(`🔑 Test Password: ${TEST_PASSWORD}`);
  console.log('='.repeat(60));

  try {
    // STEP 1: Login
    console.log('\n1️⃣ TESTING LOGIN...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    });

    console.log(`   Status: ${loginResponse.status}`);
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.log('❌ Login failed:', errorText);
      return { success: false, step: 'login' };
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful');
    console.log(`   Token: ${token.substring(0, 20)}...`);

    // STEP 2: Test auth/me
    console.log('\n2️⃣ TESTING AUTH/ME...');
    const meResponse = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`   Status: ${meResponse.status}`);
    
    if (meResponse.ok) {
      const meData = await meResponse.json();
      console.log('✅ Auth/me working');
      console.log(`   User ID: ${meData.user?.id}`);
      console.log(`   Role: ${meData.user?.role}`);
    } else {
      const errorText = await meResponse.text();
      console.log('❌ Auth/me failed:', errorText.substring(0, 100));
    }

    // STEP 3: Test applications endpoint
    console.log('\n3️⃣ TESTING APPLICATIONS...');
    const appsResponse = await fetch(`${BASE_URL}/api/applications`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`   Status: ${appsResponse.status}`);
    
    if (appsResponse.ok) {
      const appsData = await appsResponse.json();
      console.log('✅ Applications working!');
      console.log(`   Found ${appsData.applications?.length || 0} applications`);
      if (appsData.applications && appsData.applications.length > 0) {
        console.log('   Sample application:');
        console.log(`     - ${appsData.applications[0].title || 'No title'}`);
        console.log(`     - Status: ${appsData.applications[0].status || 'No status'}`);
      }
    } else {
      const errorText = await appsResponse.text();
      console.log('❌ Applications failed:', errorText);
    }

    // STEP 4: Test applications stats
    console.log('\n4️⃣ TESTING APPLICATION STATS...');
    const statsResponse = await fetch(`${BASE_URL}/api/applications/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`   Status: ${statsResponse.status}`);
    
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log('✅ Application stats working!');
      console.log(`   Total Applications: ${statsData.total_applications || 0}`);
      console.log(`   Weekly Target: ${statsData.weekly_target || 0}`);
      console.log(`   This Week: ${statsData.applications_this_week || 0}`);
    } else {
      const errorText = await statsResponse.text();
      console.log('❌ Application stats failed:', errorText);
    }

    // STEP 5: Test dashboard endpoint
    console.log('\n5️⃣ TESTING CLIENT DASHBOARD...');
    const dashboardResponse = await fetch(`${BASE_URL}/api/client/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`   Status: ${dashboardResponse.status}`);
    
    if (dashboardResponse.ok) {
      const dashboardData = await dashboardResponse.json();
      console.log('✅ Client dashboard working!');
      console.log(`   Client Name: ${dashboardData.client?.full_name || 'No name'}`);
      console.log(`   Profile Completion: ${dashboardData.profile_completion?.percentage || 0}%`);
      console.log(`   20Q Status: ${dashboardData.twenty_questions?.status || 'unknown'}`);
    } else {
      const errorText = await dashboardResponse.text();
      console.log('❌ Client dashboard failed:', errorText);
    }

    // STEP 6: Test discovery mode
    console.log('\n6️⃣ TESTING DISCOVERY MODE...');
    const discoveryResponse = await fetch(`${BASE_URL}/api/applications/discovery-mode`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`   Status: ${discoveryResponse.status}`);
    
    if (discoveryResponse.ok) {
      const discoveryData = await discoveryResponse.json();
      console.log('✅ Discovery mode working!');
      console.log(`   Discovery Active: ${discoveryData.discovery_mode?.active || false}`);
      console.log(`   Message: ${discoveryData.message || 'No message'}`);
    } else {
      const errorText = await discoveryResponse.text();
      console.log('❌ Discovery mode failed:', errorText);
    }

    // FINAL SUMMARY
    console.log('\n' + '='.repeat(60));
    console.log('🎉 DASHBOARD ENDPOINT TESTING COMPLETED!');
    console.log('='.repeat(60));
    
    console.log('\n📋 SUMMARY:');
    console.log(`✅ Login: Working`);
    console.log(`✅ Auth/Me: ${meResponse.ok ? 'Working' : 'Failed'}`);
    console.log(`${appsResponse.ok ? '✅' : '❌'} Applications: ${appsResponse.ok ? 'Working' : 'Failed'}`);
    console.log(`${statsResponse.ok ? '✅' : '❌'} App Stats: ${statsResponse.ok ? 'Working' : 'Failed'}`);
    console.log(`${dashboardResponse.ok ? '✅' : '❌'} Dashboard: ${dashboardResponse.ok ? 'Working' : 'Failed'}`);
    console.log(`${discoveryResponse.ok ? '✅' : '❌'} Discovery: ${discoveryResponse.ok ? 'Working' : 'Failed'}`);

    console.log('\n🌐 FRONTEND ACCESS:');
    console.log('   Login URL: https://www.applybureau.com/login');
    console.log('   Dashboard URL: https://www.applybureau.com/dashboard');
    
    console.log('\n🔗 API ENDPOINTS:');
    console.log(`   Login: POST ${BASE_URL}/api/auth/login`);
    console.log(`   Dashboard: GET ${BASE_URL}/api/client/dashboard`);
    console.log(`   Applications: GET ${BASE_URL}/api/applications`);
    console.log(`   Stats: GET ${BASE_URL}/api/applications/stats`);

    return { 
      success: true, 
      results: {
        login: loginResponse.ok,
        auth: meResponse.ok,
        applications: appsResponse.ok,
        stats: statsResponse.ok,
        dashboard: dashboardResponse.ok,
        discovery: discoveryResponse.ok
      }
    };

  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error.message };
  }
}

// Run if called directly
if (require.main === module) {
  testDashboardEndpoints()
    .then(result => {
      if (result.success) {
        console.log('\n🎯 ALL TESTS COMPLETED!');
        process.exit(0);
      } else {
        console.error('\n💥 Tests failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Script error:', error);
      process.exit(1);
    });
}

module.exports = { testDashboardEndpoints };