#!/usr/bin/env node

/**
 * Debug Consultation Creation Issue
 * Test the specific consultation creation endpoint
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
            headers: res.headers,
            data: jsonData,
            rawData: data
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            rawData: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

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

async function debugConsultationCreation() {
  console.log('🔍 Debugging consultation creation...');
  
  try {
    const response = await makeRequest('/api/public-consultations', {
      method: 'POST',
      body: {
        full_name: 'Test User Debug',
        email: TEST_EMAIL,
        phone: '+2348012345678',
        message: 'Debug test consultation creation',
        preferred_slots: [
          { date: '2026-01-25', time: '14:00' },
          { date: '2026-01-26', time: '15:00' }
        ]
      }
    });

    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.status !== 201 && response.status !== 200) {
      console.log('❌ Consultation creation failed');
      console.log('Raw response:', response.rawData);
    } else {
      console.log('✅ Consultation creation successful');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugConsultationCreation();