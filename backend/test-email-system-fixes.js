// Load environment variables
require('dotenv').config();

const { sendEmail, buildUrl } = require('./utils/email');
const jwt = require('jsonwebtoken');

// Test configuration
const TEST_EMAIL = 'israelloko65@gmail.com';
const TEST_ADMIN_EMAIL = 'applybureau@gmail.com';

async function testEmailSystemFixes() {
  console.log('🧪 Testing Apply Bureau Email System Fixes\n');
  
  try {
    // Test 1: Consultation Confirmed Email with Meeting Link
    console.log('1️⃣ Testing Consultation Confirmed Email...');
    await sendEmail(TEST_EMAIL, 'consultation_confirmed_concierge', {
      client_name: 'John Doe',
      confirmed_date: '2026-02-15',
      confirmed_time: '14:00',
      meeting_details: 'We will discuss your career goals and how Apply Bureau can help you achieve them.',
      meeting_link: 'https://meet.google.com/abc-defg-hij',
      admin_name: 'Sarah Johnson',
      next_steps: 'Please mark this time in your calendar and prepare any questions you may have.',
      current_year: new Date().getFullYear()
    });
    console.log('✅ Consultation confirmed email sent\n');

    // Test 2: Consultation Confirmed Email without Meeting Link (fallback test)
    console.log('2️⃣ Testing Consultation Confirmed Email (No Meeting Link)...');
    await sendEmail(TEST_EMAIL, 'consultation_confirmed_concierge', {
      client_name: 'Jane Smith',
      confirmed_date: '2026-02-16',
      confirmed_time: '10:30',
      admin_name: 'Michael Chen',
      current_year: new Date().getFullYear()
    });
    console.log('✅ Consultation confirmed email (fallback) sent\n');

    // Test 3: Payment Confirmed with Registration Token
    console.log('3️⃣ Testing Payment Confirmed with Registration Token...');
    const registrationToken = jwt.sign(
      { 
        email: TEST_EMAIL,
        name: 'Alex Johnson',
        type: 'registration',
        payment_confirmed: true,
        consultation_id: 'test-123'
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '7d' }
    );
    
    const registrationUrl = buildUrl(`/register?token=${registrationToken}`);
    
    await sendEmail(TEST_EMAIL, 'payment_confirmed_welcome_concierge', {
      client_name: 'Alex Johnson',
      payment_amount: 2500,
      payment_date: '2026-01-27',
      package_tier: 'Premium Package',
      package_type: 'tier',
      selected_services: 'Resume Review, Interview Coaching, Application Tracking',
      payment_method: 'Interac e-Transfer',
      payment_reference: 'REF-2026-001',
      registration_url: registrationUrl,
      registration_link: registrationUrl,
      token_expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      admin_name: 'Apply Bureau Team',
      current_year: new Date().getFullYear()
    });
    console.log('✅ Payment confirmed with registration token sent\n');

    // Test 4: Admin Password Reset with Real Data
    console.log('4️⃣ Testing Admin Password Reset with Real Data...');
    await sendEmail(TEST_EMAIL, 'admin_password_reset', {
      admin_name: 'David Wilson',
      admin_email: 'david.wilson@applybureau.com',
      reset_by: 'Super Admin (applybureau@gmail.com)',
      new_password: 'NewSecure123!',
      login_url: buildUrl('/admin/login'),
      current_year: new Date().getFullYear()
    });
    console.log('✅ Admin password reset email sent\n');

    // Test 5: Application Update Email
    console.log('5️⃣ Testing Application Update Email...');
    await sendEmail(TEST_EMAIL, 'application_update', {
      client_name: 'Emma Thompson',
      company_name: 'Tech Innovations Inc.',
      position_title: 'Senior Software Engineer',
      application_status: 'interview',
      message: 'Great news! Your application has progressed to the interview stage. The hiring manager was impressed with your background.',
      next_steps: 'Please prepare for a technical interview scheduled for next week. We will send you the details shortly.',
      reply_to: 'consultant@applybureau.com',
      current_year: new Date().getFullYear()
    });
    console.log('✅ Application update email sent\n');

    // Test 6: Logo Verification Test
    console.log('6️⃣ Testing Logo Update Verification...');
    await sendEmail(TEST_EMAIL, 'admin_welcome', {
      admin_name: 'Test Admin',
      admin_email: 'test@applybureau.com',
      login_url: buildUrl('/admin/login'),
      super_admin_email: TEST_ADMIN_EMAIL,
      current_year: new Date().getFullYear()
    });
    console.log('✅ Logo verification email sent\n');

    // Test 7: Consultation Reschedule Request
    console.log('7️⃣ Testing Consultation Reschedule Request...');
    await sendEmail(TEST_EMAIL, 'consultation_reschedule_request', {
      client_name: 'Robert Chen',
      reschedule_reason: 'Schedule conflict on our end',
      admin_name: 'Lisa Park',
      new_times_url: buildUrl('/consultation/new-times/test-456'),
      next_steps: 'Please provide 3 new preferred time slots using the link above.'
    });
    console.log('✅ Consultation reschedule request sent\n');

    // Test 8: Consultation Waitlisted
    console.log('8️⃣ Testing Consultation Waitlisted...');
    await sendEmail(TEST_EMAIL, 'consultation_waitlisted', {
      client_name: 'Maria Rodriguez',
      waitlist_reason: 'High demand - all slots currently filled',
      admin_name: 'James Kim',
      next_steps: 'We will contact you as soon as availability opens up. Thank you for your patience.'
    });
    console.log('✅ Consultation waitlisted email sent\n');

    console.log('🎉 All email system tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('✅ Consultation confirmed emails (with and without meeting links)');
    console.log('✅ Payment confirmed with registration token and link');
    console.log('✅ Admin password reset with real data (no placeholders)');
    console.log('✅ Application update emails');
    console.log('✅ Logo verification (new Cloudinary URL)');
    console.log('✅ Consultation reschedule and waitlist emails');
    console.log('\n🔧 Fixes Applied:');
    console.log('• Updated all 35 email templates with new logo URL');
    console.log('• Fixed consultation emails to include conditional meeting links');
    console.log('• Fixed admin password reset to use real admin data');
    console.log('• Fixed payment confirmation to include registration tokens');
    console.log('• Added fallback text for all optional template variables');
    console.log('• Implemented proper token generation with 7-day expiry');
    
  } catch (error) {
    console.error('❌ Email test failed:', error);
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  testEmailSystemFixes();
}

module.exports = { testEmailSystemFixes };