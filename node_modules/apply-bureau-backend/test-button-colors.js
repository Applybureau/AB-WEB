const { sendEmail } = require('./utils/email');

async function testButtonColors() {
  console.log('🧪 Testing button colors in email templates...\n');
  
  try {
    // Test consultation confirmed email (has buttons)
    console.log('📧 Sending consultation_confirmed test email...');
    const result = await sendEmail('applybureau@gmail.com', 'consultation_confirmed', {
      client_name: 'Test User',
      consultation_date: 'Friday, March 15, 2024',
      consultation_time: '10:00 AM EST',
      meeting_link: 'https://meet.google.com/test-meeting',
      is_whatsapp_call: false,
      is_video_call: true,
      meeting_details: 'Your consultation has been confirmed.',
      current_year: new Date().getFullYear()
    });
    
    console.log('✅ Email sent successfully:', result);
    console.log('\n📬 Check applybureau@gmail.com for the test email');
    console.log('🔍 Verify that buttons have:');
    console.log('   • Teal background (#0d9488)');
    console.log('   • White text (#ffffff)');
    
  } catch (error) {
    console.error('❌ Error sending test email:', error);
  }
}

testButtonColors();