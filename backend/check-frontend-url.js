// Check what FRONTEND_URL is currently being used by the server
require('dotenv').config();

console.log('\n🔍 FRONTEND_URL Configuration Check\n');
console.log('=' .repeat(60));

console.log('\n📋 Current Environment Variables:');
console.log(`   FRONTEND_URL: ${process.env.FRONTEND_URL || 'NOT SET'}`);
console.log(`   BACKEND_URL: ${process.env.BACKEND_URL || 'NOT SET'}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'NOT SET'}`);

console.log('\n✅ Expected Values:');
console.log('   FRONTEND_URL: https://applybureau.com');
console.log('   BACKEND_URL: https://jellyfish-app-t4m35.ondigitalocean.app');
console.log('   NODE_ENV: production');

console.log('\n🔗 Registration Link Example:');
const registrationToken = 'sample-token-12345';
const registrationUrl = `${process.env.FRONTEND_URL}/register?token=${registrationToken}`;
console.log(`   ${registrationUrl}`);

console.log('\n📧 Email Links Will Use:');
console.log(`   Login: ${process.env.FRONTEND_URL}/login`);
console.log(`   Dashboard: ${process.env.FRONTEND_URL}/client/dashboard`);
console.log(`   Register: ${process.env.FRONTEND_URL}/register?token=...`);

if (process.env.FRONTEND_URL === 'https://applybureau.com') {
  console.log('\n✅ FRONTEND_URL is correctly set to production domain!');
} else if (process.env.FRONTEND_URL === 'https://apply-bureau.vercel.app') {
  console.log('\n⚠️  FRONTEND_URL is still using old Vercel domain!');
  console.log('   Action Required: Restart the backend server to load new .env values');
} else {
  console.log('\n❌ FRONTEND_URL is set to an unexpected value!');
  console.log('   Please update .env file and restart server');
}

console.log('\n' + '='.repeat(60) + '\n');
