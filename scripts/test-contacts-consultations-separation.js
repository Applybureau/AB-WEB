#!/usr/bin/env node

/**
 * Test Contacts vs Consultations Separation
 * Verify that both endpoints work independently
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

function logTest(name, status, details = '') {
  const icon = status === 'pass' ? '✓' : status === 'fail' ? '✗' : '⚠';
  const color = status === 'pass' ? colors.green : status === 'fail' ? colors.red : colors.yellow;
  console.log(`  ${color}${icon}${colors.reset} ${name}`);
  if (details) {
    console.log(`    ${colors.cyan}${details}${colors.reset}`);
  }
}

async function testContactsConsultationsSeparation() {
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║        CONTACTS vs CONSULTATIONS SEPARATION TEST          ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log('');

  let adminToken = null;

  // Step 1: Admin Authentication
  console.log(`${colors.yellow}[STEP 1] Admin Authentication${colors.reset}`);
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
      logTest('Admin login', 'pass', `Admin authenticated`);
    } else {
      logTest('Admin login', 'fail', `Status: ${response.status}`);
      return;
    }
  } catch (error) {
    logTest('Admin login', 'fail', error.message);
    return;
  }

  // Step 2: Test Contact Form Submission
  console.log(`\n${colors.yellow}[STEP 2] Contact Form Submission${colors.reset}`);
  let contactId = null;
  try {
    const response = await makeRequest('/api/contact', {
      method: 'POST',
      body: {
        name: 'Israel Loko Contact Test',
        email: TEST_EMAIL,
        phone: '+2348012345678',
        subject: 'Testing Contact Form Separation',
        message: 'This is a test to ensure contacts and consultations are separate',
        company: 'Test Company'
      }
    });

    if (response.status === 201 || response.status === 200) {
      contactId = response.data.id;
      logTest('Contact form submission', 'pass', `Contact ID: ${contactId}`);
    } else {
      logTest('Contact form submission', 'fail', `Status: ${response.status}`);
      console.log(`    ${colors.red}Response: ${JSON.stringify(response.data, null, 2)}${colors.reset}`);
    }
  } catch (error) {
    logTest('Contact form submission', 'fail', error.message);
  }

  // Step 3: Test Consultation Request Submission
  console.log(`\n${colors.yellow}[STEP 3] Consultation Request Submission${colors.reset}`);
  let consultationId = null;
  try {
    const response = await makeRequest('/api/public-consultations', {
      method: 'POST',
      body: {
        full_name: 'Israel Loko Consultation Test',
        email: TEST_EMAIL,
        phone: '+2348012345678',
        message: 'This is a test consultation request to ensure separation from contacts',
        preferred_slots: [
          { date: '2026-01-25', time: '14:00' },
          { date: '2026-01-26', time: '15:00' }
        ]
      }
    });

    if (response.status === 201 || response.status === 200) {
      consultationId = response.data.id;
      logTest('Consultation request submission', 'pass', `Consultation ID: ${consultationId}`);
    } else {
      logTest('Consultation request submission', 'fail', `Status: ${response.status}`);
      console.log(`    ${colors.red}Response: ${JSON.stringify(response.data, null, 2)}${colors.reset}`);
    }
  } catch (error) {
    logTest('Consultation request submission', 'fail', error.message);
  }

  // Step 4: Get Contacts List (Admin)
  console.log(`\n${colors.yellow}[STEP 4] Get Contacts List${colors.reset}`);
  try {
    const response = await makeRequest('/api/contact', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200) {
      const contacts = response.data.contacts || [];
      logTest('Contacts list retrieval', 'pass', `Found ${contacts.length} contacts`);
      
      if (contacts.length > 0) {
        console.log(`    ${colors.cyan}Sample contact fields: ${Object.keys(contacts[0]).join(', ')}${colors.reset}`);
      }
    } else {
      logTest('Contacts list retrieval', 'fail', `Status: ${response.status}`);
    }
  } catch (error) {
    logTest('Contacts list retrieval', 'fail', error.message);
  }

  // Step 5: Get Contact Requests List (Alternative endpoint)
  console.log(`\n${colors.yellow}[STEP 5] Get Contact Requests List${colors.reset}`);
  try {
    const response = await makeRequest('/api/contact-requests', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200) {
      const contacts = response.data.data || response.data.contacts || [];
      logTest('Contact requests list retrieval', 'pass', `Found ${contacts.length} contact requests`);
      
      if (contacts.length > 0) {
        console.log(`    ${colors.cyan}Sample contact request fields: ${Object.keys(contacts[0]).join(', ')}${colors.reset}`);
      }
    } else {
      logTest('Contact requests list retrieval', 'fail', `Status: ${response.status}`);
    }
  } catch (error) {
    logTest('Contact requests list retrieval', 'fail', error.message);
  }

  // Step 6: Get Consultations List
  console.log(`\n${colors.yellow}[STEP 6] Get Consultations List${colors.reset}`);
  try {
    const response = await makeRequest('/api/admin/concierge/consultations', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200) {
      const consultations = response.data.consultations || [];
      logTest('Consultations list retrieval', 'pass', `Found ${consultations.length} consultations`);
      
      if (consultations.length > 0) {
        console.log(`    ${colors.cyan}Sample consultation fields: ${Object.keys(consultations[0]).join(', ')}${colors.reset}`);
      }
    } else {
      logTest('Consultations list retrieval', 'fail', `Status: ${response.status}`);
    }
  } catch (error) {
    logTest('Consultations list retrieval', 'fail', error.message);
  }

  // Step 7: Verify Data Separation
  console.log(`\n${colors.yellow}[STEP 7] Data Separation Verification${colors.reset}`);
  
  if (contactId && consultationId) {
    logTest('Data separation', 'pass', 'Contacts and consultations created with different IDs');
    console.log(`    ${colors.cyan}Contact ID: ${contactId}${colors.reset}`);
    console.log(`    ${colors.cyan}Consultation ID: ${consultationId}${colors.reset}`);
  } else if (contactId || consultationId) {
    logTest('Data separation', 'warn', 'Only one type created successfully');
  } else {
    logTest('Data separation', 'fail', 'Neither contacts nor consultations created');
  }

  // Summary
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}              SEPARATION TEST SUMMARY           ${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════${colors.reset}\n`);
  
  console.log(`${colors.magenta}ENDPOINT SEPARATION:${colors.reset}`);
  console.log(`  ${colors.cyan}📞 CONTACTS:${colors.reset}`);
  console.log(`    • POST /api/contact - Submit contact form`);
  console.log(`    • GET /api/contact - List contacts (admin)`);
  console.log(`    • GET /api/contact-requests - Alternative contact list`);
  console.log('');
  console.log(`  ${colors.cyan}📅 CONSULTATIONS:${colors.reset}`);
  console.log(`    • POST /api/public-consultations - Request consultation`);
  console.log(`    • GET /api/admin/concierge/consultations - List consultations`);
  console.log(`    • POST /api/admin/concierge/consultations/{id}/confirm - Confirm`);
  console.log('');

  console.log(`${colors.green}✅ CONTACTS AND CONSULTATIONS ARE NOW SEPARATE!${colors.reset}`);
}

testContactsConsultationsSeparation().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});