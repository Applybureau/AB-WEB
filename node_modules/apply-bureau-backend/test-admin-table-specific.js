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
    return true;
  } else {
    console.log('❌ Admin login failed:', result.error);
    return false;
  }
}

// Test different admin table endpoints that might be used by frontend
async function testAdminTableEndpoints() {
  console.log('\n📋 Testing All Possible Admin Table Endpoints...');
  
  const endpointsToTest = [
    // Main admin dashboard
    { name: 'Admin Dashboard', endpoint: '/api/admin-dashboard' },
    
    // Admin clients (most likely the "admin table")
    { name: 'Admin Clients (default)', endpoint: '/api/admin-dashboard/clients' },
    { name: 'Admin Clients (limit 20)', endpoint: '/api/admin-dashboard/clients?limit=20' },
    { name: 'Admin Clients (with search)', endpoint: '/api/admin-dashboard/clients?search=test' },
    { name: 'Admin Clients (active only)', endpoint: '/api/admin-dashboard/clients?status=active' },
    { name: 'Admin Clients (pending only)', endpoint: '/api/admin-dashboard/clients?status=pending' },
    
    // Admin management endpoints
    { name: 'Admin Management', endpoint: '/api/admin-management' },
    { name: 'Admin Management Admins', endpoint: '/api/admin-management/admins' },
    
    // Other possible admin tables
    { name: 'Admin Consultations', endpoint: '/api/admin/concierge/consultations' },
    { name: 'Admin Applications', endpoint: '/api/applications' },
    { name: 'Admin Contacts', endpoint: '/api/contact' },
    { name: 'Admin Notifications', endpoint: '/api/notifications' },
    
    // Admin analytics
    { name: 'Admin Analytics', endpoint: '/api/admin-dashboard/analytics' },
    
    // Admin 20Q Dashboard
    { name: 'Admin 20Q Dashboard', endpoint: '/api/admin/20q-dashboard' },
  ];

  for (const test of endpointsToTest) {
    console.log(`   Testing: ${test.name}`);
    const result = await makeRequest('GET', test.endpoint, null, adminToken);
    
    if (result.success) {
      console.log(`   ✅ ${test.name}: Working`);
      
      // Show data structure for table-like endpoints
      if (result.data.clients) {
        console.log(`      - Clients: ${result.data.clients.length} items`);
      }
      if (result.data.consultations) {
        console.log(`      - Consultations: ${result.data.consultations.length} items`);
      }
      if (result.data.applications) {
        console.log(`      - Applications: ${result.data.applications.length} items`);
      }
      if (result.data.contacts) {
        console.log(`      - Contacts: ${result.data.contacts.length} items`);
      }
      if (result.data.notifications) {
        console.log(`      - Notifications: ${result.data.notifications.length} items`);
      }
      if (result.data.admins) {
        console.log(`      - Admins: ${result.data.admins.length} items`);
      }
      
    } else {
      console.log(`   ❌ ${test.name}: Failed (${result.status})`);
      if (result.status === 404) {
        console.log(`      - Endpoint not found`);
      } else if (result.status === 403) {
        console.log(`      - Access denied`);
      } else if (result.status === 500) {
        console.log(`      - Server error: ${result.error?.error || 'Unknown error'}`);
      }
    }
  }
}

// Test with different query parameters that might affect loading
async function testAdminClientsWithDifferentParams() {
  console.log('\n🔍 Testing Admin Clients with Different Parameters...');
  
  const paramTests = [
    { name: 'No params', params: '' },
    { name: 'Limit 5', params: '?limit=5' },
    { name: 'Limit 50', params: '?limit=50' },
    { name: 'With offset', params: '?limit=10&offset=0' },
    { name: 'Active status', params: '?status=active' },
    { name: 'Pending status', params: '?status=pending' },
    { name: 'Search test', params: '?search=test' },
    { name: 'Search admin', params: '?search=admin' },
  ];

  for (const test of paramTests) {
    console.log(`   Testing: ${test.name}`);
    const result = await makeRequest('GET', `/api/admin-dashboard/clients${test.params}`, null, adminToken);
    
    if (result.success) {
      console.log(`   ✅ ${test.name}: ${result.data.clients?.length || 0} clients returned`);
      console.log(`      - Total: ${result.data.total || 'N/A'}`);
      console.log(`      - Offset: ${result.data.offset || 0}`);
      console.log(`      - Limit: ${result.data.limit || 'N/A'}`);
    } else {
      console.log(`   ❌ ${test.name}: Failed (${result.status}) - ${result.error?.error || 'Unknown error'}`);
    }
  }
}

// Test response times to see if there's a timeout issue
async function testResponseTimes() {
  console.log('\n⏱️  Testing Response Times...');
  
  const endpoints = [
    '/api/admin-dashboard',
    '/api/admin-dashboard/clients',
    '/api/admin-dashboard/clients?limit=20',
    '/api/admin/concierge/consultations?limit=10'
  ];

  for (const endpoint of endpoints) {
    const startTime = Date.now();
    const result = await makeRequest('GET', endpoint, null, adminToken);
    const responseTime = Date.now() - startTime;
    
    console.log(`   ${endpoint}: ${responseTime}ms ${result.success ? '✅' : '❌'}`);
    
    if (responseTime > 5000) {
      console.log(`      ⚠️  Slow response (${responseTime}ms) - might cause frontend timeout`);
    }
  }
}

// Main test function
async function runAdminTableTests() {
  console.log('🔍 Starting Admin Table Loading Tests');
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log(`📅 Test run: ${new Date().toISOString()}`);

  // Test admin login
  const loginSuccess = await testAdminLogin();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without admin authentication');
    return;
  }

  // Test all possible admin table endpoints
  await testAdminTableEndpoints();

  // Test admin clients with different parameters
  await testAdminClientsWithDifferentParams();

  // Test response times
  await testResponseTimes();

  console.log('\n🏁 Admin table tests completed!');
  console.log('\n💡 Troubleshooting Tips:');
  console.log('   1. If all endpoints are working, the issue might be frontend-related');
  console.log('   2. Check browser console for JavaScript errors');
  console.log('   3. Check network tab for failed requests');
  console.log('   4. Verify the frontend is calling the correct endpoint');
  console.log('   5. Check if there are CORS issues');
  console.log('   6. Verify the frontend is sending the correct Authorization header');
}

// Run the tests
runAdminTableTests().catch(error => {
  console.error('❌ Test execution failed:', error);
});