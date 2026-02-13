const axios = require('axios');

// Configuration
const BASE_URL = 'https://apply-bureau-backend.vercel.app';
const ADMIN_EMAIL = 'applybureau@gmail.com';
const ADMIN_PASSWORD = 'Admin123@#';

let authToken = null;

// Helper function to make authenticated requests
async function makeRequest(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
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
    authToken = result.data.token;
    console.log('✅ Admin login successful');
    console.log(`   Token: ${authToken.substring(0, 20)}...`);
    return true;
  } else {
    console.log('❌ Admin login failed:', result.error);
    return false;
  }
}

// Test admin dashboard loading
async function testAdminDashboard() {
  console.log('\n📊 Testing Admin Dashboard...');
  
  const result = await makeRequest('GET', '/api/admin-dashboard');

  if (result.success) {
    console.log('✅ Admin dashboard loaded successfully');
    console.log(`   Admin: ${result.data.admin?.full_name} (${result.data.admin?.email})`);
    console.log(`   Total clients: ${result.data.stats?.clients?.total_clients || 0}`);
    console.log(`   Total consultations: ${result.data.stats?.consultations?.total_consultations || 0}`);
    console.log(`   Quick actions: ${result.data.quick_actions?.length || 0}`);
    return true;
  } else {
    console.log('❌ Admin dashboard failed:', result.error);
    console.log(`   Status: ${result.status}`);
    return false;
  }
}

// Test contact system - create a test contact
async function testContactCreation() {
  console.log('\n📝 Testing Contact Creation...');
  
  const testContact = {
    name: 'Test Contact',
    email: 'test@example.com',
    phone: '+1234567890',
    subject: 'Test Subject',
    message: 'This is a test contact message',
    company: 'Test Company'
  };

  const result = await makeRequest('POST', '/api/contact', testContact);

  if (result.success) {
    console.log('✅ Contact created successfully');
    console.log(`   Contact ID: ${result.data.id}`);
    return result.data.id;
  } else {
    console.log('❌ Contact creation failed:', result.error);
    return null;
  }
}

// Test contact listing (admin only)
async function testContactListing() {
  console.log('\n📋 Testing Contact Listing...');
  
  const result = await makeRequest('GET', '/api/contact?limit=5');

  if (result.success) {
    console.log('✅ Contact listing successful');
    console.log(`   Total contacts: ${result.data.contacts?.length || 0}`);
    if (result.data.contacts && result.data.contacts.length > 0) {
      const contact = result.data.contacts[0];
      console.log(`   First contact: ${contact.name} (${contact.email}) - Status: ${contact.status}`);
      return contact.id;
    }
    return null;
  } else {
    console.log('❌ Contact listing failed:', result.error);
    console.log(`   Status: ${result.status}`);
    return null;
  }
}

// Test contact status update to "handled"
async function testContactStatusUpdate(contactId) {
  if (!contactId) {
    console.log('\n⚠️  Skipping contact status update - no contact ID');
    return false;
  }

  console.log('\n🔄 Testing Contact Status Update to "handled"...');
  
  const result = await makeRequest('PATCH', `/api/contact/${contactId}`, {
    status: 'handled',
    admin_notes: 'Test update to handled status'
  });

  if (result.success) {
    console.log('✅ Contact status updated successfully');
    console.log(`   New status: ${result.data.contact?.status}`);
    console.log(`   Admin notes: ${result.data.contact?.admin_notes}`);
    return true;
  } else {
    console.log('❌ Contact status update failed:', result.error);
    console.log(`   Status: ${result.status}`);
    return false;
  }
}

// Test consultation listing (admin concierge)
async function testConsultationListing() {
  console.log('\n🗓️  Testing Consultation Listing...');
  
  const result = await makeRequest('GET', '/api/admin/concierge/consultations?limit=5');

  if (result.success) {
    console.log('✅ Consultation listing successful');
    console.log(`   Total consultations: ${result.data.consultations?.length || 0}`);
    console.log(`   Status counts:`, result.data.status_counts);
    console.log(`   Available actions:`, result.data.gatekeeper_actions);
    
    if (result.data.consultations && result.data.consultations.length > 0) {
      const consultation = result.data.consultations[0];
      console.log(`   First consultation: ${consultation.prospect_name} (${consultation.prospect_email}) - Status: ${consultation.status}`);
      return consultation.id;
    }
    return null;
  } else {
    console.log('❌ Consultation listing failed:', result.error);
    console.log(`   Status: ${result.status}`);
    return null;
  }
}

// Test admin clients listing
async function testAdminClientsListing() {
  console.log('\n👥 Testing Admin Clients Listing...');
  
  const result = await makeRequest('GET', '/api/admin-dashboard/clients?limit=5');

  if (result.success) {
    console.log('✅ Admin clients listing successful');
    console.log(`   Total clients: ${result.data.clients?.length || 0}`);
    if (result.data.clients && result.data.clients.length > 0) {
      const client = result.data.clients[0];
      console.log(`   First client: ${client.full_name} (${client.email})`);
    }
    return true;
  } else {
    console.log('❌ Admin clients listing failed:', result.error);
    console.log(`   Status: ${result.status}`);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Contact System and Admin Dashboard Tests');
  console.log(`📍 Testing against: ${BASE_URL}`);

  // Test admin login first
  const loginSuccess = await testAdminLogin();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without admin authentication');
    return;
  }

  // Test admin dashboard
  await testAdminDashboard();

  // Test admin clients listing
  await testAdminClientsListing();

  // Test contact system
  const newContactId = await testContactCreation();
  const existingContactId = await testContactListing();
  
  // Test contact status update with either new or existing contact
  const contactIdToUpdate = newContactId || existingContactId;
  await testContactStatusUpdate(contactIdToUpdate);

  // Test consultation system (action buttons)
  await testConsultationListing();

  console.log('\n🏁 Tests completed!');
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test execution failed:', error);
});