require('dotenv').config();
const jwt = require('jsonwebtoken');
const { buildUrl } = require('../utils/email');

console.log('🧪 Testing Registration Link Generation');
console.log('=====================================');

// Simulate the exact process from the consultation approval
const consultationId = 'test-consultation-id';
const registrationToken = jwt.sign({
  consultationId: consultationId,
  email: '',
  type: 'client_registration',
  exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
}, process.env.JWT_SECRET);

console.log('Generated token:', registrationToken);

// Generate the registration link exactly as done in the route
const registrationLink = buildUrl(`/register?token=${registrationToken}`);

console.log('Generated registration link:', registrationLink);
console.log('Link length:', registrationLink.length);

// Check for any issues
if (registrationLink.includes('//register')) {
  console.log('❌ ISSUE FOUND: Double slash in URL!');
} else {
  console.log('✅ URL looks correct');
}

// Test URL parsing
try {
  const url = new URL(registrationLink);
  console.log('URL components:');
  console.log('  Protocol:', url.protocol);
  console.log('  Host:', url.host);
  console.log('  Pathname:', url.pathname);
  console.log('  Search:', url.search);
} catch (error) {
  console.log('❌ Invalid URL:', error.message);
}

// Test token decoding
try {
  const decoded = jwt.verify(registrationToken, process.env.JWT_SECRET);
  console.log('Token decoded successfully:', decoded);
} catch (error) {
  console.log('❌ Token verification failed:', error.message);
}