#!/usr/bin/env node

/**
 * Test Payment Verification and Reschedule Functionality
 * Debug issues with payment verification and consultation rescheduling
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

async function testPaymentVerificationAndReschedule() {
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║        TEST: PAYMENT VERIFICATION & RESCHEDULE            ║${colors.reset}`);
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
      console.log(`  Response: ${JSON.stringify(response.data, null, 2)}`);
      return;
    }
  } catch (error) {
    console.log(`  ${colors.red}✗ Admin login error: ${error.message}${colors.reset}`);
    return;
  }

  // Step 2: Create a test consultation for testing
  console.log(`\n${colors.yellow}[STEP 2] Creating Test Consultation${colors.reset}`);
  let testConsultationId = null;
  
  try {
    const response = await makeRequest('/api/public-consultations', {
      method: 'POST',
      body: {
        full_name: "Payment Test User",
        email: "payment-test@example.com",
        phone: "+1234567890",
        message: "Testing payment verification and reschedule functionality.",
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
      console.log(`  Response: ${JSON.stringify(response.data, null, 2)}`);
      return;
    }
  } catch (error) {
    console.log(`  ${colors.red}✗ Error creating test consultation: ${error.message}${colors.reset}`);
    return;
  }

  // Step 3: Test Payment Verification Endpoint
  console.log(`\n${colors.yellow}[STEP 3] Testing Payment Verification${colors.reset}`);
  
  const paymentVerificationEndpoints = [
    '/api/admin/concierge/payment-confirmation',
    '/api/admin/concierge/payment/confirm-and-invite'
  ];

  for (const endpoint of paymentVerificationEndpoints) {
    console.log(`\n  ${colors.cyan}Testing ${endpoint}${colors.reset}`);
    
    try {
      const response = await makeRequest(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        },
        body: {
          consultation_id: testConsultationId,
          client_email: "payment-test@example.com",
          client_name: "Payment Test User",
          payment_amount: "500.00",
          payment_date: "2026-01-21",
          package_tier: "Standard Package",
          package_type: "tier",
          selected_services: ["Resume Review", "Interview Prep"],
          payment_method: "interac_etransfer",
          payment_reference: "TEST-REF-12345",
          admin_notes: "Test payment verification"
        }
      });

      console.log(`    Status: ${response.status}`);
      
      if (response.status === 200) {
        console.log(`    ${colors.green}✓ Payment verification successful${colors.reset}`);
        console.log(`    Response: ${JSON.stringify(response.data, null, 2)}`);
      } else {
        console.log(`    ${colors.red}✗ Payment verification failed${colors.reset}`);
        console.log(`    Error: ${JSON.stringify(response.data, null, 2)}`);
        console.log(`    Raw response: ${response.rawData}`);
      }
    } catch (error) {
      console.log(`    ${colors.red}✗ Error: ${error.message}${colors.reset}`);
    }
  }

  // Step 4: Test Consultation Reschedule
  console.log(`\n${colors.yellow}[STEP 4] Testing Consultation Reschedule${colors.reset}`);
  
  try {
    const response = await makeRequest(`/api/admin/concierge/consultations/${testConsultationId}/reschedule`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      body: {
        reschedule_reason: "Admin unavailable at requested times. Please provide 3 new time slots.",
        admin_notes: "Testing reschedule functionality"
      }
    });

    console.log(`  Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log(`  ${colors.green}✓ Reschedule successful${colors.reset}`);
      console.log(`  Response: ${JSON.stringify(response.data, null, 2)}`);
    } else {
      console.log(`  ${colors.red}✗ Reschedule failed${colors.reset}`);
      console.log(`  Error: ${JSON.stringify(response.data, null, 2)}`);
      console.log(`  Raw response: ${response.rawData}`);
    }
  } catch (error) {
    console.log(`  ${colors.red}✗ Reschedule error: ${error.message}${colors.reset}`);
  }

  // Step 5: Test Consultation Confirmation (for comparison)
  console.log(`\n${colors.yellow}[STEP 5] Testing Consultation Confirmation (for comparison)${colors.reset}`);
  
  try {
    const response = await makeRequest(`/api/admin/concierge/consultations/${testConsultationId}/confirm`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      body: {
        selected_slot_index: 0,
        meeting_details: "Test consultation confirmation",
        meeting_link: "https://meet.google.com/test-link",
        admin_notes: "Testing confirmation functionality"
      }
    });

    console.log(`  Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log(`  ${colors.green}✓ Confirmation successful${colors.reset}`);
      console.log(`  Response: ${JSON.stringify(response.data, null, 2)}`);
    } else {
      console.log(`  ${colors.red}✗ Confirmation failed${colors.reset}`);
      console.log(`  Error: ${JSON.stringify(response.data, null, 2)}`);
      console.log(`  Raw response: ${response.rawData}`);
    }
  } catch (error) {
    console.log(`  ${colors.red}✗ Confirmation error: ${error.message}${colors.reset}`);
  }

  // Step 6: Check consultation status after operations
  console.log(`\n${colors.yellow}[STEP 6] Checking Consultation Status${colors.reset}`);
  
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
        console.log(`    Admin Notes: ${testConsultation.admin_notes || 'None'}`);
        console.log(`    Scheduled At: ${testConsultation.scheduled_at || 'Not scheduled'}`);
      } else {
        console.log(`  ${colors.red}✗ Test consultation not found${colors.reset}`);
      }
    }
  } catch (error) {
    console.log(`  ${colors.red}✗ Error checking consultation status: ${error.message}${colors.reset}`);
  }

  // Step 7: Test alternative payment endpoints
  console.log(`\n${colors.yellow}[STEP 7] Testing Alternative Payment Endpoints${colors.reset}`);
  
  const alternativeEndpoints = [
    '/api/admin/payment-confirmation',
    '/api/payment-confirmation',
    '/api/verify-payment'
  ];

  for (const endpoint of alternativeEndpoints) {
    console.log(`\n  ${colors.cyan}Testing ${endpoint}${colors.reset}`);
    
    try {
      const response = await makeRequest(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        },
        body: {
          consultation_id: testConsultationId,
          client_email: "payment-test@example.com",
          client_name: "Payment Test User",
          payment_amount: "500.00"
        }
      });

      console.log(`    Status: ${response.status}`);
      
      if (response.status === 200) {
        console.log(`    ${colors.green}✓ Alternative endpoint working${colors.reset}`);
      } else if (response.status === 404) {
        console.log(`    ${colors.yellow}⚠ Endpoint not found (expected)${colors.reset}`);
      } else {
        console.log(`    ${colors.red}✗ Unexpected response${colors.reset}`);
        console.log(`    Error: ${JSON.stringify(response.data, null, 2)}`);
      }
    } catch (error) {
      console.log(`    ${colors.red}✗ Error: ${error.message}${colors.reset}`);
    }
  }

  console.log(`\n${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║                        SUMMARY                             ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log(`\n${colors.magenta}Issues to check:${colors.reset}`);
  console.log(`  1. Payment verification endpoint responses`);
  console.log(`  2. Reschedule endpoint functionality`);
  console.log(`  3. Database constraints or validation errors`);
  console.log(`  4. Email template or notification issues`);
  console.log(`  5. Authentication or permission problems`);
  console.log(`\n${colors.yellow}If endpoints are failing, check:${colors.reset}`);
  console.log(`  - Server logs in Vercel dashboard`);
  console.log(`  - Database constraints in Supabase`);
  console.log(`  - Email service configuration`);
  console.log(`  - JWT token validity and permissions`);
}

testPaymentVerificationAndReschedule().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});