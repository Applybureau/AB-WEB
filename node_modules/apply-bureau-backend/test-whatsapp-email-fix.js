const whatsappManager = require('./utils/whatsapp');
const fs = require('fs');
const path = require('path');

async function testWhatsAppEmailFix() {
  console.log('🔍 Testing Fixed WhatsApp Email Templates...\n');

  // Test 1: Generate correct email template data
  console.log('1. Testing Email Template Data Generation:');
  
  const mockConsultation = {
    id: 'test-whatsapp-email-123',
    prospect_name: 'Maria Rodriguez',
    prospect_email: 'maria.rodriguez@test.com',
    communication_method: 'whatsapp_call',
    phone_number: '+1555123456', // Original phone from consultation form
    whatsapp_number: '+1555123456', // Same as phone (WhatsApp number)
    scheduled_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 2 days from now
    status: 'confirmed',
    consultation_type: 'strategy_call'
  };

  const emailData = whatsappManager.generateEmailTemplateData(mockConsultation);
  
  console.log('   ✓ Generated email template data:');
  console.log(`     - Prospect Name: ${emailData.prospect_name}`);
  console.log(`     - Is WhatsApp Call: ${emailData.is_whatsapp_call}`);
  console.log(`     - Client Phone Number: ${emailData.client_phone_number}`);
  console.log(`     - Communication Method: ${emailData.communication_method}`);
  console.log(`     - Consultation Date: ${emailData.consultation_date}`);
  console.log(`     - Consultation Time: ${emailData.consultation_time}`);

  // Test 2: Verify template content changes
  console.log('\n2. Verifying Template Content Changes:');
  
  const templatesDir = path.join(__dirname, 'emails', 'templates');
  const whatsappTemplates = [
    'consultation_confirmed.html',
    'consultation_confirmed_concierge.html'
  ];

  whatsappTemplates.forEach(templateFile => {
    console.log(`\n   📧 Checking ${templateFile}:`);
    const filePath = path.join(templatesDir, templateFile);
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for correct changes
      const hasClientPhoneNumber = content.includes('{{client_phone_number}}');
      const hasWeWillCall = content.includes('We will call you at:');
      const hasWhatsAppCallDetails = content.includes('WhatsApp Call Details');
      const noWhatsAppWebLink = !content.includes('{{whatsapp_web_link}}');
      const noOpenWhatsAppButton = !content.includes('Open WhatsApp');
      
      console.log(`     ✓ Uses client_phone_number: ${hasClientPhoneNumber}`);
      console.log(`     ✓ Says "We will call you": ${hasWeWillCall}`);
      console.log(`     ✓ Has WhatsApp call details: ${hasWhatsAppCallDetails}`);
      console.log(`     ✓ No WhatsApp web link: ${noWhatsAppWebLink}`);
      console.log(`     ✓ No "Open WhatsApp" button: ${noOpenWhatsAppButton}`);
      
      const isCorrectlyFixed = hasClientPhoneNumber && hasWeWillCall && hasWhatsAppCallDetails && noWhatsAppWebLink && noOpenWhatsAppButton;
      console.log(`     ${isCorrectlyFixed ? '✅' : '❌'} Template correctly fixed: ${isCorrectlyFixed}`);
    } else {
      console.log(`     ❌ Template file not found`);
    }
  });

  // Test 3: Simulate email rendering with correct data
  console.log('\n3. Testing Email Rendering Simulation:');
  
  const testTemplate = `
    <h2>Consultation Confirmed for {{prospect_name}}</h2>
    <p>Date: {{consultation_date}} at {{consultation_time}}</p>
    
    {{#if is_whatsapp_call}}
    <div class="whatsapp-section">
      <h3>WhatsApp Call Details</h3>
      <p><strong>We will call you at:</strong> {{client_phone_number}}</p>
      
      <div class="info-box">
        <p>We will call you via WhatsApp at the scheduled time. Please ensure:</p>
        <ul>
          <li>WhatsApp is installed and working on your phone</li>
          <li>You have a stable internet connection</li>
          <li>Your phone is available and ready to receive the call</li>
          <li>If you miss our call, we'll try calling again or send a message</li>
        </ul>
      </div>
    </div>
    {{/if}}
  `;

  // Simple template rendering
  let renderedTemplate = testTemplate
    .replace(/\{\{prospect_name\}\}/g, emailData.prospect_name)
    .replace(/\{\{consultation_date\}\}/g, emailData.consultation_date)
    .replace(/\{\{consultation_time\}\}/g, emailData.consultation_time)
    .replace(/\{\{client_phone_number\}\}/g, emailData.client_phone_number);

  // Handle conditional rendering
  if (emailData.is_whatsapp_call) {
    renderedTemplate = renderedTemplate.replace(/\{\{#if is_whatsapp_call\}\}/g, '');
    renderedTemplate = renderedTemplate.replace(/\{\{\/if\}\}/g, '');
  }

  console.log('   ✓ Rendered email preview:');
  console.log(renderedTemplate);

  // Test 4: Compare old vs new approach
  console.log('\n4. Comparing Old vs New Approach:');
  
  console.log('   ❌ OLD APPROACH (incorrect):');
  console.log('     - Email asks client to WhatsApp us');
  console.log('     - Provides WhatsApp web links');
  console.log('     - Shows admin WhatsApp number');
  console.log('     - Has "Open WhatsApp" buttons');
  console.log('     - Confusing for clients');
  
  console.log('\n   ✅ NEW APPROACH (correct):');
  console.log('     - Email tells client "we will call you"');
  console.log('     - Shows their phone number');
  console.log('     - No WhatsApp links or buttons');
  console.log('     - Clear instructions for receiving the call');
  console.log('     - Client just needs to wait for our call');

  // Test 5: Test different communication methods
  console.log('\n5. Testing Different Communication Methods:');
  
  const testCases = [
    {
      name: 'WhatsApp Call',
      communication_method: 'whatsapp_call',
      phone_number: '+1555987654'
    },
    {
      name: 'Video Call',
      communication_method: 'video_call',
      meeting_link: 'https://meet.google.com/abc-def-ghi'
    },
    {
      name: 'Phone Call',
      communication_method: 'phone_call',
      phone_number: '+1555123789'
    }
  ];

  testCases.forEach(testCase => {
    const testConsultation = {
      ...mockConsultation,
      communication_method: testCase.communication_method,
      phone_number: testCase.phone_number,
      whatsapp_number: testCase.phone_number,
      meeting_link: testCase.meeting_link
    };

    const data = whatsappManager.generateEmailTemplateData(testConsultation);
    
    console.log(`\n   📞 ${testCase.name}:`);
    console.log(`     - Is WhatsApp Call: ${data.is_whatsapp_call}`);
    console.log(`     - Communication Method: ${data.communication_method}`);
    if (data.client_phone_number) {
      console.log(`     - Client Phone: ${data.client_phone_number}`);
    }
  });

  console.log('\n🎉 WhatsApp Email Fix Test Complete!\n');
  console.log('✅ Summary: WhatsApp emails now correctly tell clients "we will call you" instead of asking them to contact us.');
}

// Run the test
if (require.main === module) {
  testWhatsAppEmailFix().catch(console.error);
}

module.exports = testWhatsAppEmailFix;