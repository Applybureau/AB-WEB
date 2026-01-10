require('dotenv').config();
const { buildUrl } = require('../utils/email');

console.log('Environment variables:');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

console.log('\nTesting buildUrl function:');
console.log('buildUrl("/register"):', buildUrl('/register'));
console.log('buildUrl("register"):', buildUrl('register'));
console.log('buildUrl("/register?token=test"):', buildUrl('/register?token=test'));

// Test the exact call from the consultation route
const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
const registrationLink = buildUrl(`/register?token=${testToken}`);
console.log('Registration link:', registrationLink);

// Check if there are any hidden characters
console.log('Registration link length:', registrationLink.length);
console.log('Registration link bytes:', Buffer.from(registrationLink).toString('hex'));