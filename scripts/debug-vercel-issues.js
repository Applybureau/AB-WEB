#!/usr/bin/env node

/**
 * Debug Vercel Issues - Detailed Error Analysis
 * Identifies specific problems with the deployed backend
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

async function debugIssues() {
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║              Vercel Backend Debug Analysis                ║${colors.reset}`);
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
    }
  } catch (error) {
    console.log(`  ${colors.red}✗ Admin login error: ${error.message}${colors.reset}`);
  }

  if (!adminToken) {
    console.log(`${colors.red}Cannot continue without admin token${colors.reset}`);
    return;
  }

  // Step 2: Debug Dashboard Stats (500 error)
  console.log(`\n${colors.yellow}[STEP 2] Debug Dashboard Stats (500 Error)${colors.reset}`);
  try {
    const response = await makeRequest('/api/admin/dashboard/stats', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    console.log(`  Status: ${response.status}`);
    console.log(`  Response: ${JSON.stringify(response.data, null, 2)}`);
  } catch (error) {
    console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);
  }

  // Step 3: Debug Consultation Confirmation (400 error)
  console.log(`\n${colors.yellow}[STEP 3] Debug Consultation Confirmation (400 Error)${colors.reset}`);
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
          meeting_details: 'Test meeting',
          meeting_link: 'https://meet.google.com/test',
          admin_notes: 'Test confirmation'
        }
      });

      console.log(`  Status: ${response.status}`);
      console.log(`  Response: ${JSON.stringify(response.data, null, 2)}`);
    } else {
      console.log(`  ${colors.yellow}No pending consultations found${colors.reset}`);
    }
  } catch (error) {
    console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);
  }

  // Step 4: Debug Applications Creation (400 error)
  console.log(`\n${colors.yellow}[STEP 4] Debug Applications Creation (400 Error)${colors.reset}`);
  try {
    const response = await makeRequest('/api/applications', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      body: {
        user_id: 'test-user-id',
        company_name: 'Google',
        role: 'Senior Software Engineer',
        type: 'job_application',
        status: 'applied',
        application_date: new Date().toISOString(),
        resume_used: 'test_resume.pdf',
        notes: 'Test application'
      }
    });

    console.log(`  Status: ${response.status}`);
    console.log(`  Response: ${JSON.stringify(response.data, null, 2)}`);
  } catch (error) {
    console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);
  }

  // Step 5: Debug Applications List (403 error)
  console.log(`\n${colors.yellow}[STEP 5] Debug Applications List (403 Error)${colors.reset}`);
  try {
    const response = await makeRequest('/api/applications', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    console.log(`  Status: ${response.status}`);
    console.log(`  Response: ${JSON.stringify(response.data, null, 2)}`);
  } catch (error) {
    console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);
  }

  // Step 6: Check Server Health
  console.log(`\n${colors.yellow}[STEP 6] Server Health Check${colors.reset}`);
  try {
    const response = await makeRequest('/api/health');
    console.log(`  Status: ${response.status}`);
    console.log(`  Response: ${JSON.stringify(response.data, null, 2)}`);
  } catch (error) {
    console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);
  }

  // Step 7: Check Available Routes
  console.log(`\n${colors.yellow}[STEP 7] Check Available Routes${colors.reset}`);
  const routes = [
    '/api/contact',
    '/api/public-consultations',
    '/api/auth/login',
    '/api/admin/dashboard/stats',
    '/api/admin/concierge/consultations',
    '/api/applications',
    '/api/client/dashboard'
  ];

  for (const route of routes) {
    try {
      const response = await makeRequest(route, {
        headers: adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {}
      });
      console.log(`  ${route}: ${response.status}`);
    } catch (error) {
      console.log(`  ${route}: ERROR - ${error.message}`);
    }
  }

  console.log(`\n${colors.cyan}Debug analysis complete${colors.reset}`);
}

debugIssues().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});