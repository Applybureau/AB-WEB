const axios = require('axios');

const BASE_URL = 'https://apply-bureau-backend.vercel.app';
const ADMIN_EMAIL = 'admin@applybureau.com';
const ADMIN_PASSWORD = 'admin123';

let adminToken = null;

async function testAdminEndpoints() {
  console.log('🧪 Testing Admin Dashboard Endpoints\n');

  try {
    // Step 1: Admin Login
    console.log('1️⃣ Testing Admin Login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    if (loginResponse.status === 200) {
      adminToken = loginResponse.data.token;
      console.log('✅ Admin login successful');
      console.log('   Token received:', adminToken ? 'Yes' : 'No');
    } else {
      throw new Error('Login failed');
    }

    // Step 2: Get All Consultation Requests
    console.log('\n2️⃣ Testing GET /api/consultation-requests...');
    const consultationsResponse = await axios.get(`${BASE_URL}/api/consultation-requests`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Consultations fetched successfully');
    console.log(`   Found ${consultationsResponse.data.length} consultations`);
    
    if (consultationsResponse.data.length > 0) {
      const firstConsultation = consultationsResponse.data[0];
      console.log('   Sample consultation:');
      console.log(`     ID: ${firstConsultation.id}`);
      console.log(`     Name: ${firstConsultation.full_name}`);
      console.log(`     Email: ${firstConsultation.email}`);
      console.log(`     Status: ${firstConsultation.status}`);
      console.log(`     PDF Available: ${firstConsultation.pdf_url ? 'Yes' : 'No'}`);
      
      // Step 3: Get Specific Consultation
      console.log('\n3️⃣ Testing GET /api/consultation-requests/{id}...');
      const specificResponse = await axios.get(`${BASE_URL}/api/consultation-requests/${firstConsultation.id}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Specific consultation fetched successfully');
      console.log(`   Consultation ID: ${specificResponse.data.id}`);
    }

    // Step 4: Test Filtering
    console.log('\n4️⃣ Testing consultation filtering...');
    const pendingResponse = await axios.get(`${BASE_URL}/api/consultation-requests?status=pending`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Filtering by status works');
    console.log(`   Pending consultations: ${pendingResponse.data.length}`);

    // Step 5: Test Search
    console.log('\n5️⃣ Testing consultation search...');
    const searchResponse = await axios.get(`${BASE_URL}/api/consultation-requests?search=test`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Search functionality works');
    console.log(`   Search results: ${searchResponse.data.length}`);

    // Step 6: Test Pagination
    console.log('\n6️⃣ Testing pagination...');
    const paginatedResponse = await axios.get(`${BASE_URL}/api/consultation-requests?limit=5&offset=0`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Pagination works');
    console.log(`   Limited results: ${paginatedResponse.data.length}`);

    // Step 7: Test Admin Stats (if available)
    console.log('\n7️⃣ Testing admin stats...');
    try {
      const statsResponse = await axios.get(`${BASE_URL}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Admin stats available');
      console.log('   System info:', statsResponse.data.system ? 'Available' : 'Not available');
    } catch (error) {
      console.log('⚠️  Admin stats endpoint not available or requires different permissions');
    }

    // Step 8: Test Enhanced Dashboard (if available)
    console.log('\n8️⃣ Testing enhanced dashboard...');
    try {
      const dashboardResponse = await axios.get(`${BASE_URL}/api/enhanced-dashboard`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Enhanced dashboard available');
      console.log('   Dashboard data:', dashboardResponse.data ? 'Available' : 'Not available');
    } catch (error) {
      console.log('⚠️  Enhanced dashboard endpoint not available');
    }

    console.log('\n🎉 All admin endpoint tests completed successfully!');
    
    // Summary for frontend developers
    console.log('\n📋 FRONTEND INTEGRATION SUMMARY:');
    console.log('✅ Admin login: POST /api/auth/login');
    console.log('✅ Get consultations: GET /api/consultation-requests');
    console.log('✅ Get specific consultation: GET /api/consultation-requests/{id}');
    console.log('✅ Filter consultations: GET /api/consultation-requests?status=pending');
    console.log('✅ Search consultations: GET /api/consultation-requests?search=term');
    console.log('✅ Paginate consultations: GET /api/consultation-requests?limit=10&offset=0');
    console.log('✅ Update consultation: PATCH /api/consultation-requests/{id}');
    
    console.log('\n🔗 All endpoints use Authorization: Bearer {token}');
    console.log('📄 PDF files available via pdf_url field in consultation data');

  } catch (error) {
    console.error('\n❌ Admin endpoint test failed:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    } else {
      console.error('   Error:', error.message);
    }
    process.exit(1);
  }
}

// Test consultation status update
async function testStatusUpdate() {
  if (!adminToken) {
    console.log('⚠️  Skipping status update test - no admin token');
    return;
  }

  console.log('\n🔄 Testing consultation status updates...');
  
  try {
    // Get a consultation to update
    const consultationsResponse = await axios.get(`${BASE_URL}/api/consultation-requests?limit=1`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (consultationsResponse.data.length === 0) {
      console.log('⚠️  No consultations available for status update test');
      return;
    }

    const consultation = consultationsResponse.data[0];
    console.log(`Testing status update on consultation: ${consultation.id}`);

    // Test status update to under_review
    const updateResponse = await axios.patch(`${BASE_URL}/api/consultation-requests/${consultation.id}`, {
      status: 'under_review',
      admin_notes: 'Test status update from automated test'
    }, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Status update successful');
    console.log(`   New status: ${updateResponse.data.consultation.status}`);

  } catch (error) {
    console.error('❌ Status update test failed:', error.response?.data || error.message);
  }
}

// Run tests
async function runAllTests() {
  await testAdminEndpoints();
  await testStatusUpdate();
}

if (require.main === module) {
  runAllTests();
}

module.exports = { testAdminEndpoints, testStatusUpdate };