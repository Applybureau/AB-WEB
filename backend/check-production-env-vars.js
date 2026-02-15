/**
 * CHECK PRODUCTION ENVIRONMENT VARIABLES
 * 
 * This script checks which environment variables are available in production
 * by making a test request that logs the environment.
 * 
 * Usage: node backend/check-production-env-vars.js <ADMIN_TOKEN>
 */

const axios = require('axios');

const PRODUCTION_URL = 'https://jellyfish-app-t4m35.ondigitalocean.app';

console.log('🔍 Checking Production Environment Variables\n');
console.log('Production URL:', PRODUCTION_URL);
console.log('\n' + '='.repeat(60) + '\n');

async function checkEnvironment(adminToken) {
  try {
    // Test 1: Check if server responds
    console.log('📡 Testing server connection...');
    const healthCheck = await axios.get(`${PRODUCTION_URL}/health`, { timeout: 10000 });
    console.log('✅ Server is reachable\n');

    // Test 2: Make a request that will trigger email sending
    // The error logs will reveal if RESEND_API_KEY is set
    console.log('🧪 Testing email endpoint to check environment...');
    
    try {
      const response = await axios.post(
        `${PRODUCTION_URL}/api/admin/concierge/payment-confirmation`,
        {
          client_email: 'env-test@example.com',
          client_name: 'Environment Test',
          payment_amount: '1'
        },
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      console.log('\n📊 Response Analysis:');
      console.log('Status:', response.status);
      console.log('Has email_sent flag:', response.data.hasOwnProperty('email_sent'));
      console.log('email_sent value:', response.data.email_sent);
      
      if (response.data.email_sent === true) {
        console.log('\n✅ RESEND_API_KEY IS SET AND WORKING');
        console.log('Emails should be sending successfully.');
      } else if (response.data.email_sent === false) {
        console.log('\n⚠️  RESEND_API_KEY MAY BE MISSING OR INVALID');
        console.log('Email sending is failing in production.');
      }

    } catch (error) {
      if (error.response) {
        console.log('\n📊 Error Response Analysis:');
        console.log('Status:', error.response.status);
        console.log('Error:', error.response.data.error);
        console.log('Has email_sent flag:', error.response.data.hasOwnProperty('email_sent'));
        
        if (error.response.data.hasOwnProperty('email_sent')) {
          console.log('email_sent value:', error.response.data.email_sent);
          
          if (error.response.data.email_sent === false) {
            console.log('\n❌ RESEND_API_KEY IS MISSING OR INVALID');
          }
        }
      } else {
        console.log('Request error:', error.message);
      }
    }

    // Test 3: Check what we can infer about environment
    console.log('\n' + '='.repeat(60));
    console.log('ENVIRONMENT VARIABLE CHECKLIST');
    console.log('='.repeat(60));
    
    console.log('\n✅ Variables that MUST be set:');
    console.log('  - SUPABASE_URL');
    console.log('  - SUPABASE_SERVICE_KEY');
    console.log('  - JWT_SECRET');
    console.log('  - RESEND_API_KEY  <-- CRITICAL FOR EMAILS');
    console.log('  - FRONTEND_URL');
    console.log('  - BACKEND_URL');
    
    console.log('\n📋 How to verify in DigitalOcean:');
    console.log('  1. Go to: https://cloud.digitalocean.com/apps');
    console.log('  2. Select app: jellyfish-app-t4m35');
    console.log('  3. Click: Settings > App-Level Environment Variables');
    console.log('  4. Check if RESEND_API_KEY exists');
    console.log('  5. Value should be: re_DkzYXYAB_DN7Td7bHkh6FFYbT9sLvHib8');
    
    console.log('\n🔧 If RESEND_API_KEY is missing:');
    console.log('  1. Click "Edit" button');
    console.log('  2. Click "Add Variable"');
    console.log('  3. Key: RESEND_API_KEY');
    console.log('  4. Value: re_DkzYXYAB_DN7Td7bHkh6FFYbT9sLvHib8');
    console.log('  5. Scope: All components');
    console.log('  6. Click "Save"');
    console.log('  7. Wait for automatic redeploy (2-3 minutes)');
    
    console.log('\n' + '='.repeat(60));
    console.log('NEXT STEPS');
    console.log('='.repeat(60));
    console.log('\n1. Verify RESEND_API_KEY in DigitalOcean');
    console.log('2. If missing, add it and wait for redeploy');
    console.log('3. Run diagnostic again:');
    console.log('   node backend/diagnose-production-email-complete.js <TOKEN>');
    console.log('4. Test should show email_sent: true');
    console.log('\n');

  } catch (error) {
    console.error('❌ Failed to check environment:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n❌ Cannot connect to production server');
      console.log('Server may be down or URL is incorrect');
    } else if (error.response?.status === 401) {
      console.log('\n❌ Invalid admin token');
      console.log('Get a new token from the admin dashboard');
    }
  }
}

// Main execution
const adminToken = process.argv[2];

if (!adminToken) {
  console.error('❌ Error: Admin token required');
  console.log('Usage: node backend/check-production-env-vars.js <ADMIN_TOKEN>');
  console.log('');
  console.log('To get an admin token:');
  console.log('1. Login to admin dashboard');
  console.log('2. Open browser console');
  console.log('3. Run: localStorage.getItem("token")');
  process.exit(1);
}

checkEnvironment(adminToken)
  .then(() => {
    console.log('✅ Environment check complete\n');
  })
  .catch((error) => {
    console.error('❌ Environment check failed:', error.message);
    process.exit(1);
  });
