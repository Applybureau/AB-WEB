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
      status: error.response?.status || 500
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

// Test contact update endpoints
async function testContactUpdateEndpoints() {
  console.log('\n📞 Testing Contact Update Endpoints...');
  
  // 1. Get contacts to find one to update
  console.log('   1. Getting contacts list...');
  const contactsResult = await makeRequest('GET', '/api/contact?limit=5', null, adminToken);
  
  if (!contactsResult.success) {
    console.log('   ❌ Failed to get contacts:', contactsResult.error);
    return;
  }
  
  console.log(`   ✅ Found ${contactsResult.data.contacts?.length || 0} contacts`);
  
  if (!contactsResult.data.contacts || contactsResult.data.contacts.length === 0) {
    console.log('   ⚠️  No contacts found, creating a test contact...');
    
    // Create a test contact
    const createResult = await makeRequest('POST', '/api/contact', {
      name: 'Test Contact Update',
      email: 'test-update@example.com',
      phone: '+1234567890',
      subject: 'Test Contact Update',
      message: 'This is a test contact for update testing',
      company: 'Test Company'
    });
    
    if (createResult.success) {
      console.log('   ✅ Test contact created');
      
      // Get the updated contacts list
      const updatedContactsResult = await makeRequest('GET', '/api/contact?limit=5', null, adminToken);
      if (updatedContactsResult.success && updatedContactsResult.data.contacts.length > 0) {
        contactsResult.data.contacts = updatedContactsResult.data.contacts;
      }
    } else {
      console.log('   ❌ Failed to create test contact:', createResult.error);
      return;
    }
  }
  
  // 2. Test updating contact status
  const testContact = contactsResult.data.contacts[0];
  console.log(`   2. Testing update on contact: ${testContact.name} (${testContact.id})`);
  console.log(`      Current status: ${testContact.status}`);
  
  // Test different status updates
  const statusTests = [
    { status: 'in_progress', notes: 'Working on this contact' },
    { status: 'handled', notes: 'Contact has been resolved successfully' },
    { status: 'pending', notes: 'Reset to pending for testing' }
  ];
  
  for (const test of statusTests) {
    console.log(`   Testing status update to: ${test.status}`);
    
    const updateResult = await makeRequest('PATCH', `/api/contact/${testContact.id}`, {
      status: test.status,
      admin_notes: test.notes
    }, adminToken);
    
    if (updateResult.success) {
      console.log(`   ✅ Status updated to "${test.status}"`);
      console.log(`      Admin notes: ${updateResult.data.contact?.admin_notes || 'N/A'}`);
      console.log(`      Updated at: ${updateResult.data.contact?.updated_at || 'N/A'}`);
    } else {
      console.log(`   ❌ Failed to update to "${test.status}":`, updateResult.error);
    }
  }
  
  // 3. Test filtering by status
  console.log('   3. Testing status filtering...');
  
  const filterTests = ['pending', 'in_progress', 'handled', 'all'];
  
  for (const status of filterTests) {
    const filterResult = await makeRequest('GET', `/api/contact?status=${status}&limit=10`, null, adminToken);
    
    if (filterResult.success) {
      console.log(`   ✅ Filter "${status}": ${filterResult.data.contacts?.length || 0} contacts`);
    } else {
      console.log(`   ❌ Filter "${status}" failed:`, filterResult.error);
    }
  }
}

// Main test function
async function runContactUpdateTests() {
  console.log('🚀 Starting Contact Update Endpoint Tests');
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log(`📅 Test run: ${new Date().toISOString()}`);

  // Test admin login
  const loginSuccess = await testAdminLogin();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without admin authentication');
    return;
  }

  // Test contact update endpoints
  await testContactUpdateEndpoints();

  console.log('\n🏁 Contact update tests completed!');
  console.log('\n📋 Contact Update Endpoint Summary:');
  console.log('   PATCH /api/contact/:id - Update contact status and notes (Admin only)');
  console.log('   GET   /api/contact?status=handled - Filter contacts by status');
  console.log('   GET   /api/contact?search=keyword - Search contacts');
  console.log('   POST  /api/contact - Create new contact (Public)');
  console.log('\n✅ Available statuses: pending, in_progress, handled, completed, archived');
}

// Run the tests
runContactUpdateTests().catch(error => {
  console.error('❌ Test execution failed:', error);
});