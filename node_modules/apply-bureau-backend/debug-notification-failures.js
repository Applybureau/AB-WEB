require('dotenv').config();
const axios = require('axios');

// Configuration
const BASE_URL = 'https://apply-bureau-backend.vercel.app';
const ADMIN_EMAIL = 'applybureau@gmail.com';
const ADMIN_PASSWORD = 'Admin123@#';

let adminToken = null;

// Helper function to make authenticated requests
async function makeRequest(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      data
    };

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500,
      fullError: error.response
    };
  }
}

// Test admin login
async function testAdminLogin() {
  console.log('🔐 Testing Admin Login...');
  
  const result = await makeRequest('POST', '/api/auth/login', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  });

  if (result.success) {
    adminToken = result.data.token;
    console.log('✅ Admin login successful');
    console.log(`   User: ${result.data.user.full_name} (${result.data.user.role})`);
    return true;
  } else {
    console.log('❌ Admin login failed:', result.error);
    return false;
  }
}

// Debug admin notification stats endpoint
async function debugAdminNotificationStats() {
  console.log('\n🔍 Debugging Admin Notification Stats...');
  
  const result = await makeRequest('GET', '/api/notifications/admin/stats', null, adminToken);
  
  if (result.success) {
    console.log('✅ Admin notification stats working');
    console.log('   Data:', JSON.stringify(result.data, null, 2));
  } else {
    console.log('❌ Admin notification stats failed');
    console.log('   Status:', result.status);
    console.log('   Error:', JSON.stringify(result.error, null, 2));
    
    if (result.fullError) {
      console.log('   Full error details:');
      console.log('   - Status:', result.fullError.status);
      console.log('   - Status Text:', result.fullError.statusText);
      console.log('   - Headers:', result.fullError.headers);
    }
  }
}

// Debug test notification creation
async function debugTestNotificationCreation() {
  console.log('\n🔍 Debugging Test Notification Creation...');
  
  // First get a client to test with
  const clientsResult = await makeRequest('GET', '/api/admin-dashboard/clients?limit=1', null, adminToken);
  
  if (!clientsResult.success) {
    console.log('❌ Cannot get clients for test notification');
    console.log('   Error:', clientsResult.error);
    return;
  }
  
  if (!clientsResult.data.clients || clientsResult.data.clients.length === 0) {
    console.log('⚠️  No clients available for test notification');
    return;
  }
  
  const testClient = clientsResult.data.clients[0];
  console.log(`   Using test client: ${testClient.full_name} (${testClient.id})`);
  
  const testData = {
    userId: testClient.id,
    type: 'admin_test',
    title: 'Debug Test Notification',
    message: 'This is a debug test notification.',
    category: 'system',
    priority: 'medium'
  };
  
  console.log('   Test data:', JSON.stringify(testData, null, 2));
  
  const result = await makeRequest('POST', '/api/notifications/test', testData, adminToken);
  
  if (result.success) {
    console.log('✅ Test notification creation working');
    console.log('   Response:', JSON.stringify(result.data, null, 2));
  } else {
    console.log('❌ Test notification creation failed');
    console.log('   Status:', result.status);
    console.log('   Error:', JSON.stringify(result.error, null, 2));
    
    if (result.fullError) {
      console.log('   Full error details:');
      console.log('   - Status:', result.fullError.status);
      console.log('   - Status Text:', result.fullError.statusText);
    }
  }
}

// Debug admin notifications spec endpoint
async function debugAdminNotificationsSpec() {
  console.log('\n🔍 Debugging Admin Notifications Spec Endpoint...');
  
  // Try different possible routes
  const possibleRoutes = [
    '/api/admin-notifications-spec',
    '/api/admin/notifications-spec',
    '/api/admin-notifications',
    '/api/notifications/admin-spec'
  ];
  
  for (const route of possibleRoutes) {
    console.log(`   Trying: ${route}`);
    const result = await makeRequest('GET', route, null, adminToken);
    
    if (result.success) {
      console.log(`   ✅ Found working route: ${route}`);
      console.log('   Response:', JSON.stringify(result.data, null, 2));
      return;
    } else {
      console.log(`   ❌ ${route} - Status: ${result.status}`);
    }
  }
  
  console.log('   ⚠️  No working admin notifications spec route found');
}

// Check if notification routes are properly mounted
async function checkNotificationRoutesMounting() {
  console.log('\n🔍 Checking Notification Routes Mounting...');
  
  // Test basic notification endpoint
  const basicResult = await makeRequest('GET', '/api/notifications', null, adminToken);
  console.log(`   /api/notifications - Status: ${basicResult.status} ${basicResult.success ? '✅' : '❌'}`);
  
  // Test unread count
  const unreadResult = await makeRequest('GET', '/api/notifications/unread-count', null, adminToken);
  console.log(`   /api/notifications/unread-count - Status: ${unreadResult.status} ${unreadResult.success ? '✅' : '❌'}`);
  
  // Test recent notifications
  const recentResult = await makeRequest('GET', '/api/notifications/recent', null, adminToken);
  console.log(`   /api/notifications/recent - Status: ${recentResult.status} ${recentResult.success ? '✅' : '❌'}`);
}

// Check if notifications table exists and has data
async function checkNotificationsTable() {
  console.log('\n🔍 Checking Notifications Table...');
  
  // Try to get notifications to see if table exists
  const result = await makeRequest('GET', '/api/notifications?limit=1', null, adminToken);
  
  if (result.success) {
    console.log('✅ Notifications table accessible');
    console.log(`   Found ${result.data.notifications?.length || 0} notifications`);
    console.log('   Stats:', result.data.stats);
  } else {
    console.log('❌ Notifications table access failed');
    console.log('   Error:', result.error);
  }
}

// Main debug function
async function runDebug() {
  console.log('🐛 Starting Notification Failures Debug');
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log(`📅 Debug run: ${new Date().toISOString()}`);

  // Test admin login
  const loginSuccess = await testAdminLogin();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without admin authentication');
    return;
  }

  // Check basic notification functionality
  await checkNotificationRoutesMounting();
  await checkNotificationsTable();

  // Debug specific failing endpoints
  await debugAdminNotificationStats();
  await debugTestNotificationCreation();
  await debugAdminNotificationsSpec();

  console.log('\n🏁 Debug completed!');
}

// Run the debug
runDebug().catch(error => {
  console.error('❌ Debug execution failed:', error);
});