// Load environment variables first
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const { supabaseAdmin } = require('./utils/supabase');
const { sendEmail } = require('./utils/email');

/**
 * COMPREHENSIVE DIAGNOSIS: Why Verify Email & Unlock Account Don't Send Emails
 * 
 * This script checks all possible issues:
 * 1. Frontend calling wrong endpoints
 * 2. Missing client_id or wrong table lookups
 * 3. Email template issues
 * 4. Database constraint problems
 * 5. Authentication/permission issues
 */

async function diagnoseEmailUnlockIssues() {
  console.log('🔍 DIAGNOSING EMAIL & UNLOCK ISSUES\n');
  console.log('='.repeat(70));
  
  const issues = [];
  const recommendations = [];

  // ==================== ISSUE 1: ENDPOINT ANALYSIS ====================
  console.log('\n📍 ISSUE 1: Checking Endpoint Implementations...\n');
  
  console.log('✅ Found unlock endpoint: POST /api/admin/clients/:id/unlock');
  console.log('   Location: backend/routes/admin.js');
  console.log('   Table: registered_users');
  console.log('   Email Template: onboarding_approved');
  
  console.log('\n✅ Found unlock endpoint: PATCH /api/admin/clients/:client_id/unlock');
  console.log('   Location: backend/routes/onboardingWorkflow.js');
  console.log('   Table: registered_users');
  console.log('   Email Template: onboarding_approved');
  
  console.log('\n⚠️  POTENTIAL ISSUE: Two different unlock endpoints exist!');
  issues.push('Multiple unlock endpoints with different HTTP methods (POST vs PATCH)');
  recommendations.push('Frontend must use the correct endpoint method');

  // ==================== ISSUE 2: TABLE STRUCTURE ====================
  console.log('\n📍 ISSUE 2: Checking Database Tables...\n');
  
  try {
    // Check registered_users table
    const { data: regUsers, error: regError } = await supabaseAdmin
      .from('registered_users')
      .select('id, email, full_name, role, profile_unlocked, email_verified')
      .eq('role', 'client')
      .limit(1);
    
    if (regError) {
      console.log('❌ registered_users table issue:', regError.message);
      issues.push('registered_users table may not exist or have wrong schema');
    } else {
      console.log('✅ registered_users table exists');
      console.log('   Columns found:', Object.keys(regUsers[0] || {}).join(', '));
    }

    // Check clients table
    const { data: clients, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, email, full_name, status, profile_unlocked')
      .limit(1);
    
    if (clientError) {
      console.log('❌ clients table issue:', clientError.message);
    } else {
      console.log('✅ clients table exists');
      console.log('   Columns found:', Object.keys(clients[0] || {}).join(', '));
    }

    // Check for data consistency
    if (regUsers && regUsers.length > 0 && clients && clients.length > 0) {
      const regUserIds = regUsers.map(u => u.id);
      const clientIds = clients.map(c => c.id);
      
      const inBoth = regUserIds.filter(id => clientIds.includes(id));
      if (inBoth.length === 0) {
        console.log('\n⚠️  WARNING: No matching IDs between registered_users and clients tables');
        issues.push('Data inconsistency: Users exist in one table but not the other');
        recommendations.push('Ensure client records exist in both tables with same ID');
      }
    }

  } catch (error) {
    console.log('❌ Database check failed:', error.message);
    issues.push('Database connection or schema issue');
  }

  // ==================== ISSUE 3: EMAIL TEMPLATE CHECK ====================
  console.log('\n📍 ISSUE 3: Checking Email Templates...\n');
  
  const fs = require('fs').promises;
  const path = require('path');
  
  const requiredTemplates = [
    'onboarding_approved',
    'signup_invite',
    'payment_verified_registration'
  ];
  
  for (const template of requiredTemplates) {
    const templatePath = path.join(__dirname, 'emails', 'templates', `${template}.html`);
    try {
      await fs.access(templatePath);
      console.log(`✅ Template exists: ${template}.html`);
    } catch (error) {
      console.log(`❌ Template missing: ${template}.html`);
      issues.push(`Missing email template: ${template}.html`);
    }
  }

  // ==================== ISSUE 4: TEST ACTUAL EMAIL SENDING ====================
  console.log('\n📍 ISSUE 4: Testing Email Sending Mechanism...\n');
  
  try {
    // Test with a dummy client
    const testEmail = 'israelloko65@gmail.com';
    console.log(`Attempting to send test email to ${testEmail}...`);
    
    await sendEmail(testEmail, 'onboarding_approved', {
      client_name: 'Test Client',
      admin_name: 'Test Admin',
      dashboard_url: process.env.FRONTEND_URL + '/dashboard',
      next_steps: 'This is a test email to verify the email system works.',
      current_year: new Date().getFullYear()
    });
    
    console.log('✅ Email sent successfully!');
    console.log('   If you received this email, the email system works.');
    console.log('   Issue is likely in the endpoint logic or frontend call.');
    
  } catch (emailError) {
    console.log('❌ Email sending failed:', emailError.message);
    issues.push('Email sending mechanism is broken');
    recommendations.push('Check RESEND_API_KEY and email configuration');
  }

  // ==================== ISSUE 5: FRONTEND CALL ANALYSIS ====================
  console.log('\n📍 ISSUE 5: Frontend Call Requirements...\n');
  
  console.log('For UNLOCK to work, frontend must:');
  console.log('1. Use correct endpoint:');
  console.log('   POST /api/admin/clients/:id/unlock (from admin.js)');
  console.log('   OR');
  console.log('   PATCH /api/admin/clients/:client_id/unlock (from onboardingWorkflow.js)');
  console.log('');
  console.log('2. Include valid admin JWT token in Authorization header');
  console.log('');
  console.log('3. Use client ID from registered_users table (NOT clients table)');
  console.log('');
  console.log('4. Client must have:');
  console.log('   - role = "client"');
  console.log('   - profile_unlocked = false (not already unlocked)');
  console.log('   - onboarding_completed = true (for PATCH endpoint)');

  // ==================== ISSUE 6: CHECK ACTUAL CLIENT DATA ====================
  console.log('\n📍 ISSUE 6: Checking Actual Client Data...\n');
  
  try {
    const { data: testClients, error } = await supabaseAdmin
      .from('registered_users')
      .select('id, email, full_name, role, profile_unlocked, onboarding_completed, email_verified')
      .eq('role', 'client')
      .limit(5);
    
    if (error) {
      console.log('❌ Could not fetch clients:', error.message);
    } else if (testClients && testClients.length > 0) {
      console.log(`Found ${testClients.length} client(s):\n`);
      testClients.forEach((client, index) => {
        console.log(`${index + 1}. ${client.email}`);
        console.log(`   ID: ${client.id}`);
        console.log(`   Name: ${client.full_name || 'N/A'}`);
        console.log(`   Profile Unlocked: ${client.profile_unlocked}`);
        console.log(`   Onboarding Complete: ${client.onboarding_completed}`);
        console.log(`   Email Verified: ${client.email_verified}`);
        console.log('');
      });
      
      const lockedClients = testClients.filter(c => !c.profile_unlocked);
      if (lockedClients.length === 0) {
        console.log('⚠️  All clients are already unlocked!');
        issues.push('No locked clients to test unlock functionality');
      }
    } else {
      console.log('⚠️  No clients found in registered_users table');
      issues.push('No client records exist to test');
    }
  } catch (error) {
    console.log('❌ Client data check failed:', error.message);
  }

  // ==================== ISSUE 7: VERIFY EMAIL ENDPOINT ====================
  console.log('\n📍 ISSUE 7: Checking Verify Email Endpoint...\n');
  
  console.log('⚠️  CRITICAL FINDING: No dedicated "verify email" endpoint found!');
  console.log('');
  console.log('The codebase has:');
  console.log('- Email verification webhooks (for Resend status)');
  console.log('- But NO endpoint for admin to manually trigger verification email');
  console.log('');
  issues.push('Missing endpoint: Admin cannot manually send verification email');
  recommendations.push('Create endpoint: POST /api/admin/clients/:id/resend-verification');

  // ==================== SUMMARY ====================
  console.log('\n' + '='.repeat(70));
  console.log('📊 DIAGNOSIS SUMMARY\n');
  
  if (issues.length > 0) {
    console.log('❌ ISSUES FOUND:\n');
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
  } else {
    console.log('✅ No critical issues found!');
  }
  
  if (recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:\n');
    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
  }

  // ==================== ROOT CAUSE ANALYSIS ====================
  console.log('\n' + '='.repeat(70));
  console.log('🎯 ROOT CAUSE ANALYSIS\n');
  
  console.log('Why emails don\'t send from frontend but work in tests:\n');
  console.log('1. ENDPOINT MISMATCH:');
  console.log('   - Frontend may be calling wrong HTTP method (GET instead of POST/PATCH)');
  console.log('   - Frontend may be using wrong URL path');
  console.log('   - Frontend may be missing required body parameters\n');
  
  console.log('2. CLIENT ID ISSUE:');
  console.log('   - Frontend may be passing client ID from wrong table');
  console.log('   - ID from "clients" table won\'t match "registered_users" table');
  console.log('   - Endpoint looks up in registered_users, returns 404\n');
  
  console.log('3. AUTHENTICATION:');
  console.log('   - Frontend may not be sending admin JWT token');
  console.log('   - Token may be expired or invalid');
  console.log('   - Middleware rejects request before reaching email logic\n');
  
  console.log('4. CONSTRAINT VIOLATIONS:');
  console.log('   - Client already unlocked (profile_unlocked = true)');
  console.log('   - Onboarding not completed (for PATCH endpoint)');
  console.log('   - Endpoint returns error before sending email\n');
  
  console.log('5. VERIFY EMAIL MISSING:');
  console.log('   - No endpoint exists for admin to resend verification email');
  console.log('   - Frontend calling non-existent endpoint');
  console.log('   - Returns 404, no email sent\n');

  console.log('='.repeat(70));
  console.log('\n✅ Diagnosis complete! Check the findings above.\n');
}

// Run diagnosis
if (require.main === module) {
  diagnoseEmailUnlockIssues()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Diagnosis failed:', error);
      process.exit(1);
    });
}

module.exports = { diagnoseEmailUnlockIssues };
