#!/usr/bin/env node

/**
 * Debug Consultation Slots Structure
 * Check the actual structure of preferred_slots in consultation_requests
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

async function debugConsultationSlots() {
  console.log('🔍 Debugging Consultation Slots Structure');
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

  // Step 2: Get consultation requests and examine structure
  console.log('\n[STEP 2] Examining Consultation Requests Structure');
  try {
    const response = await makeRequest('/api/admin/concierge/consultations?admin_status=pending', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (response.status === 200 && response.data.consultations?.length > 0) {
      const consultation = response.data.consultations[0];
      console.log('  ✓ Found consultation:', consultation.id);
      console.log('  📋 Full consultation data:');
      console.log(JSON.stringify(consultation, null, 2));
      console.log('');
      console.log('  🎯 Preferred slots structure:');
      console.log('    Type:', typeof consultation.preferred_slots);
      console.log('    Is Array:', Array.isArray(consultation.preferred_slots));
      console.log('    Length:', consultation.preferred_slots?.length || 'N/A');
      console.log('    Content:', JSON.stringify(consultation.preferred_slots, null, 2));
      
      if (consultation.preferred_slots && Array.isArray(consultation.preferred_slots)) {
        consultation.preferred_slots.forEach((slot, index) => {
          console.log(`    Slot ${index}:`, JSON.stringify(slot, null, 2));
        });
      }
    } else {
      console.log('  ⚠️ No pending consultations found');
      console.log('  Response:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.log('  ✗ Error:', error.message);
  }

  console.log('\n🔍 Debug complete');
}

debugConsultationSlots().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});