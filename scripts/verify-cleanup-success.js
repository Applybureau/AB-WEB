#!/usr/bin/env node

/**
 * Verify Cleanup Success
 * Test that contacts and consultations are properly separated after cleanup
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

async function verifyCleanupSuccess() {
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║              VERIFY CLEANUP SUCCESS                       ║${colors.reset}`);
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

  // Step 2: Check consultations table (should be clean)
  console.log(`\n${colors.yellow}[STEP 2] Checking Consultations Table${colors.reset}`);
  try {
    const response = await makeRequest('/api/admin/concierge/consultations', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (response.status === 200) {
      const consultations = response.data.consultations || [];
      console.log(`  ${colors.cyan}Total consultations: ${consultations.length}${colors.reset}`);
      
      if (consultations.length === 0) {
        console.log(`  ${colors.green}✅ PERFECT: Consultations table is clean (no mixed data)${colors.reset}`);
      } else {
        // Check if remaining consultations are proper
        let properCount = 0;
        let issueCount = 0;
        
        consultations.forEach(consultation => {
          const hasProperTimeSlots = consultation.preferred_slots && 
            Array.isArray(consultation.preferred_slots) && 
            consultation.preferred_slots.length > 0 &&
            consultation.preferred_slots.every(slot => 
              typeof slot === 'object' && slot.date && slot.time
            );
          
          const isContactForm = consultation.client_reason && 
            consultation.client_reason.includes('CONTACT FORM SUBMISSION');
          
          const isTestRecord = consultation.prospect_name && 
            (consultation.prospect_name.includes('Test') || 
             consultation.prospect_name.includes('Debug'));

          if (isContactForm || isTestRecord || !hasProperTimeSlots) {
            issueCount++;
            console.log(`    ${colors.red}❌ Issue: ${consultation.prospect_name} (${consultation.id})${colors.reset}`);
          } else {
            properCount++;
          }
        });

        console.log(`  ${colors.green}✓ Proper consultations: ${properCount}${colors.reset}`);
        console.log(`  ${colors.red}✗ Issues remaining: ${issueCount}${colors.reset}`);
        
        if (issueCount === 0) {
          console.log(`  ${colors.green}✅ All consultations are proper!${colors.reset}`);
        } else {
          console.log(`  ${colors.red}⚠️ Cleanup incomplete - still has mixed data${colors.reset}`);
        }
      }
    }
  } catch (error) {
    console.log(`  ${colors.red}Error checking consultations: ${error.message}${colors.reset}`);
  }

  // Step 3: Check contacts table
  console.log(`\n${colors.yellow}[STEP 3] Checking Contacts Table${colors.reset}`);
  try {
    const response = await makeRequest('/api/contact', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (response.status === 200) {
      const contacts = response.data.contacts || [];
      console.log(`  ${colors.cyan}Total contacts: ${contacts.length}${colors.reset}`);
      
      if (contacts.length > 0) {
        console.log(`  ${colors.green}✓ Contacts table has data (as expected)${colors.reset}`);
        
        // Show recent contacts
        console.log(`\n  ${colors.magenta}Recent contacts:${colors.reset}`);
        contacts.slice(0, 3).forEach((contact, index) => {
          console.log(`    ${index + 1}. ${contact.name} - ${contact.subject}`);
        });
      } else {
        console.log(`  ${colors.yellow}⚠️ No contacts found${colors.reset}`);
      }
    }
  } catch (error) {
    console.log(`  ${colors.red}Error checking contacts: ${error.message}${colors.reset}`);
  }

  // Step 4: Test new submissions to ensure they go to correct tables
  console.log(`\n${colors.yellow}[STEP 4] Testing New Submissions${colors.reset}`);
  
  // Test contact submission
  console.log(`  ${colors.cyan}Testing contact submission...${colors.reset}`);
  try {
    const contactResponse = await makeRequest('/api/contact', {
      method: 'POST',
      body: {
        name: "Cleanup Verification User",
        email: "cleanup-test@example.com",
        phone: "+1234567890",
        subject: "Post-Cleanup Test",
        message: "This contact should only appear in contacts, not consultations.",
        company: "Verification Co"
      }
    });

    if (contactResponse.status === 201) {
      console.log(`    ${colors.green}✓ Contact submission successful${colors.reset}`);
    } else {
      console.log(`    ${colors.red}✗ Contact submission failed: ${contactResponse.status}${colors.reset}`);
    }
  } catch (error) {
    console.log(`    ${colors.red}✗ Contact submission error: ${error.message}${colors.reset}`);
  }

  // Test consultation submission
  console.log(`  ${colors.cyan}Testing consultation submission...${colors.reset}`);
  try {
    const consultationResponse = await makeRequest('/api/public-consultations', {
      method: 'POST',
      body: {
        full_name: "Cleanup Verification Consultant",
        email: "consultation-test@example.com",
        phone: "+1987654321",
        message: "This consultation should only appear in consultations, not contacts.",
        preferred_slots: [
          {
            date: "2026-01-25",
            time: "14:00"
          },
          {
            date: "2026-01-26",
            time: "15:00"
          }
        ]
      }
    });

    if (consultationResponse.status === 201) {
      console.log(`    ${colors.green}✓ Consultation submission successful${colors.reset}`);
    } else {
      console.log(`    ${colors.red}✗ Consultation submission failed: ${consultationResponse.status}${colors.reset}`);
    }
  } catch (error) {
    console.log(`    ${colors.red}✗ Consultation submission error: ${error.message}${colors.reset}`);
  }

  // Step 5: Final verification
  console.log(`\n${colors.yellow}[STEP 5] Final Verification${colors.reset}`);
  
  try {
    const [contactCheck, consultationCheck] = await Promise.all([
      makeRequest('/api/contact', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      }),
      makeRequest('/api/admin/concierge/consultations', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      })
    ]);

    const contacts = contactCheck.data.contacts || [];
    const consultations = consultationCheck.data.consultations || [];

    // Check for cross-contamination
    const contactInConsultations = consultations.find(c => 
      c.prospect_email === 'cleanup-test@example.com'
    );
    
    const consultationInContacts = contacts.find(c => 
      c.email === 'consultation-test@example.com'
    );

    console.log(`  ${colors.cyan}Final counts:${colors.reset}`);
    console.log(`    Contacts: ${contacts.length}`);
    console.log(`    Consultations: ${consultations.length}`);
    
    console.log(`\n  ${colors.cyan}Cross-contamination check:${colors.reset}`);
    console.log(`    Contact in consultations: ${contactInConsultations ? colors.red + 'YES (PROBLEM!)' + colors.reset : colors.green + 'NO (CORRECT)' + colors.reset}`);
    console.log(`    Consultation in contacts: ${consultationInContacts ? colors.red + 'YES (PROBLEM!)' + colors.reset : colors.green + 'NO (CORRECT)' + colors.reset}`);

  } catch (error) {
    console.log(`  ${colors.red}Error in final verification: ${error.message}${colors.reset}`);
  }

  console.log(`\n${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║                        SUMMARY                             ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log(`\n${colors.green}If cleanup was successful, you should see:${colors.reset}`);
  console.log(`  ✅ Consultations table: 0 records OR only proper consultations`);
  console.log(`  ✅ Contacts table: Multiple contact requests`);
  console.log(`  ✅ No cross-contamination between systems`);
  console.log(`  ✅ New submissions go to correct tables`);
  console.log(`\n${colors.yellow}If you still see issues, run the SQL cleanup commands in Supabase.${colors.reset}`);
}

verifyCleanupSuccess().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});