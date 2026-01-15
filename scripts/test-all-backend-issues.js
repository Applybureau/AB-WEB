require('dotenv').config();
const axios = require('axios');

const VERCEL_URL = 'https://apply-bureau-backend.vercel.app';
const ADMIN_EMAIL = 'admin@applybureau.com';
const ADMIN_PASSWORD = 'Admin@123456';

async function testAllBackendIssues() {
  console.log('🔍 Testing All Backend Issues\n');
  console.log('='.repeat(70));
  console.log('Backend URL:', VERCEL_URL);
  console.log('='.repeat(70));

  let adminToken = null;

  // Test 1: Admin Login
  console.log('\n📝 Test 1: Admin Login');
  console.log('Endpoint: POST /api/auth/login');
  try {
    const loginResponse = await axios.post(`${VERCEL_URL}/api/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    }, {
      validateStatus: () => true,
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5173'
      }
    });

    console.log('Status:', loginResponse.status);
    
    if (loginResponse.status === 200) {
      console.log('✅ Login successful!');
      adminToken = loginResponse.data.token;
      console.log('Token received:', adminToken ? 'Yes' : 'No');
      console.log('User role:', loginResponse.data.user?.role);
    } else if (loginResponse.status === 429) {
      console.log('⏳ Rate limited. Wait', loginResponse.data.retryAfter, 'seconds');
      console.log('Cannot continue tests without login token.');
      return;
    } else {
      console.log('❌ Login failed:', loginResponse.data);
      return;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  // Test 2: CORS Headers Check
  console.log('\n' + '='.repeat(70));
  console.log('\n📝 Test 2: CORS Headers Check');
  console.log('Testing if CORS allows localhost:5173');
  try {
    const corsResponse = await axios.get(`${VERCEL_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Origin': 'http://localhost:5173'
      },
      validateStatus: () => true
    });

    console.log('Status:', corsResponse.status);
    console.log('CORS Headers:');
    console.log('  Access-Control-Allow-Origin:', corsResponse.headers['access-control-allow-origin'] || 'Not set');
    console.log('  Access-Control-Allow-Credentials:', corsResponse.headers['access-control-allow-credentials'] || 'Not set');
    
    if (corsResponse.headers['access-control-allow-origin']) {
      console.log('✅ CORS is working!');
    } else {
      console.log('⚠️  CORS headers not present - may cause issues in browser');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 3: /api/admin/clients endpoint (500 error fix)
  console.log('\n' + '='.repeat(70));
  console.log('\n📝 Test 3: GET /api/admin/clients (Previously 500 Error)');
  console.log('This endpoint was querying non-existent admin_client_overview view');
  try {
    const clientsResponse = await axios.get(`${VERCEL_URL}/api/admin/clients`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Origin': 'http://localhost:5173'
      },
      params: {
        limit: 10,
        offset: 0
      },
      validateStatus: () => true
    });

    console.log('Status:', clientsResponse.status);
    
    if (clientsResponse.status === 200) {
      console.log('✅ Endpoint working!');
      console.log('Response structure:');
      console.log('  - clients:', Array.isArray(clientsResponse.data.clients) ? `Array (${clientsResponse.data.clients.length})` : 'Not array');
      console.log('  - total:', clientsResponse.data.total);
      console.log('  - offset:', clientsResponse.data.offset);
      console.log('  - limit:', clientsResponse.data.limit);
      
      if (clientsResponse.data.clients && clientsResponse.data.clients.length > 0) {
        console.log('\nSample client data:');
        const sample = clientsResponse.data.clients[0];
        console.log('  - id:', sample.id);
        console.log('  - email:', sample.email);
        console.log('  - full_name:', sample.full_name);
        console.log('  - status:', sample.status);
      }
    } else if (clientsResponse.status === 500) {
      console.log('❌ Still returning 500 error!');
      console.log('Error:', clientsResponse.data);
      console.log('\n⚠️  This means the fix needs to be deployed to Vercel');
    } else if (clientsResponse.status === 401) {
      console.log('❌ Unauthorized - token might be invalid');
    } else {
      console.log('⚠️  Unexpected status:', clientsResponse.status);
      console.log('Response:', clientsResponse.data);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }

  // Test 4: /api/contact-requests endpoint (401 error check)
  console.log('\n' + '='.repeat(70));
  console.log('\n📝 Test 4: GET /api/contact-requests (Previously 401 Error)');
  console.log('This endpoint requires admin authentication');
  try {
    const contactsResponse = await axios.get(`${VERCEL_URL}/api/contact-requests`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Origin': 'http://localhost:5173'
      },
      params: {
        limit: 10,
        page: 1
      },
      validateStatus: () => true
    });

    console.log('Status:', contactsResponse.status);
    
    if (contactsResponse.status === 200) {
      console.log('✅ Endpoint working!');
      console.log('Response structure:');
      console.log('  - data:', Array.isArray(contactsResponse.data.data) ? `Array (${contactsResponse.data.data.length})` : 'Not array');
      console.log('  - total:', contactsResponse.data.total);
      console.log('  - page:', contactsResponse.data.page);
      console.log('  - totalPages:', contactsResponse.data.totalPages);
      
      if (contactsResponse.data.data && contactsResponse.data.data.length > 0) {
        console.log('\nSample contact request:');
        const sample = contactsResponse.data.data[0];
        console.log('  - id:', sample.id);
        console.log('  - name:', sample.name);
        console.log('  - email:', sample.email);
        console.log('  - status:', sample.status);
      }
    } else if (contactsResponse.status === 401) {
      console.log('❌ Still returning 401 Unauthorized!');
      console.log('Possible causes:');
      console.log('  1. Token is invalid or expired');
      console.log('  2. User role is not "admin"');
      console.log('  3. Authentication middleware not working correctly');
      console.log('\nResponse:', contactsResponse.data);
    } else {
      console.log('⚠️  Unexpected status:', contactsResponse.status);
      console.log('Response:', contactsResponse.data);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }

  // Test 5: /api/admin/concierge/consultations endpoint (CORS issue)
  console.log('\n' + '='.repeat(70));
  console.log('\n📝 Test 5: GET /api/admin/concierge/consultations (CORS Issue)');
  console.log('This was the original CORS error endpoint');
  try {
    const consultationsResponse = await axios.get(`${VERCEL_URL}/api/admin/concierge/consultations`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Origin': 'http://localhost:5173'
      },
      params: {
        admin_status: 'all',
        limit: 10
      },
      validateStatus: () => true
    });

    console.log('Status:', consultationsResponse.status);
    
    if (consultationsResponse.status === 200) {
      console.log('✅ Endpoint working!');
      console.log('CORS Headers:');
      console.log('  Access-Control-Allow-Origin:', consultationsResponse.headers['access-control-allow-origin'] || 'Not set');
      
      if (consultationsResponse.headers['access-control-allow-origin']) {
        console.log('✅ CORS headers present!');
      } else {
        console.log('⚠️  CORS headers missing - will fail in browser');
      }
      
      console.log('\nResponse data:', Array.isArray(consultationsResponse.data) ? `Array (${consultationsResponse.data.length})` : typeof consultationsResponse.data);
    } else if (consultationsResponse.status === 401) {
      console.log('❌ Unauthorized');
    } else {
      console.log('⚠️  Unexpected status:', consultationsResponse.status);
      console.log('Response:', consultationsResponse.data);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 SUMMARY');
  console.log('='.repeat(70));
  console.log('\n✅ Tests completed!');
  console.log('\nIf any tests failed:');
  console.log('1. Make sure the latest code is deployed to Vercel');
  console.log('2. Check Vercel environment variables are set correctly');
  console.log('3. Verify admin user exists in database');
  console.log('4. Check Vercel logs for detailed error messages');
  console.log('\nTo deploy to Vercel:');
  console.log('  cd backend');
  console.log('  vercel --prod');
  console.log('\n='.repeat(70));
}

testAllBackendIssues();
