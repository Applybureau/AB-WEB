#!/usr/bin/env node

/**
 * Test Applications Creation with Admin User ID
 * Use the admin's own user ID to test applications creation
 */

const https = require('https');

const BASE_URL = 'https://apply-bureau-backend.vercel.app';
const TEST_EMAIL = 'israelloko65@gmail.com';

// Helper function to make HTTP requests
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

async function testApplicationsWithAdminId() {
  console.log('🎯 Testing Applications with Admin User ID');
  console.log('');

  let adminToken = null;
  let adminUserId = null;

  // Step 1: Get admin token and user ID
  console.log('[STEP 1] Getting Admin Token and User ID');
  try {
    const response = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: {
        email: TEST_EMAIL,
        password: 'admin123'
      }
    });

    if (response.status === 200 && response.data.token) {
      adminToken = response.data.token;
      adminUserId = response.data.user.id;
      console.log('  ✓ Admin login successful');
      console.log('  👤 Admin User ID:', adminUserId);
    } else {
      console.log('  ✗ Admin login failed');
      return;
    }
  } catch (error) {
    console.log('  ✗ Admin login error:', error.message);
    return;
  }

  // Step 2: Test application creation with admin's own user ID
  console.log('\n[STEP 2] Creating Application with Admin User ID');
  try {
    const appResponse = await makeRequest('/api/applications', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      body: {
        client_id: adminUserId, // Use admin's own user ID
        company_name: 'Apple',
        job_title: 'Senior iOS Engineer',
        job_description: 'Senior iOS development role at Apple',
        location: 'Cupertino, CA',
        salary_range: '$180,000 - $220,000',
        admin_notes: 'Test application creation with valid user ID'
      }
    });

    console.log('  📊 Application creation result:');
    console.log('    Status:', appResponse.status);
    if (appResponse.status === 201 || appResponse.status === 200) {
      console.log('    ✅ SUCCESS! Application created');
      console.log('    📋 Application ID:', appResponse.data.application?.id);
      console.log('    📋 Application details:', JSON.stringify(appResponse.data.application, null, 2));
    } else {
      console.log('    ❌ FAILED:', JSON.stringify(appResponse.data, null, 2));
    }
  } catch (error) {
    console.log('  ✗ Error:', error.message);
  }

  // Step 3: Test getting applications list
  console.log('\n[STEP 3] Testing Applications List');
  try {
    const listResponse = await makeRequest('/api/applications', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    console.log('  📊 Applications list result:');
    console.log('    Status:', listResponse.status);
    if (listResponse.status === 200) {
      console.log('    ✅ SUCCESS! Applications retrieved');
      console.log('    📋 Applications found:', listResponse.data.applications?.length || 0);
      if (listResponse.data.applications?.length > 0) {
        console.log('    📋 First application:', JSON.stringify(listResponse.data.applications[0], null, 2));
      }
    } else {
      console.log('    ❌ FAILED:', JSON.stringify(listResponse.data, null, 2));
    }
  } catch (error) {
    console.log('  ✗ Error:', error.message);
  }

  console.log('\n🎯 Test complete');
}

testApplicationsWithAdminId().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});