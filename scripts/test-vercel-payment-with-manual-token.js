require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');

const VERCEL_URL = 'https://apply-bureau-backend.vercel.app';

async function testWithManualToken() {
  console.log('🧪 Testing Vercel Payment with Manual Token\n');
  console.log('='.repeat(60));

  try {
    // Create a manual token for the admin
    const adminToken = jwt.sign({
      userId: '688b3986-0398-4c00-8aa9-0f14a411b378',
      email: 'admin@applybureau.com',
      full_name: 'Admin User',
      role: 'admin'
    }, process.env.JWT_SECRET, { expiresIn: '24h' });

    console.log('✅ Manual token created');
    console.log('Token:', adminToken.substring(0, 30) + '...');

    // Test payment verification
    console.log('\n📝 Testing payment verification...');
    
    const paymentData = {
      client_email: "israelloko65@gmail.com",
      client_name: "Test Client Vercel",
      payment_amount: "299",
      payment_date: "2026-01-15",
      package_tier: "Tier 2",
      package_type: "tier",
      selected_services: []
    };

    console.log('\n📋 Payment Data:');
    console.log(JSON.stringify(paymentData, null, 2));

    try {
      const response = await axios.post(
        `${VERCEL_URL}/api/admin/concierge/payment/confirm-and-invite`,
        paymentData,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          },
          validateStatus: function (status) {
            return status < 600;
          }
        }
      );

      console.log('\n📊 Response Status:', response.status);
      console.log('📊 Response Data:');
      console.log(JSON.stringify(response.data, null, 2));

      if (response.status === 200) {
        console.log('\n✅ Payment verification successful!');
        console.log('✅ The endpoint is working correctly!');
        console.log('✅ Email should have been sent to:', paymentData.client_email);
      } else {
        console.log('\n❌ Payment verification failed');
        console.log('Status:', response.status);
        console.log('This is the error the frontend is seeing!');
      }

    } catch (error) {
      console.error('\n❌ Request failed:');
      console.error('Message:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', JSON.stringify(error.response.data, null, 2));
        console.log('\n🔍 This is the actual error the frontend is getting!');
      }
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

testWithManualToken();
