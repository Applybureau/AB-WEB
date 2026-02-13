require('dotenv').config();
const { sendEmail } = require('./utils/email');

// Sample data for testing different email templates
const testEmails = [
  {
    name: 'Admin Welcome',
    template: 'admin_welcome',
    to: 'israelloko65@gmail.com',
    variables: {
      admin_name: 'John Doe',
      admin_email: 'john@example.com',
      login_url: 'https://applybureau.com/admin/login',
      current_year: new Date().getFullYear()
    }
  },
  {
    name: 'Consultation Confirmed',
    template: 'consultation_confirmed',
    to: 'israelloko65@gmail.com',
    variables: {
      client_name: 'Jane Smith',
      consultation_date: 'Monday, March 15, 2024',
      consultation_time: '2:00 PM EST',
      meeting_link: 'https://meet.google.com/abc-defg-hij',
      current_year: new Date().getFullYear()
    }
  },
  {
    name: 'Application Update',
    template: 'application_update',
    to: 'israelloko65@gmail.com',
    variables: {
      client_name: 'Jane Smith',
      company_name: 'Tech Corp',
      position_title: 'Senior Software Engineer',
      application_status: 'interview',
      message: 'Great news! Your application has progressed to the interview stage.',
      next_steps: 'The hiring manager will contact you within 2-3 business days to schedule an interview.',
      dashboard_url: 'https://applybureau.com/dashboard',
      current_year: new Date().getFullYear()
    }
  },
  {
    name: 'Onboarding Completed',
    template: 'onboarding_completed',
    to: 'israelloko65@gmail.com',
    variables: {
      client_name: 'Jane Smith',
      dashboard_url: 'https://applybureau.com/dashboard',
      current_year: new Date().getFullYear()
    }
  },
  {
    name: 'Meeting Scheduled',
    template: 'meeting_scheduled',
    to: 'israelloko65@gmail.com',
    variables: {
      client_name: 'Jane Smith',
      meeting_date: 'Friday, March 20, 2024',
      meeting_time: '10:00 AM EST',
      meeting_link: 'https://meet.google.com/xyz-abcd-efg',
      current_year: new Date().getFullYear()
    }
  }
];

async function testSampleEmails() {
  console.log('📧 Testing Sample Email Templates\n');
  console.log('='.repeat(70));
  console.log(`Sending ${testEmails.length} test emails to: israelloko65@gmail.com\n`);
  
  const results = {
    success: [],
    failed: []
  };
  
  for (const test of testEmails) {
    try {
      console.log(`\n📤 Sending: ${test.name}`);
      console.log(`   Template: ${test.template}`);
      console.log(`   Variables: ${Object.keys(test.variables).join(', ')}`);
      
      const result = await sendEmail(test.to, test.template, test.variables);
      
      console.log(`   ✅ Sent successfully! Email ID: ${result.id}`);
      results.success.push(test.name);
      
      // Wait 2 seconds between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      results.failed.push({ name: test.name, error: error.message });
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 TEST RESULTS\n');
  console.log(`✅ Successful: ${results.success.length}/${testEmails.length}`);
  if (results.success.length > 0) {
    results.success.forEach(name => console.log(`   - ${name}`));
  }
  
  if (results.failed.length > 0) {
    console.log(`\n❌ Failed: ${results.failed.length}/${testEmails.length}`);
    results.failed.forEach(({ name, error }) => {
      console.log(`   - ${name}: ${error}`);
    });
  }
  
  console.log('\n' + '='.repeat(70));
  
  if (results.failed.length === 0) {
    console.log('\n🎉 ALL TEST EMAILS SENT SUCCESSFULLY!\n');
    console.log('📋 Next Steps:');
    console.log('   1. Check your inbox at israelloko65@gmail.com');
    console.log('   2. Verify all emails render in light mode');
    console.log('   3. Check that all variables are properly replaced');
    console.log('   4. Verify no placeholder {{variables}} are visible');
    console.log('   5. Confirm all links work correctly');
    console.log('   6. Test on mobile devices\n');
  } else {
    console.log('\n⚠️  Some emails failed to send. Check the errors above.\n');
  }
}

// Run the test
testSampleEmails().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
