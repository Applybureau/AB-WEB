#!/usr/bin/env node

/**
 * Debug Applications Creation Issue
 * Test creating applications with different client IDs
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

async function debugApplicationsCreation() {
  console.log('🔍 Debugging Applications Creation');
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
      console.log('  👤 Admin user:', response.data.user);
    } else {
      console.log('  ✗ Admin login failed');
      return;
    }
  } catch (error) {
    console.log('  ✗ Admin login error:', error.message);
    return;
  }

  // Step 2: Check available clients/users
  console.log('\n[STEP 2] Finding Available Clients');
  try {
    // Try to get clients
    const clientsResponse = await makeRequest('/api/admin/clients', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    console.log('  📊 Clients response:', clientsResponse.status);
    if (clientsResponse.status === 200) {
      console.log('  👥 Available clients:', clientsResponse.data.clients?.length || 0);
      if (clientsResponse.data.clients?.length > 0) {
        const firstClient = clientsResponse.data.clients[0];
        console.log('  🎯 First client:', {
          id: firstClient.id,
          name: firstClient.full_name,
          email: firstClient.email
        });

        // Test application creation with real client ID
        console.log('\n[STEP 3] Testing Application Creation with Real Client ID');
        const appResponse = await makeRequest('/api/applications', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${adminToken}`
          },
          body: {
            client_id: firstClient.id,
            company_name: 'Google',
            job_title: 'Senior Software Engineer',
            job_description: 'Senior role at Google',
            location: 'Remote',
            salary_range: '$150,000 - $200,000',
            admin_notes: 'Test application creation with real client'
          }
        });

        console.log('  📊 Application creation result:');
        console.log('    Status:', appResponse.status);
        if (appResponse.status === 201 || appResponse.status === 200) {
          console.log('    ✅ SUCCESS! Application created');
          console.log('    📋 Application:', appResponse.data.application);
        } else {
          console.log('    ❌ FAILED:', JSON.stringify(appResponse.data, null, 2));
        }
      } else {
        console.log('  ⚠️ No clients found - creating test user first');
        
        // Create a test user
        console.log('\n[STEP 3] Creating Test User');
        // This would require access to create user endpoint
        console.log('  ℹ️ Would need to create a test user first');
      }
    } else {
      console.log('  ❌ Failed to get clients:', JSON.stringify(clientsResponse.data, null, 2));
    }
  } catch (error) {
    console.log('  ✗ Error:', error.message);
  }

  // Step 4: Test with admin user ID as fallback
  console.log('\n[STEP 4] Testing with Admin User ID as Fallback');
  try {
    const appResponse = await makeRequest('/api/applications', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      body: {
        client_id: 'admin-test-id', // Use a test ID
        company_name: 'Microsoft',
        job_title: 'Principal Engineer',
        job_description: 'Principal role at Microsoft',
        location: 'Remote',
        salary_range: '$200,000 - $250,000',
        admin_notes: 'Test application creation with test ID'
      }
    });

    console.log('  📊 Application creation result (test ID):');
    console.log('    Status:', appResponse.status);
    console.log('    Response:', JSON.stringify(appResponse.data, null, 2));
  } catch (error) {
    console.log('  ✗ Error:', error.message);
  }

  console.log('\n🔍 Debug complete');
}

debugApplicationsCreation().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});