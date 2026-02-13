const axios = require('axios');
require('dotenv').config();

// Diagnose the payment confirmation endpoint
async function diagnosePaymentConfirmation() {
  console.log('🔍 Diagnosing Payment Confirmation Endpoint');
  console.log('==========================================\n');

  // Configuration
  const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
  const endpoint = `${BACKEND_URL}/api/admin/concierge/payment-confirmation`;

  console.log('Configuration:');
  console.log('- Backend URL:', BACKEND_URL);
  console.log('- Endpoint:', endpoint);
  console.log('');

  // You need to provide a valid admin token here
  // Get this from your browser's localStorage or by logging in
  const ADMIN_TOKEN = 'YOUR_ADMIN_TOKEN_HERE'; // Replace with actual token

  if (ADMIN_TOKEN === 'YOUR_ADMIN_TOKEN_HERE') {
    console.error('❌ ERROR: Please set a valid ADMIN_TOKEN in this script');
    console.error('');
    console.error('To get your admin token:');
    console.error('1. Log in to the admin dashboard in your browser');
    console.error('2. Open browser DevTools (F12)');
    console.error('3. Go to Console tab');
    console.error('4. Type: localStorage.getItem("token")');
    console.error('5. Copy the token value and paste it in this script');
    console.error('');
    process.exit(1);
  }

  // Test payload
  const payload = {
    consultation_id: 'test-consultation-id', // Optional
    client_email: 'israelloko65@gmail.com',
    client_name: 'Test Client',
    payment_amount: '$500',
    payment_date: new Date().toISOString().split('T')[0],
    package_tier: 'Standard Package',
    package_type: 'tier',
    selected_services: ['Resume Review', 'Interview Prep'],
    payment_method: 'interac_etransfer',
    payment_reference: 'TEST-REF-12345',
    admin_notes: 'Test payment confirmation'
  };

  console.log('Test Payload:');
  console.log(JSON.stringify(payload, null, 2));
  console.log('');

  try {
    console.log('📤 Sending request to endpoint...\n');
    
    const response = await axios.post(endpoint, payload, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ REQUEST SUCCESSFUL!');
    console.log('');
    console.log('Response Status:', response.status);
    console.log('Response Data:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('');

    if (response.data.email_sent === true) {
      console.log('✅ Email was marked as sent in response');
      console.log('📧 Check inbox at:', payload.client_email);
    } else if (response.data.email_sent === false) {
      console.log('⚠️  Email was NOT sent (email_sent: false)');
      console.log('Check backend logs for email errors');
    } else {
      console.log('⚠️  Email status unclear in response');
      console.log('Check backend logs for details');
    }
    console.log('');

  } catch (error) {
    console.error('❌ REQUEST FAILED!');
    console.error('');
    
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:');
      console.error(JSON.stringify(error.response.data, null, 2));
      console.error('');
      
      if (error.response.status === 401) {
        console.error('🔒 Authentication Error:');
        console.error('- Your admin token is invalid or expired');
        console.error('- Please get a fresh token from the browser');
      } else if (error.response.status === 400) {
        console.error('📝 Validation Error:');
        console.error('- Check that all required fields are provided');
        console.error('- Verify the payload format matches the API requirements');
      } else if (error.response.status === 500) {
        console.error('💥 Server Error:');
        console.error('- Check backend logs for detailed error information');
        console.error('- The email might have failed to send');
      }
    } else if (error.request) {
      console.error('🌐 Network Error:');
      console.error('- Could not reach the backend server');
      console.error('- Check that the backend is running');
      console.error('- Verify BACKEND_URL is correct');
    } else {
      console.error('Error:', error.message);
    }
    
    console.error('');
    process.exit(1);
  }
}

// Instructions
console.log('');
console.log('📋 INSTRUCTIONS:');
console.log('================');
console.log('');
console.log('Before running this script:');
console.log('1. Make sure the backend server is running');
console.log('2. Get your admin token from the browser:');
console.log('   - Log in to admin dashboard');
console.log('   - Open DevTools (F12) > Console');
console.log('   - Run: localStorage.getItem("token")');
console.log('   - Copy the token');
console.log('3. Replace ADMIN_TOKEN in this script with your token');
console.log('4. Run: node backend/diagnose-payment-confirmation.js');
console.log('');
console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
console.log('');

// Wait 5 seconds before running
setTimeout(() => {
  diagnosePaymentConfirmation()
    .then(() => {
      console.log('✅ Diagnosis completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Diagnosis failed:', error);
      process.exit(1);
    });
}, 5000);
