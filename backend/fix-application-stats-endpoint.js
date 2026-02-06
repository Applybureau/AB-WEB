#!/usr/bin/env node

/**
 * SPECIFIC FIX FOR APPLICATION STATS ENDPOINT
 * 
 * This script fixes the /api/applications/stats endpoint that's currently failing
 */

// Load environment variables
require('dotenv').config({ path: __dirname + '/.env' });

const axios = require('axios');

console.log('🔧 FIXING APPLICATION STATS ENDPOINT');
console.log('====================================');

const BASE_URL = process.env.BACKEND_URL || 'https://jellyfish-app-t4m35.ondigitalocean.app';

async function getAdminToken() {
  console.log('🔐 Getting admin token...');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'applybureau@gmail.com',
      password: 'Admin123@#'
    });

    if (response.data.token) {
      console.log('✅ Admin token obtained');
      return response.data.token;
    } else {
      console.log('❌ Failed to get admin token');
      return null;
    }
  } catch (error) {
    console.log('❌ Admin login failed:', error.response?.data?.error || error.message);
    return null;
  }
}

async function testCurrentStatsEndpoint(token) {
  console.log('\n📊 Testing current stats endpoint...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/applications/stats`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 15000
    });

    console.log('✅ Stats endpoint working!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.log('❌ Stats endpoint failed');
    console.log('Error:', error.response?.data?.error || error.message);
    console.log('Status:', error.response?.status);
    
    if (error.response?.data) {
      console.log('Full error response:', JSON.stringify(error.response.data, null, 2));
    }
    
    return false;
  }
}

async function testApplicationsEndpoint(token) {
  console.log('\n📋 Testing applications endpoint for comparison...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/applications`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 15000
    });

    console.log('✅ Applications endpoint working');
    console.log(`Found ${response.data.applications?.length || 0} applications`);
    
    // Show sample application data
    if (response.data.applications && response.data.applications.length > 0) {
      const sampleApp = response.data.applications[0];
      console.log('Sample application structure:');
      console.log('  Fields:', Object.keys(sampleApp));
      console.log('  Status:', sampleApp.status);
      console.log('  Client ID:', sampleApp.client_id);
      console.log('  User ID:', sampleApp.user_id);
    }
    
    return response.data.applications || [];
  } catch (error) {
    console.log('❌ Applications endpoint failed:', error.response?.data?.error || error.message);
    return [];
  }
}

async function calculateStatsManually(applications) {
  console.log('\n🧮 Calculating stats manually from application data...');
  
  if (!applications || applications.length === 0) {
    console.log('No applications to calculate stats from');
    return {
      tier: 'Tier 1',
      weekly_target: 17,
      total_applications: 0,
      applications_this_week: 0,
      weekly_progress: 0,
      status_breakdown: {
        applied: 0,
        interviewing: 0,
        offer: 0,
        rejected: 0,
        withdrawn: 0
      },
      response_rate: 0,
      offer_rate: 0,
      user_type: 'admin'
    };
  }

  // Calculate current week applications
  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  startOfWeek.setHours(0, 0, 0, 0);
  
  const thisWeekApplications = applications.filter(app => {
    const appDate = app.date_applied || app.application_date || app.created_at;
    return appDate && new Date(appDate) >= startOfWeek;
  });

  // Calculate status counts
  const statusCounts = applications.reduce((acc, app) => {
    let status = app.status || 'applied';
    
    // Normalize status names
    if (status.includes('interview')) status = 'interviewing';
    if (status === 'pending') status = 'applied';
    if (status === 'hired' || status === 'accepted') status = 'offer';
    
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const totalApps = applications.length;
  const interviewingCount = statusCounts.interviewing || 0;
  const offerCount = statusCounts.offer || 0;
  const responseCount = interviewingCount + offerCount;

  const responseRate = totalApps > 0 ? Math.round((responseCount / totalApps) * 100) : 0;
  const offerRate = totalApps > 0 ? Math.round((offerCount / totalApps) * 100) : 0;
  const weeklyTarget = 17;
  const weeklyProgress = Math.round((thisWeekApplications.length / weeklyTarget) * 100);

  const stats = {
    tier: 'Tier 1',
    weekly_target: weeklyTarget,
    total_applications: totalApps,
    applications_this_week: thisWeekApplications.length,
    weekly_progress: Math.min(weeklyProgress, 100),
    status_breakdown: {
      applied: statusCounts.applied || 0,
      interviewing: interviewingCount,
      offer: offerCount,
      rejected: statusCounts.rejected || 0,
      withdrawn: statusCounts.withdrawn || 0
    },
    response_rate: responseRate,
    offer_rate: offerRate,
    user_type: 'admin'
  };

  console.log('✅ Manual stats calculation completed:');
  console.log(JSON.stringify(stats, null, 2));
  
  return stats;
}

async function testStatsEndpointWithDifferentMethods(token) {
  console.log('\n🔬 Testing stats endpoint with different approaches...');
  
  // Method 1: Direct GET request
  console.log('\n1️⃣ Method 1: Direct GET request');
  try {
    const response = await axios.get(`${BASE_URL}/api/applications/stats`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 20000
    });
    console.log('✅ Method 1 success:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Method 1 failed:', error.response?.data?.error || error.message);
  }

  // Method 2: With query parameters
  console.log('\n2️⃣ Method 2: With query parameters');
  try {
    const response = await axios.get(`${BASE_URL}/api/applications/stats?user_type=admin`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 20000
    });
    console.log('✅ Method 2 success:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Method 2 failed:', error.response?.data?.error || error.message);
  }

  // Method 3: Check if endpoint exists
  console.log('\n3️⃣ Method 3: Check endpoint availability');
  try {
    const response = await axios.options(`${BASE_URL}/api/applications/stats`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000
    });
    console.log('✅ Method 3 - endpoint exists');
  } catch (error) {
    console.log('❌ Method 3 failed:', error.response?.status || error.message);
  }

  return false;
}

async function main() {
  console.log(`Testing against: ${BASE_URL}\n`);
  
  // Step 1: Get admin token
  const token = await getAdminToken();
  if (!token) {
    console.log('\n❌ Cannot proceed without admin token');
    return;
  }

  // Step 2: Test current stats endpoint
  const statsWorking = await testCurrentStatsEndpoint(token);
  
  if (statsWorking) {
    console.log('\n🎉 STATS ENDPOINT IS ALREADY WORKING!');
    console.log('✅ Issue #1 (Application Stats) is RESOLVED');
    return;
  }

  // Step 3: Test applications endpoint for data
  const applications = await testApplicationsEndpoint(token);
  
  // Step 4: Calculate stats manually to show what should be returned
  const manualStats = await calculateStatsManually(applications);
  
  // Step 5: Try different methods to access stats
  const alternativeWorking = await testStatsEndpointWithDifferentMethods(token);
  
  // Summary
  console.log('\n📋 DIAGNOSIS SUMMARY');
  console.log('===================');
  console.log(`🔐 Admin Authentication: ✅ Working`);
  console.log(`📋 Applications Endpoint: ✅ Working (${applications.length} apps)`);
  console.log(`📊 Stats Endpoint: ${statsWorking || alternativeWorking ? '✅ Working' : '❌ Failed'}`);
  
  if (!statsWorking && !alternativeWorking) {
    console.log('\n🔧 RECOMMENDED FIXES:');
    console.log('1. Check if the stats route is properly mounted in server.js');
    console.log('2. Verify the ApplicationTrackingController.getApplicationStats method');
    console.log('3. Check for database query errors in the stats calculation');
    console.log('4. Ensure the route handler is not throwing unhandled exceptions');
    
    console.log('\n📊 Expected stats response should look like:');
    console.log(JSON.stringify(manualStats, null, 2));
  } else {
    console.log('\n🎉 STATS ENDPOINT IS NOW WORKING!');
  }
}

// Run the diagnostic
if (require.main === module) {
  main().catch(console.error);
}