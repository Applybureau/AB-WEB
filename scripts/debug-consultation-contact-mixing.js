#!/usr/bin/env node

/**
 * Debug Consultation vs Contact Data Mixing
 * Check if consultation endpoints are returning contact data
 */

const https = require('https');

const BASE_URL = 'https://apply-bureau-backend.vercel.app';
const TEST_EMAIL = 'israelloko65@gmail.com';

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

async function debugConsultationContactMixing() {
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║        DEBUG: CONSULTATION vs CONTACT DATA MIXING        ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log('');

  let adminToken = null;

  // Step 1: Get admin token
  console.log(`${colors.yellow}[STEP 1] Getting Admin Token${colors.reset}`);
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
      console.log(`  ${colors.green}✓ Admin login successful${colors.reset}`);
    } else {
      console.log(`  ${colors.red}✗ Admin login failed: ${response.status}${colors.reset}`);
      return;
    }
  } catch (error) {
    console.log(`  ${colors.red}✗ Admin login error: ${error.message}${colors.reset}`);
    return;
  }

  // Step 2: Test consultation endpoint and analyze data
  console.log(`\n${colors.yellow}[STEP 2] Testing Consultation Endpoint Data${colors.reset}`);
  try {
    const response = await makeRequest('/api/admin/concierge/consultations', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    console.log(`  Status: ${response.status}`);
    
    if (response.status === 200) {
      const consultations = response.data.consultations || [];
      console.log(`  ${colors.cyan}Found ${consultations.length} records${colors.reset}`);
      
      if (consultations.length > 0) {
        const sample = consultations[0];
        console.log(`\n  ${colors.magenta}SAMPLE RECORD ANALYSIS:${colors.reset}`);
        console.log(`  ${colors.cyan}All fields: ${Object.keys(sample).join(', ')}${colors.reset}`);
        
        // Check if this looks like contact data or consultation data
        const hasContactFields = sample.hasOwnProperty('subject') || sample.hasOwnProperty('company');
        const hasConsultationFields = sample.hasOwnProperty('prospect_name') || sample.hasOwnProperty('preferred_slots');
        
        console.log(`\n  ${colors.magenta}DATA TYPE ANALYSIS:${colors.reset}`);
        console.log(`  Has contact fields (subject, company): ${hasContactFields ? colors.red + 'YES' + colors.reset : colors.green + 'NO' + colors.reset}`);
        console.log(`  Has consultation fields (prospect_name, preferred_slots): ${hasConsultationFields ? colors.green + 'YES' + colors.reset : colors.red + 'NO' + colors.reset}`);
        
        if (hasContactFields && !hasConsultationFields) {
          console.log(`  ${colors.red}❌ ISSUE: Consultation endpoint is returning CONTACT data!${colors.reset}`);
        } else if (hasConsultationFields && !hasContactFields) {
          console.log(`  ${colors.green}✅ CORRECT: Consultation endpoint is returning CONSULTATION data${colors.reset}`);
        } else {
          console.log(`  ${colors.yellow}⚠️ MIXED: Data contains both contact and consultation fields${colors.reset}`);
        }
        
        console.log(`\n  ${colors.magenta}SAMPLE RECORD:${colors.reset}`);
        console.log(`  ${JSON.stringify(sample, null, 2)}`);
      }
    } else {
      console.log(`  ${colors.red}Error response: ${JSON.stringify(response.data, null, 2)}${colors.reset}`);
    }
  } catch (error) {
    console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);
  }

  // Step 3: Test contact endpoint for comparison
  console.log(`\n${colors.yellow}[STEP 3] Testing Contact Endpoint Data (for comparison)${colors.reset}`);
  try {
    const response = await makeRequest('/api/contact', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    console.log(`  Status: ${response.status}`);
    
    if (response.status === 200) {
      const contacts = response.data.contacts || [];
      console.log(`  ${colors.cyan}Found ${contacts.length} contact records${colors.reset}`);
      
      if (contacts.length > 0) {
        const sample = contacts[0];
        console.log(`\n  ${colors.magenta}CONTACT SAMPLE FIELDS:${colors.reset}`);
        console.log(`  ${colors.cyan}${Object.keys(sample).join(', ')}${colors.reset}`);
      }
    }
  } catch (error) {
    console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);
  }

  // Step 4: Test alternative consultation endpoints
  console.log(`\n${colors.yellow}[STEP 4] Testing Alternative Consultation Endpoints${colors.reset}`);
  
  const alternativeEndpoints = [
    '/api/consultation-requests',
    '/api/consultations',
    '/api/admin/consultations'
  ];

  for (const endpoint of alternativeEndpoints) {
    try {
      const response = await makeRequest(endpoint, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      console.log(`\n  ${colors.cyan}${endpoint}:${colors.reset} Status ${response.status}`);
      
      if (response.status === 200) {
        const data = response.data;
        const records = data.consultations || data.data || data;
        const count = Array.isArray(records) ? records.length : 0;
        console.log(`    Found ${count} records`);
        
        if (count > 0 && Array.isArray(records)) {
          const sample = records[0];
          const hasConsultationFields = sample.hasOwnProperty('prospect_name') || sample.hasOwnProperty('preferred_slots');
          console.log(`    Has consultation fields: ${hasConsultationFields ? colors.green + 'YES' + colors.reset : colors.red + 'NO' + colors.reset}`);
        }
      }
    } catch (error) {
      console.log(`  ${colors.cyan}${endpoint}:${colors.reset} ${colors.red}Error - ${error.message}${colors.reset}`);
    }
  }

  console.log(`\n${colors.cyan}Debug analysis complete${colors.reset}`);
}

debugConsultationContactMixing().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});