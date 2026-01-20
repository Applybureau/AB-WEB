#!/usr/bin/env node

/**
 * Fix All Vercel Backend Errors
 * Comprehensive fix for all identified issues
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

// Helper function to make HTTP requests
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

async function fixAllErrors() {
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║              Fix All Vercel Backend Errors                ║${colors.reset}`);
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
      console.log(`  ${colors.cyan}Response: ${JSON.stringify(response.data, null, 2)}${colors.reset}`);
      return;
    }
  } catch (error) {
    console.log(`  ${colors.red}✗ Admin login error: ${error.message}${colors.reset}`);
    return;
  }

  // Step 2: Test Fixed Dashboard Stats
  console.log(`\n${colors.yellow}[STEP 2] Testing Dashboard Stats (Should be Fixed)${colors.reset}`);
  try {
    const response = await makeRequest('/api/admin/dashboard/stats', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    console.log(`  Status: ${response.status}`);
    if (response.status === 200) {
      console.log(`  ${colors.green}✓ Dashboard stats working${colors.reset}`);
      console.log(`  ${colors.cyan}Clients: ${response.data.clients?.total || 0}${colors.reset}`);
      console.log(`  ${colors.cyan}Applications: ${response.data.applications?.total || 0}${colors.reset}`);
    } else {
      console.log(`  ${colors.red}✗ Still failing: ${JSON.stringify(response.data, null, 2)}${colors.reset}`);
    }
  } catch (error) {
    console.log(`  ${colors.red}✗ Error: ${error.message}${colors.reset}`);
  }

  // Step 3: Test Fixed Consultation Confirmation
  console.log(`\n${colors.yellow}[STEP 3] Testing Consultation Confirmation (Should be Fixed)${colors.reset}`);
  try {
    // First get a consultation ID
    const consultationsResponse = await makeRequest('/api/admin/concierge/consultations?admin_status=pending', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (consultationsResponse.status === 200 && consultationsResponse.data.consultations?.length > 0) {
      const consultationId = consultationsResponse.data.consultations[0].id;
      console.log(`  Using consultation ID: ${consultationId}`);

      const response = await makeRequest(`/api/admin/concierge/consultations/${consultationId}/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        },
        body: {
          selected_slot_index: 0,
          meeting_details: 'Test meeting - fixed validation',
          meeting_link: 'https://meet.google.com/test-fixed',
          admin_notes: 'Test confirmation with proper validation'
        }
      });

      console.log(`  Status: ${response.status}`);
      if (response.status === 200) {
        console.log(`  ${colors.green}✓ Consultation confirmation working${colors.reset}`);
        console.log(`  ${colors.cyan}Confirmed time: ${response.data.confirmed_time}${colors.reset}`);
      } else {
        console.log(`  ${colors.red}✗ Still failing: ${JSON.stringify(response.data, null, 2)}${colors.reset}`);
      }
    } else {
      console.log(`  ${colors.yellow}No pending consultations found${colors.reset}`);
    }
  } catch (error) {
    console.log(`  ${colors.red}✗ Error: ${error.message}${colors.reset}`);
  }

  // Step 4: Test Fixed Applications Creation
  console.log(`\n${colors.yellow}[STEP 4] Testing Applications Creation (Should be Fixed)${colors.reset}`);
  try {
    const response = await makeRequest('/api/applications', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      body: {
        client_id: 'test-client-id',
        job_title: 'Senior Software Engineer',
        company: 'Google',
        job_description: 'Senior role at Google',
        location: 'Remote',
        salary_range: '$150,000 - $200,000',
        admin_notes: 'Test application creation'
      }
    });

    console.log(`  Status: ${response.status}`);
    if (response.status === 201 || response.status === 200) {
      console.log(`  ${colors.green}✓ Application creation working${colors.reset}`);
      console.log(`  ${colors.cyan}Application ID: ${response.data.application?.id}${colors.reset}`);
    } else {
      console.log(`  ${colors.red}✗ Still failing: ${JSON.stringify(response.data, null, 2)}${colors.reset}`);
    }
  } catch (error) {
    console.log(`  ${colors.red}✗ Error: ${error.message}${colors.reset}`);
  }

  // Step 5: Test Fixed Applications List
  console.log(`\n${colors.yellow}[STEP 5] Testing Applications List (Should be Fixed)${colors.reset}`);
  try {
    const response = await makeRequest('/api/applications', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    console.log(`  Status: ${response.status}`);
    if (response.status === 200) {
      console.log(`  ${colors.green}✓ Applications list working${colors.reset}`);
      console.log(`  ${colors.cyan}Applications found: ${response.data.applications?.length || 0}${colors.reset}`);
    } else {
      console.log(`  ${colors.red}✗ Still failing: ${JSON.stringify(response.data, null, 2)}${colors.reset}`);
    }
  } catch (error) {
    console.log(`  ${colors.red}✗ Error: ${error.message}${colors.reset}`);
  }

  // Step 6: Test Route Fixes
  console.log(`\n${colors.yellow}[STEP 6] Testing Route Fixes${colors.reset}`);
  const routes = [
    '/api/public-consultations',
    '/api/auth/login'
  ];

  for (const route of routes) {
    try {
      const response = await makeRequest(route);
      console.log(`  ${route}: ${response.status} ${response.status === 404 ? '(Still 404)' : '(Fixed)'}`);
    } catch (error) {
      console.log(`  ${route}: ERROR - ${error.message}`);
    }
  }

  console.log(`\n${colors.cyan}Fix verification complete${colors.reset}`);
}

fixAllErrors().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});