require('dotenv').config();
const axios = require('axios');

const VERCEL_URL = 'https://apply-bureau-backend.vercel.app';

async function testContactsEndpoint() {
  console.log('\n🧪 TESTING CONTACTS ENDPOINT ON VERCEL\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Login
    console.log('\n📋 Step 1: Logging in...');
    const loginResponse = await axios.post(`${VERCEL_URL}/api/auth/login`, {
      email: 'admin@applybureau.com',
      password: 'admin123'
    });

    console.log('✅ Login successful!');
    const token = loginResponse.data.token;

    // Step 2: Test contact requests endpoint
    console.log('\n📋 Step 2: Fetching contact requests...');
    console.log('URL:', `${VERCEL_URL}/api/contact-requests`);

    const contactsResponse = await axios.get(
      `${VERCEL_URL}/api/contact-requests`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('✅ Contacts fetched successfully!');
    console.log('Status:', contactsResponse.status);
    console.log('Data:', JSON.stringify(contactsResponse.data, null, 2));

    if (contactsResponse.data.contacts) {
      console.log('\n📊 Summary:');
      console.log('  Total contacts:', contactsResponse.data.contacts.length);
      if (contactsResponse.data.contacts.length > 0) {
        console.log('  First contact:', contactsResponse.data.contacts[0]);
      }
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
      console.error('Headers:', error.response.headers);
      
      if (error.response.status === 404) {
        console.log('\n💡 404 Error - Endpoint not found');
        console.log('   Possible issues:');
        console.log('   - Route not registered in server.js');
        console.log('   - Wrong endpoint URL');
        console.log('   - Route file not deployed');
      } else if (error.response.status === 401) {
        console.log('\n💡 401 Error - Authentication failed');
      } else if (error.response.status === 500) {
        console.log('\n💡 500 Error - Server error');
        console.log('   Check database connection and query');
      }
    } else {
      console.error('Error:', error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
}

testContactsEndpoint()
  .then(() => {
    console.log('Test complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
