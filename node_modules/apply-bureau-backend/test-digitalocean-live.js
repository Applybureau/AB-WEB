#!/usr/bin/env node

/**
 * DigitalOcean Live Deployment Test
 * Tests the actual deployed application for functionality and CORS
 */

const https = require('https');
const http = require('http');

const BACKEND_URL = 'https://jellyfish-app-t4m35.ondigitalocean.app';

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DigitalOcean-Test-Script/1.0',
        'Origin': 'https://apply-bureau.vercel.app', // Test CORS
        ...options.headers
      }
    };

    const req = https.request(url, requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data,
          url: url
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testEndpoint(name, path, options = {}) {
  const url = `${BACKEND_URL}${path}`;
  
  try {
    console.log(`\n🧪 Testing ${name}...`);
    console.log(`   URL: ${url}`);
    
    const response = await makeRequest(url, options);
    
    // Check status
    const statusOk = response.status >= 200 && response.status < 300;
    console.log(`   Status: ${response.status} ${statusOk ? '✅' : '❌'}`);
    
    // Check CORS headers
    const corsHeaders = {
      'access-control-allow-origin': response.headers['access-control-allow-origin'],
      'access-control-allow-methods': response.headers['access-control-allow-methods'],
      'access-control-allow-headers': response.headers['access-control-allow-headers'],
      'access-control-allow-credentials': response.headers['access-control-allow-credentials']
    };
    
    console.log('   CORS Headers:');
    Object.entries(corsHeaders).forEach(([header, value]) => {
      if (value) {
        console.log(`     ✅ ${header}: ${value}`);
      } else {
        console.log(`     ❌ ${header}: Missing`);
      }
    });
    
    // Try to parse response
    let parsedData = null;
    try {
      parsedData = JSON.parse(response.data);
      console.log('   Response: Valid JSON ✅');
      
      // Show key response fields
      if (parsedData.service) {
        console.log(`   Service: ${parsedData.service} ✅`);
      }
      if (parsedData.status) {
        console.log(`   Health Status: ${parsedData.status} ✅`);
      }
      if (parsedData.error) {
        console.log(`   Error: ${parsedData.error} ❌`);
      }
    } catch (parseError) {
      console.log('   Response: Not JSON (might be HTML/text)');
      console.log(`   Content: ${response.data.substring(0, 200)}...`);
    }
    
    return {
      success: statusOk,
      status: response.status,
      corsEnabled: !!corsHeaders['access-control-allow-origin'],
      data: parsedData,
      rawResponse: response
    };
    
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

async function testCORSPreflight(path) {
  const url = `${BACKEND_URL}${path}`;
  
  try {
    console.log(`\n🔍 Testing CORS Preflight for ${path}...`);
    
    const response = await makeRequest(url, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://apply-bureau.vercel.app',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });
    
    const corsOk = response.status === 200 || response.status === 204;
    console.log(`   Preflight Status: ${response.status} ${corsOk ? '✅' : '❌'}`);
    
    const allowOrigin = response.headers['access-control-allow-origin'];
    const allowMethods = response.headers['access-control-allow-methods'];
    const allowHeaders = response.headers['access-control-allow-headers'];
    
    console.log(`   Allow-Origin: ${allowOrigin || 'Missing'} ${allowOrigin ? '✅' : '❌'}`);
    console.log(`   Allow-Methods: ${allowMethods || 'Missing'} ${allowMethods ? '✅' : '❌'}`);
    console.log(`   Allow-Headers: ${allowHeaders || 'Missing'} ${allowHeaders ? '✅' : '❌'}`);
    
    return corsOk && allowOrigin && allowMethods;
    
  } catch (error) {
    console.log(`   ❌ CORS Preflight ERROR: ${error.message}`);
    return false;
  }
}

async function runDeploymentTests() {
  console.log('🚀 DigitalOcean Live Deployment Test');
  console.log(`🌐 Testing: ${BACKEND_URL}`);
  console.log('=' .repeat(60));
  
  const tests = [
    {
      name: 'Health Check',
      path: '/health',
      critical: true
    },
    {
      name: 'API Health Check',
      path: '/api/health',
      critical: true
    },
    {
      name: 'Auth Login Endpoint',
      path: '/api/auth/login',
      method: 'POST',
      body: { email: 'test@example.com', password: 'test' },
      expectedStatus: 400 // Should return 400 for invalid credentials
    },
    {
      name: 'Public Consultations',
      path: '/api/public-consultations',
      method: 'GET'
    },
    {
      name: 'Contact Form',
      path: '/api/contact',
      method: 'POST',
      body: { 
        fName: 'Test',
        lName: 'User',
        email: 'test@example.com',
        message: 'Test message'
      }
    }
  ];
  
  const results = [];
  
  // Test main endpoints
  for (const test of tests) {
    const result = await testEndpoint(
      test.name,
      test.path,
      {
        method: test.method,
        body: test.body
      }
    );
    
    results.push({
      ...test,
      ...result
    });
  }
  
  // Test CORS preflight
  console.log('\n' + '='.repeat(60));
  console.log('🔍 CORS PREFLIGHT TESTS');
  
  const corsTests = [
    '/api/auth/login',
    '/api/contact',
    '/api/public-consultations'
  ];
  
  const corsResults = [];
  for (const path of corsTests) {
    const corsOk = await testCORSPreflight(path);
    corsResults.push({ path, success: corsOk });
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 TEST SUMMARY');
  
  const criticalTests = results.filter(r => r.critical);
  const criticalPassed = criticalTests.filter(r => r.success).length;
  const totalPassed = results.filter(r => r.success).length;
  const corsPassedCount = corsResults.filter(r => r.success).length;
  
  console.log(`\n🎯 CRITICAL TESTS: ${criticalPassed}/${criticalTests.length} passed`);
  criticalTests.forEach(test => {
    console.log(`   ${test.success ? '✅' : '❌'} ${test.name}: ${test.status || 'ERROR'}`);
  });
  
  console.log(`\n📊 ALL TESTS: ${totalPassed}/${results.length} passed`);
  results.forEach(test => {
    console.log(`   ${test.success ? '✅' : '❌'} ${test.name}: ${test.status || 'ERROR'}`);
  });
  
  console.log(`\n🌐 CORS TESTS: ${corsPassedCount}/${corsResults.length} passed`);
  corsResults.forEach(test => {
    console.log(`   ${test.success ? '✅' : '❌'} ${test.path}`);
  });
  
  // Overall status
  const overallSuccess = criticalPassed === criticalTests.length && corsPassedCount > 0;
  
  console.log('\n' + '='.repeat(60));
  if (overallSuccess) {
    console.log('🎉 DEPLOYMENT STATUS: SUCCESS');
    console.log('✅ DigitalOcean deployment is working correctly');
    console.log('✅ CORS is properly configured');
    console.log('✅ Critical endpoints are responding');
  } else {
    console.log('❌ DEPLOYMENT STATUS: ISSUES FOUND');
    if (criticalPassed < criticalTests.length) {
      console.log('❌ Critical health checks failing');
    }
    if (corsPassedCount === 0) {
      console.log('❌ CORS not working properly');
    }
  }
  
  console.log(`\n🔗 Deployment URL: ${BACKEND_URL}`);
  console.log('📖 Check logs in DigitalOcean dashboard if issues persist');
  
  return overallSuccess;
}

// Run tests if called directly
if (require.main === module) {
  runDeploymentTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner error:', error);
      process.exit(1);
    });
}

module.exports = { runDeploymentTests, testEndpoint, testCORSPreflight };