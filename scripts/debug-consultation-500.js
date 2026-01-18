#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');

async function debugConsultationEndpoint() {
  console.log('🔍 Debugging Consultation Requests 500 Error\n');
  
  try {
    // Step 1: Login
    console.log('1. Logging in...');
    const loginResponse = await axios.post('https://apply-bureau-backend.vercel.app/api/auth/login', {
      email: 'admin@applybureau.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Step 2: Test consultation requests endpoint
    console.log('\n2. Testing consultation requests endpoint...');
    const response = await axios.get('https://apply-bureau-backend.vercel.app/api/consultation-requests', {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Consultation requests endpoint working');
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Error occurred:');
    console.log('Status:', error.response?.status);
    console.log('Status Text:', error.response?.statusText);
    console.log('Error Data:', JSON.stringify(error.response?.data, null, 2));
    console.log('Headers:', error.response?.headers);
    
    if (error.response?.status === 500) {
      console.log('\n🔧 This is a server-side error, not an authentication issue');
      console.log('The backend code has a bug that needs to be fixed');
    }
  }
}

debugConsultationEndpoint().catch(console.error);