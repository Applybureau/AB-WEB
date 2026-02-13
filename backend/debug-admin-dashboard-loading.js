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
    console.log(`   Dashboard type: ${result.data.user.dashboard_type}`);
    return true;
  } else {
    console.log('❌ Admin login failed:', result.error);
    return false;
  }
}

// Test admin dashboard loading
async function testAdminDashboardLoading() {
  console.log('\n📊 Testing Admin Dashboard Loading...');
  
  const result = await makeRequest('GET', '/api/admin-dashboard', null, adminToken);
  
  if (result.success) {
    console.log('✅ Admin dashboard loaded successfully');
    console.log('   Dashboard data structure:');
    console.log(`   - Admin info: ${!!result.data.admin ? '✅' : '❌'}`);
    console.log(`   - Stats: ${!!result.data.stats ? '✅' : '❌'}`);
    console.log(`   - Recent activity: ${!!result.data.recent_activity ? '✅' : '❌'}`);
    console.log(`   - Quick actions: ${!!result.data.quick_actions ? '✅' : '❌'}`);
    
    if (result.data.admin) {
      console.log('   Admin details:');
      console.log(`     - ID: ${result.data.admin.id}`);
      console.log(`     - Name: ${result.data.admin.full_name}`);
      console.log(`     - Email: ${result.data.admin.email}`);
      console.log(`     - Role: ${result.data.admin.role}`);
      console.log(`     - Permissions: ${Object.keys(result.data.admin.permissions || {}).length} permissions`);
    }
    
    if (result.data.stats) {
      console.log('   Stats summary:');
      console.log(`     - Total clients: ${result.data.stats.clients?.total_clients || 0}`);
      console.log(`     - Total consultations: ${result.data.stats.consultations?.total_consultations || 0}`);
      console.log(`     - Total applications: ${result.data.stats.applications?.total_applications || 0}`);
    }
    
    return true;
  } else {
    console.log('❌ Admin dashboard failed to load');
    console.log(`   Status: ${result.status}`);
    console.log(`   Error: ${JSON.stringify(result.error, null, 2)}`);
    
    if (result.fullError) {
      console.log('   Full error details:');
      console.log(`   - Status: ${result.fullError.status}`);
      console.log(`   - Status Text: ${result.fullError.statusText}`);
    }
    
    return false;
  }
}

// Test admin clients endpoint specifically
async function testAdminClientsEndpoint() {
  console.log('\n👥 Testing Admin Clients Endpoint...');
  
  const result = await makeRequest('GET', '/api/admin-dashboard/clients?limit=10', null, adminToken);
  
  if (result.success) {
    console.log('✅ Admin clients endpoint working');
    console.log(`   Total clients returned: ${result.data.clients?.length || 0}`);
    console.log(`   Total count: ${result.data.total || 0}`);
    
    if (result.data.clients && result.data.clients.length > 0) {
      console.log('   Sample client data:');
      const client = result.data.clients[0];
      console.log(`     - ID: ${client.id}`);
      console.log(`     - Name: ${client.full_name}`);
      console.log(`     - Email: ${client.email}`);
      console.log(`     - Onboarding complete: ${client.onboarding_complete}`);
    }
    
    return true;
  } else {
    console.log('❌ Admin clients endpoint failed');
    console.log(`   Status: ${result.status}`);
    console.log(`   Error: ${JSON.stringify(result.error, null, 2)}`);
    return false;
  }
}

// Test admin analytics endpoint
async function testAdminAnalyticsEndpoint() {
  console.log('\n📈 Testing Admin Analytics Endpoint...');
  
  const result = await makeRequest('GET', '/api/admin-dashboard/analytics?period=30d', null, adminToken);
  
  if (result.success) {
    console.log('✅ Admin analytics endpoint working');
    console.log(`   Period: ${result.data.period}`);
    console.log(`   Client growth data points: ${result.data.client_growth?.length || 0}`);
    console.log(`   Consultation trends data points: ${result.data.consultation_trends?.length || 0}`);
    console.log(`   Success metrics: ${Object.keys(result.data.success_metrics || {}).length} metrics`);
    
    return true;
  } else {
    console.log('❌ Admin analytics endpoint failed');
    console.log(`   Status: ${result.status}`);
    console.log(`   Error: ${JSON.stringify(result.error, null, 2)}`);
    return false;
  }
}

// Test individual data sources that admin dashboard depends on
async function testDataSources() {
  console.log('\n🔍 Testing Individual Data Sources...');
  
  // Test clients table access
  console.log('   Testing clients table access...');
  const clientsTest = await makeRequest('GET', '/api/admin-dashboard/clients?limit=1', null, adminToken);
  console.log(`   Clients table: ${clientsTest.success ? '✅' : '❌'}`);
  
  // Test consultations - we'll try the admin concierge endpoint
  console.log('   Testing consultations access...');
  const consultationsTest = await makeRequest('GET', '/api/admin/concierge/consultations?limit=1', null, adminToken);
  console.log(`   Consultations: ${consultationsTest.success ? '✅' : '❌'}`);
  
  // Test applications
  console.log('   Testing applications access...');
  const applicationsTest = await makeRequest('GET', '/api/applications?limit=1', null, adminToken);
  console.log(`   Applications: ${applicationsTest.success ? '✅' : '❌'}`);
  
  // Test notifications
  console.log('   Testing notifications access...');
  const notificationsTest = await makeRequest('GET', '/api/notifications?limit=1', null, adminToken);
  console.log(`   Notifications: ${notificationsTest.success ? '✅' : '❌'}`);
}

// Test admin profile lookup
async function testAdminProfileLookup() {
  console.log('\n👤 Testing Admin Profile Lookup...');
  
  const result = await makeRequest('GET', '/api/auth/me', null, adminToken);
  
  if (result.success) {
    console.log('✅ Admin profile lookup successful');
    console.log('   Profile data:');
    console.log(`     - ID: ${result.data.user.id}`);
    console.log(`     - Name: ${result.data.user.full_name}`);
    console.log(`     - Email: ${result.data.user.email}`);
    console.log(`     - Role: ${result.data.user.role}`);
    console.log(`     - Dashboard type: ${result.data.user.dashboard_type}`);
    console.log(`     - Permissions: ${Object.keys(result.data.user.permissions || {}).length} permissions`);
    
    return true;
  } else {
    console.log('❌ Admin profile lookup failed');
    console.log(`   Status: ${result.status}`);
    console.log(`   Error: ${JSON.stringify(result.error, null, 2)}`);
    return false;
  }
}

// Main debug function
async function runAdminDashboardDebug() {
  console.log('🐛 Starting Admin Dashboard Loading Debug');
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log(`📅 Debug run: ${new Date().toISOString()}`);

  // Test admin login
  const loginSuccess = await testAdminLogin();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without admin authentication');
    return;
  }

  // Test admin profile lookup
  await testAdminProfileLookup();

  // Test individual data sources
  await testDataSources();

  // Test main admin dashboard
  await testAdminDashboardLoading();

  // Test specific admin endpoints
  await testAdminClientsEndpoint();
  await testAdminAnalyticsEndpoint();

  console.log('\n🏁 Admin dashboard debug completed!');
  console.log('\n📋 Summary:');
  console.log('   If any endpoints are failing, that could be causing the admin table not to load.');
  console.log('   Check the specific error messages above for details.');
}

// Run the debug
runAdminDashboardDebug().catch(error => {
  console.error('❌ Debug execution failed:', error);
});