const axios = require('axios');

// Test configuration
const BASE_URL = 'https://apply-bureau-backend.vercel.app';
const ADMIN_EMAIL = 'admin@applybureau.com';
const ADMIN_PASSWORD = 'admin123';

async function testContactEndpoints() {
  try {
    console.log('🧪 Testing Contact Endpoints...\n');

    // Step 1: Login as admin to get token
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    const adminToken = loginResponse.data.token;
    console.log('✅ Admin login successful');

    // Step 2: Submit a test contact form (public endpoint)
    console.log('\n2. Submitting test contact form...');
    const contactData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      subject: 'Test Contact Inquiry',
      message: 'This is a test message from the contact form.'
    };

    const submitResponse = await axios.post(`${BASE_URL}/api/contact`, contactData);
    console.log('✅ Contact form submitted:', submitResponse.data);

    // Step 3: Get all contact submissions (admin endpoint)
    console.log('\n3. Fetching contact submissions as admin...');
    const getResponse = await axios.get(`${BASE_URL}/api/contact-requests`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    console.log('✅ Contact submissions fetched:');
    console.log(`   Total contacts: ${getResponse.data.total}`);
    console.log(`   Current page: ${getResponse.data.page}`);
    
    if (getResponse.data.data.length > 0) {
      const firstContact = getResponse.data.data[0];
      console.log(`   Latest contact: ${firstContact.first_name} ${firstContact.last_name} - ${firstContact.subject}`);
      
      // Step 4: Update contact status (admin endpoint)
      console.log('\n4. Updating contact status...');
      const updateResponse = await axios.patch(`${BASE_URL}/api/contact-requests/${firstContact.id}`, {
        status: 'in_progress',
        admin_notes: 'Following up with client via email'
      }, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      console.log('✅ Contact status updated:', updateResponse.data.message);
    }

    // Step 5: Test pagination and filtering
    console.log('\n5. Testing pagination and filtering...');
    const filteredResponse = await axios.get(`${BASE_URL}/api/contact-requests?status=new&page=1&limit=5`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    console.log('✅ Filtered results:');
    console.log(`   New contacts: ${filteredResponse.data.total}`);

    // Step 6: Test search functionality
    console.log('\n6. Testing search functionality...');
    const searchResponse = await axios.get(`${BASE_URL}/api/contact-requests?search=john`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    console.log('✅ Search results:');
    console.log(`   Matching contacts: ${searchResponse.data.total}`);

    console.log('\n🎉 All contact endpoint tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error(`   Status: ${error.response.status}`);
    }
  }
}

// Run the test
testContactEndpoints();