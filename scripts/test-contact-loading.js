require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'https://apply-bureau-backend.vercel.app';
const ADMIN_EMAIL = 'admin@applybureau.com';
const ADMIN_PASSWORD = 'Admin@123456';
const TEST_EMAIL = 'israelloko65@gmail.com';

async function testContactLoading() {
  console.log('🔍 Testing Contact Loading Issue...\n');
  
  try {
    // Step 1: Submit a test contact form
    console.log('1️⃣ Submitting test contact form...');
    const contactData = {
      firstName: 'Test',
      lastName: 'Contact',
      email: TEST_EMAIL,
      phone: '+1234567890',
      subject: 'Dashboard Loading Test',
      message: 'This is a test contact to verify dashboard loading functionality.'
    };
    
    const contactResponse = await axios.post(`${BASE_URL}/api/contact-requests`, contactData);
    console.log('✅ Contact submitted:', contactResponse.data);
    console.log('   Contact ID:', contactResponse.data.id);
    
    // Step 2: Login as admin
    console.log('\n2️⃣ Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    if (!loginResponse.data.token) {
      console.error('❌ Login failed - no token received');
      console.log('Response:', loginResponse.data);
      return;
    }
    
    const adminToken = loginResponse.data.token;
    console.log('✅ Admin logged in successfully');
    console.log('   Token:', adminToken.substring(0, 20) + '...');
    
    // Step 3: Test GET /api/contact-requests (admin endpoint)
    console.log('\n3️⃣ Testing GET /api/contact-requests...');
    try {
      const contactRequestsResponse = await axios.get(`${BASE_URL}/api/contact-requests`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Contact requests loaded successfully');
      console.log('   Total contacts:', contactRequestsResponse.data.total);
      console.log('   Contacts returned:', contactRequestsResponse.data.data?.length || 0);
      
      if (contactRequestsResponse.data.data && contactRequestsResponse.data.data.length > 0) {
        console.log('\n📋 Sample contact:');
        const sample = contactRequestsResponse.data.data[0];
        console.log('   ID:', sample.id);
        console.log('   Name:', sample.first_name, sample.last_name);
        console.log('   Email:', sample.email);
        console.log('   Subject:', sample.subject);
        console.log('   Status:', sample.status);
        console.log('   Created:', sample.created_at);
      }
    } catch (error) {
      console.error('❌ Failed to load contact requests');
      console.error('   Status:', error.response?.status);
      console.error('   Error:', error.response?.data || error.message);
      console.error('   Headers sent:', error.config?.headers);
    }
    
    // Step 4: Test GET /api/contact (alternative endpoint)
    console.log('\n4️⃣ Testing GET /api/contact (alternative endpoint)...');
    try {
      const contactSubmissionsResponse = await axios.get(`${BASE_URL}/api/contact`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Contact submissions loaded successfully');
      console.log('   Total contacts:', contactSubmissionsResponse.data.pagination?.total || 0);
      console.log('   Contacts returned:', contactSubmissionsResponse.data.contacts?.length || 0);
      
      if (contactSubmissionsResponse.data.contacts && contactSubmissionsResponse.data.contacts.length > 0) {
        console.log('\n📋 Sample contact submission:');
        const sample = contactSubmissionsResponse.data.contacts[0];
        console.log('   ID:', sample.id);
        console.log('   Name:', sample.name);
        console.log('   Email:', sample.email);
        console.log('   Subject:', sample.subject);
        console.log('   Status:', sample.status);
        console.log('   Created:', sample.created_at);
      }
    } catch (error) {
      console.error('❌ Failed to load contact submissions');
      console.error('   Status:', error.response?.status);
      console.error('   Error:', error.response?.data || error.message);
    }
    
    // Step 5: Test CORS headers
    console.log('\n5️⃣ Testing CORS headers...');
    try {
      const corsTest = await axios.options(`${BASE_URL}/api/contact-requests`, {
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'authorization,content-type'
        }
      });
      
      console.log('✅ CORS preflight successful');
      console.log('   Allow-Origin:', corsTest.headers['access-control-allow-origin']);
      console.log('   Allow-Methods:', corsTest.headers['access-control-allow-methods']);
      console.log('   Allow-Headers:', corsTest.headers['access-control-allow-headers']);
    } catch (error) {
      console.error('❌ CORS preflight failed');
      console.error('   Error:', error.message);
    }
    
    // Step 6: Check database tables
    console.log('\n6️⃣ Checking database structure...');
    console.log('   Tables used:');
    console.log('   - contact_requests (for /api/contact-requests)');
    console.log('   - contact_submissions (for /api/contact)');
    console.log('   Note: Frontend might be calling the wrong endpoint!');
    
    console.log('\n✅ DIAGNOSIS COMPLETE');
    console.log('\n📊 SUMMARY:');
    console.log('   - Contact form submission: Working');
    console.log('   - Admin authentication: Working');
    console.log('   - Contact loading endpoint: Check results above');
    console.log('   - Possible issues:');
    console.log('     1. Frontend calling wrong endpoint');
    console.log('     2. CORS blocking the request');
    console.log('     3. Auth token not being sent correctly');
    console.log('     4. RLS policies blocking access');
    console.log('     5. Wrong table being queried');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

testContactLoading();
