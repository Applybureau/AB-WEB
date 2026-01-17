/**
 * DIAGNOSE VERCEL ERRORS
 * Detailed diagnosis of each failing endpoint
 */

const axios = require('axios');

const BASE_URL = 'https://apply-bureau-backend.vercel.app';
const ADMIN_EMAIL = 'israelloko65@gmail.com';
const ADMIN_PASSWORD = 'admin123';

let adminToken = null;

async function getAdminToken() {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    return response.data.token;
  } catch (error) {
    console.error('❌ Failed to get admin token:', error.message);
    return null;
  }
}

async function diagnoseEndpoint(name, method, url, options = {}) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔍 DIAGNOSING: ${name}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Method: ${method}`);
  console.log(`URL: ${BASE_URL}${url}`);
  
  if (options.data) {
    console.log(`Request Body:`, JSON.stringify(options.data, null, 2));
  }
  
  try {
    const response = await axios({
      method,
      url: `${BASE_URL}${url}`,
      ...options,
      timeout: 15000
    });
    
    console.log(`\n✅ SUCCESS`);
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log(`\n❌ FAILED`);
    
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Error Response:`, JSON.stringify(error.response.data, null, 2));
      
      // Extract error ID if present
      if (error.response.data.errorId) {
        console.log(`\n🆔 Error ID: ${error.response.data.errorId}`);
        console.log(`   (Check Vercel logs for this error ID)`);
      }
      
      // Analyze error type
      if (error.response.status === 400) {
        console.log(`\n📋 DIAGNOSIS: Bad Request - Check request payload format`);
      } else if (error.response.status === 403) {
        console.log(`\n🔒 DIAGNOSIS: Permission Denied - Check user role/permissions`);
      } else if (error.response.status === 404) {
        console.log(`\n🔍 DIAGNOSIS: Not Found - Check route registration`);
      } else if (error.response.status === 500) {
        console.log(`\n💥 DIAGNOSIS: Server Error - Likely database or code issue`);
        console.log(`   Possible causes:`);
        console.log(`   - Missing database table or column`);
        console.log(`   - SQL query syntax error`);
        console.log(`   - Null reference error`);
        console.log(`   - Database connection issue`);
      }
      
    } else if (error.request) {
      console.log(`\n🌐 DIAGNOSIS: No response received`);
      console.log(`   Possible causes:`);
      console.log(`   - Network timeout`);
      console.log(`   - Server not responding`);
      console.log(`   - CORS issue`);
    } else {
      console.log(`\n⚠️ DIAGNOSIS: Request setup error`);
      console.log(`Error: ${error.message}`);
    }
  }
}

async function runDiagnosis() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║       VERCEL BACKEND ERROR DIAGNOSIS           ║');
  console.log('╚════════════════════════════════════════════════╝\n');
  console.log(`Testing: ${BASE_URL}\n`);

  // Get admin token
  console.log('🔐 Getting admin token...');
  adminToken = await getAdminToken();
  
  if (!adminToken) {
    console.log('\n❌ Cannot proceed without admin token\n');
    return;
  }
  
  console.log('✅ Admin token obtained\n');

  // Diagnose each failing endpoint
  
  // 1. Contact Request Schema Issue
  await diagnoseEndpoint(
    'Contact Request (Current Frontend Format)',
    'POST',
    '/api/contact-requests',
    {
      data: {
        full_name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        message: 'Test message'
      }
    }
  );

  await diagnoseEndpoint(
    'Contact Request (Backend Expected Format)',
    'POST',
    '/api/contact-requests',
    {
      data: {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test message'
      }
    }
  );

  // 2. Admin Dashboard Overview
  await diagnoseEndpoint(
    'Admin Dashboard Overview',
    'GET',
    '/api/admin-dashboard/overview',
    {
      headers: { Authorization: `Bearer ${adminToken}` }
    }
  );

  // 3. Enhanced Dashboard
  await diagnoseEndpoint(
    'Enhanced Dashboard',
    'GET',
    '/api/enhanced-dashboard',
    {
      headers: { Authorization: `Bearer ${adminToken}` }
    }
  );

  // 4. Onboarding Submissions
  await diagnoseEndpoint(
    'Onboarding Submissions',
    'GET',
    '/api/admin/concierge/onboarding',
    {
      headers: { Authorization: `Bearer ${adminToken}` }
    }
  );

  // 5. Unread Notifications Count
  await diagnoseEndpoint(
    'Unread Notifications Count',
    'GET',
    '/api/notifications/unread/count',
    {
      headers: { Authorization: `Bearer ${adminToken}` }
    }
  );

  // 6. Strategy Calls
  await diagnoseEndpoint(
    'Strategy Calls',
    'GET',
    '/api/strategy-calls',
    {
      headers: { Authorization: `Bearer ${adminToken}` }
    }
  );

  // 7. Consultation Requests (Spec)
  await diagnoseEndpoint(
    'Consultation Requests (Spec)',
    'GET',
    '/api/consultation-requests',
    {
      headers: { Authorization: `Bearer ${adminToken}` }
    }
  );

  // 8. Webhooks
  await diagnoseEndpoint(
    'Webhooks Test',
    'POST',
    '/api/webhooks/test',
    {
      data: { test: 'data' }
    }
  );

  // 9. Public Info
  await diagnoseEndpoint(
    'Public Info',
    'GET',
    '/api/public/info',
    {}
  );

  // 10. Admin Activity Logs
  await diagnoseEndpoint(
    'Admin Activity Logs',
    'GET',
    '/api/admin-management/activity-logs',
    {
      headers: { Authorization: `Bearer ${adminToken}` }
    }
  );

  // 11. Admin Management (Permission Test)
  await diagnoseEndpoint(
    'Admin Management - Get All Admins',
    'GET',
    '/api/admin-management/admins',
    {
      headers: { Authorization: `Bearer ${adminToken}` }
    }
  );

  // Test payment confirmation flow
  console.log('\n\n' + '='.repeat(60));
  console.log('🔍 TESTING PAYMENT CONFIRMATION FLOW');
  console.log('='.repeat(60));
  
  // First create a consultation
  console.log('\nStep 1: Creating test consultation...');
  try {
    const consultationResponse = await axios.post(
      `${BASE_URL}/api/public-consultations`,
      {
        full_name: 'Payment Test User',
        email: 'paymenttest_' + Date.now() + '@example.com',
        phone: '+1234567890',
        country: 'United States',
        preferred_date: '2026-02-01',
        preferred_time: '14:00',
        message: 'Testing payment flow'
      }
    );
    
    const consultationId = consultationResponse.data.consultation.id;
    console.log(`✅ Consultation created: ${consultationId}`);
    
    // Now test payment confirmation
    await diagnoseEndpoint(
      'Payment Confirmation with Registration Token',
      'POST',
      '/api/admin/concierge/payment/confirm-and-invite',
      {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          consultation_id: consultationId,
          payment_amount: 500,
          payment_method: 'bank_transfer'
        }
      }
    );
    
  } catch (error) {
    console.log('❌ Failed to create test consultation:', error.message);
  }

  console.log('\n\n╔════════════════════════════════════════════════╗');
  console.log('║              DIAGNOSIS COMPLETE                ║');
  console.log('╚════════════════════════════════════════════════╝\n');
  
  console.log('📝 NEXT STEPS:\n');
  console.log('1. Check Vercel logs for the error IDs shown above');
  console.log('2. Verify database schema matches code expectations');
  console.log('3. Check for missing tables or columns');
  console.log('4. Review RLS policies that might be blocking queries');
  console.log('5. Fix schema mismatches (especially contact-requests)');
  console.log('\n');
}

runDiagnosis().catch(error => {
  console.error('\n❌ FATAL ERROR:', error.message);
  console.error(error.stack);
  process.exit(1);
});
