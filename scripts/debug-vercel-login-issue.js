require('dotenv').config();
const axios = require('axios');

const VERCEL_URL = 'https://apply-bureau-backend.vercel.app';

async function debugLoginIssue() {
  console.log('🔍 Debugging Vercel Login Issue\n');
  console.log('='.repeat(60));

  // Test different scenarios that could cause 400 error

  // Test 1: Valid login
  console.log('\n📝 Test 1: Valid login credentials');
  try {
    const response = await axios.post(`${VERCEL_URL}/api/auth/login`, {
      email: 'admin@applybureau.com',
      password: 'Admin@123456'
    }, {
      validateStatus: () => true
    });
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }

  // Test 2: Missing email
  console.log('\n📝 Test 2: Missing email (should return 400)');
  try {
    const response = await axios.post(`${VERCEL_URL}/api/auth/login`, {
      password: 'Admin@123456'
    }, {
      validateStatus: () => true
    });
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }

  // Test 3: Missing password
  console.log('\n📝 Test 3: Missing password (should return 400)');
  try {
    const response = await axios.post(`${VERCEL_URL}/api/auth/login`, {
      email: 'admin@applybureau.com'
    }, {
      validateStatus: () => true
    });
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }

  // Test 4: Invalid email format
  console.log('\n📝 Test 4: Invalid email format (should return 400)');
  try {
    const response = await axios.post(`${VERCEL_URL}/api/auth/login`, {
      email: 'not-an-email',
      password: 'Admin@123456'
    }, {
      validateStatus: () => true
    });
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }

  // Test 5: Empty strings
  console.log('\n📝 Test 5: Empty strings (should return 400)');
  try {
    const response = await axios.post(`${VERCEL_URL}/api/auth/login`, {
      email: '',
      password: ''
    }, {
      validateStatus: () => true
    });
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }

  // Test 6: Wrong password (should return 401, not 400)
  console.log('\n📝 Test 6: Wrong password (should return 401)');
  try {
    const response = await axios.post(`${VERCEL_URL}/api/auth/login`, {
      email: 'admin@applybureau.com',
      password: 'WrongPassword123'
    }, {
      validateStatus: () => true
    });
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }

  // Test 7: Check what frontend might be sending
  console.log('\n📝 Test 7: Simulating possible frontend payload');
  const possiblePayloads = [
    { username: 'admin@applybureau.com', password: 'Admin@123456' }, // Wrong field name
    { Email: 'admin@applybureau.com', Password: 'Admin@123456' }, // Capitalized
    { email: 'admin@applybureau.com', pass: 'Admin@123456' }, // Wrong password field
  ];

  for (let i = 0; i < possiblePayloads.length; i++) {
    console.log(`\n  Payload ${i + 1}:`, JSON.stringify(possiblePayloads[i]));
    try {
      const response = await axios.post(`${VERCEL_URL}/api/auth/login`, possiblePayloads[i], {
        validateStatus: () => true
      });
      console.log('  Status:', response.status);
      console.log('  Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.error('  Error:', error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n💡 Analysis:');
  console.log('- 400 errors come from validation (missing/invalid email or password)');
  console.log('- 401 errors come from wrong credentials');
  console.log('- Check frontend is sending: { email: "...", password: "..." }');
  console.log('- Field names must be lowercase: "email" and "password"');
}

debugLoginIssue();
