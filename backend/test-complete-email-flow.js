const { sendEmail, buildUrl } = require('./utils/email');

console.log('📧 TESTING COMPLETE EMAIL FLOW');
console.log('='.repeat(70));
console.log('');
console.log('This will send test emails to verify all fixes');
console.log('');

const TEST_EMAIL = 'israelloko65@gmail.com'; // Change to your test email
const TEST_NAME = 'Test Client';

async function runTests() {
  const results = {
    passed: 0,
    failed: 0
  };

  // Test 1: Consultation Confirmed (Video Call)
  console.log('1️⃣ Testing Consultation Confirmed (Video Call)...');
  try {
    await sendEmail(TEST_EMAIL, 'consultation_confirmed', {
      client_name: TEST_NAME,
      consultation_date: 'Friday, February 14, 2026',
      consultation_time: '2:00 PM EST',
      meeting_link: 'https://meet.google.com/test-meeting-link',
      is_whatsapp_call: false,
      current_year: new Date().getFullYear()
    });
    console.log('   ✅ Sent successfully');
    console.log('   📋 Check: Duration shows 1 hour, button is clickable');
    results.passed++;
  } catch (error) {
    console.log('   ❌ Failed:', error.message);
    results.failed++;
  }

  // Test 2: Consultation Confirmed (WhatsApp)
  console.log('');
  console.log('2️⃣ Testing Consultation Confirmed (WhatsApp)...');
  try {
    await sendEmail(TEST_EMAIL, 'consultation_confirmed_concierge', {
      client_name: TEST_NAME,
      confirmed_date: 'Saturday, February 15, 2026',
      confirmed_time: '3:00 PM EST',
      is_whatsapp_call: true,
      admin_name: 'Apply Bureau Team',
      current_year: new Date().getFullYear()
    });
    console.log('   ✅ Sent successfully');
    console.log('   📋 Check: Duration shows 1 hour, WhatsApp instructions visible');
    results.passed++;
  } catch (error) {
    console.log('   ❌ Failed:', error.message);
    results.failed++;
  }

  // Test 3: Payment Verified Registration
  console.log('');
  console.log('3️⃣ Testing Payment Verified Registration...');
  try {
    const testToken = 'test-token-12345';
    await sendEmail(TEST_EMAIL, 'payment_verified_registration', {
      client_name: TEST_NAME,
      email: TEST_EMAIL,
      registration_url: buildUrl(`/register?token=${testToken}`),
      current_year: new Date().getFullYear()
    });
    console.log('   ✅ Sent successfully');
    console.log('   📋 Check: No temp password, button is clickable, only shows email');
    results.passed++;
  } catch (error) {
    console.log('   ❌ Failed:', error.message);
    results.failed++;
  }

  // Test 4: Payment Confirmed Welcome
  console.log('');
  console.log('4️⃣ Testing Payment Confirmed Welcome...');
  try {
    const testToken = 'test-token-67890';
    await sendEmail(TEST_EMAIL, 'payment_confirmed_welcome_concierge', {
      client_name: TEST_NAME,
      package_tier: 'Premium Package',
      registration_url: buildUrl(`/register?token=${testToken}`),
      admin_name: 'Apply Bureau Team',
      current_year: new Date().getFullYear()
    });
    console.log('   ✅ Sent successfully');
    console.log('   📋 Check: No temp password, registration button clickable');
    results.passed++;
  } catch (error) {
    console.log('   ❌ Failed:', error.message);
    results.failed++;
  }

  // Test 5: Account Created Confirmation
  console.log('');
  console.log('5️⃣ Testing Account Created Confirmation...');
  try {
    await sendEmail(TEST_EMAIL, 'onboarding_completed_secure', {
      client_name: TEST_NAME,
      email: TEST_EMAIL,
      dashboard_url: buildUrl('/client/dashboard'),
      login_url: buildUrl('/login'),
      current_year: new Date().getFullYear()
    });
    console.log('   ✅ Sent successfully');
    console.log('   📋 Check: Only shows email, no password, login button clickable');
    results.passed++;
  } catch (error) {
    console.log('   ❌ Failed:', error.message);
    results.failed++;
  }

  // Summary
  console.log('');
  console.log('='.repeat(70));
  console.log('\n📊 Test Summary:');
  console.log(`   ✅ Passed: ${results.passed}/5`);
  console.log(`   ❌ Failed: ${results.failed}/5`);
  console.log('');

  if (results.failed === 0) {
    console.log('🎉 All emails sent successfully!');
    console.log('');
    console.log('📋 Manual Verification Checklist:');
    console.log('   1. Check your inbox for 5 emails');
    console.log('   2. Verify consultation duration shows "1 hour"');
    console.log('   3. Verify NO temp passwords mentioned');
    console.log('   4. Verify all buttons are clickable');
    console.log('   5. Verify no duplicate logos');
    console.log('   6. Verify no placeholder data');
  } else {
    console.log('⚠️  Some emails failed to send - check errors above');
  }
}

runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
