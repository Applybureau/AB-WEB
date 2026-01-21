#!/usr/bin/env node

/**
 * Test Consultation Loading in Dashboard
 * Specifically tests the consultation loading functionality
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

function logTest(name, status, details = '') {
  const icon = status === 'pass' ? '✓' : status === 'fail' ? '✗' : '⚠';
  const color = status === 'pass' ? colors.green : status === 'fail' ? colors.red : colors.yellow;
  console.log(`  ${color}${icon}${colors.reset} ${name}`);
  if (details) {
    console.log(`    ${colors.cyan}${details}${colors.reset}`);
  }
}

async function testConsultationDashboardLoading() {
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║           Consultation Dashboard Loading Test              ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log('');
  console.log(`${colors.blue}Testing URL: ${BASE_URL}${colors.reset}`);
  console.log(`${colors.blue}Test Email: ${TEST_EMAIL}${colors.reset}`);
  console.log('');

  let adminToken = null;

  // Step 1: Admin Login
  console.log(`${colors.yellow}[STEP 1] Admin Authentication${colors.reset}`);
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
      logTest('Admin login', 'pass', 'Successfully authenticated');
      console.log(`    ${colors.cyan}Admin ID: ${response.data.user.id}${colors.reset}`);
      console.log(`    ${colors.cyan}Admin Role: ${response.data.user.role}${colors.reset}`);
    } else {
      logTest('Admin login', 'fail', `Status: ${response.status}`);
      console.log(`    ${colors.red}Response: ${JSON.stringify(response.data, null, 2)}${colors.reset}`);
      return;
    }
  } catch (error) {
    logTest('Admin login', 'fail', error.message);
    return;
  }

  // Step 2: Test All Consultation Endpoints
  console.log(`\n${colors.yellow}[STEP 2] Testing Consultation Endpoints${colors.reset}`);

  const consultationEndpoints = [
    { path: '/api/admin/concierge/consultations', name: 'Admin Concierge Consultations' },
    { path: '/api/admin/concierge/consultations?admin_status=pending', name: 'Pending Consultations' },
    { path: '/api/admin/concierge/consultations?admin_status=confirmed', name: 'Confirmed Consultations' },
    { path: '/api/admin/concierge/consultations?admin_status=completed', name: 'Completed Consultations' },
    { path: '/api/consultation-requests', name: 'Consultation Requests' },
    { path: '/api/public-consultations', name: 'Public Consultations (GET)' }
  ];

  for (const endpoint of consultationEndpoints) {
    try {
      const response = await makeRequest(endpoint.path, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (response.status === 200) {
        const consultations = response.data.consultations || response.data.data || response.data;
        const count = Array.isArray(consultations) ? consultations.length : 0;
        logTest(endpoint.name, 'pass', `Found ${count} consultations`);
        
        if (count > 0 && Array.isArray(consultations)) {
          console.log(`    ${colors.cyan}Sample consultation:${colors.reset}`);
          const sample = consultations[0];
          console.log(`      ID: ${sample.id}`);
          console.log(`      Status: ${sample.status || sample.admin_status}`);
          console.log(`      Email: ${sample.email}`);
          console.log(`      Created: ${sample.created_at}`);
        }
      } else {
        logTest(endpoint.name, 'fail', `Status: ${response.status}`);
        console.log(`    ${colors.red}Error: ${JSON.stringify(response.data, null, 2)}${colors.reset}`);
      }
    } catch (error) {
      logTest(endpoint.name, 'fail', error.message);
    }
  }

  // Step 3: Create a Test Consultation
  console.log(`\n${colors.yellow}[STEP 3] Creating Test Consultation${colors.reset}`);
  let testConsultationId = null;

  try {
    const response = await makeRequest('/api/public-consultations', {
      method: 'POST',
      body: {
        full_name: 'Test User Dashboard',
        email: TEST_EMAIL,
        phone: '+2348012345678',
        role_targets: 'Software Engineer, Senior Developer',
        package_interest: 'Tier 2',
        employment_status: 'Currently Employed',
        area_of_concern: 'Dashboard loading test consultation',
        consultation_window: 'Weekday evenings (6PM - 9PM WAT)',
        country: 'Nigeria',
        linkedin_url: 'https://linkedin.com/in/test'
      }
    });

    if (response.status === 201 || response.status === 200) {
      testConsultationId = response.data.id;
      logTest('Test consultation creation', 'pass', `Created consultation: ${testConsultationId}`);
    } else {
      logTest('Test consultation creation', 'fail', `Status: ${response.status}`);
      console.log(`    ${colors.red}Response: ${JSON.stringify(response.data, null, 2)}${colors.reset}`);
    }
  } catch (error) {
    logTest('Test consultation creation', 'fail', error.message);
  }

  // Step 4: Test Dashboard Stats (includes consultation counts)
  console.log(`\n${colors.yellow}[STEP 4] Testing Dashboard Stats${colors.reset}`);
  try {
    const response = await makeRequest('/api/admin/dashboard/stats', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (response.status === 200) {
      logTest('Dashboard stats', 'pass', 'Stats loaded successfully');
      console.log(`    ${colors.cyan}Response structure:${colors.reset}`);
      console.log(`      ${JSON.stringify(Object.keys(response.data), null, 2)}`);
      
      if (response.data.consultations) {
        console.log(`    ${colors.cyan}Consultation stats:${colors.reset}`);
        console.log(`      ${JSON.stringify(response.data.consultations, null, 2)}`);
      }
    } else {
      logTest('Dashboard stats', 'fail', `Status: ${response.status}`);
      console.log(`    ${colors.red}Error: ${JSON.stringify(response.data, null, 2)}${colors.reset}`);
    }
  } catch (error) {
    logTest('Dashboard stats', 'fail', error.message);
  }

  // Step 5: Test Admin Dashboard Route
  console.log(`\n${colors.yellow}[STEP 5] Testing Admin Dashboard Route${colors.reset}`);
  try {
    const response = await makeRequest('/api/admin-dashboard', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (response.status === 200) {
      logTest('Admin dashboard', 'pass', 'Dashboard loaded successfully');
      console.log(`    ${colors.cyan}Dashboard data structure:${colors.reset}`);
      console.log(`      ${JSON.stringify(Object.keys(response.data), null, 2)}`);
      
      if (response.data.stats && response.data.stats.consultations) {
        console.log(`    ${colors.cyan}Consultation stats in dashboard:${colors.reset}`);
        console.log(`      ${JSON.stringify(response.data.stats.consultations, null, 2)}`);
      }
    } else {
      logTest('Admin dashboard', 'fail', `Status: ${response.status}`);
      console.log(`    ${colors.red}Error: ${JSON.stringify(response.data, null, 2)}${colors.reset}`);
    }
  } catch (error) {
    logTest('Admin dashboard', 'fail', error.message);
  }

  // Step 6: Test Consultation Actions (if we have a consultation)
  if (testConsultationId) {
    console.log(`\n${colors.yellow}[STEP 6] Testing Consultation Actions${colors.reset}`);
    
    // Test getting specific consultation
    try {
      const response = await makeRequest(`/api/admin/concierge/consultations/${testConsultationId}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (response.status === 200) {
        logTest('Get specific consultation', 'pass', 'Consultation details loaded');
        console.log(`    ${colors.cyan}Consultation details:${colors.reset}`);
        console.log(`      ID: ${response.data.id}`);
        console.log(`      Status: ${response.data.status || response.data.admin_status}`);
        console.log(`      Email: ${response.data.email}`);
        console.log(`      Package: ${response.data.package_interest}`);
      } else {
        logTest('Get specific consultation', 'fail', `Status: ${response.status}`);
      }
    } catch (error) {
      logTest('Get specific consultation', 'fail', error.message);
    }

    // Test consultation confirmation (with proper slot data)
    try {
      const response = await makeRequest(`/api/admin/concierge/consultations/${testConsultationId}/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        },
        body: {
          selected_slot_index: 0,
          meeting_details: 'Dashboard loading test meeting',
          meeting_link: 'https://meet.google.com/dashboard-test',
          admin_notes: 'Test confirmation for dashboard loading'
        }
      });

      if (response.status === 200 || response.status === 201) {
        logTest('Consultation confirmation', 'pass', 'Consultation confirmed successfully');
        console.log(`    ${colors.cyan}Confirmation response:${colors.reset}`);
        console.log(`      ${JSON.stringify(response.data, null, 2)}`);
      } else {
        logTest('Consultation confirmation', 'fail', `Status: ${response.status}`);
        console.log(`    ${colors.red}Error: ${JSON.stringify(response.data, null, 2)}${colors.reset}`);
      }
    } catch (error) {
      logTest('Consultation confirmation', 'fail', error.message);
    }
  }

  // Step 7: Test Contact Requests (related to consultations)
  console.log(`\n${colors.yellow}[STEP 7] Testing Contact Requests${colors.reset}`);
  try {
    const response = await makeRequest('/api/contact-requests', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (response.status === 200) {
      const contacts = response.data.contacts || response.data.data || response.data;
      const count = Array.isArray(contacts) ? contacts.length : 0;
      logTest('Contact requests', 'pass', `Found ${count} contact requests`);
    } else {
      logTest('Contact requests', 'fail', `Status: ${response.status}`);
      console.log(`    ${colors.red}Error: ${JSON.stringify(response.data, null, 2)}${colors.reset}`);
    }
  } catch (error) {
    logTest('Contact requests', 'fail', error.message);
  }

  console.log(`\n${colors.cyan}═══════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}              TEST SUMMARY                      ${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════${colors.reset}\n`);
  
  console.log(`${colors.yellow}📧 IMPORTANT: Check your email!${colors.reset}`);
  console.log(`  Email: ${colors.cyan}${TEST_EMAIL}${colors.reset}`);
  console.log(`  You should have received consultation-related emails`);
  console.log('');

  console.log(`${colors.green}✓ Consultation dashboard loading test completed${colors.reset}`);
}

testConsultationDashboardLoading().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});