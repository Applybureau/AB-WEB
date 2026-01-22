#!/usr/bin/env node

/**
 * Test Contact Submission Isolation
 * Verify that contact submissions only appear in contacts, not consultations
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

async function testContactSubmissionIsolation() {
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║           TEST: CONTACT SUBMISSION ISOLATION              ║${colors.reset}`);
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

  // Step 2: Get baseline counts
  console.log(`\n${colors.yellow}[STEP 2] Getting Baseline Counts${colors.reset}`);
  
  let initialContactCount = 0;
  let initialConsultationCount = 0;

  try {
    // Get initial contact count
    const contactResponse = await makeRequest('/api/contact', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (contactResponse.status === 200) {
      initialContactCount = contactResponse.data.pagination.total;
      console.log(`  ${colors.cyan}Initial contacts: ${initialContactCount}${colors.reset}`);
    }

    // Get initial consultation count
    const consultationResponse = await makeRequest('/api/admin/concierge/consultations', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (consultationResponse.status === 200) {
      initialConsultationCount = consultationResponse.data.total;
      console.log(`  ${colors.cyan}Initial consultations: ${initialConsultationCount}${colors.reset}`);
    }
  } catch (error) {
    console.log(`  ${colors.red}Error getting baseline counts: ${error.message}${colors.reset}`);
    return;
  }

  // Step 3: Submit a new contact form
  console.log(`\n${colors.yellow}[STEP 3] Submitting New Contact Form${colors.reset}`);
  
  const testContact = {
    name: "Test Contact Isolation User",
    email: "test-isolation@example.com",
    phone: "+1234567890",
    subject: "Testing Contact Isolation",
    message: "This contact submission should ONLY appear in contacts, NOT in consultations.",
    company: "Isolation Test Company"
  };

  let newContactId = null;

  try {
    const response = await makeRequest('/api/contact', {
      method: 'POST',
      body: testContact
    });

    if (response.status === 201) {
      newContactId = response.data.id;
      console.log(`  ${colors.green}✓ Contact submitted successfully${colors.reset}`);
      console.log(`    ID: ${newContactId}`);
    } else {
      console.log(`  ${colors.red}✗ Failed to submit contact: ${response.status}${colors.reset}`);
      return;
    }
  } catch (error) {
    console.log(`  ${colors.red}✗ Error submitting contact: ${error.message}${colors.reset}`);
    return;
  }

  // Step 4: Check if contact appears in contacts endpoint
  console.log(`\n${colors.yellow}[STEP 4] Checking Contact Endpoint${colors.reset}`);
  
  try {
    const response = await makeRequest('/api/contact', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (response.status === 200) {
      const newContactCount = response.data.pagination.total;
      const contactFound = response.data.contacts.find(c => c.id === newContactId);
      
      console.log(`  ${colors.cyan}New contact count: ${newContactCount} (was ${initialContactCount})${colors.reset}`);
      
      if (newContactCount === initialContactCount + 1) {
        console.log(`  ${colors.green}✓ Contact count increased correctly${colors.reset}`);
      } else {
        console.log(`  ${colors.red}✗ Contact count mismatch${colors.reset}`);
      }

      if (contactFound) {
        console.log(`  ${colors.green}✓ New contact found in contacts endpoint${colors.reset}`);
        console.log(`    Name: ${contactFound.name}`);
        console.log(`    Subject: ${contactFound.subject}`);
      } else {
        console.log(`  ${colors.red}✗ New contact NOT found in contacts endpoint${colors.reset}`);
      }
    }
  } catch (error) {
    console.log(`  ${colors.red}Error checking contacts: ${error.message}${colors.reset}`);
  }

  // Step 5: Check if contact appears in consultations endpoint (IT SHOULD NOT!)
  console.log(`\n${colors.yellow}[STEP 5] Checking Consultations Endpoint (Should NOT contain contact)${colors.reset}`);
  
  try {
    const response = await makeRequest('/api/admin/concierge/consultations', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (response.status === 200) {
      const newConsultationCount = response.data.total;
      const consultations = response.data.consultations || [];
      
      console.log(`  ${colors.cyan}New consultation count: ${newConsultationCount} (was ${initialConsultationCount})${colors.reset}`);
      
      // Check if our contact appears in consultations (it shouldn't!)
      const contactInConsultations = consultations.find(c => 
        c.prospect_email === testContact.email || 
        c.prospect_name === testContact.name ||
        (c.message && c.message.includes("Testing Contact Isolation"))
      );

      if (contactInConsultations) {
        console.log(`  ${colors.red}❌ PROBLEM: Contact found in consultations endpoint!${colors.reset}`);
        console.log(`    ID: ${contactInConsultations.id}`);
        console.log(`    Name: ${contactInConsultations.prospect_name}`);
        console.log(`    Email: ${contactInConsultations.prospect_email}`);
        console.log(`    Message: ${contactInConsultations.message || contactInConsultations.client_reason}`);
        console.log(`\n  ${colors.red}This is the issue - contact submissions are appearing in consultations!${colors.reset}`);
      } else {
        console.log(`  ${colors.green}✅ CORRECT: Contact NOT found in consultations endpoint${colors.reset}`);
      }

      if (newConsultationCount === initialConsultationCount) {
        console.log(`  ${colors.green}✓ Consultation count unchanged (correct)${colors.reset}`);
      } else {
        console.log(`  ${colors.red}✗ Consultation count changed (incorrect)${colors.reset}`);
      }
    }
  } catch (error) {
    console.log(`  ${colors.red}Error checking consultations: ${error.message}${colors.reset}`);
  }

  // Step 6: Check for any route conflicts or misconfigurations
  console.log(`\n${colors.yellow}[STEP 6] Checking for Route Conflicts${colors.reset}`);
  
  // Test if contact endpoint is accidentally posting to consultations
  console.log(`  ${colors.cyan}Testing contact form submission path...${colors.reset}`);
  
  try {
    // Submit another test contact to see where it goes
    const testContact2 = {
      name: "Route Test User",
      email: "route-test@example.com",
      phone: "+1987654321",
      subject: "Route Conflict Test",
      message: "Testing if contact forms are going to the wrong endpoint.",
      company: "Route Test Co"
    };

    const contactResponse = await makeRequest('/api/contact', {
      method: 'POST',
      body: testContact2
    });

    console.log(`    Contact submission status: ${contactResponse.status}`);

    // Immediately check both endpoints
    const [contactCheck, consultationCheck] = await Promise.all([
      makeRequest('/api/contact', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      }),
      makeRequest('/api/admin/concierge/consultations', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      })
    ]);

    const contactsNow = contactCheck.data.contacts || [];
    const consultationsNow = consultationCheck.data.consultations || [];

    const contactFound = contactsNow.find(c => c.email === testContact2.email);
    const consultationFound = consultationsNow.find(c => c.prospect_email === testContact2.email);

    console.log(`    Contact found in contacts: ${contactFound ? 'YES' : 'NO'}`);
    console.log(`    Contact found in consultations: ${consultationFound ? 'YES (PROBLEM!)' : 'NO (CORRECT)'}`);

  } catch (error) {
    console.log(`    ${colors.red}Error testing route conflicts: ${error.message}${colors.reset}`);
  }

  console.log(`\n${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║                        SUMMARY                             ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log(`\n${colors.magenta}If contacts are appearing in consultations, the issue is likely:${colors.reset}`);
  console.log(`  1. Frontend is posting to wrong endpoint`);
  console.log(`  2. Route conflict in server.js`);
  console.log(`  3. Database trigger or constraint issue`);
  console.log(`  4. Old mixed data still in consultations table`);
}

testContactSubmissionIsolation().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});