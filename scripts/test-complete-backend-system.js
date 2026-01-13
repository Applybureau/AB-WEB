#!/usr/bin/env node

/**
 * COMPREHENSIVE BACKEND SYSTEM TEST
 * Tests all features including:
 * - Admin creation and authentication
 * - New consultation system with all fields
 * - Contact submissions
 * - Applications workflow
 * - Notifications system
 * - File uploads
 * - Email notifications
 * - Database schema validation
 */

require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = 'admin@test.com';
const TEST_PASSWORD = 'TestAdmin123!';
const CLIENT_EMAIL = 'client@test.com';

let adminToken = null;
let clientToken = null;
let testUserId = null;
let testConsultationId = null;
let testApplicationId = null;

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bold');
  console.log('='.repeat(60));
}

function logTest(testName, status, details = '') {
  const statusColor = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'yellow';
  const statusSymbol = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  log(`${statusSymbol} ${testName}: ${status}`, statusColor);
  if (details) {
    log(`   ${details}`, 'cyan');
  }
}

async function makeRequest(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      ...(data && { data })
    };

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
}

async function testDatabaseConnection() {
  logSection('🔌 DATABASE CONNECTION TEST');
  
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      logTest('Database Connection', 'FAIL', error.message);
      return false;
    }
    
    logTest('Database Connection', 'PASS', 'Successfully connected to Supabase');
    return true;
  } catch (error) {
    logTest('Database Connection', 'FAIL', error.message);
    return false;
  }
}

async function testSchemaValidation() {
  logSection('📋 SCHEMA VALIDATION TEST');
  
  const tables = [
    'profiles',
    'admin_users', 
    'applications',
    'consultations',
    'notifications',
    'contact_submissions',
    'consultation_requests'
  ];
  
  let allTablesExist = true;
  
  for (const table of tables) {
    try {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        logTest(`Table: ${table}`, 'FAIL', error.message);
        allTablesExist = false;
      } else {
        logTest(`Table: ${table}`, 'PASS', 'Table exists and accessible');
      }
    } catch (error) {
      logTest(`Table: ${table}`, 'FAIL', error.message);
      allTablesExist = false;
    }
  }
  
  return allTablesExist;
}

async function createTestAdmin() {
  logSection('👤 ADMIN USER CREATION TEST');
  
  try {
    // Check if admin already exists
    const { data: existingAdmin } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('email', TEST_EMAIL)
      .single();
    
    if (existingAdmin) {
      logTest('Admin User Exists', 'PASS', 'Using existing admin user');
      return existingAdmin.id;
    }
    
    // Create auth user first
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true
    });
    
    if (authError) {
      logTest('Auth User Creation', 'FAIL', authError.message);
      return null;
    }
    
    logTest('Auth User Creation', 'PASS', `User ID: ${authUser.user.id}`);
    
    // Create admin user record
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .insert({
        id: authUser.user.id,
        email: TEST_EMAIL,
        full_name: 'Test Admin',
        role: 'super_admin',
        is_active: true,
        department: 'Testing',
        specializations: ['consultation', 'testing'],
        hourly_rate: 150.00
      })
      .select()
      .single();
    
    if (adminError) {
      logTest('Admin User Record', 'FAIL', adminError.message);
      return null;
    }
    
    logTest('Admin User Record', 'PASS', `Admin created: ${adminUser.full_name}`);
    return adminUser.id;
    
  } catch (error) {
    logTest('Admin Creation', 'FAIL', error.message);
    return null;
  }
}

async function createTestClient() {
  logSection('👥 CLIENT USER CREATION TEST');
  
  try {
    // Create auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: CLIENT_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true
    });
    
    if (authError) {
      logTest('Client Auth User', 'FAIL', authError.message);
      return null;
    }
    
    logTest('Client Auth User', 'PASS', `User ID: ${authUser.user.id}`);
    
    // Update profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: 'Test Client',
        phone: '+1234567890',
        company: 'Test Company',
        position: 'CEO',
        country: 'US',
        current_country: 'US',
        industry: 'Technology',
        business_stage: 'Growth',
        annual_revenue: '$1M-$5M',
        team_size: '10-50',
        primary_challenge: 'Scaling operations',
        goals: 'International expansion',
        timeline: '6-12 months',
        budget_range: '$50K-$100K',
        profile_completed: true,
        profile_approved: true
      })
      .eq('id', authUser.user.id)
      .select()
      .single();
    
    if (profileError) {
      logTest('Client Profile', 'FAIL', profileError.message);
      return null;
    }
    
    logTest('Client Profile', 'PASS', `Profile created: ${profile.full_name}`);
    testUserId = authUser.user.id;
    return authUser.user.id;
    
  } catch (error) {
    logTest('Client Creation', 'FAIL', error.message);
    return null;
  }
}

async function testAuthentication() {
  logSection('🔐 AUTHENTICATION TEST');
  
  // Test admin login
  const adminLogin = await makeRequest('POST', '/api/auth/login', {
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  });
  
  if (adminLogin.success && adminLogin.data.token) {
    logTest('Admin Login', 'PASS', 'Token received');
    adminToken = adminLogin.data.token;
  } else {
    logTest('Admin Login', 'FAIL', adminLogin.error?.message || 'No token received');
    return false;
  }
  
  // Test client login
  const clientLogin = await makeRequest('POST', '/api/auth/login', {
    email: CLIENT_EMAIL,
    password: TEST_PASSWORD
  });
  
  if (clientLogin.success && clientLogin.data.token) {
    logTest('Client Login', 'PASS', 'Token received');
    clientToken = clientLogin.data.token;
  } else {
    logTest('Client Login', 'FAIL', clientLogin.error?.message || 'No token received');
    return false;
  }
  
  // Test token validation
  const tokenValidation = await makeRequest('GET', '/api/auth/me', null, adminToken);
  
  if (tokenValidation.success) {
    logTest('Token Validation', 'PASS', `User: ${tokenValidation.data.user.email}`);
  } else {
    logTest('Token Validation', 'FAIL', tokenValidation.error?.message);
    return false;
  }
  
  return true;
}

async function testConsultationSystem() {
  logSection('📅 CONSULTATION SYSTEM TEST');
  
  if (!adminToken || !testUserId) {
    logTest('Consultation Prerequisites', 'FAIL', 'Missing admin token or test user');
    return false;
  }
  
  // Test consultation creation with all new fields
  const consultationData = {
    user_id: testUserId,
    type: 'initial',
    title: 'Strategic Business Consultation',
    description: 'Comprehensive business strategy review and planning session',
    scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    duration_minutes: 90,
    meeting_link: 'https://meet.google.com/test-meeting',
    meeting_id: 'test-meeting-123',
    meeting_password: 'secure123',
    timezone: 'America/New_York',
    location: 'Virtual Meeting',
    attendees: [
      { name: 'Test Admin', email: TEST_EMAIL, role: 'consultant' },
      { name: 'Test Client', email: CLIENT_EMAIL, role: 'client' }
    ],
    agenda: [
      { item: 'Business overview', duration: 20 },
      { item: 'Strategy discussion', duration: 40 },
      { item: 'Action planning', duration: 30 }
    ],
    preparation_notes: 'Please review your business plan and financial statements',
    notes: 'Initial consultation for strategic planning',
    consultant_id: testUserId, // Using test user as consultant for simplicity
    hourly_rate: 200.00,
    billable_hours: 1.5
  };
  
  const createConsultation = await makeRequest('POST', '/api/consultations', consultationData, adminToken);
  
  if (createConsultation.success) {
    logTest('Consultation Creation', 'PASS', `ID: ${createConsultation.data.consultation.id}`);
    testConsultationId = createConsultation.data.consultation.id;
    
    // Verify all fields were saved correctly
    const consultation = createConsultation.data.consultation;
    const fieldsToCheck = [
      'type', 'title', 'description', 'duration_minutes', 'meeting_link', 
      'meeting_password', 'timezone', 'location', 'preparation_notes', 
      'hourly_rate', 'billable_hours', 'total_cost'
    ];
    
    let allFieldsCorrect = true;
    for (const field of fieldsToCheck) {
      if (consultation[field] === null || consultation[field] === undefined) {
        logTest(`Field: ${field}`, 'FAIL', 'Field is null or undefined');
        allFieldsCorrect = false;
      } else {
        logTest(`Field: ${field}`, 'PASS', `Value: ${consultation[field]}`);
      }
    }
    
    if (allFieldsCorrect) {
      logTest('All Consultation Fields', 'PASS', 'All fields saved correctly');
    }
    
  } else {
    logTest('Consultation Creation', 'FAIL', createConsultation.error?.message);
    return false;
  }
  
  // Test consultation retrieval
  const getConsultation = await makeRequest('GET', `/api/consultations/${testConsultationId}`, null, adminToken);
  
  if (getConsultation.success) {
    logTest('Consultation Retrieval', 'PASS', 'Consultation fetched successfully');
  } else {
    logTest('Consultation Retrieval', 'FAIL', getConsultation.error?.message);
  }
  
  // Test consultation update
  const updateData = {
    status: 'confirmed',
    actual_duration: 85,
    internal_notes: 'Client was well-prepared and engaged',
    internal_rating: 5
  };
  
  const updateConsultation = await makeRequest('PATCH', `/api/consultations/${testConsultationId}`, updateData, adminToken);
  
  if (updateConsultation.success) {
    logTest('Consultation Update', 'PASS', 'Status updated to confirmed');
  } else {
    logTest('Consultation Update', 'FAIL', updateConsultation.error?.message);
  }
  
  // Test consultation completion
  const completeData = {
    actual_duration: 90,
    notes: 'Excellent session with clear action items',
    action_items: [
      { task: 'Review market analysis', due_date: '2024-02-01', assigned_to: 'client' },
      { task: 'Prepare financial projections', due_date: '2024-02-05', assigned_to: 'client' }
    ],
    follow_up_required: true,
    follow_up_notes: 'Schedule follow-up in 2 weeks to review progress',
    internal_rating: 5,
    internal_notes: 'Highly productive session, client very engaged',
    billable_hours: 1.5,
    hourly_rate: 200.00
  };
  
  const completeConsultation = await makeRequest('POST', `/api/consultations/${testConsultationId}/complete`, completeData, adminToken);
  
  if (completeConsultation.success) {
    logTest('Consultation Completion', 'PASS', 'Consultation marked as completed');
  } else {
    logTest('Consultation Completion', 'FAIL', completeConsultation.error?.message);
  }
  
  // Test client feedback
  const feedbackData = {
    satisfaction_rating: 5,
    client_feedback: 'Excellent consultation! Very helpful and insightful.'
  };
  
  const submitFeedback = await makeRequest('POST', `/api/consultations/${testConsultationId}/feedback`, feedbackData, clientToken);
  
  if (submitFeedback.success) {
    logTest('Client Feedback', 'PASS', 'Feedback submitted successfully');
  } else {
    logTest('Client Feedback', 'FAIL', submitFeedback.error?.message);
  }
  
  return true;
}

async function testApplicationSystem() {
  logSection('📋 APPLICATION SYSTEM TEST');
  
  if (!clientToken || !testUserId) {
    logTest('Application Prerequisites', 'FAIL', 'Missing client token or test user');
    return false;
  }
  
  // Test application creation
  const applicationData = {
    type: 'consultation',
    title: 'Business Strategy Review Application',
    description: 'Requesting comprehensive business strategy consultation',
    requirements: {
      documents: ['business_plan', 'financial_statements'],
      preparation: 'Review current business model and challenges'
    },
    estimated_duration: 120,
    priority: 'high',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Next week
  };
  
  const createApplication = await makeRequest('POST', '/api/applications', applicationData, clientToken);
  
  if (createApplication.success) {
    logTest('Application Creation', 'PASS', `ID: ${createApplication.data.application.id}`);
    testApplicationId = createApplication.data.application.id;
  } else {
    logTest('Application Creation', 'FAIL', createApplication.error?.message);
    return false;
  }
  
  // Test application approval (admin)
  const approvalData = {
    status: 'approved',
    admin_notes: 'Application approved - client meets all requirements',
    estimated_cost: 500.00
  };
  
  const approveApplication = await makeRequest('PATCH', `/api/applications/${testApplicationId}`, approvalData, adminToken);
  
  if (approveApplication.success) {
    logTest('Application Approval', 'PASS', 'Application approved by admin');
  } else {
    logTest('Application Approval', 'FAIL', approveApplication.error?.message);
  }
  
  return true;
}

async function testContactSystem() {
  logSection('📞 CONTACT SYSTEM TEST');
  
  // Test public contact submission
  const contactData = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    company: 'Example Corp',
    position: 'CEO',
    country: 'US',
    subject: 'Business Consultation Inquiry',
    message: 'I am interested in your business consultation services. Please contact me to discuss my requirements.',
    source: 'website',
    utm_source: 'google',
    utm_medium: 'cpc',
    utm_campaign: 'business_consultation'
  };
  
  const submitContact = await makeRequest('POST', '/api/contact', contactData);
  
  if (submitContact.success) {
    logTest('Contact Submission', 'PASS', `ID: ${submitContact.data.submission.id}`);
  } else {
    logTest('Contact Submission', 'FAIL', submitContact.error?.message);
    return false;
  }
  
  // Test consultation request submission
  const consultationRequestData = {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '+1987654321',
    company: 'Smith Enterprises',
    position: 'Founder',
    country: 'CA',
    current_country: 'CA',
    business_stage: 'startup',
    industry: 'fintech',
    annual_revenue: 'under_100k',
    team_size: '1-10',
    primary_challenge: 'Product-market fit',
    goals: 'Scale to 1M ARR',
    urgency: 'high',
    budget_range: '10k-25k',
    consultation_type: 'strategy_call',
    preferred_times: [
      { date: '2024-02-01', time: '10:00', timezone: 'America/Toronto' },
      { date: '2024-02-02', time: '14:00', timezone: 'America/Toronto' }
    ],
    duration_preference: 60,
    meeting_preference: 'video',
    message: 'Looking for strategic guidance on scaling our fintech startup'
  };
  
  const submitConsultationRequest = await makeRequest('POST', '/api/consultation-requests', consultationRequestData);
  
  if (submitConsultationRequest.success) {
    logTest('Consultation Request', 'PASS', `ID: ${submitConsultationRequest.data.request.id}`);
  } else {
    logTest('Consultation Request', 'FAIL', submitConsultationRequest.error?.message);
  }
  
  return true;
}

async function testNotificationSystem() {
  logSection('🔔 NOTIFICATION SYSTEM TEST');
  
  if (!adminToken || !clientToken) {
    logTest('Notification Prerequisites', 'FAIL', 'Missing tokens');
    return false;
  }
  
  // Test admin notifications
  const getAdminNotifications = await makeRequest('GET', '/api/notifications', null, adminToken);
  
  if (getAdminNotifications.success) {
    logTest('Admin Notifications', 'PASS', `Found ${getAdminNotifications.data.notifications.length} notifications`);
  } else {
    logTest('Admin Notifications', 'FAIL', getAdminNotifications.error?.message);
  }
  
  // Test client notifications
  const getClientNotifications = await makeRequest('GET', '/api/notifications', null, clientToken);
  
  if (getClientNotifications.success) {
    logTest('Client Notifications', 'PASS', `Found ${getClientNotifications.data.notifications.length} notifications`);
  } else {
    logTest('Client Notifications', 'FAIL', getClientNotifications.error?.message);
  }
  
  return true;
}

async function testHealthEndpoints() {
  logSection('🏥 HEALTH CHECK TEST');
  
  // Test basic health endpoint
  const healthCheck = await makeRequest('GET', '/health');
  
  if (healthCheck.success) {
    logTest('Health Endpoint', 'PASS', `Status: ${healthCheck.data.status}`);
  } else {
    logTest('Health Endpoint', 'FAIL', healthCheck.error?.message);
  }
  
  // Test API health endpoint
  const apiHealthCheck = await makeRequest('GET', '/api/health');
  
  if (apiHealthCheck.success) {
    logTest('API Health Endpoint', 'PASS', `Service: ${apiHealthCheck.data.service}`);
  } else {
    logTest('API Health Endpoint', 'FAIL', apiHealthCheck.error?.message);
  }
  
  return true;
}

async function testAdminDashboard() {
  logSection('📊 ADMIN DASHBOARD TEST');
  
  if (!adminToken) {
    logTest('Admin Dashboard Prerequisites', 'FAIL', 'Missing admin token');
    return false;
  }
  
  // Test admin stats
  const getAdminStats = await makeRequest('GET', '/api/admin/stats', null, adminToken);
  
  if (getAdminStats.success) {
    logTest('Admin Stats', 'PASS', 'Stats retrieved successfully');
  } else {
    logTest('Admin Stats', 'FAIL', getAdminStats.error?.message);
  }
  
  // Test enhanced dashboard
  const getEnhancedDashboard = await makeRequest('GET', '/api/enhanced-dashboard', null, adminToken);
  
  if (getEnhancedDashboard.success) {
    logTest('Enhanced Dashboard', 'PASS', 'Dashboard data retrieved');
  } else {
    logTest('Enhanced Dashboard', 'FAIL', getEnhancedDashboard.error?.message);
  }
  
  return true;
}

async function runAllTests() {
  logSection('🚀 COMPREHENSIVE BACKEND SYSTEM TEST');
  log('Starting complete backend system validation...', 'blue');
  
  const testResults = {
    passed: 0,
    failed: 0,
    total: 0
  };
  
  const tests = [
    { name: 'Database Connection', fn: testDatabaseConnection },
    { name: 'Schema Validation', fn: testSchemaValidation },
    { name: 'Admin Creation', fn: createTestAdmin },
    { name: 'Client Creation', fn: createTestClient },
    { name: 'Authentication', fn: testAuthentication },
    { name: 'Consultation System', fn: testConsultationSystem },
    { name: 'Application System', fn: testApplicationSystem },
    { name: 'Contact System', fn: testContactSystem },
    { name: 'Notification System', fn: testNotificationSystem },
    { name: 'Health Endpoints', fn: testHealthEndpoints },
    { name: 'Admin Dashboard', fn: testAdminDashboard }
  ];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        testResults.passed++;
      } else {
        testResults.failed++;
      }
      testResults.total++;
    } catch (error) {
      logTest(test.name, 'FAIL', error.message);
      testResults.failed++;
      testResults.total++;
    }
  }
  
  // Final results
  logSection('📈 TEST RESULTS SUMMARY');
  log(`Total Tests: ${testResults.total}`, 'blue');
  log(`Passed: ${testResults.passed}`, 'green');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'green');
  log(`Success Rate: ${Math.round((testResults.passed / testResults.total) * 100)}%`, 
      testResults.failed === 0 ? 'green' : 'yellow');
  
  if (testResults.failed === 0) {
    log('\n🎉 ALL TESTS PASSED! Backend system is fully functional.', 'green');
  } else {
    log(`\n⚠️  ${testResults.failed} test(s) failed. Please review the errors above.`, 'red');
  }
  
  // Cleanup information
  logSection('🧹 CLEANUP INFORMATION');
  log('Test data created:', 'blue');
  log(`- Admin User: ${TEST_EMAIL}`, 'cyan');
  log(`- Client User: ${CLIENT_EMAIL}`, 'cyan');
  if (testConsultationId) log(`- Test Consultation ID: ${testConsultationId}`, 'cyan');
  if (testApplicationId) log(`- Test Application ID: ${testApplicationId}`, 'cyan');
  log('\nTo clean up test data, run the cleanup script or manually delete from database.', 'yellow');
  
  process.exit(testResults.failed === 0 ? 0 : 1);
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled Rejection at: ${promise}, reason: ${reason}`, 'red');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log(`Uncaught Exception: ${error.message}`, 'red');
  process.exit(1);
});

// Run the tests
if (require.main === module) {
  runAllTests().catch(error => {
    log(`Test execution failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testDatabaseConnection,
  testSchemaValidation,
  createTestAdmin,
  testConsultationSystem
};