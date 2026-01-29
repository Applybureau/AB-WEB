const axios = require('axios');

// Configuration
const BASE_URL = 'https://apply-bureau-backend.vercel.app';
const ADMIN_EMAIL = 'applybureau@gmail.com';
const ADMIN_PASSWORD = 'Admin123@#';

let adminToken = null;
let clientToken = null;

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
      status: error.response?.status || 500
    };
  }
}

// Test admin login
async function testAdminLogin() {
  console.log('\n🔐 Testing Admin Login...');
  
  const result = await makeRequest('POST', '/api/auth/login', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  });

  if (result.success) {
    adminToken = result.data.token;
    console.log('✅ Admin login successful');
    return true;
  } else {
    console.log('❌ Admin login failed:', result.error);
    return false;
  }
}

// Test client login (if available)
async function testClientLogin() {
  console.log('\n👤 Testing Client Login...');
  
  // Try to find a client to test with
  const clientsResult = await makeRequest('GET', '/api/admin-dashboard/clients?limit=1', null, adminToken);
  
  if (!clientsResult.success || !clientsResult.data.clients || clientsResult.data.clients.length === 0) {
    console.log('⚠️  No clients available for testing client notifications');
    return false;
  }

  const testClient = clientsResult.data.clients[0];
  console.log(`   Found test client: ${testClient.full_name} (${testClient.email})`);
  
  // For this test, we'll use admin token to simulate client requests
  // In a real scenario, you'd need the client's actual credentials
  console.log('⚠️  Using admin token for client notification testing (demo purposes)');
  clientToken = adminToken;
  return true;
}

// Test notification endpoints for clients
async function testClientNotificationEndpoints() {
  console.log('\n📱 Testing Client Notification Endpoints...');
  
  if (!clientToken) {
    console.log('⚠️  Skipping client notification tests - no client token');
    return;
  }

  // 1. GET /api/notifications - Get all notifications
  console.log('   1. GET /api/notifications - Get all notifications');
  const allNotifications = await makeRequest('GET', '/api/notifications?limit=10', null, clientToken);
  if (allNotifications.success) {
    console.log(`   ✅ Retrieved ${allNotifications.data.notifications?.length || 0} notifications`);
    console.log(`   📊 Stats: ${allNotifications.data.stats?.total_unread || 0} unread`);
  } else {
    console.log(`   ❌ Failed: ${allNotifications.error?.error || allNotifications.error}`);
  }

  // 2. GET /api/notifications/unread-count - Get unread count
  console.log('   2. GET /api/notifications/unread-count - Get unread count');
  const unreadCount = await makeRequest('GET', '/api/notifications/unread-count', null, clientToken);
  if (unreadCount.success) {
    console.log(`   ✅ Unread count: ${unreadCount.data.unread_count}`);
  } else {
    console.log(`   ❌ Failed: ${unreadCount.error?.error || unreadCount.error}`);
  }

  // 3. GET /api/notifications/recent - Get recent notifications
  console.log('   3. GET /api/notifications/recent - Get recent notifications');
  const recentNotifications = await makeRequest('GET', '/api/notifications/recent', null, clientToken);
  if (recentNotifications.success) {
    console.log(`   ✅ Retrieved ${recentNotifications.data.notifications?.length || 0} recent notifications`);
    console.log(`   🕐 Timestamp: ${recentNotifications.data.timestamp}`);
  } else {
    console.log(`   ❌ Failed: ${recentNotifications.error?.error || recentNotifications.error}`);
  }

  // 4. GET /api/notifications with filters
  console.log('   4. GET /api/notifications?read=false - Get unread notifications');
  const unreadNotifications = await makeRequest('GET', '/api/notifications?read=false&limit=5', null, clientToken);
  if (unreadNotifications.success) {
    console.log(`   ✅ Retrieved ${unreadNotifications.data.notifications?.length || 0} unread notifications`);
  } else {
    console.log(`   ❌ Failed: ${unreadNotifications.error?.error || unreadNotifications.error}`);
  }

  // 5. Test marking notification as read (if we have notifications)
  if (allNotifications.success && allNotifications.data.notifications && allNotifications.data.notifications.length > 0) {
    const firstNotification = allNotifications.data.notifications[0];
    console.log(`   5. PATCH /api/notifications/${firstNotification.id}/read - Mark as read`);
    
    const markRead = await makeRequest('PATCH', `/api/notifications/${firstNotification.id}/read`, null, clientToken);
    if (markRead.success) {
      console.log('   ✅ Notification marked as read');
    } else {
      console.log(`   ❌ Failed: ${markRead.error?.error || markRead.error}`);
    }
  }

  // 6. PATCH /api/notifications/read-all - Mark all as read
  console.log('   6. PATCH /api/notifications/read-all - Mark all as read');
  const markAllRead = await makeRequest('PATCH', '/api/notifications/read-all', null, clientToken);
  if (markAllRead.success) {
    console.log('   ✅ All notifications marked as read');
  } else {
    console.log(`   ❌ Failed: ${markAllRead.error?.error || markAllRead.error}`);
  }
}

// Test admin notification endpoints
async function testAdminNotificationEndpoints() {
  console.log('\n👨‍💼 Testing Admin Notification Endpoints...');
  
  if (!adminToken) {
    console.log('⚠️  Skipping admin notification tests - no admin token');
    return;
  }

  // 1. GET /api/notifications/admin/stats - Get notification statistics
  console.log('   1. GET /api/notifications/admin/stats - Get notification statistics');
  const adminStats = await makeRequest('GET', '/api/notifications/admin/stats', null, adminToken);
  if (adminStats.success) {
    console.log('   ✅ Admin notification statistics retrieved');
    console.log(`   📊 Total notifications: ${adminStats.data.total}`);
    console.log(`   📊 Unread notifications: ${adminStats.data.unread}`);
    console.log(`   📊 Categories: ${Object.keys(adminStats.data.by_category || {}).join(', ')}`);
    console.log(`   📊 Priorities: ${Object.keys(adminStats.data.by_priority || {}).join(', ')}`);
  } else {
    console.log(`   ❌ Failed: ${adminStats.error?.error || adminStats.error}`);
  }

  // 2. POST /api/notifications/test - Create test notification
  console.log('   2. POST /api/notifications/test - Create test notification');
  
  // Get a client to send test notification to
  const clientsResult = await makeRequest('GET', '/api/admin-dashboard/clients?limit=1', null, adminToken);
  
  if (clientsResult.success && clientsResult.data.clients && clientsResult.data.clients.length > 0) {
    const testClient = clientsResult.data.clients[0];
    
    const testNotification = await makeRequest('POST', '/api/notifications/test', {
      userId: testClient.id,
      type: 'admin_test',
      title: 'Test Notification from Admin',
      message: 'This is a test notification created by the admin for testing purposes.',
      category: 'system',
      priority: 'medium'
    }, adminToken);
    
    if (testNotification.success) {
      console.log('   ✅ Test notification created successfully');
      console.log(`   📧 Sent to: ${testClient.full_name} (${testClient.email})`);
    } else {
      console.log(`   ❌ Failed: ${testNotification.error?.error || testNotification.error}`);
    }
  } else {
    console.log('   ⚠️  No clients available for test notification');
  }

  // 3. GET /api/admin-notifications-spec - Admin notifications spec
  console.log('   3. GET /api/admin-notifications-spec - Admin notifications spec');
  const adminNotificationsSpec = await makeRequest('GET', '/api/admin-notifications-spec', null, adminToken);
  if (adminNotificationsSpec.success) {
    console.log('   ✅ Admin notifications spec endpoint accessible');
  } else {
    console.log(`   ❌ Failed: ${adminNotificationsSpec.error?.error || adminNotificationsSpec.error}`);
  }
}

// Test notification endpoints in dashboard context
async function testDashboardNotifications() {
  console.log('\n📊 Testing Dashboard Notification Integration...');
  
  // Test admin dashboard notifications
  console.log('   Testing admin dashboard notifications...');
  const adminDashboard = await makeRequest('GET', '/api/admin-dashboard', null, adminToken);
  if (adminDashboard.success) {
    const notifications = adminDashboard.data.recent_activity?.notifications || [];
    console.log(`   ✅ Admin dashboard includes ${notifications.length} notifications`);
  } else {
    console.log(`   ❌ Admin dashboard failed: ${adminDashboard.error?.error || adminDashboard.error}`);
  }

  // Test client dashboard notifications (using admin token for demo)
  console.log('   Testing client dashboard notifications...');
  const clientDashboard = await makeRequest('GET', '/api/dashboard', null, adminToken);
  if (clientDashboard.success) {
    const notifications = clientDashboard.data.unread_notifications || [];
    console.log(`   ✅ Client dashboard includes ${notifications.length} unread notifications`);
  } else {
    console.log(`   ❌ Client dashboard failed: ${clientDashboard.error?.error || clientDashboard.error}`);
  }
}

// Main test function
async function runNotificationTests() {
  console.log('🔔 Starting Comprehensive Notification Endpoints Test');
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log(`📅 Test run: ${new Date().toISOString()}`);

  // Test authentication
  const adminLoginSuccess = await testAdminLogin();
  if (!adminLoginSuccess) {
    console.log('\n❌ Cannot proceed without admin authentication');
    return;
  }

  const clientLoginSuccess = await testClientLogin();

  // Test client notification endpoints
  await testClientNotificationEndpoints();

  // Test admin notification endpoints
  await testAdminNotificationEndpoints();

  // Test dashboard notification integration
  await testDashboardNotifications();

  console.log('\n🏁 Notification endpoint tests completed!');
  console.log('\n📋 Summary of Available Notification Endpoints:');
  console.log('\n🔹 CLIENT NOTIFICATION ENDPOINTS:');
  console.log('   GET    /api/notifications                    - Get all notifications with filtering');
  console.log('   GET    /api/notifications/unread-count      - Get unread notification count');
  console.log('   GET    /api/notifications/recent            - Get recent notifications');
  console.log('   PATCH  /api/notifications/:id/read         - Mark specific notification as read');
  console.log('   PATCH  /api/notifications/read-all         - Mark all notifications as read');
  console.log('   DELETE /api/notifications/:id              - Delete specific notification');
  
  console.log('\n🔹 ADMIN NOTIFICATION ENDPOINTS:');
  console.log('   GET    /api/notifications/admin/stats      - Get notification statistics (admin only)');
  console.log('   POST   /api/notifications/test             - Create test notification (admin only)');
  console.log('   GET    /api/admin-notifications-spec       - Admin notifications spec endpoint');
  
  console.log('\n🔹 DASHBOARD INTEGRATION:');
  console.log('   GET    /api/dashboard                       - Client dashboard (includes unread_notifications)');
  console.log('   GET    /api/admin-dashboard                 - Admin dashboard (includes recent notifications)');
  
  console.log('\n🔹 QUERY PARAMETERS (for GET /api/notifications):');
  console.log('   ?read=true/false     - Filter by read status');
  console.log('   ?category=system     - Filter by category');
  console.log('   ?priority=high       - Filter by priority');
  console.log('   ?type=application    - Filter by notification type');
  console.log('   ?limit=20           - Limit number of results');
  console.log('   ?offset=0           - Pagination offset');
  console.log('   ?since=2024-01-01   - Get notifications since timestamp (for /recent)');
}

// Run the tests
runNotificationTests().catch(error => {
  console.error('❌ Test execution failed:', error);
});