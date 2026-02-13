const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const ADMIN_EMAIL = 'admin@applybureau.com';
const ADMIN_PASSWORD = 'Admin123!@#';

let adminToken = null;
let testClientId = null;

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'cyan');
}

function logSection(message) {
  log(`\n${'='.repeat(60)}`, 'blue');
  log(message, 'blue');
  log('='.repeat(60), 'blue');
}

// Admin login
async function adminLogin() {
  try {
    logSection('ADMIN LOGIN');
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    adminToken = response.data.token;
    logSuccess('Admin logged in successfully');
    return true;
  } catch (error) {
    logError(`Admin login failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Get a test client ID
async function getTestClient() {
  try {
    logSection('GET TEST CLIENT');
    const response = await axios.get(`${BASE_URL}/api/admin/clients?limit=1`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (response.data.clients && response.data.clients.length > 0) {
      testClientId = response.data.clients[0].id;
      logSuccess(`Found test client: ${testClientId}`);
      return true;
    } else {
      logError('No clients found in database');
      return false;
    }
  } catch (error) {
    logError(`Failed to get test client: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Test 20Q endpoints
async function test20QEndpoints() {
  logSection('TESTING 20Q ENDPOINTS');

  try {
    // Test GET pending reviews
    logInfo('Testing GET /api/admin/20q/pending-review');
    const pendingResponse = await axios.get(`${BASE_URL}/api/admin/20q/pending-review`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logSuccess(`Pending reviews: ${pendingResponse.data.total_count}`);
    console.log(JSON.stringify(pendingResponse.data.summary, null, 2));

    // Test GET client 20Q responses
    logInfo(`Testing GET /api/admin/clients/${testClientId}/20q/responses`);
    try {
      const responsesResponse = await axios.get(
        `${BASE_URL}/api/admin/clients/${testClientId}/20q/responses`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      logSuccess('Retrieved 20Q responses');
      console.log(JSON.stringify(responsesResponse.data.twenty_questions, null, 2));

      // Test mark as reviewed
      logInfo(`Testing POST /api/admin/clients/${testClientId}/20q/mark-reviewed`);
      const reviewResponse = await axios.post(
        `${BASE_URL}/api/admin/clients/${testClientId}/20q/mark-reviewed`,
        {
          admin_notes: 'Test review - responses look good',
          approved: true,
          feedback: 'Great responses, ready to proceed'
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      logSuccess('Marked 20Q as reviewed');
      console.log(JSON.stringify(reviewResponse.data, null, 2));
    } catch (error) {
      if (error.response?.status === 404) {
        logInfo('No 20Q responses found for this client (expected for some clients)');
      } else {
        throw error;
      }
    }

    return true;
  } catch (error) {
    logError(`20Q endpoints test failed: ${error.response?.data?.error || error.message}`);
    if (error.response?.data) {
      console.log(JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

// Test Client Files endpoints
async function testClientFilesEndpoints() {
  logSection('TESTING CLIENT FILES ENDPOINTS');

  try {
    // Test GET all files
    logInfo(`Testing GET /api/admin/clients/${testClientId}/files`);
    const filesResponse = await axios.get(
      `${BASE_URL}/api/admin/clients/${testClientId}/files`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    logSuccess('Retrieved client files');
    console.log(JSON.stringify(filesResponse.data.summary, null, 2));

    // Test GET resume
    logInfo(`Testing GET /api/admin/clients/${testClientId}/files/resume`);
    try {
      const resumeResponse = await axios.get(
        `${BASE_URL}/api/admin/clients/${testClientId}/files/resume`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      logSuccess('Retrieved resume details');
      console.log(JSON.stringify(resumeResponse.data.resume, null, 2));
    } catch (error) {
      if (error.response?.status === 404) {
        logInfo('No resume found for this client (expected for some clients)');
      } else {
        throw error;
      }
    }

    // Test GET LinkedIn
    logInfo(`Testing GET /api/admin/clients/${testClientId}/files/linkedin`);
    try {
      const linkedinResponse = await axios.get(
        `${BASE_URL}/api/admin/clients/${testClientId}/files/linkedin`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      logSuccess('Retrieved LinkedIn details');
      console.log(JSON.stringify(linkedinResponse.data.linkedin, null, 2));
    } catch (error) {
      if (error.response?.status === 404) {
        logInfo('No LinkedIn profile found for this client (expected for some clients)');
      } else {
        throw error;
      }
    }

    // Test GET portfolio
    logInfo(`Testing GET /api/admin/clients/${testClientId}/files/portfolio`);
    try {
      const portfolioResponse = await axios.get(
        `${BASE_URL}/api/admin/clients/${testClientId}/files/portfolio`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      logSuccess('Retrieved portfolio details');
      console.log(JSON.stringify(portfolioResponse.data, null, 2));
    } catch (error) {
      if (error.response?.status === 404) {
        logInfo('No portfolio found for this client (expected for some clients)');
      } else {
        throw error;
      }
    }

    return true;
  } catch (error) {
    logError(`Client files endpoints test failed: ${error.response?.data?.error || error.message}`);
    if (error.response?.data) {
      console.log(JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

// Test Package endpoints
async function testPackageEndpoints() {
  logSection('TESTING PACKAGE ENDPOINTS');

  try {
    // Test GET client package
    logInfo(`Testing GET /api/admin/clients/${testClientId}/package`);
    const packageResponse = await axios.get(
      `${BASE_URL}/api/admin/clients/${testClientId}/package`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    logSuccess('Retrieved client package');
    console.log(JSON.stringify(packageResponse.data, null, 2));

    // Test GET expiring packages
    logInfo('Testing GET /api/admin/packages/expiring');
    const expiringResponse = await axios.get(
      `${BASE_URL}/api/admin/packages/expiring?days=30`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    logSuccess(`Expiring packages: ${expiringResponse.data.total_count}`);
    console.log(JSON.stringify(expiringResponse.data, null, 2));

    // Test extend package
    logInfo(`Testing PUT /api/admin/clients/${testClientId}/package/extend`);
    const extendResponse = await axios.put(
      `${BASE_URL}/api/admin/clients/${testClientId}/package/extend`,
      {
        extension_days: 30,
        reason: 'Test extension',
        admin_notes: 'Testing package extension endpoint'
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    logSuccess('Package extended successfully');
    console.log(JSON.stringify(extendResponse.data, null, 2));

    return true;
  } catch (error) {
    logError(`Package endpoints test failed: ${error.response?.data?.error || error.message}`);
    if (error.response?.data) {
      console.log(JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

// Test Interview endpoints
async function testInterviewEndpoints() {
  logSection('TESTING INTERVIEW ENDPOINTS');

  let testInterviewId = null;

  try {
    // Test GET all interviews
    logInfo('Testing GET /api/admin/interviews');
    const interviewsResponse = await axios.get(
      `${BASE_URL}/api/admin/interviews?limit=10`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    logSuccess(`Retrieved interviews: ${interviewsResponse.data.total_count}`);
    console.log(JSON.stringify(interviewsResponse.data.summary, null, 2));

    // Test CREATE interview
    logInfo('Testing POST /api/admin/interviews');
    const createResponse = await axios.post(
      `${BASE_URL}/api/admin/interviews`,
      {
        client_id: testClientId,
        interview_type: 'technical',
        scheduled_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        duration_minutes: 60,
        interviewer_name: 'John Smith',
        interviewer_email: 'john@techcorp.com',
        meeting_link: 'https://zoom.us/j/123456789',
        company: 'Test Corp',
        role: 'Senior Developer',
        admin_notes: 'Test interview creation'
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    testInterviewId = createResponse.data.interview.id;
    logSuccess(`Interview created: ${testInterviewId}`);
    console.log(JSON.stringify(createResponse.data, null, 2));

    // Test GET interview details
    logInfo(`Testing GET /api/admin/interviews/${testInterviewId}`);
    const detailsResponse = await axios.get(
      `${BASE_URL}/api/admin/interviews/${testInterviewId}`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    logSuccess('Retrieved interview details');
    console.log(JSON.stringify(detailsResponse.data.interview, null, 2));

    // Test UPDATE interview
    logInfo(`Testing PUT /api/admin/interviews/${testInterviewId}`);
    const updateResponse = await axios.put(
      `${BASE_URL}/api/admin/interviews/${testInterviewId}`,
      {
        status: 'rescheduled',
        admin_notes: 'Updated test interview'
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    logSuccess('Interview updated');
    console.log(JSON.stringify(updateResponse.data, null, 2));

    // Test ADD feedback
    logInfo(`Testing POST /api/admin/interviews/${testInterviewId}/feedback`);
    const feedbackResponse = await axios.post(
      `${BASE_URL}/api/admin/interviews/${testInterviewId}/feedback`,
      {
        outcome: 'passed',
        feedback: 'Candidate performed well',
        next_steps: 'Moving to final round',
        admin_notes: 'Strong technical skills'
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    logSuccess('Feedback added');
    console.log(JSON.stringify(feedbackResponse.data, null, 2));

    return true;
  } catch (error) {
    logError(`Interview endpoints test failed: ${error.response?.data?.error || error.message}`);
    if (error.response?.data) {
      console.log(JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

// Main test runner
async function runTests() {
  log('\n' + '='.repeat(60), 'yellow');
  log('MISSING ENDPOINTS TEST SUITE', 'yellow');
  log('='.repeat(60) + '\n', 'yellow');

  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };

  // Login
  if (!(await adminLogin())) {
    logError('Cannot proceed without admin login');
    process.exit(1);
  }

  // Get test client
  if (!(await getTestClient())) {
    logError('Cannot proceed without test client');
    process.exit(1);
  }

  // Run all tests
  const tests = [
    { name: '20Q Endpoints', fn: test20QEndpoints },
    { name: 'Client Files Endpoints', fn: testClientFilesEndpoints },
    { name: 'Package Endpoints', fn: testPackageEndpoints },
    { name: 'Interview Endpoints', fn: testInterviewEndpoints }
  ];

  for (const test of tests) {
    results.total++;
    const passed = await test.fn();
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }
  }

  // Print summary
  logSection('TEST SUMMARY');
  log(`Total Tests: ${results.total}`, 'cyan');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`, 'cyan');

  if (results.failed === 0) {
    log('\n✓ All tests passed!', 'green');
  } else {
    log('\n✗ Some tests failed', 'red');
  }
}

// Run tests
runTests().catch(error => {
  logError(`Test suite error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
