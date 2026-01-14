#!/usr/bin/env node

/**
 * Detailed Admin Features Test
 * Shows actual error messages from the API
 */

const https = require('https');

const BASE_URL = 'https://apply-bureau-backend.vercel.app';
const TEST_EMAIL = 'israelloko65@gmail.com';

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: 30000
    };

    const req = https.request(url, requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testAdminFeatures() {
  console.log('🔐 Testing Admin Features...\n');

  // Step 1: Login
  console.log('1. Admin Login...');
  const loginResponse = await makeRequest('/api/auth/login', {
    method: 'POST',
    body: {
      email: TEST_EMAIL,
      password: 'admin123'
    }
  });

  if (loginResponse.status !== 200) {
    console.error('❌ Login failed:', loginResponse.data);
    return;
  }

  const token = loginResponse.data.token;
  console.log('✅ Login successful');
  console.log('   Token:', token.substring(0, 20) + '...');
  console.log('   User:', loginResponse.data.user);
  console.log('');

  // Step 2: Dashboard Stats
  console.log('2. Dashboard Stats...');
  const statsResponse = await makeRequest('/api/admin/dashboard/stats', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  console.log('   Status:', statsResponse.status);
  console.log('   Response:', JSON.stringify(statsResponse.data, null, 2));
  console.log('');

  // Step 3: Consultation Requests
  console.log('3. Consultation Requests...');
  const requestsResponse = await makeRequest('/api/admin/concierge/requests?status=pending', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  console.log('   Status:', requestsResponse.status);
  console.log('   Response:', JSON.stringify(requestsResponse.data, null, 2));
  console.log('');

  // Step 4: Applications List
  console.log('4. Applications List...');
  const appsResponse = await makeRequest('/api/applications', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  console.log('   Status:', appsResponse.status);
  console.log('   Response:', JSON.stringify(appsResponse.data, null, 2));
  console.log('');
}

testAdminFeatures().catch(console.error);
