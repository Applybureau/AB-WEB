require('dotenv').config();
const { sendEmail } = require('./utils/email');

async function testFixedRegistrationEmail() {
  console.log('📧 Testing Fixed Registration Email\n');

  try {
    const result = await sendEmail('israelloko65@gmail.com', 'payment_verified_registration', {
      client_name: 'Israel Test',
      login_url: 'https://www.applybureau.com/login',
      email: 'israelloko65@gmail.com',
      temp_password: 'IsraelTest2024!',
      dashboard_url: 'https://www.applybureau.com/dashboard'
    });

    console.log('✅ Email sent successfully!');
    console.log('   Email ID:', result.id);
    console.log('   To:', result.to);
    console.log('   Subject:', result.subject);
    console.log('\n📋 Email should now have:');
    console.log('   ✅ No {{payment_amount}} placeholder');
    console.log('   ✅ No {{payment_method}} placeholder');
    console.log('   ✅ No {{package_tier}} placeholder');
    console.log('   ✅ No {{admin_name}} placeholder');
    console.log('   ✅ No {{token_expiry}} placeholder');
    console.log('   ✅ No {{current_year}} placeholder');
    console.log('   ✅ Proper clickable button (not text)');
    console.log('   ✅ Login credentials displayed');
    console.log('\n✅ Check your email at israelloko65@gmail.com');

  } catch (error) {
    console.error('❌ Error sending email:', error);
    process.exit(1);
  }
}

testFixedRegistrationEmail();
