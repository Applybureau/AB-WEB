#!/usr/bin/env node

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

async function test() {
  console.log('🔐 Testing Payment Confirmation...\n');

  // Login first
  const loginResponse = await makeRequest('/api/auth/login', {
    method: 'POST',
    body: {
      email: TEST_EMAIL,
      password: 'admin123'
    }
  });

  if (loginResponse.status !== 200) {
    console.error('❌ Login failed');
    return;
  }

  const token = loginResponse.data.token;
  console.log('✅ Login successful\n');

  // Test payment confirmation
  console.log('Testing payment confirmation endpoint...');
  const response = await makeRequest('/api/admin/concierge/payment/confirm-and-invite', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: {
      client_email: TEST_EMAIL,
      client_name: 'Israel Loko',
      payment_amount: 500,
      payment_method: 'interac_etransfer',
      payment_reference: 'TEST-' + Date.now(),
      admin_notes: 'Test payment confirmation'
    }
  });

  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(response.data, null, 2));
}

test().catch(console.error);
