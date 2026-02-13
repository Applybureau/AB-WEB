#!/usr/bin/env node

/**
 * Detailed Error Analysis
 * Analyze the specific 500 errors in detail
 */

const TEST_EMAIL = 'israelloko65@gmail.com';
const TEST_PASSWORD = 'SimplePass123!';
const BASE_URL = 'https://jellyfish-app-t4m35.ondigitalocean.app';

async function detailedErrorAnalysis() {
  console.log('🔍 DETAILED ERROR ANALYSIS\n');
  console.log('='.repeat(60));
  console.log('🎯 Goal: Identify exact causes of 500 errors');
  console.log('='.repeat(60));

  try {
    // Login first
    console.log('\n1️⃣ AUTHENTICATING...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD })
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed - cannot analyze other endpoints');
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Authentication successful');

    // Test Application Stats endpoint in detail
    console.log('\n2️⃣ ANALYZING APPLICATION STATS ENDPOINT...');
    console.log('   Endpoint: GET /api/applications/stats');
    
    const statsResponse = await fetch(`${BASE_URL}/api/applications/stats`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`   Status Code: ${statsResponse.status}`);
    console.log(`   Status Text: ${statsResponse.statusText}`);
    
    if (!statsResponse.ok) {
      const errorText = await statsResponse.text();
      console.log('   ❌ ERROR DETAILS:');
      console.log(`      Response: ${errorText}`);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.log(`      Error Message: ${errorJson.error || 'No error message'}`);
        console.log(`      Error Details: ${JSON.stringify(errorJson, null, 6)}`);
      } catch (parseError) {
        console.log(`      Raw Error Text: ${errorText}`);
      }
    } else {
      const statsData = await statsResponse.json();
      console.log('   ✅ SUCCESS:');
      console.log(`      Data: ${JSON.stringify(statsData, null, 6)}`);
    }

    // Test Client Dashboard endpoint in detail
    console.log('\n3️⃣ ANALYZING CLIENT DASHBOARD ENDPOINT...');
    console.log('   Endpoint: GET /api/client/dashboard');
    
    const dashboardResponse = await fetch(`${BASE_URL}/api/client/dashboard`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`   Status Code: ${dashboardResponse.status}`);
    console.log(`   Status Text: ${dashboardResponse.statusText}`);
    
    if (!dashboardResponse.ok) {
      const errorText = await dashboardResponse.text();
      console.log('   ❌ ERROR DETAILS:');
      console.log(`      Response: ${errorText}`);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.log(`      Error Message: ${errorJson.error || 'No error message'}`);
        console.log(`      Error Details: ${JSON.stringify(errorJson, null, 6)}`);
      } catch (parseError) {
        console.log(`      Raw Error Text: ${errorText}`);
      }
    } else {
      const dashboardData = await dashboardResponse.json();
      console.log('   ✅ SUCCESS:');
      console.log(`      Data: ${JSON.stringify(dashboardData, null, 6)}`);
    }

    // Check response headers for additional clues
    console.log('\n4️⃣ ANALYZING RESPONSE HEADERS...');
    
    console.log('   Stats Response Headers:');
    for (const [key, value] of statsResponse.headers.entries()) {
      console.log(`      ${key}: ${value}`);
    }
    
    console.log('   Dashboard Response Headers:');
    for (const [key, value] of dashboardResponse.headers.entries()) {
      console.log(`      ${key}: ${value}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🔍 ERROR ANALYSIS SUMMARY');
    console.log('='.repeat(60));
    
    console.log('\n📊 APPLICATION STATS ENDPOINT:');
    if (statsResponse.ok) {
      console.log('   ✅ Status: Working');
    } else {
      console.log('   ❌ Status: Failing with 500 error');
      console.log('   🔍 Likely Causes:');
      console.log('      • Database query failure in calculateApplicationStats()');
      console.log('      • Missing consultation_requests table causing exception');
      console.log('      • Error in tier calculation logic');
      console.log('      • Unhandled exception in controller method');
    }

    console.log('\n🏠 CLIENT DASHBOARD ENDPOINT:');
    if (dashboardResponse.ok) {
      console.log('   ✅ Status: Working');
    } else {
      console.log('   ❌ Status: Failing with 500 error');
      console.log('   🔍 Likely Causes:');
      console.log('      • Database query failure in getDashboardOverview()');
      console.log('      • Missing consultation_requests table causing exception');
      console.log('      • Error in profile completion calculation');
      console.log('      • Unhandled exception in controller method');
    }

    console.log('\n🎯 ROOT CAUSE ANALYSIS:');
    console.log('   1. MISSING TABLE: consultation_requests table does not exist');
    console.log('   2. DEPLOYMENT LAG: Latest fixes may not be deployed yet');
    console.log('   3. DATABASE ERRORS: Queries failing before reaching error-proof code');
    console.log('   4. MIDDLEWARE ISSUES: profileGuard or auth middleware failing');

    console.log('\n🔧 RECOMMENDED FIXES:');
    console.log('   1. Verify DigitalOcean deployment status');
    console.log('   2. Check if latest controller changes are deployed');
    console.log('   3. Add try-catch around all database queries');
    console.log('   4. Implement complete database bypass for these endpoints');

    return {
      success: true,
      results: {
        statsWorking: statsResponse.ok,
        dashboardWorking: dashboardResponse.ok,
        statsError: statsResponse.ok ? null : await statsResponse.text(),
        dashboardError: dashboardResponse.ok ? null : await dashboardResponse.text()
      }
    };

  } catch (error) {
    console.error('❌ Analysis failed:', error);
    return { success: false, error: error.message };
  }
}

// Run if called directly
if (require.main === module) {
  detailedErrorAnalysis()
    .then(result => {
      console.log('\n🔍 Detailed error analysis completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Analysis error:', error);
      process.exit(1);
    });
}

module.exports = { detailedErrorAnalysis };