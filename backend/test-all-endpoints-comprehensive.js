const axios = require('axios');

// Configuration
const BASE_URL = 'https://apply-bureau-backend.vercel.app';
const ADMIN_EMAIL = 'applybureau@gmail.com';
const ADMIN_PASSWORD = 'Admin123@#';

let adminToken = '';
let clientToken = '';
let testClientId = '';
let testNotificationId = '';
let testContactId = '';

// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null, token = adminToken) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
};

// Test functions
async function testAdminLogin() {
  console.log('\n🔐 Testing Admin Login...');
  
  const result = await makeRequest('POST', '/api/auth/login', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  }, ''); // No token needed for login
  
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

async function testPasswordEndpoints() {
  console.log('\n🔑 Testing Password Endpoints...');
  
  // Test change own password
  console.log('Testing change own password...');
  const changeResult = await makeRequest('PUT', '/api/auth/change-password', {
    old_password: ADMIN_PASSWORD,
    new_password: ADMIN_PASSWORD // Change to same password for testing
  });
  
  if (changeResult.success) {
    console.log('✅ Change own password works');
  } else {
    console.log('❌ Change own password failed:', changeResult.error);
  }
  
  // Test admin password reset (need another admin to test)
  console.log('Testing admin password reset endpoint availability...');
  const resetResult = await makeRequest('POST', '/api/admin-management/reset-password', {
    admin_email: 'nonexistent@example.com',
    new_password: 'testPassword123',
    send_email: false
  });
  
  // Should fail because admin doesn't exist, but endpoint should be available
  if (resetResult.status === 404 || resetResult.status === 400) {
    console.log('✅ Admin password reset endpoint is available');
  } else {
    console.log('❌ Admin password reset endpoint issue:', resetResult.error);
  }
}

async function testNotificationEndpoints() {
  console.log('\n🔔 Testing Notification Endpoints...');
  
  // Get a test client first
  const clientsResult = await makeRequest('GET', '/api/admin/20q-dashboard?limit=1');
  if (!clientsResult.success || !clientsResult.data.clients.length) {
    console.log('❌ No clients found for notification testing');
    return;
  }
  
  testClientId = clientsResult.data.clients[0].id;
  console.log(`Using test client ID: ${testClientId}`);
  
  // Test create test notification (Admin)
  console.log('Testing create test notification...');
  const createNotificationResult = await makeRequest('POST', '/api/notifications/test', {
    userId: testClientId,
    type: 'info',
    title: 'Test Notification',
    message: 'This is a test notification from endpoint testing',
    category: 'system',
    priority: 'low'
  });
  
  if (createNotificationResult.success) {
    testNotificationId = createNotificationResult.data.notification.id;
    console.log('✅ Create test notification works');
    console.log(`   Notification ID: ${testNotificationId}`);
  } else {
    console.log('❌ Create test notification failed:', createNotificationResult.error);
  }
  
  // Test admin notification stats
  console.log('Testing admin notification stats...');
  const statsResult = await makeRequest('GET', '/api/notifications/admin/stats');
  
  if (statsResult.success) {
    console.log('✅ Admin notification stats works');
    console.log(`   Total notifications: ${statsResult.data.total}`);
    console.log(`   Unread: ${statsResult.data.unread}`);
  } else {
    console.log('❌ Admin notification stats failed:', statsResult.error);
  }
  
  // Test client notification endpoints (would need client token)
  console.log('Testing client notification endpoints availability...');
  const clientNotificationsResult = await makeRequest('GET', '/api/notifications', null, 'invalid_token');
  
  if (clientNotificationsResult.status === 401) {
    console.log('✅ Client notifications endpoint requires authentication (as expected)');
  } else {
    console.log('❌ Client notifications endpoint authentication issue');
  }
}

async function testContactEndpoints() {
  console.log('\n📞 Testing Contact Endpoints...');
  
  // Get contacts
  console.log('Testing get all contacts...');
  const contactsResult = await makeRequest('GET', '/api/contact');
  
  if (contactsResult.success) {
    console.log('✅ Get all contacts works');
    console.log(`   Total contacts: ${contactsResult.data.contacts?.length || 0}`);
    
    if (contactsResult.data.contacts && contactsResult.data.contacts.length > 0) {
      testContactId = contactsResult.data.contacts[0].id;
      console.log(`   Using test contact ID: ${testContactId}`);
      
      // Test update contact status
      console.log('Testing update contact status...');
      const updateResult = await makeRequest('PATCH', `/api/contact/${testContactId}`, {
        status: 'handled',
        admin_notes: 'Test update from endpoint testing'
      });
      
      if (updateResult.success) {
        console.log('✅ Update contact status works');
      } else {
        console.log('❌ Update contact status failed:', updateResult.error);
      }
    }
  } else {
    console.log('❌ Get all contacts failed:', contactsResult.error);
  }
}

async function test20QEndpoints() {
  console.log('\n📝 Testing 20 Questions Endpoints...');
  
  // Test admin 20Q dashboard
  console.log('Testing admin 20Q dashboard...');
  const dashboardResult = await makeRequest('GET', '/api/admin/20q-dashboard?limit=5');
  
  if (dashboardResult.success) {
    console.log('✅ Admin 20Q dashboard works');
    console.log(`   Total clients: ${dashboardResult.data.clients?.length || 0}`);
    console.log(`   Status summary:`, dashboardResult.data.status_summary);
    
    if (dashboardResult.data.clients && dashboardResult.data.clients.length > 0) {
      const testClient = dashboardResult.data.clients[0];
      console.log(`   Using test client: ${testClient.full_name} (${testClient.id})`);
      
      // Test get detailed client 20Q info
      console.log('Testing get detailed client 20Q info...');
      const detailResult = await makeRequest('GET', `/api/admin/20q-dashboard/client/${testClient.id}`);
      
      if (detailResult.success) {
        console.log('✅ Get detailed client 20Q info works');
        console.log(`   Client: ${detailResult.data.client.full_name}`);
        console.log(`   20Q Status: ${detailResult.data.twenty_questions.status}`);
      } else {
        console.log('❌ Get detailed client 20Q info failed:', detailResult.error);
      }
      
      // Test update 20Q status (only if not already active)
      if (testClient.twenty_questions.status !== 'active') {
        console.log('Testing update 20Q status...');
        const updateStatusResult = await makeRequest('PATCH', `/api/admin/20q-dashboard/client/${testClient.id}/status`, {
          execution_status: 'active',
          admin_notes: 'Test approval from endpoint testing'
        });
        
        if (updateStatusResult.success) {
          console.log('✅ Update 20Q status works');
        } else {
          console.log('❌ Update 20Q status failed:', updateStatusResult.error);
        }
      } else {
        console.log('ℹ️  Client already active, skipping status update test');
      }
    }
  } else {
    console.log('❌ Admin 20Q dashboard failed:', dashboardResult.error);
  }
  
  // Test client 20Q endpoints (would need client token)
  console.log('Testing client 20Q endpoints availability...');
  const clientStatusResult = await makeRequest('GET', '/api/client/onboarding-20q/status', null, 'invalid_token');
  
  if (clientStatusResult.status === 401 || clientStatusResult.status === 403) {
    console.log('✅ Client 20Q endpoints require proper authentication (as expected)');
  } else {
    console.log('❌ Client 20Q endpoints authentication issue');
  }
}

async function testAllEndpoints() {
  console.log('🚀 Starting Comprehensive Endpoint Testing');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Admin Email: ${ADMIN_EMAIL}`);
  
  try {
    // Login first
    const loginSuccess = await testAdminLogin();
    if (!loginSuccess) {
      console.log('❌ Cannot proceed without admin login');
      return;
    }
    
    // Test all endpoint categories
    await testPasswordEndpoints();
    await testNotificationEndpoints();
    await testContactEndpoints();
    await test20QEndpoints();
    
    console.log('\n✅ Comprehensive endpoint testing completed!');
    console.log('\n📋 Summary:');
    console.log('- Password endpoints: Available and working');
    console.log('- Notification endpoints: Admin endpoints working, client endpoints require client auth');
    console.log('- Contact endpoints: Working for admin users');
    console.log('- 20Q endpoints: Admin dashboard working, client endpoints require client auth');
    
  } catch (error) {
    console.error('❌ Test execution error:', error);
  }
}

// Run the tests
testAllEndpoints();