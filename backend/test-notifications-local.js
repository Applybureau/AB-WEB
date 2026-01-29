require('dotenv').config();
const axios = require('axios');

// Configuration for local testing
const BASE_URL = 'http://localhost:3000';
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
  console.log('🔐 Testing Admin Login (Local)...');
  
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

// Test notification endpoints
async function testNotificationEndpoints() {
  console.log('\n📱 Testing Notification Endpoints (Local)...');
  
  // 1. Test basic notifications endpoint
  console.log('   1. GET /api/notifications');
  const notifications = await makeRequest('GET', '/api/notifications', null, adminToken);
  console.log(`   ${notifications.success ? '✅' : '❌'} Status: ${notifications.status}`);
  if (notifications.success) {
    console.log(`      Found ${notifications.data.notifications?.length || 0} notifications`);
  } else {
    console.log(`      Error: ${JSON.stringify(notifications.error, null, 2)}`);
  }

  // 2. Test admin stats endpoint
  console.log('   2. GET /api/notifications/admin/stats');
  const adminStats = await makeRequest('GET', '/api/notifications/admin/stats', null, adminToken);
  console.log(`   ${adminStats.success ? '✅' : '❌'} Status: ${adminStats.status}`);
  if (adminStats.success) {
    console.log(`      Stats: ${JSON.stringify(adminStats.data, null, 2)}`);
  } else {
    console.log(`      Error: ${JSON.stringify(adminStats.error, null, 2)}`);
  }

  // 3. Test creating a test notification
  console.log('   3. POST /api/notifications/test');
  
  // Get a client to test with
  const clientsResult = await makeRequest('GET', '/api/admin-dashboard/clients?limit=1', null, adminToken);
  
  if (clientsResult.success && clientsResult.data.clients && clientsResult.data.clients.length > 0) {
    const testClient = clientsResult.data.clients[0];
    
    const testNotification = await makeRequest('POST', '/api/notifications/test', {
      userId: testClient.id,
      type: 'info', // Use allowed type
      title: 'Local Test Notification',
      message: 'This is a test notification from local server.',
      category: 'system',
      priority: 'medium'
    }, adminToken);
    
    console.log(`   ${testNotification.success ? '✅' : '❌'} Status: ${testNotification.status}`);
    if (testNotification.success) {
      console.log(`      Created notification: ${testNotification.data.notification?.id}`);
    } else {
      console.log(`      Error: ${JSON.stringify(testNotification.error, null, 2)}`);
    }
  } else {
    console.log('   ⚠️  No clients available for test notification');
  }

  // 4. Test admin notifications spec endpoint
  console.log('   4. GET /api/admin-notifications-spec');
  const adminNotificationsSpec = await makeRequest('GET', '/api/admin-notifications-spec', null, adminToken);
  console.log(`   ${adminNotificationsSpec.success ? '✅' : '❌'} Status: ${adminNotificationsSpec.status}`);
  if (adminNotificationsSpec.success) {
    console.log(`      Response: ${JSON.stringify(adminNotificationsSpec.data, null, 2)}`);
  } else {
    console.log(`      Error: ${JSON.stringify(adminNotificationsSpec.error, null, 2)}`);
  }

  // 5. Test unread count
  console.log('   5. GET /api/notifications/unread-count');
  const unreadCount = await makeRequest('GET', '/api/notifications/unread-count', null, adminToken);
  console.log(`   ${unreadCount.success ? '✅' : '❌'} Status: ${unreadCount.status}`);
  if (unreadCount.success) {
    console.log(`      Unread count: ${unreadCount.data.unread_count}`);
  } else {
    console.log(`      Error: ${JSON.stringify(unreadCount.error, null, 2)}`);
  }
}

// Test server health
async function testServerHealth() {
  console.log('\n🏥 Testing Server Health...');
  
  try {
    const healthCheck = await makeRequest('GET', '/api/auth/me', null, adminToken);
    console.log(`   Server responding: ${healthCheck.success ? '✅' : '❌'}`);
    
    if (healthCheck.success) {
      console.log(`   User info: ${healthCheck.data.user?.full_name} (${healthCheck.data.user?.role})`);
    }
  } catch (error) {
    console.log('   ❌ Server health check failed:', error.message);
  }
}

// Main test function
async function runLocalTests() {
  console.log('🚀 Starting Local Notification Tests');
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log(`📅 Test run: ${new Date().toISOString()}`);

  // Wait a moment for server to be ready
  console.log('\n⏳ Waiting for server to be ready...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test server health first
  await testServerHealth();

  // Test admin login
  const loginSuccess = await testAdminLogin();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without admin authentication');
    return;
  }

  // Test notification endpoints
  await testNotificationEndpoints();

  console.log('\n🏁 Local notification tests completed!');
}

// Run the tests
runLocalTests().catch(error => {
  console.error('❌ Local test execution failed:', error);
});