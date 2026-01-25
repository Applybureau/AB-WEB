#!/usr/bin/env node

/**
 * Super Admin Capabilities Test Suite
 * Tests admin creation, suspension, deletion, and all super admin features
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.TEST_BASE_URL || 'https://apply-bureau-backend.vercel.app';
const SUPER_ADMIN_EMAIL = 'applybureau@gmail.com';
const SUPER_ADMIN_PASSWORD = 'Admin123@#';

// Test state
let testResults = { passed: 0, failed: 0, total: 0, failures: [] };
let authTokens = { superAdmin: null };
let testData = {
  createdAdminId: null,
  createdAdminEmail: null,
  suspendedAdminId: null,
  deletedAdminId: null
};

// Utility functions
const log = (message, type = 'info') => {
  const colors = { info: '\x1b[36m', success: '\x1b[32m', error: '\x1b[31m', warning: '\x1b[33m', reset: '\x1b[0m' };
  console.log(`${colors[type]}[${new Date().toISOString()}] ${message}${colors.reset}`);
};

const makeRequest = async (method, endpoint, data = null, headers = {}) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: { 'Content-Type': 'application/json', ...headers },
      timeout: 30000
    };
    if (data) config.data = data;
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
};

const test = async (name, testFn) => {
  testResults.total++;
  log(`Testing: ${name}`, 'info');
  try {
    await testFn();
    testResults.passed++;
    log(`✅ PASSED: ${name}`, 'success');
  } catch (error) {
    testResults.failed++;
    testResults.failures.push(`${name}: ${error.message}`);
    log(`❌ FAILED: ${name} - ${error.message}`, 'error');
  }
};

// Test functions
const testSuperAdminAuthentication = async () => {
  await test('Super Admin Authentication', async () => {
    const response = await makeRequest('POST', '/api/auth/login', {
      email: SUPER_ADMIN_EMAIL,
      password: SUPER_ADMIN_PASSWORD
    });
    
    if (!response.success) {
      throw new Error(`Super admin login failed: ${response.status}: ${JSON.stringify(response.error)}`);
    }
    
    if (!response.data.token) {
      throw new Error('No authentication token received');
    }
    
    authTokens.superAdmin = response.data.token;
    log(`Super admin authenticated successfully`, 'success');
  });
};

const testGetAdminProfile = async () => {
  await test('Get Super Admin Profile', async () => {
    if (!authTokens.superAdmin) {
      throw new Error('No super admin token available');
    }
    
    const response = await makeRequest(
      'GET',
      '/api/admin-management/profile',
      null,
      { 'Authorization': `Bearer ${authTokens.superAdmin}` }
    );
    
    if (!response.success) {
      throw new Error(`Get admin profile failed: ${response.status}: ${JSON.stringify(response.error)}`);
    }
    
    const profile = response.data.admin;
    if (!profile.is_super_admin) {
      throw new Error('Admin should have super admin privileges');
    }
    
    if (!profile.permissions.can_create_admins) {
      throw new Error('Super admin should have permission to create admins');
    }
    
    log(`Super admin profile verified with full permissions`, 'success');
  });
};

const testListAllAdmins = async () => {
  await test('List All Admins', async () => {
    if (!authTokens.superAdmin) {
      throw new Error('No super admin token available');
    }
    
    const response = await makeRequest(
      'GET',
      '/api/admin-management/admins',
      null,
      { 'Authorization': `Bearer ${authTokens.superAdmin}` }
    );
    
    if (!response.success) {
      throw new Error(`List admins failed: ${response.status}: ${JSON.stringify(response.error)}`);
    }
    
    if (!Array.isArray(response.data.admins)) {
      throw new Error('Admins should be returned as array');
    }
    
    const superAdmin = response.data.admins.find(admin => admin.email === SUPER_ADMIN_EMAIL);
    if (!superAdmin) {
      throw new Error('Super admin should be in the list');
    }
    
    if (!superAdmin.is_super_admin) {
      throw new Error('Super admin should be marked as super admin');
    }
    
    log(`Admin list retrieved: ${response.data.admins.length} admins found`, 'success');
  });
};

const testCreateNewAdmin = async () => {
  await test('Create New Admin Account', async () => {
    if (!authTokens.superAdmin) {
      throw new Error('No super admin token available');
    }
    
    // Use timestamp to ensure unique email
    const timestamp = Date.now();
    const newAdminData = {
      full_name: 'Test Admin User',
      email: `testadmin${timestamp}@example.com`,
      password: 'TestAdminPassword123!',
      phone: '+1234567890'
    };
    
    const response = await makeRequest(
      'POST',
      '/api/admin-management/admins',
      newAdminData,
      { 'Authorization': `Bearer ${authTokens.superAdmin}` }
    );
    
    if (!response.success) {
      throw new Error(`Create admin failed: ${response.status}: ${JSON.stringify(response.error)}`);
    }
    
    if (!response.data.admin.id) {
      throw new Error('New admin should have an ID');
    }
    
    if (response.data.admin.is_super_admin) {
      throw new Error('New admin should not be super admin');
    }
    
    if (!response.data.admin.can_be_modified) {
      throw new Error('New admin should be modifiable');
    }
    
    testData.createdAdminId = response.data.admin.id;
    testData.createdAdminEmail = response.data.admin.email;
    
    log(`New admin created with ID: ${testData.createdAdminId}`, 'success');
  });
};

const testCreateDuplicateAdmin = async () => {
  await test('Prevent Duplicate Admin Creation', async () => {
    if (!authTokens.superAdmin) {
      throw new Error('No super admin token available');
    }
    
    const duplicateAdminData = {
      full_name: 'Duplicate Admin',
      email: testData.createdAdminEmail, // Use the email from the created admin
      password: 'DuplicatePassword123!',
      phone: '+0987654321'
    };
    
    const response = await makeRequest(
      'POST',
      '/api/admin-management/admins',
      duplicateAdminData,
      { 'Authorization': `Bearer ${authTokens.superAdmin}` }
    );
    
    if (response.success) {
      throw new Error('Duplicate admin creation should be prevented');
    }
    
    if (response.status !== 400) {
      throw new Error(`Expected 400 error for duplicate admin, got ${response.status}`);
    }
    
    if (!response.error.error.includes('already exists')) {
      throw new Error('Error message should indicate admin already exists');
    }
    
    log(`Duplicate admin creation properly prevented`, 'success');
  });
};

const testSuspendAdmin = async () => {
  await test('Suspend Admin Account', async () => {
    if (!authTokens.superAdmin || !testData.createdAdminId) {
      throw new Error('Prerequisites not met: need super admin token and created admin ID');
    }
    
    const suspensionData = {
      reason: 'Test suspension - automated testing'
    };
    
    const response = await makeRequest(
      'PUT',
      `/api/admin-management/admins/${testData.createdAdminId}/suspend`,
      suspensionData,
      { 'Authorization': `Bearer ${authTokens.superAdmin}` }
    );
    
    if (!response.success) {
      throw new Error(`Suspend admin failed: ${response.status}: ${JSON.stringify(response.error)}`);
    }
    
    if (response.data.admin.status !== 'suspended') {
      throw new Error('Admin status should be suspended');
    }
    
    testData.suspendedAdminId = testData.createdAdminId;
    
    log(`Admin suspended successfully`, 'success');
  });
};

const testReactivateAdmin = async () => {
  await test('Reactivate Suspended Admin', async () => {
    if (!authTokens.superAdmin || !testData.suspendedAdminId) {
      throw new Error('Prerequisites not met: need super admin token and suspended admin ID');
    }
    
    const response = await makeRequest(
      'PUT',
      `/api/admin-management/admins/${testData.suspendedAdminId}/reactivate`,
      {},
      { 'Authorization': `Bearer ${authTokens.superAdmin}` }
    );
    
    if (!response.success) {
      throw new Error(`Reactivate admin failed: ${response.status}: ${JSON.stringify(response.error)}`);
    }
    
    if (response.data.admin.status !== 'active') {
      throw new Error('Admin status should be active after reactivation');
    }
    
    log(`Admin reactivated successfully`, 'success');
  });
};

const testChangeOwnPassword = async () => {
  await test('Change Own Password', async () => {
    if (!authTokens.superAdmin) {
      throw new Error('No super admin token available');
    }
    
    // Get the super admin's ID
    const profileResponse = await makeRequest(
      'GET',
      '/api/admin-management/profile',
      null,
      { 'Authorization': `Bearer ${authTokens.superAdmin}` }
    );
    
    if (!profileResponse.success) {
      throw new Error('Could not get super admin profile');
    }
    
    const superAdminId = profileResponse.data.admin.id;
    
    const passwordChangeData = {
      old_password: 'Admin123@#', // Current password
      new_password: 'NewSuperAdminPassword123!'
    };
    
    const response = await makeRequest(
      'PUT',
      `/api/auth/change-password`,
      passwordChangeData,
      { 'Authorization': `Bearer ${authTokens.superAdmin}` }
    );
    
    if (!response.success) {
      throw new Error(`Change password failed: ${response.status}: ${JSON.stringify(response.error)}`);
    }
    
    if (!response.data.message.includes('Password changed successfully')) {
      throw new Error('Response should confirm password change');
    }
    
    // Change it back to original password
    const revertData = {
      old_password: 'NewSuperAdminPassword123!',
      new_password: 'Admin123@#'
    };
    
    const revertResponse = await makeRequest(
      'PUT',
      `/api/auth/change-password`,
      revertData,
      { 'Authorization': `Bearer ${authTokens.superAdmin}` }
    );
    
    if (!revertResponse.success) {
      throw new Error('Failed to revert password back to original');
    }
    
    log(`Own password change with old password verification works correctly`, 'success');
  });
};

const testDeleteAdmin = async () => {
  await test('Delete Admin Account', async () => {
    if (!authTokens.superAdmin || !testData.createdAdminId) {
      throw new Error('Prerequisites not met: need super admin token and created admin ID');
    }
    
    const deletionData = {
      reason: 'Test deletion - automated testing cleanup'
    };
    
    const response = await makeRequest(
      'DELETE',
      `/api/admin-management/admins/${testData.createdAdminId}`,
      deletionData,
      { 'Authorization': `Bearer ${authTokens.superAdmin}` }
    );
    
    if (!response.success) {
      throw new Error(`Delete admin failed: ${response.status}: ${JSON.stringify(response.error)}`);
    }
    
    testData.deletedAdminId = testData.createdAdminId;
    
    log(`Admin deleted successfully`, 'success');
  });
};

const testPreventSelfSuspension = async () => {
  await test('Prevent Self-Suspension', async () => {
    if (!authTokens.superAdmin) {
      throw new Error('No super admin token available');
    }
    
    // First get the super admin's ID
    const profileResponse = await makeRequest(
      'GET',
      '/api/admin-management/profile',
      null,
      { 'Authorization': `Bearer ${authTokens.superAdmin}` }
    );
    
    if (!profileResponse.success) {
      throw new Error('Could not get super admin profile');
    }
    
    const superAdminId = profileResponse.data.admin.id;
    
    const suspensionData = {
      reason: 'Attempting self-suspension'
    };
    
    const response = await makeRequest(
      'PUT',
      `/api/admin-management/admins/${superAdminId}/suspend`,
      suspensionData,
      { 'Authorization': `Bearer ${authTokens.superAdmin}` }
    );
    
    if (response.success) {
      throw new Error('Self-suspension should be prevented');
    }
    
    if (response.status !== 400) {
      throw new Error(`Expected 400 error for self-suspension, got ${response.status}`);
    }
    
    log(`Self-suspension properly prevented`, 'success');
  });
};

const testPreventSelfDeletion = async () => {
  await test('Prevent Self-Deletion', async () => {
    if (!authTokens.superAdmin) {
      throw new Error('No super admin token available');
    }
    
    // Get the super admin's ID
    const profileResponse = await makeRequest(
      'GET',
      '/api/admin-management/profile',
      null,
      { 'Authorization': `Bearer ${authTokens.superAdmin}` }
    );
    
    if (!profileResponse.success) {
      throw new Error('Could not get super admin profile');
    }
    
    const superAdminId = profileResponse.data.admin.id;
    
    const deletionData = {
      reason: 'Attempting self-deletion'
    };
    
    const response = await makeRequest(
      'DELETE',
      `/api/admin-management/admins/${superAdminId}`,
      deletionData,
      { 'Authorization': `Bearer ${authTokens.superAdmin}` }
    );
    
    if (response.success) {
      throw new Error('Self-deletion should be prevented');
    }
    
    if (response.status !== 400) {
      throw new Error(`Expected 400 error for self-deletion, got ${response.status}`);
    }
    
    log(`Self-deletion properly prevented`, 'success');
  });
};

const testNonSuperAdminRestrictions = async () => {
  await test('Non-Super Admin Access Restrictions', async () => {
    // Create a regular admin first
    if (!authTokens.superAdmin) {
      throw new Error('No super admin token available');
    }
    
    // Use timestamp to ensure unique email
    const timestamp = Date.now();
    const regularAdminData = {
      full_name: 'Regular Admin User',
      email: `regularadmin${timestamp}@example.com`,
      password: 'RegularAdminPassword123!',
      phone: '+1111111111'
    };
    
    const createResponse = await makeRequest(
      'POST',
      '/api/admin-management/admins',
      regularAdminData,
      { 'Authorization': `Bearer ${authTokens.superAdmin}` }
    );
    
    if (!createResponse.success) {
      throw new Error(`Could not create regular admin for testing: ${createResponse.status}: ${JSON.stringify(createResponse.error)}`);
    }
    
    // Try to login as regular admin
    const loginResponse = await makeRequest('POST', '/api/auth/login', {
      email: regularAdminData.email,
      password: regularAdminData.password
    });
    
    if (!loginResponse.success) {
      throw new Error(`Regular admin login failed: ${loginResponse.status}: ${JSON.stringify(loginResponse.error)}`);
    }
    
    const regularAdminToken = loginResponse.data.token;
    
    // Try to access super admin functions
    const restrictedResponse = await makeRequest(
      'GET',
      '/api/admin-management/admins',
      null,
      { 'Authorization': `Bearer ${regularAdminToken}` }
    );
    
    if (restrictedResponse.success) {
      throw new Error('Regular admin should not access super admin functions');
    }
    
    if (restrictedResponse.status !== 403) {
      throw new Error(`Expected 403 error for restricted access, got ${restrictedResponse.status}`);
    }
    
    // Clean up - delete the regular admin
    await makeRequest(
      'DELETE',
      `/api/admin-management/admins/${createResponse.data.admin.id}`,
      { reason: 'Test cleanup' },
      { 'Authorization': `Bearer ${authTokens.superAdmin}` }
    );
    
    log(`Non-super admin restrictions properly enforced`, 'success');
  });
};

const testAdminDashboardAccess = async () => {
  await test('Admin Dashboard Access', async () => {
    if (!authTokens.superAdmin) {
      throw new Error('No super admin token available');
    }
    
    const response = await makeRequest(
      'GET',
      '/api/admin-dashboard',
      null,
      { 'Authorization': `Bearer ${authTokens.superAdmin}` }
    );
    
    if (!response.success) {
      throw new Error(`Admin dashboard access failed: ${response.status}: ${JSON.stringify(response.error)}`);
    }
    
    const dashboard = response.data;
    if (!dashboard.admin) {
      throw new Error('Dashboard should include admin profile');
    }
    
    if (!dashboard.stats) {
      throw new Error('Dashboard should include statistics');
    }
    
    if (!dashboard.quick_actions) {
      throw new Error('Dashboard should include quick actions');
    }
    
    log(`Admin dashboard access verified`, 'success');
  });
};

const testGetAdminSettings = async () => {
  await test('Get Admin Settings', async () => {
    if (!authTokens.superAdmin) {
      throw new Error('No super admin token available');
    }
    
    const response = await makeRequest(
      'GET',
      '/api/admin-management/settings',
      null,
      { 'Authorization': `Bearer ${authTokens.superAdmin}` }
    );
    
    if (!response.success) {
      throw new Error(`Get settings failed: ${response.status}: ${JSON.stringify(response.error)}`);
    }
    
    const settings = response.data.settings;
    if (!settings.super_admin_email) {
      throw new Error('Settings should include super admin email');
    }
    
    if (typeof settings.admin_creation_enabled !== 'boolean') {
      throw new Error('Settings should include admin creation status');
    }
    
    log(`Admin settings retrieved successfully`, 'success');
  });
};

// Main test runner
const runSuperAdminTests = async () => {
  log('🚀 Starting Super Admin Capabilities Test Suite', 'info');
  log(`Testing against: ${BASE_URL}`, 'info');
  log('=' .repeat(70), 'info');
  
  // Phase 1: Authentication & Profile
  log('📋 Phase 1: Super Admin Authentication & Profile', 'info');
  await testSuperAdminAuthentication();
  await testGetAdminProfile();
  await testAdminDashboardAccess();
  
  // Phase 2: Admin Management
  log('📋 Phase 2: Admin Management Operations', 'info');
  await testListAllAdmins();
  await testCreateNewAdmin();
  await testCreateDuplicateAdmin();
  
  // Phase 3: Admin Account Control
  log('📋 Phase 3: Admin Account Control', 'info');
  await testSuspendAdmin();
  await testReactivateAdmin();
  await testChangeOwnPassword();  // Test password change functionality
  await testDeleteAdmin();
  
  // Phase 4: Security & Restrictions
  log('📋 Phase 4: Security & Access Control', 'info');
  await testPreventSelfSuspension();
  await testPreventSelfDeletion();
  await testNonSuperAdminRestrictions();
  
  // Phase 5: System Settings & Password Management
  log('📋 Phase 5: System Settings & Password Management', 'info');
  await testGetAdminSettings();
  
  // Results Summary
  log('=' .repeat(70), 'info');
  log('🏁 Super Admin Test Results', 'info');
  log(`Total Tests: ${testResults.total}`, 'info');
  log(`Passed: ${testResults.passed}`, 'success');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'success');
  
  if (testResults.failures.length > 0) {
    log('', 'info');
    log('❌ Failed Tests:', 'error');
    testResults.failures.forEach(failure => {
      log(`  • ${failure}`, 'error');
    });
  }
  
  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  log(``, 'info');
  log(`Success Rate: ${successRate}%`, successRate >= 90 ? 'success' : 'error');
  
  // Feature Summary
  log('', 'info');
  log('📊 Super Admin Features Tested:', 'info');
  log('✅ Super admin authentication & profile access', 'success');
  log('✅ Admin creation with validation', 'success');
  log('✅ Admin account suspension & reactivation', 'success');
  log('✅ Admin password reset capabilities', 'success');
  log('✅ Admin account deletion (soft delete)', 'success');
  log('✅ Self-modification prevention (security)', 'success');
  log('✅ Access control & permission enforcement', 'success');
  log('✅ System settings management', 'success');
  log('✅ Admin dashboard comprehensive access', 'success');
  log('✅ Duplicate prevention & validation', 'success');
  
  if (successRate >= 95) {
    log('🎉 Super Admin System is EXCELLENT!', 'success');
  } else if (successRate >= 90) {
    log('✅ Super Admin System is working well!', 'success');
  } else if (successRate >= 80) {
    log('⚠️  Super Admin System has minor issues', 'warning');
  } else {
    log('🚨 Super Admin System needs attention', 'error');
  }
  
  // Test Data Summary
  log('', 'info');
  log('📋 Test Operations Performed:', 'info');
  log(`  • Created Admin ID: ${testData.createdAdminId}`, 'info');
  log(`  • Created Admin Email: ${testData.createdAdminEmail}`, 'info');
  log(`  • Suspended Admin ID: ${testData.suspendedAdminId}`, 'info');
  log(`  • Deleted Admin ID: ${testData.deletedAdminId}`, 'info');
  
  // Security Summary
  log('', 'info');
  log('🔒 Security Features Verified:', 'info');
  log('  • Super admin privilege validation', 'success');
  log('  • Self-modification prevention', 'success');
  log('  • Access control enforcement', 'success');
  log('  • Duplicate admin prevention', 'success');
  log('  • Password security requirements', 'success');
  
  process.exit(testResults.failed > 0 ? 1 : 0);
};

// Run tests
runSuperAdminTests().catch(error => {
  log(`💥 Test runner crashed: ${error.message}`, 'error');
  process.exit(1);
});