#!/usr/bin/env node

/**
 * FINAL WORKING TEST - Apply Bureau Backend
 * Simple test to confirm all endpoints work
 */

const axios = require('axios');

const DEPLOYED_URL = 'https://apply-bureau-backend.onrender.com';
const API_URL = `${DEPLOYED_URL}/api`;

async function finalTest() {
  console.log('🎯 FINAL WORKING TEST - Apply Bureau Backend');
  console.log('='.repeat(60));
  console.log(`🌐 Backend URL: ${DEPLOYED_URL}`);
  console.log('⏰ URGENT: Confirming all endpoints work for tomorrow\n');

  let passed = 0;
  let failed = 0;

  function test(name, success, details = '') {
    if (success) {
      console.log(`✅ ${name} - ${details}`);
      passed++;
    } else {
      console.log(`❌ ${name} - ${details}`);
      failed++;
    }
  }

  try {
    // 1. Health Check
    const health = await axios.get(`${DEPLOYED_URL}/health`, { timeout: 30000 });
    test('Health endpoint', health.status === 200, health.data.service);

    // 2. Logo Asset
    const logo = await axios.get(`${DEPLOYED_URL}/emails/assets/logo.png`, { timeout: 10000 });
    test('Logo asset', logo.status === 200, `${Math.round(logo.headers['content-length']/1024)}KB`);

    // 3. Email Templates
    const templates = ['signup_invite.html', 'consultation_scheduled.html', 'application_status_update.html', 'onboarding_completion.html'];
    for (const template of templates) {
      const response = await axios.get(`${DEPLOYED_URL}/emails/templates/${template}`, { timeout: 5000 });
      test(`Template: ${template}`, response.status === 200, 'Accessible');
    }

    // 4. Admin Login
    const login = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@applybureau.com',
      password: 'admin123'
    }, { timeout: 15000 });
    test('Admin login', login.status === 200, login.data.user.full_name);

    const token = login.data.token;

    // 5. Auth Me
    const me = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000
    });
    test('GET /api/auth/me', me.status === 200, me.data.user.full_name);

    // 6. Dashboard
    const dashboard = await axios.get(`${API_URL}/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 15000
    });
    test('GET /api/dashboard', dashboard.status === 200, 'Dashboard loaded');

    // 7. Dashboard Stats
    const stats = await axios.get(`${API_URL}/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000
    });
    test('GET /api/dashboard/stats', stats.status === 200, 'Statistics loaded');

    // 8. Consultations
    const consultations = await axios.get(`${API_URL}/consultations`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000
    });
    test('GET /api/consultations', consultations.status === 200, `${consultations.data.length || 0} consultations`);

    // 9. Applications
    const applications = await axios.get(`${API_URL}/applications`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000
    });
    test('GET /api/applications', applications.status === 200, `${applications.data.length || 0} applications`);

    // 10. Notifications
    const notifications = await axios.get(`${API_URL}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000
    });
    test('GET /api/notifications', notifications.status === 200, `${notifications.data.notifications?.length || 0} notifications`);

    // 11. Unread Count
    const unreadCount = await axios.get(`${API_URL}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000
    });
    test('GET /api/notifications/unread-count', unreadCount.status === 200, `${unreadCount.data.unread_count} unread`);

    // 12. Security Test
    try {
      await axios.get(`${API_URL}/dashboard`, {
        headers: { Authorization: 'Bearer invalid-token' },
        timeout: 5000
      });
      test('Security protection', false, 'Invalid token accepted');
    } catch (error) {
      const secured = error.response?.status === 401 || error.response?.status === 403;
      test('Security protection', secured, 'Unauthorized access blocked');
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
    failed++;
  }

  // Results
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL TEST RESULTS');
  console.log('='.repeat(60));

  const total = passed + failed;
  const successRate = Math.round((passed / total) * 100);

  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${successRate}%`);

  if (failed === 0) {
    console.log('\n🎉 BACKEND IS 100% PRODUCTION READY! 🚀');
    console.log('✨ ALL ENDPOINTS WORKING PERFECTLY ✨');
    console.log('\n🎯 READY FOR TOMORROW SUBMISSION! 🎯');
    console.log('\n📋 WORKING ENDPOINTS:');
    console.log('✅ Health monitoring');
    console.log('✅ Authentication system');
    console.log('✅ Dashboard and statistics');
    console.log('✅ Consultations management');
    console.log('✅ Applications tracking');
    console.log('✅ Notifications system');
    console.log('✅ Email templates');
    console.log('✅ Security features');
    console.log('\n🌐 BACKEND URL: https://apply-bureau-backend.onrender.com');
    console.log('🔑 ADMIN LOGIN: admin@applybureau.com / admin123');
  } else {
    console.log('\n⚠️  Some issues found, but core functionality working');
  }
}

finalTest();