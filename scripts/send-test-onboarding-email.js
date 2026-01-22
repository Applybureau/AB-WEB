#!/usr/bin/env node

/**
 * Send Test Onboarding Email
 * Simulates payment verification and sends registration email to israelloko65@gmail.com
 */

require('dotenv').config();
const { sendEmail, buildUrl } = require('../utils/email');
const jwt = require('jsonwebtoken');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

async function sendTestOnboardingEmail() {
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║              SEND TEST ONBOARDING EMAIL                   ║${colors.reset}`);
  console.log(`${colors.cyan}║          Payment Verified - Registration Link            ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log('');

  const clientEmail = 'israelloko65@gmail.com';
  const clientName = 'Israel Loko';
  
  console.log(`${colors.blue}Recipient: ${clientEmail}${colors.reset}`);
  console.log(`${colors.blue}Client Name: ${clientName}${colors.reset}`);
  console.log('');

  try {
    // Step 1: Generate registration token (7-day expiry)
    console.log(`${colors.yellow}[STEP 1] Generating Registration Token${colors.reset}`);
    
    const token = jwt.sign(
      { 
        email: clientEmail,
        name: clientName,
        type: 'registration',
        payment_confirmed: true,
        package_tier: 'Tier 2 - Premium Package',
        consultation_id: 'test-consultation-123'
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const tokenExpiry = new Date();
    tokenExpiry.setDate(tokenExpiry.getDate() + 7);

    console.log(`  ${colors.green}✓ Registration token generated${colors.reset}`);
    console.log(`  ${colors.cyan}Token expires: ${tokenExpiry.toLocaleDateString()}${colors.reset}`);
    console.log('');

    // Step 2: Build registration URL
    console.log(`${colors.yellow}[STEP 2] Building Registration URL${colors.reset}`);
    
    const registrationUrl = buildUrl(`/register?token=${token}`);
    
    console.log(`  ${colors.green}✓ Registration URL created${colors.reset}`);
    console.log(`  ${colors.cyan}URL: ${registrationUrl}${colors.reset}`);
    console.log('');

    // Step 3: Send payment confirmed welcome email with registration link
    console.log(`${colors.yellow}[STEP 3] Sending Payment Confirmed Welcome Email${colors.reset}`);
    
    const emailData = {
      client_name: clientName,
      payment_amount: '$497.00',
      payment_date: new Date().toISOString().split('T')[0],
      package_tier: 'Tier 2 - Premium Package',
      package_type: 'comprehensive',
      selected_services: [
        'Resume Optimization & ATS Compliance',
        'LinkedIn Profile Enhancement', 
        'Interview Preparation & Mock Sessions',
        'Job Application Strategy',
        'Salary Negotiation Coaching',
        'Personal Branding Consultation'
      ].join(', '),
      payment_method: 'Interac E-Transfer',
      payment_reference: 'TEST-PAYMENT-' + Date.now(),
      registration_url: registrationUrl,
      token_expiry: tokenExpiry.toLocaleDateString(),
      admin_name: 'Apply Bureau Team',
      next_steps: 'Click the registration link below to create your account and begin your onboarding process. You will have access to your personalized dashboard where you can track your job applications and progress.',
      
      // Additional onboarding details
      onboarding_steps: [
        '1. Complete your profile setup',
        '2. Upload your current resume and LinkedIn profile',
        '3. Complete our 20-question career assessment',
        '4. Schedule your strategy call',
        '5. Begin receiving optimized job applications'
      ].join('\n'),
      
      dashboard_features: [
        'Real-time job application tracking',
        'Interview status updates',
        'Resume versions used for each application',
        'Weekly progress reports',
        'Direct messaging with your career consultant'
      ].join('\n'),
      
      support_info: 'If you have any questions, reply to this email or contact us at support@applybureau.com'
    };

    await sendEmail(clientEmail, 'payment_confirmed_welcome_concierge', emailData);
    
    console.log(`  ${colors.green}✓ Payment confirmed welcome email sent successfully!${colors.reset}`);
    console.log('');

    // Step 4: Send additional onboarding completion email
    console.log(`${colors.yellow}[STEP 4] Sending Onboarding Complete Confirmation Email${colors.reset}`);
    
    const onboardingEmailData = {
      client_name: clientName,
      dashboard_url: buildUrl('/dashboard'),
      login_url: buildUrl('/login'),
      profile_completion_url: buildUrl('/profile/complete'),
      next_steps: 'Your account is ready! Complete your profile to unlock all features.',
      admin_name: 'Apply Bureau Team',
      
      // Welcome message
      welcome_message: 'Welcome to Apply Bureau! Your payment has been confirmed and your premium account is now active. You can now access your personalized dashboard and begin your career transformation journey.',
      
      // Account details
      account_type: 'Premium Client',
      access_level: 'Full Access',
      
      // What to expect
      what_to_expect: [
        'Personalized job application strategy',
        'Weekly application submissions on your behalf',
        'Real-time tracking of all applications',
        'Interview preparation and coaching',
        'Salary negotiation support'
      ].join('\n')
    };

    await sendEmail(clientEmail, 'onboarding_complete_confirmation', onboardingEmailData);
    
    console.log(`  ${colors.green}✓ Onboarding complete confirmation email sent successfully!${colors.reset}`);
    console.log('');

    // Step 5: Summary
    console.log(`${colors.cyan}═══════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}                EMAIL SUMMARY                   ${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════════════${colors.reset}\n`);
    
    console.log(`${colors.magenta}📧 EMAILS SENT TO: ${clientEmail}${colors.reset}`);
    console.log(`  ${colors.green}✓ Payment Confirmed Welcome Email${colors.reset}`);
    console.log(`  ${colors.green}✓ Onboarding Complete Confirmation Email${colors.reset}`);
    console.log('');
    
    console.log(`${colors.magenta}🔗 REGISTRATION DETAILS:${colors.reset}`);
    console.log(`  Registration URL: ${colors.cyan}${registrationUrl}${colors.reset}`);
    console.log(`  Token Expires: ${colors.cyan}${tokenExpiry.toLocaleDateString()} at ${tokenExpiry.toLocaleTimeString()}${colors.reset}`);
    console.log(`  Package: ${colors.cyan}Tier 2 - Premium Package${colors.reset}`);
    console.log(`  Payment Amount: ${colors.cyan}$497.00${colors.reset}`);
    console.log('');
    
    console.log(`${colors.magenta}📋 NEXT STEPS FOR CLIENT:${colors.reset}`);
    console.log(`  1. Check email inbox: ${colors.cyan}${clientEmail}${colors.reset}`);
    console.log(`  2. Click registration link in the email`);
    console.log(`  3. Create account password`);
    console.log(`  4. Complete profile setup`);
    console.log(`  5. Begin onboarding process`);
    console.log('');
    
    console.log(`${colors.green}🎉 TEST ONBOARDING EMAILS SENT SUCCESSFULLY!${colors.reset}`);
    console.log(`${colors.yellow}📧 Check your email: ${clientEmail}${colors.reset}`);

  } catch (error) {
    console.error(`${colors.red}❌ Error sending test onboarding email:${colors.reset}`, error);
    console.error(`${colors.red}Error details:${colors.reset}`, error.message);
    
    if (error.code) {
      console.error(`${colors.red}Error code:${colors.reset}`, error.code);
    }
    
    process.exit(1);
  }
}

// Run the test
sendTestOnboardingEmail().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});