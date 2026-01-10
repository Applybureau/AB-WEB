// Load environment variables
require('dotenv').config();

const { buildUrl } = require('./utils/email');

console.log('🔗 Testing Registration Link Generation...');

// Test the buildUrl function
const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';

console.log('Environment FRONTEND_URL:', process.env.FRONTEND_URL);

const registrationLink = buildUrl(`/register?token=${testToken}`);
console.log('Generated registration link:', registrationLink);

// Test various URL scenarios
const testUrls = [
  '/register',
  'register',
  '/dashboard',
  'dashboard',
  '/admin/consultations',
  'admin/consultations'
];

console.log('\n📋 Testing various URL constructions:');
testUrls.forEach(url => {
  console.log(`${url} -> ${buildUrl(url)}`);
});

console.log('\n✅ URL generation test completed!');