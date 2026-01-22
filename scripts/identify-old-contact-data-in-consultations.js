#!/usr/bin/env node

/**
 * Identify Old Contact Data in Consultations Table
 * Find and list all contact form submissions that are still in consultations table
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

async function identifyOldContactDataInConsultations() {
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║        IDENTIFY OLD CONTACT DATA IN CONSULTATIONS         ║${colors.reset}`);
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

  // Step 2: Get all consultations and analyze them
  console.log(`\n${colors.yellow}[STEP 2] Analyzing All Consultations${colors.reset}`);
  try {
    const response = await makeRequest('/api/admin/concierge/consultations', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (response.status === 200) {
      const consultations = response.data.consultations || [];
      console.log(`  ${colors.cyan}Total consultations: ${consultations.length}${colors.reset}`);
      
      // Categorize consultations
      const properConsultations = [];
      const contactFormSubmissions = [];
      const testRecords = [];
      const invalidTimeSlots = [];

      consultations.forEach((consultation) => {
        // Check for contact form submission markers
        const hasContactFormMarker = consultation.client_reason && 
          consultation.client_reason.includes('CONTACT FORM SUBMISSION');
        
        const hasSubjectInMessage = consultation.client_reason && 
          consultation.client_reason.includes('Subject:');

        // Check for test records
        const isTestRecord = consultation.prospect_name && 
          (consultation.prospect_name.includes('Debug') || 
           consultation.prospect_name.includes('Test') ||
           consultation.prospect_email.includes('debug') ||
           consultation.prospect_email.includes('test'));

        // Check for proper time slots
        const hasProperTimeSlots = consultation.preferred_slots && 
          Array.isArray(consultation.preferred_slots) && 
          consultation.preferred_slots.length > 0 &&
          consultation.preferred_slots.every(slot => 
            typeof slot === 'object' && slot.date && slot.time
          );

        // Categorize
        if (hasContactFormMarker || hasSubjectInMessage) {
          contactFormSubmissions.push(consultation);
        } else if (isTestRecord) {
          testRecords.push(consultation);
        } else if (!hasProperTimeSlots && consultation.preferred_slots) {
          invalidTimeSlots.push(consultation);
        } else {
          properConsultations.push(consultation);
        }
      });

      console.log(`\n  ${colors.magenta}CATEGORIZATION RESULTS:${colors.reset}`);
      console.log(`  ${colors.green}✓ Proper consultations: ${properConsultations.length}${colors.reset}`);
      console.log(`  ${colors.red}✗ Contact form submissions: ${contactFormSubmissions.length}${colors.reset}`);
      console.log(`  ${colors.yellow}⚠ Test records: ${testRecords.length}${colors.reset}`);
      console.log(`  ${colors.yellow}⚠ Invalid time slots: ${invalidTimeSlots.length}${colors.reset}`);

      // Show contact form submissions in detail
      if (contactFormSubmissions.length > 0) {
        console.log(`\n  ${colors.red}CONTACT FORM SUBMISSIONS IN CONSULTATIONS TABLE:${colors.reset}`);
        contactFormSubmissions.forEach((submission, index) => {
          console.log(`    ${index + 1}. ID: ${submission.id}`);
          console.log(`       Name: ${submission.prospect_name}`);
          console.log(`       Email: ${submission.prospect_email}`);
          console.log(`       Created: ${submission.created_at}`);
          
          // Extract subject and message from client_reason
          if (submission.client_reason && submission.client_reason.includes('Subject:')) {
            const subjectMatch = submission.client_reason.match(/Subject:\s*([^\n]+)/);
            const messageMatch = submission.client_reason.match(/Message:\s*([\s\S]+)/);
            
            if (subjectMatch) console.log(`       Subject: ${subjectMatch[1].trim()}`);
            if (messageMatch) console.log(`       Message: ${messageMatch[1].trim().substring(0, 100)}...`);
          }
          console.log('');
        });
      }

      // Show test records
      if (testRecords.length > 0) {
        console.log(`\n  ${colors.yellow}TEST RECORDS IN CONSULTATIONS TABLE:${colors.reset}`);
        testRecords.forEach((record, index) => {
          console.log(`    ${index + 1}. ID: ${record.id}`);
          console.log(`       Name: ${record.prospect_name}`);
          console.log(`       Email: ${record.prospect_email}`);
          console.log(`       Created: ${record.created_at}`);
          console.log('');
        });
      }

      // Show invalid time slots
      if (invalidTimeSlots.length > 0) {
        console.log(`\n  ${colors.yellow}INVALID TIME SLOTS IN CONSULTATIONS TABLE:${colors.reset}`);
        invalidTimeSlots.forEach((record, index) => {
          console.log(`    ${index + 1}. ID: ${record.id}`);
          console.log(`       Name: ${record.prospect_name}`);
          console.log(`       Email: ${record.prospect_email}`);
          console.log(`       Time Slots: ${JSON.stringify(record.preferred_slots)}`);
          console.log(`       Created: ${record.created_at}`);
          console.log('');
        });
      }

      // Generate cleanup SQL
      const recordsToDelete = [...contactFormSubmissions, ...testRecords];
      
      if (recordsToDelete.length > 0) {
        console.log(`\n${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
        console.log(`${colors.cyan}║                    CLEANUP REQUIRED                       ║${colors.reset}`);
        console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
        
        console.log(`\n${colors.yellow}SUPABASE SQL CLEANUP COMMANDS:${colors.reset}`);
        console.log(`${colors.cyan}-- Delete contact form submissions and test records from consultations table${colors.reset}`);
        
        recordsToDelete.forEach((record, index) => {
          console.log(`DELETE FROM consultations WHERE id = '${record.id}'; -- ${record.prospect_name} (${record.prospect_email})`);
        });

        console.log(`\n${colors.yellow}MANUAL CLEANUP STEPS:${colors.reset}`);
        console.log(`1. Access your Supabase dashboard`);
        console.log(`2. Go to SQL Editor`);
        console.log(`3. Run the DELETE commands above`);
        console.log(`4. Verify only proper consultations remain`);
        
        console.log(`\n${colors.green}AFTER CLEANUP, YOU SHOULD HAVE:${colors.reset}`);
        console.log(`- Contacts: Only in contact_requests table`);
        console.log(`- Consultations: Only proper consultation requests with time slots`);
        console.log(`- No data mixing between the two systems`);
      } else {
        console.log(`\n${colors.green}✅ NO CLEANUP NEEDED - All consultations are proper!${colors.reset}`);
      }

    } else {
      console.log(`  ${colors.red}Error fetching consultations: ${response.status}${colors.reset}`);
    }
  } catch (error) {
    console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);
  }
}

identifyOldContactDataInConsultations().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});