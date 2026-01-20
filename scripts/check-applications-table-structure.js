#!/usr/bin/env node

/**
 * Check Applications Table Structure
 * Query the actual table to see what columns exist
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

async function checkApplicationsTable() {
  console.log('🔍 Checking Applications Table Structure');
  console.log('');

  let adminToken = null;

  // Step 1: Get admin token
  console.log('[STEP 1] Getting Admin Token');
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
      console.log('  ✓ Admin login successful');
    } else {
      console.log('  ✗ Admin login failed');
      return;
    }
  } catch (error) {
    console.log('  ✗ Admin login error:', error.message);
    return;
  }

  // Step 2: Try to get existing applications to see structure
  console.log('\n[STEP 2] Checking Existing Applications Structure');
  try {
    const response = await makeRequest('/api/applications', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    console.log('  📊 Applications response:', response.status);
    if (response.status === 200) {
      console.log('  📋 Applications found:', response.data.applications?.length || 0);
      if (response.data.applications?.length > 0) {
        const firstApp = response.data.applications[0];
        console.log('  🔍 First application structure:');
        console.log(JSON.stringify(firstApp, null, 2));
        console.log('');
        console.log('  📝 Available columns:');
        Object.keys(firstApp).forEach(key => {
          console.log(`    - ${key}: ${typeof firstApp[key]}`);
        });
      } else {
        console.log('  ⚠️ No applications found to examine structure');
      }
    } else {
      console.log('  ❌ Failed to get applications:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.log('  ✗ Error:', error.message);
  }

  console.log('\n🔍 Check complete');
}

checkApplicationsTable().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});