#!/usr/bin/env node

// DigitalOcean Deployment Verification Script
const http = require('http');

async function verifyDeployment() {
  console.log('🔍 Verifying DigitalOcean deployment...');
  
  const checks = [
    {
      name: 'Health Endpoint',
      url: '/health',
      expected: 200
    },
    {
      name: 'API Health Endpoint', 
      url: '/api/health',
      expected: 200
    },
    {
      name: 'Admin Login Endpoint',
      url: '/api/auth/login',
      method: 'POST',
      expected: 400 // Should return 400 for missing credentials
    }
  ];
  
  const baseUrl = process.env.BACKEND_URL || 'https://apply-bureau-backend-production.ondigitalocean.app';
  
  for (const check of checks) {
    try {
      console.log(`\nTesting ${check.name}...`);
      
      const options = {
        method: check.method || 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      const response = await fetch(`${baseUrl}${check.url}`, options);
      
      if (response.status === check.expected) {
        console.log(`✅ ${check.name}: PASSED (${response.status})`);
      } else {
        console.log(`❌ ${check.name}: FAILED (${response.status}, expected ${check.expected})`);
      }
      
    } catch (error) {
      console.log(`❌ ${check.name}: ERROR - ${error.message}`);
    }
  }
  
  console.log('\n🎯 Deployment verification completed!');
}

verifyDeployment();
