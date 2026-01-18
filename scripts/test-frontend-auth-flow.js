#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');

const BACKEND_URL = 'https://apply-bureau-backend.vercel.app';

async function testFrontendAuthFlow() {
  console.log('🔄 Testing Complete Frontend Authentication Flow\n');
  
  // Step 1: Test login with correct credentials (you'll need to update these)
  console.log('1. Testing Login Flow:');
  console.log('   📝 Frontend should use these exact credentials:');
  console.log('   Email: admin@applybureau.com');
  console.log('   Password: [Check your admin password in database]');
  console.log('');
  
  // Step 2: Show exact request format
  console.log('2. Exact Login Request Format:');
  console.log(`
const loginResponse = await fetch('${BACKEND_URL}/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'admin@applybureau.com',
    password: 'your_actual_password'
  })
});

const loginData = await loginResponse.json();
console.log('Login response:', loginData);

// Store token
localStorage.setItem('authToken', loginData.token);
  `);
  
  // Step 3: Show exact authenticated request format
  console.log('3. Exact Authenticated Request Format:');
  console.log(`
const token = localStorage.getItem('authToken');

const contactsResponse = await fetch('${BACKEND_URL}/api/contact', {
  method: 'GET',
  headers: {
    'Authorization': \`Bearer \${token}\`,
    'Content-Type': 'application/json',
  }
});

const contactsData = await contactsResponse.json();
console.log('Contacts data:', contactsData);
  `);
  
  // Step 4: Test with a working token (if we can get one)
  console.log('4. Testing Auth Middleware:');
  try {
    // Test without token
    await axios.get(`${BACKEND_URL}/api/contact`);
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('✅ Auth middleware working - correctly blocks unauthenticated requests');
    } else {
      console.log(`❌ Unexpected response: ${error.response?.status}`);
    }
  }
  
  console.log('\n5. Frontend Implementation Checklist:');
  console.log('   ✅ Use exact URL: https://apply-bureau-backend.vercel.app');
  console.log('   ✅ Include Content-Type: application/json');
  console.log('   ✅ Use Authorization: Bearer <token> format');
  console.log('   ✅ Handle 401 responses by redirecting to login');
  console.log('   ✅ Store token in localStorage after successful login');
  
  console.log('\n6. Common Frontend Mistakes to Avoid:');
  console.log('   ❌ Missing "Bearer " prefix in Authorization header');
  console.log('   ❌ Not including Content-Type header');
  console.log('   ❌ Using wrong backend URL');
  console.log('   ❌ Not handling token expiration');
  console.log('   ❌ Not storing token after login');
  
  console.log('\n7. Debug Steps for Frontend:');
  console.log('   1. Check browser Network tab for request headers');
  console.log('   2. Verify token is stored in localStorage');
  console.log('   3. Check if Authorization header is present');
  console.log('   4. Verify token format starts with "Bearer "');
  console.log('   5. Check for CORS errors in console');
  
  console.log('\n🎯 Next Steps:');
  console.log('   1. Update frontend login credentials');
  console.log('   2. Implement exact request format shown above');
  console.log('   3. Test login flow in browser dev tools');
  console.log('   4. Verify token storage and usage');
  console.log('   5. Test authenticated requests');
}

testFrontendAuthFlow().catch(console.error);