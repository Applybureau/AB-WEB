#!/usr/bin/env node

/**
 * Create Test Consultation with Proper Time Slots
 * This will create a consultation request with valid preferred_slots for testing
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

async function createTestConsultation() {
  console.log('🎯 Creating Test Consultation with Time Slots');
  console.log('');

  // Create consultation with proper time slots
  console.log('[STEP 1] Creating Consultation Request with Time Slots');
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    const dayAfterThat = new Date();
    dayAfterThat.setDate(dayAfterThat.getDate() + 3);

    const response = await makeRequest('/api/public-consultations', {
      method: 'POST',
      body: {
        full_name: 'Test User With Slots',
        name: 'Test User With Slots',
        email: 'test-slots@example.com',
        phone: '+1234567890',
        role_targets: 'Software Engineer, Senior Developer',
        package_interest: 'Tier 2',
        employment_status: 'Currently Employed',
        area_of_concern: 'Need help with interview preparation',
        consultation_window: 'Weekday evenings',
        country: 'Nigeria',
        linkedin_url: 'https://linkedin.com/in/testuser',
        preferred_slots: [
          {
            date: tomorrow.toISOString().split('T')[0],
            time: '14:00',
            timezone: 'WAT'
          },
          {
            date: dayAfter.toISOString().split('T')[0],
            time: '15:00',
            timezone: 'WAT'
          },
          {
            date: dayAfterThat.toISOString().split('T')[0],
            time: '16:00',
            timezone: 'WAT'
          }
        ]
      }
    });

    if (response.status === 201 || response.status === 200) {
      console.log('  ✓ Consultation created successfully');
      console.log('  📋 Consultation ID:', response.data.id);
      console.log('  🎯 Time slots:', JSON.stringify(response.data.preferred_slots || [], null, 2));
      
      // Now test the confirmation
      console.log('\n[STEP 2] Testing Consultation Confirmation');
      
      // Get admin token
      const loginResponse = await makeRequest('/api/auth/login', {
        method: 'POST',
        body: {
          email: TEST_EMAIL,
          password: 'admin123'
        }
      });

      if (loginResponse.status === 200 && loginResponse.data.token) {
        const adminToken = loginResponse.data.token;
        console.log('  ✓ Admin login successful');

        // Test confirmation
        const confirmResponse = await makeRequest(`/api/admin/concierge/consultations/${response.data.id}/confirm`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${adminToken}`
          },
          body: {
            selected_slot_index: 0,
            meeting_details: 'Test meeting with proper slots',
            meeting_link: 'https://meet.google.com/test-slots',
            admin_notes: 'Test confirmation with valid time slots'
          }
        });

        console.log('  📊 Confirmation result:');
        console.log('    Status:', confirmResponse.status);
        if (confirmResponse.status === 200) {
          console.log('    ✅ SUCCESS! Consultation confirmed');
          console.log('    📅 Confirmed time:', confirmResponse.data.confirmed_time);
        } else {
          console.log('    ❌ FAILED:', JSON.stringify(confirmResponse.data, null, 2));
        }
      } else {
        console.log('  ✗ Admin login failed');
      }
    } else {
      console.log('  ✗ Failed to create consultation');
      console.log('  📊 Response:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.log('  ✗ Error:', error.message);
  }

  console.log('\n🎯 Test complete');
}

createTestConsultation().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});