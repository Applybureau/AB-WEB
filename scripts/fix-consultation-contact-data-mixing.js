#!/usr/bin/env node

/**
 * Fix Consultation vs Contact Data Mixing
 * Move contact form submissions from consultations table to contact_requests table
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

async function fixConsultationContactMixing() {
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║           FIX: CONSULTATION vs CONTACT DATA MIXING       ║${colors.reset}`);
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

  // Step 2: Get all consultations and identify contact form submissions
  console.log(`\n${colors.yellow}[STEP 2] Identifying Contact Form Submissions in Consultations${colors.reset}`);
  try {
    const response = await makeRequest('/api/admin/concierge/consultations', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (response.status === 200) {
      const consultations = response.data.consultations || [];
      console.log(`  ${colors.cyan}Found ${consultations.length} consultation records${colors.reset}`);
      
      // Identify records that look like contact form submissions
      const contactFormSubmissions = consultations.filter(consultation => {
        const hasContactFormMarker = consultation.client_reason && 
          consultation.client_reason.includes('CONTACT FORM SUBMISSION');
        
        const hasSubjectInMessage = consultation.client_reason && 
          consultation.client_reason.includes('Subject:');
          
        const lacksProperTimeSlots = !consultation.preferred_slots || 
          consultation.preferred_slots.length === 0 ||
          (Array.isArray(consultation.preferred_slots) && 
           consultation.preferred_slots.some(slot => typeof slot === 'string'));
        
        return hasContactFormMarker || hasSubjectInMessage || 
               (lacksProperTimeSlots && consultation.client_reason);
      });

      console.log(`  ${colors.magenta}Found ${contactFormSubmissions.length} contact form submissions in consultations table${colors.reset}`);
      
      if (contactFormSubmissions.length > 0) {
        console.log(`\n  ${colors.yellow}Contact form submissions to move:${colors.reset}`);
        contactFormSubmissions.forEach((submission, index) => {
          console.log(`    ${index + 1}. ${submission.prospect_name} (${submission.prospect_email})`);
          console.log(`       Message: ${(submission.client_reason || '').substring(0, 100)}...`);
        });

        // Step 3: Move each contact form submission to contact_requests table
        console.log(`\n${colors.yellow}[STEP 3] Moving Contact Form Submissions to Contact Requests Table${colors.reset}`);
        
        for (const submission of contactFormSubmissions) {
          try {
            // Extract subject and message from client_reason
            let subject = 'General Inquiry';
            let message = submission.client_reason || submission.message || '';
            
            if (submission.client_reason && submission.client_reason.includes('Subject:')) {
              const subjectMatch = submission.client_reason.match(/Subject:\s*([^\n]+)/);
              const messageMatch = submission.client_reason.match(/Message:\s*([\s\S]+)/);
              
              if (subjectMatch) subject = subjectMatch[1].trim();
              if (messageMatch) message = messageMatch[1].trim();
            }

            // Create contact request
            const contactResponse = await makeRequest('/api/contact', {
              method: 'POST',
              body: {
                name: submission.prospect_name,
                email: submission.prospect_email,
                phone: submission.prospect_phone,
                subject: subject,
                message: message,
                company: 'Migrated from consultations'
              }
            });

            if (contactResponse.status === 201) {
              console.log(`    ${colors.green}✓ Moved ${submission.prospect_name} to contacts${colors.reset}`);
              
              // Note: In a real scenario, we would delete from consultations table
              // But since we can't directly access the database, we'll just log this
              console.log(`    ${colors.yellow}⚠️ Manual cleanup needed: Delete consultation ID ${submission.id}${colors.reset}`);
            } else {
              console.log(`    ${colors.red}✗ Failed to move ${submission.prospect_name}: ${contactResponse.status}${colors.reset}`);
            }
          } catch (error) {
            console.log(`    ${colors.red}✗ Error moving ${submission.prospect_name}: ${error.message}${colors.reset}`);
          }
        }
      } else {
        console.log(`  ${colors.green}✓ No contact form submissions found in consultations table${colors.reset}`);
      }
    } else {
      console.log(`  ${colors.red}Error fetching consultations: ${response.status}${colors.reset}`);
    }
  } catch (error) {
    console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);
  }

  // Step 4: Verify separation by testing both endpoints
  console.log(`\n${colors.yellow}[STEP 4] Verifying Data Separation${colors.reset}`);
  
  try {
    // Test consultations endpoint
    const consultationsResponse = await makeRequest('/api/admin/concierge/consultations', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (consultationsResponse.status === 200) {
      const consultations = consultationsResponse.data.consultations || [];
      const properConsultations = consultations.filter(c => 
        c.preferred_slots && 
        Array.isArray(c.preferred_slots) && 
        c.preferred_slots.length > 0 &&
        !c.client_reason?.includes('CONTACT FORM SUBMISSION')
      );
      
      console.log(`  ${colors.cyan}Consultations endpoint: ${consultations.length} total, ${properConsultations.length} proper consultations${colors.reset}`);
    }

    // Test contacts endpoint
    const contactsResponse = await makeRequest('/api/contact', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (contactsResponse.status === 200) {
      const contacts = contactsResponse.data.contacts || [];
      console.log(`  ${colors.cyan}Contacts endpoint: ${contacts.length} contact requests${colors.reset}`);
    }
  } catch (error) {
    console.log(`  ${colors.red}Error verifying separation: ${error.message}${colors.reset}`);
  }

  console.log(`\n${colors.green}Data separation analysis complete${colors.reset}`);
  console.log(`\n${colors.yellow}MANUAL CLEANUP REQUIRED:${colors.reset}`);
  console.log(`  1. Access Supabase dashboard`);
  console.log(`  2. Delete contact form submissions from 'consultations' table`);
  console.log(`  3. Verify only proper consultation requests remain`);
}

fixConsultationContactMixing().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});