require('dotenv').config();
const axios = require('axios');

const VERCEL_URL = 'https://apply-bureau-backend.vercel.app';

async function testVercelWithRealAdmin() {
  console.log('🧪 Testing Vercel Payment Verification with Real Admin\n');
  console.log('='.repeat(60));
  console.log('URL:', VERCEL_URL);
  console.log('='.repeat(60));

  try {
    // Step 1: Try to get admin list to see if admin exists
    console.log('\n📝 Step 1: Checking if admin endpoint is accessible...');
    
    // First, let's try to login with the admin credentials
    console.log('\n📝 Step 2: Attempting admin login...');
    console.log('Email: admin@applybureau.com');
    
    try {
      const loginResponse = await axios.post(`${VERCEL_URL}/api/auth/login`, {
        email: 'admin@applybureau.com',
        password: 'Admin@123456'
      }, {
        validateStatus: function (status) {
          return status < 500; // Resolve only if the status code is less than 500
        }
      });

      console.log('Login Response Status:', loginResponse.status);
      console.log('Login Response:', JSON.stringify(loginResponse.data, null, 2));

      if (loginResponse.status === 200 && loginResponse.data.token) {
        const adminToken = loginResponse.data.token;
        console.log('\n✅ Admin logged in successfully!');
        console.log('Token:', adminToken.substring(0, 30) + '...');

        // Now test the payment verification endpoint
        console.log('\n📝 Step 3: Testing payment verification endpoint...');
        
        const paymentData = {
          client_email: "israelloko65@gmail.com",
          client_name: "Test Client Vercel",
          payment_amount: "299",
          payment_date: "2026-01-15",
          package_tier: "Tier 2",
          package_type: "tier",
          selected_services: []
        };

        console.log('\n📋 Sending payment data:');
        console.log(JSON.stringify(paymentData, null, 2));

        try {
          const paymentResponse = await axios.post(
            `${VERCEL_URL}/api/admin/concierge/payment/confirm-and-invite`,
            paymentData,
            {
              headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
              },
              validateStatus: function (status) {
                return status < 600; // Accept all responses
              }
            }
          );

          console.log('\n📊 Payment Response Status:', paymentResponse.status);
          console.log('📊 Payment Response:');
          console.log(JSON.stringify(paymentResponse.data, null, 2));

          if (paymentResponse.status === 200) {
            console.log('\n✅ Payment verification successful!');
          } else {
            console.log('\n❌ Payment verification failed with status:', paymentResponse.status);
          }

        } catch (paymentError) {
          console.error('\n❌ Payment request error:');
          console.error('Message:', paymentError.message);
          if (paymentError.response) {
            console.error('Status:', paymentError.response.status);
            console.error('Data:', JSON.stringify(paymentError.response.data, null, 2));
          }
        }

      } else {
        console.log('\n❌ Admin login failed');
        console.log('Status:', loginResponse.status);
        console.log('Response:', loginResponse.data);
        
        // The admin might not exist in production database
        console.log('\n💡 Suggestion: The admin user might not exist in the production database.');
        console.log('   You may need to run the admin creation script on production.');
      }

    } catch (loginError) {
      console.error('\n❌ Login request error:');
      console.error('Message:', loginError.message);
      if (loginError.response) {
        console.error('Status:', loginError.response.status);
        console.error('Data:', JSON.stringify(loginError.response.data, null, 2));
      }
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

console.log('🚀 Starting Vercel Test with Real Admin...\n');
testVercelWithRealAdmin();
