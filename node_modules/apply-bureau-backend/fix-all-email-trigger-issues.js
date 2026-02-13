const fs = require('fs').promises;
const path = require('path');

// Map of incorrect template names to correct ones
const TEMPLATE_FIXES = {
  // Contact form - using subject as template name (WRONG)
  'Thank you for contacting Apply Bureau': 'contact_form_received',
  'New Contact Form Submission': 'new_contact_submission',
  
  // Admin account
  'Admin Account Created': 'admin_welcome',
  
  // Onboarding variations - use existing templates
  'onboarding_submitted_pending_approval': 'admin_onboarding_review_needed',
  'onboarding_completed_needs_approval': 'admin_onboarding_review_needed',
  'onboarding_submitted_secure': 'admin_onboarding_review_needed',
  'admin_onboarding_review_required': 'admin_onboarding_review_needed',
  'profile_unlocked': 'onboarding_approved',
  'profile_unlocked_tracker_active': 'onboarding_approved',
  
  // Consultation variations - use existing templates
  'request_new_consultation_times': 'consultation_reschedule_request',
  'consultation_proceeding': 'consultation_confirmed',
  'consultation_completed_no_proceed': 'consultation_completed',
  'new_consultation_request_concierge': 'new_consultation_request',
  'new_times_received': 'consultation_request_received',
  'client_updated_consultation_times_concierge': 'consultation_reschedule_request',
  
  // Strategy calls - use existing templates
  'strategy_call_requested': 'consultation_request_received',
  'new_strategy_call_request': 'new_consultation_request',
  
  // Mock sessions - use meeting templates
  'mock_session_scheduled': 'meeting_scheduled',
  'new_mock_session_request': 'new_consultation_request',
  'mock_session_confirmed': 'meeting_scheduled',
  'mock_session_cancelled': 'consultation_cancelled',
  'mock_session_feedback': 'consultation_completed'
};

// Files to fix with specific replacements
const FILE_FIXES = [
  {
    file: 'controllers/leadController.js',
    replacements: [
      {
        find: "await sendEmail(lead.email, 'consultation_rejected',",
        replace: "await sendEmail(lead.email, 'profile_under_review',"
      }
    ]
  },
  {
    file: 'routes/contact.js',
    replacements: [
      {
        find: "'Thank you for contacting Apply Bureau'",
        replace: "'contact_form_received'"
      },
      {
        find: "'New Contact Form Submission'",
        replace: "'new_contact_submission'"
      }
    ]
  },
  {
    file: 'routes/auth.js',
    replacements: [
      {
        find: "'Admin Account Created'",
        replace: "'admin_welcome'"
      }
    ]
  },
  {
    file: 'routes/clientOnboarding20Q.js',
    replacements: [
      {
        find: "'onboarding_submitted_pending_approval'",
        replace: "'admin_onboarding_review_needed'"
      },
      {
        find: "'onboarding_completed_needs_approval'",
        replace: "'admin_onboarding_review_needed'"
      }
    ]
  },
  {
    file: 'routes/secureOnboarding.js',
    replacements: [
      {
        find: "'onboarding_submitted_secure'",
        replace: "'admin_onboarding_review_needed'"
      },
      {
        find: "'admin_onboarding_review_required'",
        replace: "'admin_onboarding_review_needed'"
      }
    ]
  },
  {
    file: 'routes/onboardingWorkflow.js',
    replacements: [
      {
        find: "'profile_unlocked'",
        replace: "'onboarding_approved'"
      }
    ]
  },
  {
    file: 'routes/adminConcierge.js',
    replacements: [
      {
        find: "'profile_unlocked_tracker_active'",
        replace: "'onboarding_approved'"
      }
    ]
  },
  {
    file: 'routes/adminConsultations.js',
    replacements: [
      {
        find: "'request_new_consultation_times'",
        replace: "'consultation_reschedule_request'"
      },
      {
        find: "'consultation_proceeding'",
        replace: "'consultation_confirmed'"
      },
      {
        find: "'consultation_completed_no_proceed'",
        replace: "'consultation_completed'"
      }
    ]
  },
  {
    file: 'routes/publicConsultations.js',
    replacements: [
      {
        find: "'new_consultation_request_concierge'",
        replace: "'new_consultation_request'"
      },
      {
        find: "'new_times_received'",
        replace: "'consultation_request_received'"
      },
      {
        find: "'client_updated_consultation_times_concierge'",
        replace: "'consultation_reschedule_request'"
      }
    ]
  },
  {
    file: 'routes/strategyCalls.js',
    replacements: [
      {
        find: "'strategy_call_requested'",
        replace: "'consultation_request_received'"
      },
      {
        find: "'new_strategy_call_request'",
        replace: "'new_consultation_request'"
      }
    ]
  },
  {
    file: 'routes/mockSessions.js',
    replacements: [
      {
        find: "'mock_session_scheduled'",
        replace: "'meeting_scheduled'"
      },
      {
        find: "'new_mock_session_request'",
        replace: "'new_consultation_request'"
      },
      {
        find: "'mock_session_confirmed'",
        replace: "'meeting_scheduled'"
      },
      {
        find: "'mock_session_cancelled'",
        replace: "'consultation_cancelled'"
      },
      {
        find: "'mock_session_feedback'",
        replace: "'consultation_completed'"
      }
    ]
  }
];

async function applyFixes() {
  console.log('🔧 Applying email trigger fixes...\n');
  
  let totalFixes = 0;
  let filesModified = 0;
  
  for (const fileFix of FILE_FIXES) {
    const filePath = path.join(__dirname, fileFix.file);
    
    try {
      let content = await fs.readFile(filePath, 'utf8');
      let modified = false;
      let fileFixCount = 0;
      
      for (const replacement of fileFix.replacements) {
        if (content.includes(replacement.find)) {
          content = content.replace(new RegExp(replacement.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement.replace);
          modified = true;
          fileFixCount++;
          totalFixes++;
          console.log(`✅ Fixed in ${fileFix.file}:`);
          console.log(`   ${replacement.find}`);
          console.log(`   → ${replacement.replace}\n`);
        }
      }
      
      if (modified) {
        await fs.writeFile(filePath, content, 'utf8');
        filesModified++;
        console.log(`📝 Saved ${fileFix.file} (${fileFixCount} fixes)\n`);
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`⚠️  File not found: ${fileFix.file} (skipping)\n`);
      } else {
        console.error(`❌ Error processing ${fileFix.file}:`, error.message, '\n');
      }
    }
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('✅ FIX COMPLETE\n');
  console.log(`Files modified: ${filesModified}`);
  console.log(`Total fixes applied: ${totalFixes}`);
  console.log('═'.repeat(60));
  
  // Generate summary report
  console.log('\n📋 SUMMARY OF FIXES:\n');
  console.log('1. Contact Form Emails:');
  console.log('   ✅ Fixed to use contact_form_received & new_contact_submission\n');
  
  console.log('2. Onboarding Emails:');
  console.log('   ✅ Standardized to use admin_onboarding_review_needed & onboarding_approved\n');
  
  console.log('3. Consultation Emails:');
  console.log('   ✅ Fixed to use existing consultation templates\n');
  
  console.log('4. Strategy Call Emails:');
  console.log('   ✅ Mapped to consultation templates\n');
  
  console.log('5. Mock Session Emails:');
  console.log('   ✅ Mapped to meeting and consultation templates\n');
  
  console.log('6. Admin Emails:');
  console.log('   ✅ Fixed to use admin_welcome\n');
  
  console.log('\n🎯 NEXT STEPS:\n');
  console.log('1. Test the fixed email triggers');
  console.log('2. Verify emails are sent with correct templates');
  console.log('3. Check that all email content is appropriate for context');
  console.log('4. Run: node backend/scan-and-fix-email-triggers.js to verify\n');
}

applyFixes().catch(console.error);
