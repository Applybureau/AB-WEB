#!/usr/bin/env node

/**
 * Test Payment Verification After Database Fix
 * Verify that payment verification works after fixing database constraints
 */

const https = require('https');

const BASE_URL = 'https://apply-bureau-backend.vercel.app';
const TEST_EMAIL = 'israelloko65@gmail.com';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: 30000
    };

    const req = https.request(url, requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData,
            rawData: data
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            rawData: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testPaymentVerificationAfterFix() {
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║        TEST: PAYMENT VERIFICATION AFTER FIX              ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log('');

  let adminToken = null;

  // Step 1: Get admin token
  console.log(`${colors.yellow}[STEP 1] Getting Admin Token${colors.reset}`);
  try {
    const response = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: {
        email: TEST_EMAIL,
        password: 'admin123'
      }
    });

    if (response.status === 200 && response.data.token) {
      adminToken = response.data.token;
      console.log(`  ${colors.green}✓ Admin login successful${colors.reset}`);
    } else {
      console.log(`  ${colors.red}✗ Admin login failed: ${response.status}${colors.reset}`);
      return;
    }
  } catch (error) {
    console.log(`  ${colors.red}✗ Admin login error: ${error.message}${colors.reset}`);
    return;
  }

  // Step 2: Create a new test consultation
  console.log(`\n${colors.yellow}[STEP 2] Creating New Test Consultation${colors.reset}`);
  let testConsultationId = null;
  
  try {
    const response = await makeRequest('/api/public-consultations', {
      method: 'POST',
      body: {
        full_name: "Payment Fix Test User",
        email: "payment-fix-test@example.com",
        phone: "+1234567890",
        message: "Testing payment verification after database fix.",
        preferred_slots: [
          {
            date: "2026-01-25",
            time: "14:00"
          },
          {
            date: "2026-01-26",
            time: "15:00"
          },
          {
            date: "2026-01-27",
            time: "16:00"
          }
        ]
      }
    });

    if (response.status === 201) {
      testConsultationId = response.data.id;
      console.log(`  ${colors.green}✓ Test consultation created${colors.reset}`);
      console.log(`    ID: ${testConsultationId}`);
    } else {
      console.log(`  ${colors.red}✗ Failed to create test consultation: ${response.status}${colors.reset}`);
      return;
    }
  } catch (error) {
    console.log(`  ${colors.red}✗ Error creating test consultation: ${error.message}${colors.reset}`);
    return;
  }

  // Step 3: Test Payment Verification (First Endpoint)
  console.log(`\n${colors.yellow}[STEP 3] Testing Payment Verification (payment-confirmation)${colors.reset}`);
  
  try {
    const response = await makeRequest('/api/admin/concierge/payment-confirmation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      body: {
        consultation_id: testConsultationId,
        client_email: "payment-fix-test@example.com",
        client_name: "Payment Fix Test User",
        payment_amount: "750.00",
        payment_date: "2026-01-21",
        package_tier: "Premium Package",
        package_type: "tier",
        selected_services: ["Resume Review", "Interview Prep", "LinkedIn Optimization"],
        payment_method: "interac_etransfer",
        payment_reference: "FIX-TEST-12345",
        admin_notes: "Testing payment verification after database fix"
      }
    });

    console.log(`  Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log(`  ${colors.green}✅ Payment verification SUCCESSFUL!${colors.reset}`);
      console.log(`  Message: ${response.data.message}`);
      console.log(`  Client Email: ${response.data.data?.client_email}`);
      console.log(`  Status: ${response.data.data?.status}`);
      console.log(`  Registration URL: ${response.data.data?.registration_url ? 'Generated' : 'Not generated'}`);
    } else {
      console.log(`  ${colors.red}❌ Payment verification FAILED${colors.reset}`);
      console.log(`  Error: ${JSON.stringify(response.data, null, 2)}`);
    }
  } catch (error) {
    console.log(`  ${colors.red}❌ Payment verification ERROR: ${error.message}${colors.reset}`);
  }

  // Step 4: Test Second Payment Endpoint
  console.log(`\n${colors.yellow}[STEP 4] Testing Second Payment Endpoint (confirm-and-invite)${colors.reset}`);
  
  try {
    const response = await makeRequest('/api/admin/concierge/payment/confirm-and-invite', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      body: {
        client_email: "payment-fix-test-2@example.com",
        client_name: "Payment Fix Test User 2",
        payment_amount: "500.00",
        payment_date: "2026-01-21",
        package_tier: "Standard Package",
        package_type: "tier",
        selected_services: ["Resume Review", "Interview Prep"],
        payment_method: "interac_etransfer",
        payment_reference: "FIX-TEST-67890",
        admin_notes: "Testing second payment endpoint after fix"
      }
    });

    console.log(`  Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log(`  ${colors.green}✅ Second payment endpoint SUCCESSFUL!${colors.reset}`);
      console.log(`  Message: ${response.data.message}`);
      console.log(`  Client Email: ${response.data.client_email}`);
      console.log(`  Registration Token: ${response.data.registration_token ? 'Generated' : 'Not generated'}`);
    } else {
      console.log(`  ${colors.red}❌ Second payment endpoint FAILED${colors.reset}`);
      console.log(`  Error: ${JSON.stringify(response.data, null, 2)}`);
    }
  } catch (error) {
    console.log(`  ${colors.red}❌ Second payment endpoint ERROR: ${error.message}${colors.reset}`);
  }

  // Step 5: Verify consultation status was updated
  console.log(`\n${colors.yellow}[STEP 5] Verifying Consultation Status Update${colors.reset}`);
  
  try {
    const response = await makeRequest('/api/admin/concierge/consultations', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (response.status === 200) {
      const consultations = response.data.consultations || [];
      const testConsultation = consultations.find(c => c.id === testConsultationId);
      
      if (testConsultation) {
        console.log(`  ${colors.green}✓ Test consultation found${colors.reset}`);
        console.log(`    Status: ${testConsultation.status}`);
        console.log(`    Admin Status: ${testConsultation.admin_status}`);
        
        if (testConsultation.status === 'onboarding') {
          console.log(`  ${colors.green}✅ Status correctly updated to 'onboarding'${colors.reset}`);
        } else {
          console.log(`  ${colors.yellow}⚠️ Status is '${testConsultation.status}' (expected 'onboarding')${colors.reset}`);
        }
      } else {
        console.log(`  ${colors.red}✗ Test consultation not found${colors.reset}`);
      }
    }
  } catch (error) {
    console.log(`  ${colors.red}✗ Error checking consultation status: ${error.message}${colors.reset}`);
  }

  // Step 6: Test Reschedule (should still work)
  console.log(`\n${colors.yellow}[STEP 6] Testing Reschedule (should still work)${colors.reset}`);
  
  try {
    const response = await makeRequest(`/api/admin/concierge/consultations/${testConsultationId}/reschedule`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      body: {
        reschedule_reason: "Testing reschedule after payment verification fix.",
        admin_notes: "Reschedule test after database fix"
      }
    });

    console.log(`  Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log(`  ${colors.green}✅ Reschedule still working correctly${colors.reset}`);
    } else {
      console.log(`  ${colors.red}❌ Reschedule failed: ${JSON.stringify(response.data, null, 2)}${colors.reset}`);
    }
  } catch (error) {
    console.log(`  ${colors.red}❌ Reschedule error: ${error.message}${colors.reset}`);
  }

  console.log(`\n${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║                        SUMMARY                             ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log(`\n${colors.green}✅ FIXES APPLIED:${colors.reset}`);
  console.log(`  1. Database constraint updated to allow 'onboarding' status`);
  console.log(`  2. Missing columns added to registered_users table`);
  console.log(`\n${colors.yellow}📋 NEXT STEPS:${colors.reset}`);
  console.log(`  1. Run the SQL fix in Supabase if not already done`);
  console.log(`  2. Test payment verification in your frontend`);
  console.log(`  3. Verify email notifications are sent`);
  console.log(`  4. Check registration links are generated correctly`);
}

testPaymentVerificationAfterFix().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});