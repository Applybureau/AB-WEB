const { sendEmail } = require('../utils/email');

async function testEmailTemplate() {
  try {
    console.log('Testing consultation_scheduled email template...');
    
    // Test data that matches what the backend sends
    const testData = {
      client_name: 'John Doe',
      scheduled_date: 'January 15, 2026',
      scheduled_time: '2:00 PM EST',
      meeting_url: 'https://meet.google.com/abc-defg-hij',
      package_interest: 'TIER 2 — Accelerated Application Support',
      role_targets: 'Senior Software Engineer',
      meeting_details: 'We look forward to discussing your career goals.'
    };

    const result = await sendEmail('test@example.com', 'consultation_scheduled', testData);
    console.log('✅ Email sent successfully:', result);
    
    console.log('\nTesting consultation_approved email template...');
    
    const approvedData = {
      client_name: 'Jane Smith',
      consultation_type: 'Career Strategy Session',
      scheduled_date: 'January 20, 2026',
      scheduled_time: '10:00 AM EST'
    };

    const result2 = await sendEmail('test2@example.com', 'consultation_approved', approvedData);
    console.log('✅ Approved email sent successfully:', result2);
    
  } catch (error) {
    console.error('❌ Email test failed:', error);
  }
}

testEmailTemplate();