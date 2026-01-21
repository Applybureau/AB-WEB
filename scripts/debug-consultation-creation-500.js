#!/usr/bin/env node

/**
 * Debug Consultation Creation 500 Error
 */

const https = require('https');

const BASE_URL = 'https://apply-bureau-backend.vercel.app';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

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
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║           DEBUG: CONSULTATION CREATION 500 ERROR         ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log('');

  // Test different consultation payloads
  const testCases = [
    {
      name: "Minimal consultation",
      payload: {
        full_name: "Debug Test User",
        email: "debug@example.com",
        phone: "+1234567890"
      }
    },
    {
      name: "Consultation with message",
      payload: {
        full_name: "Debug Test User",
        email: "debug@example.com",
        phone: "+1234567890",
        message: "I need help with interview preparation."
      }
    },
    {
      name: "Consultation with time slots",
      payload: {
        full_name: "Debug Test User",
        email: "debug@example.com",
        phone: "+1234567890",
        message: "I need help with interview preparation.",
        preferred_slots: [
          {
            date: "2026-01-25",
            time: "14:00"
          }
        ]
      }
    },
    {
      name: "Full consultation request",
      payload: {
        full_name: "Debug Test User",
        email: "debug@example.com",
        phone: "+1234567890",
        message: "I need help with interview preparation for senior software engineer roles.",
        preferred_slots: [
          {
            date: "2026-01-25",
            time: "14:00"
          },
          {
            date: "2026-01-26",
            time: "15:00"
          },
          {
            date: "2026-01-27",
            time: "16:00"
          }
        ]
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n${colors.yellow}Testing: ${testCase.name}${colors.reset}`);
    console.log(`Payload: ${JSON.stringify(testCase.payload, null, 2)}`);
    
    try {
      const response = await makeRequest('/api/public-consultations', {
        method: 'POST',
        body: testCase.payload
      });

      console.log(`Status: ${response.status}`);
      
      if (response.status === 201) {
        console.log(`${colors.green}✓ Success${colors.reset}`);
        console.log(`Response: ${JSON.stringify(response.data, null, 2)}`);
      } else {
        console.log(`${colors.red}✗ Failed${colors.reset}`);
        console.log(`Response: ${JSON.stringify(response.data, null, 2)}`);
        console.log(`Raw response: ${response.rawData}`);
      }
    } catch (error) {
      console.log(`${colors.red}✗ Error: ${error.message}${colors.reset}`);
    }
  }

  // Test alternative endpoints
  console.log(`\n${colors.yellow}Testing alternative consultation endpoints:${colors.reset}`);
  
  const alternativeEndpoints = [
    '/api/consultation-requests',
    '/api/consultations'
  ];

  for (const endpoint of alternativeEndpoints) {
    console.log(`\n${colors.cyan}Testing ${endpoint}${colors.reset}`);
    
    try {
      const response = await makeRequest(endpoint, {
        method: 'POST',
        body: {
          full_name: "Debug Test User",
          email: "debug@example.com",
          phone: "+1234567890",
          message: "Test consultation request"
        }
      });

      console.log(`Status: ${response.status}`);
      
      if (response.status === 201) {
        console.log(`${colors.green}✓ Success${colors.reset}`);
      } else {
        console.log(`${colors.red}✗ Failed${colors.reset}`);
        console.log(`Response: ${JSON.stringify(response.data, null, 2)}`);
      }
    } catch (error) {
      console.log(`${colors.red}✗ Error: ${error.message}${colors.reset}`);
    }
  }
}

debugConsultationCreation().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});